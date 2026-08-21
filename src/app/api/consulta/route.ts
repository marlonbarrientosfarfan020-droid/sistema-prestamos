import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dniSchema } from "@/lib/validations/solicitud";
import { z } from "zod";

const consultaDNISchema = z.object({ dni: dniSchema });

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const dniRaw = searchParams.get("dni");

    // Validar DNI
    const validation = consultaDNISchema.safeParse({ dni: dniRaw });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "DNI inválido. Debe tener 8 dígitos." },
        { status: 400 }
      );
    }

    const { dni } = validation.data;

    // Buscar cliente con su solicitud más reciente
    const cliente = await prisma.cliente.findUnique({
      where: { dni },
      include: {
        solicitudes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            prestamo: {
              include: {
                cuotas: {
                  orderBy: { numero_cuota: "asc" },
                  include: {
                    vouchers: {
                      orderBy: { createdAt: "desc" },
                      take: 3,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "No encontramos ninguna solicitud con ese DNI." },
        { status: 404 }
      );
    }

    const solicitud = cliente.solicitudes[0];
    if (!solicitud) {
      return NextResponse.json(
        { success: false, error: "No tienes solicitudes registradas." },
        { status: 404 }
      );
    }

    // Calcular mora para cuotas vencidas (1.5% diario)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cuotasDb = solicitud.prestamo?.cuotas ?? [];

    const cuotasConMora = cuotasDb.map((c: any) => {
      const venc = new Date(c.fecha_vencimiento);
      venc.setHours(0, 0, 0, 0);

      const dias =
        c.estado === "PENDIENTE"
          ? Math.max(0, Math.floor((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

      const mora =
        dias > 0
          ? parseFloat(c.cuota_total.toString()) * 0.015 * dias
          : parseFloat(c.mora ? c.mora.toString() : "0");

      const diasRestantes = Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: c.id,
        numeroCuota: c.numero_cuota,
        fechaVencimiento: c.fecha_vencimiento.toISOString(),
        capital: parseFloat(c.capital.toString()),
        interes: parseFloat(c.interes.toString()),
        cuotaTotal: parseFloat(c.cuota_total.toString()),
        saldoRestante: parseFloat(c.saldo_restante.toString()),
        mora,
        estado: c.estado,
        fecha_pago_real: c.fecha_pago_real ? new Date(c.fecha_pago_real).toISOString() : null,
        diasRestantes,
        vouchers: (c.vouchers ?? []).map((v: any) => ({
          id: v.id,
          url: v.url,
          montoDeclarado: parseFloat(v.monto_declarado.toString()),
          aprobado: v.aprobado,
          createdAt: new Date(v.createdAt).toISOString(),
        })),
      };
    });

    // Encontrar próxima cuota pendiente
    const proximaCuota = cuotasConMora.find((c: any) => c.estado === "PENDIENTE") ?? null;

    return NextResponse.json({
      success: true,
      data: {
        cliente: {
          nombres: cliente.nombres,
          apellidos: cliente.apellidos,
          dni: cliente.dni,
        },
        solicitud: {
          id: solicitud.id,
          estado: solicitud.estado,
          createdAt: new Date(solicitud.createdAt).toISOString(),
        },
        prestamo: solicitud.prestamo
          ? {
              id: solicitud.prestamo.id,
              montoAprobado: parseFloat(solicitud.prestamo.monto_aprobado.toString()),
              totalAPagar: parseFloat(solicitud.prestamo.total_a_pagar.toString()),
              metodoCobro: solicitud.prestamo.metodo_cobro,
              numeroCobro: solicitud.prestamo.numero_cobro,
              proximaCuota,
              cuotas: cuotasConMora,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[API /consulta] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}