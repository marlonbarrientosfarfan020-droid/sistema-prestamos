import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aprobacionSchema } from "@/lib/validations/solicitud";
import { generarCronograma } from "@/lib/finance/cronograma";
import { parseISODatePeru } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

// POST /api/admin/prestamos/[id]/editar o PUT /api/admin/prestamos/[id]/editar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return handleEditarPrestamo(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return handleEditarPrestamo(request, params);
}

async function handleEditarPrestamo(
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
    const body = await request.json();

    // Validar parámetros recibidos con Zod
    const validation = aprobacionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros de préstamo inválidos",
          detalles: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Buscar préstamo por id propio o por solicitudId
    const prestamo = await prisma.prestamo.findFirst({
      where: {
        OR: [{ id }, { solicitudId: id }],
      },
    });

    if (!prestamo) {
      return NextResponse.json(
        { success: false, error: "No se encontró el préstamo a modificar." },
        { status: 404 }
      );
    }

    // Parsear fecha del primer pago fijando hora de Perú para evitar desfases UTC
    const fechaPrimerPago = parseISODatePeru(data.fechaPrimerPago);

    // Generar el nuevo cronograma con el motor financiero
    const cronograma = generarCronograma({
      montoAprobado: data.montoAprobado,
      tipoTasa: data.tipoTasa,
      valorInteres: data.valorInteres,
      modalidadPago: data.modalidadPago,
      frecuenciaPago: data.frecuenciaPago,
      numeroCuotas: data.numeroCuotas,
      fechaPrimerPago,
    });

    // Transacción atómica en Prisma: eliminar cuotas previas y guardar nuevas
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Eliminar cuotas anteriores
      await tx.cronogramaCuota.deleteMany({
        where: { prestamoId: prestamo.id },
      });

      // 2. Actualizar registro principal del préstamo
      const prestamoActualizado = await tx.prestamo.update({
        where: { id: prestamo.id },
        data: {
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

      // 3. Crear las nuevas cuotas del cronograma
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
      message: "¡Préstamo y cronograma actualizados correctamente!",
      data: {
        prestamoId: resultado.id,
        totalCuotas: cronograma.cuotas.length,
        totalAPagar: cronograma.totalAPagar,
        gananciaEstimada: cronograma.gananciaEstimada,
      },
    });
  } catch (error) {
    console.error("[API /api/admin/prestamos/[id]/editar] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al actualizar el préstamo y regenerar el cronograma." },
      { status: 500 }
    );
  }
}
