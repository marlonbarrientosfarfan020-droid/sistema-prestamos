import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/admin/vouchers/[id] o POST /api/admin/vouchers/[id] — Aprobar o Rechazar voucher
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return handleVoucherAction(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return handleVoucherAction(request, params);
}

async function handleVoucherAction(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }>
): Promise<NextResponse> {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    const { id } = await paramsPromise;
    let aprobadoVal: boolean | null = null;
    let notasAdmin: string | undefined;
    const isFormSubmit = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") ||
      request.headers.get("content-type")?.includes("multipart/form-data");

    if (isFormSubmit) {
      const formData = await request.formData();
      const rawAprobado = formData.get("aprobado");
      aprobadoVal = rawAprobado === "true" || rawAprobado === "1";
      notasAdmin = String(formData.get("notasAdmin") ?? "") || undefined;
    } else {
      const body = await request.json().catch(() => ({}));
      aprobadoVal = body.aprobado === true;
      notasAdmin = body.notasAdmin;
    }

    // Buscar voucher con cuota y préstamo
    const voucher = await prisma.voucherPago.findUnique({
      where: { id },
      include: {
        cuota: {
          include: {
            prestamo: {
              include: {
                cuotas: true,
                solicitud: true,
              },
            },
          },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: "Comprobante no encontrado." }, { status: 404 });
    }

    // Transacción para actualizar voucher y estado de cuota
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado del voucher
      await tx.voucherPago.update({
        where: { id },
        data: {
          aprobado: aprobadoVal,
          ...(notasAdmin !== undefined && { notas_admin: notasAdmin }),
        },
      });

      // 2. Si es aprobado, marcar cuota como PAGADO
      if (aprobadoVal === true) {
        await tx.cronogramaCuota.update({
          where: { id: voucher.cuotaId },
          data: {
            estado: "PAGADO",
            fecha_pago_real: new Date(),
          },
        });

        // 3. Verificar si todas las cuotas del préstamo ya están pagadas
        const cuotasRestantes = await tx.cronogramaCuota.count({
          where: {
            prestamoId: voucher.cuota.prestamoId,
            estado: "PENDIENTE",
            id: { not: voucher.cuotaId },
          },
        });

        if (cuotasRestantes === 0) {
          // Marcar préstamo como finalizado
          await tx.prestamo.update({
            where: { id: voucher.cuota.prestamoId },
            data: { activo: false },
          });

          await tx.solicitudPrestamo.update({
            where: { id: voucher.cuota.prestamo.solicitudId },
            data: { estado: "FINALIZADO" },
          });
        }
      } else if (aprobadoVal === false) {
        // Si se rechaza y la cuota estaba marcada como pagada por error, revertirla a pendiente
        if (voucher.cuota.estado === "PAGADO") {
          await tx.cronogramaCuota.update({
            where: { id: voucher.cuotaId },
            data: {
              estado: "PENDIENTE",
              fecha_pago_real: null,
            },
          });
        }
      }
    });

    // Si viene de formulario HTML estándar en la página de Cobranzas, redirigir
    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/admin/cobranzas", request.url), { status: 303 });
    }

    return NextResponse.json({
      success: true,
      message: aprobadoVal ? "Voucher aprobado exitosamente." : "Voucher rechazado.",
    });
  } catch (error) {
    console.error("[API /admin/vouchers/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la revisión del comprobante." },
      { status: 500 }
    );
  }
}
