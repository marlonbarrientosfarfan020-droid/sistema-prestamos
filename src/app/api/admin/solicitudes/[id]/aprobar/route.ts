import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aprobacionSchema } from "@/lib/validations/solicitud";
import { generarCronograma } from "@/lib/finance/cronograma";
import { parseISODatePeru } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

// POST /api/admin/solicitudes/[id]/aprobar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validar parámetros de aprobación
    const validation = aprobacionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Parámetros de aprobación inválidos", detalles: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que la solicitud existe y está en estado correcto
    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id },
      include: { prestamo: true },
    });

    if (!solicitud) {
      return NextResponse.json({ success: false, error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.prestamo) {
      return NextResponse.json(
        { success: false, error: "Esta solicitud ya fue aprobada anteriormente" },
        { status: 409 }
      );
    }

    if (solicitud.estado === "RECHAZADO") {
      return NextResponse.json(
        { success: false, error: "No se puede aprobar una solicitud rechazada" },
        { status: 400 }
      );
    }

    // Generar cronograma con el motor de amortización
    const fechaPrimerPago = parseISODatePeru(data.fechaPrimerPago);
    const cronograma = generarCronograma({
      montoAprobado: data.montoAprobado,
      tipoTasa: data.tipoTasa,
      valorInteres: data.valorInteres,
      modalidadPago: data.modalidadPago,
      frecuenciaPago: data.frecuenciaPago,
      numeroCuotas: data.numeroCuotas,
      fechaPrimerPago,
    });

    // Transacción: crear préstamo + cronograma + actualizar solicitud
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear préstamo
      const prestamo = await tx.prestamo.create({
        data: {
          solicitudId: id,
          monto_aprobado: data.montoAprobado,
          tipo_tasa: data.tipoTasa,
          valor_interes: data.valorInteres,
          modalidad_pago: data.modalidadPago,
          frecuencia_pago: data.frecuenciaPago,
          numero_cuotas: data.numeroCuotas,
          fecha_primer_pago: fechaPrimerPago,
          total_interes: cronograma.totalInteres,
          total_a_pagar: cronograma.totalAPagar,
          ganancia_estimada: cronograma.gananciaEstimada,
          metodo_cobro: data.metodoCobro,
          numero_cobro: data.numeroCobro,
        },
      });

      // Crear cuotas del cronograma
      await tx.cronogramaCuota.createMany({
        data: cronograma.cuotas.map((c) => ({
          prestamoId: prestamo.id,
          numero_cuota: c.numeroCuota,
          fecha_vencimiento: c.fechaVencimiento,
          capital: c.capital,
          interes: c.interes,
          cuota_total: c.cuotaTotal,
          saldo_restante: c.saldoRestante,
          mora: 0,
          estado: "PENDIENTE",
        })),
      });

      // Actualizar solicitud a APROBADO
      await tx.solicitudPrestamo.update({
        where: { id },
        data: { estado: "APROBADO" },
      });

      return {
        prestamoId: prestamo.id,
        totalCuotas: cronograma.cuotas.length,
        totalAPagar: cronograma.totalAPagar,
        gananciaEstimada: cronograma.gananciaEstimada,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        mensaje: "Préstamo aprobado y cronograma generado exitosamente.",
        prestamoId: resultado.prestamoId,
        totalCuotas: resultado.totalCuotas,
        totalAPagar: resultado.totalAPagar,
        gananciaEstimada: resultado.gananciaEstimada,
      },
    });
  } catch (error) {
    console.error("[API /admin/solicitudes/[id]/aprobar] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la aprobación" },
      { status: 500 }
    );
  }
}
