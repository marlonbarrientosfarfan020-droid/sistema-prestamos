import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarCronograma } from "@/lib/finance/cronograma";
import { parseISODatePeru, calcularPrimerPagoPeru } from "@/lib/utils/dates";
import type { PeriodicidadPago, TipoTasa, ModalidadPago, MetodoDesembolso } from "@/types";

export const dynamic = "force-dynamic";

// POST /api/admin/prestamos/[id]/recalcular
// Recalcula o regenera el cronograma de un préstamo existente corrigiendo fechas y cuotas
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

    // Buscar préstamo por su ID o por solicitudId
    const prestamo = await prisma.prestamo.findFirst({
      where: {
        OR: [{ id }, { solicitudId: id }],
      },
      include: {
        cuotas: {
          orderBy: { numero_cuota: "asc" },
        },
      },
    });

    if (!prestamo) {
      return NextResponse.json(
        { success: false, error: "Préstamo no encontrado" },
        { status: 404 }
      );
    }

    // Opcionalmente recibir nuevos parámetros en el body para actualizar el préstamo
    let body: Partial<{
      montoAprobado: number;
      tipoTasa: TipoTasa;
      valorInteres: number;
      modalidadPago: ModalidadPago;
      frecuenciaPago: PeriodicidadPago;
      numeroCuotas: number;
      fechaPrimerPago: string;
      metodoCobro: MetodoDesembolso;
      numeroCobro: string;
    }> = {};

    try {
      body = await request.json();
    } catch {
      // Body vacío, se usan los parámetros actuales del préstamo
    }

    const montoAprobado = body.montoAprobado ?? parseFloat(prestamo.monto_aprobado.toString());
    const tipoTasa = (body.tipoTasa ?? prestamo.tipo_tasa) as TipoTasa;
    const valorInteres = body.valorInteres ?? parseFloat(prestamo.valor_interes.toString());
    const modalidadPago = (body.modalidadPago ?? prestamo.modalidad_pago) as ModalidadPago;
    const frecuenciaPago = (body.frecuenciaPago ?? prestamo.frecuencia_pago) as PeriodicidadPago;
    const numeroCuotas = body.numeroCuotas ?? prestamo.numero_cuotas;
    const metodoCobro = (body.metodoCobro ?? prestamo.metodo_cobro) as MetodoDesembolso;
    const numeroCobro = body.numeroCobro ?? prestamo.numero_cobro;

    // Calcular fecha del primer pago:
    // Si viene en el body se parsea con hora de Perú; sino se calcula a partir de la fecha sugerida (mañana hábil)
    let fechaPrimerPago: Date;
    if (body.fechaPrimerPago) {
      fechaPrimerPago = parseISODatePeru(body.fechaPrimerPago);
    } else {
      fechaPrimerPago = calcularPrimerPagoPeru(frecuenciaPago);
    }

    // Generar nuevo cronograma
    const cronograma = generarCronograma({
      montoAprobado,
      tipoTasa,
      valorInteres,
      modalidadPago,
      frecuenciaPago,
      numeroCuotas,
      fechaPrimerPago,
    });

    // Transacción atómica: eliminar cuotas anteriores y crear nuevas
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Eliminar cuotas anteriores
      await tx.cronogramaCuota.deleteMany({
        where: { prestamoId: prestamo.id },
      });

      // 2. Actualizar datos del préstamo
      const prestamoActualizado = await tx.prestamo.update({
        where: { id: prestamo.id },
        data: {
          monto_aprobado: montoAprobado,
          tipo_tasa: tipoTasa,
          valor_interes: valorInteres,
          modalidad_pago: modalidadPago,
          frecuencia_pago: frecuenciaPago,
          numero_cuotas: numeroCuotas,
          fecha_primer_pago: fechaPrimerPago,
          total_interes: cronograma.totalInteres,
          total_a_pagar: cronograma.totalAPagar,
          ganancia_estimada: cronograma.gananciaEstimada,
          metodo_cobro: metodoCobro,
          numero_cobro: numeroCobro,
        },
      });

      // 3. Crear nuevas cuotas del cronograma
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

      return prestamoActualizado;
    });

    return NextResponse.json({
      success: true,
      message: "¡Cronograma recalculado y actualizado exitosamente!",
      data: {
        prestamoId: resultado.id,
        fechaPrimerPago: fechaPrimerPago.toISOString(),
        totalCuotas: cronograma.cuotas.length,
        totalAPagar: cronograma.totalAPagar,
        gananciaEstimada: cronograma.gananciaEstimada,
        cuotas: cronograma.cuotas,
      },
    });
  } catch (error) {
    console.error("[API /api/admin/prestamos/[id]/recalcular] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al recalcular el cronograma del préstamo." },
      { status: 500 }
    );
  }
}
