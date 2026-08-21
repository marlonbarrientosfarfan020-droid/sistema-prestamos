import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET /api/admin/solicitudes/[id] — Expediente completo
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            datosLaborales: true,
            documentosKYC: {
              where: { solicitudId: id },
              orderBy: { createdAt: "asc" },
            },
            referencias: {
              orderBy: { numero: "asc" },
            },
          },
        },
        prestamo: {
          include: {
            cuotas: {
              orderBy: { numero_cuota: "asc" },
              include: {
                vouchers: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
        admin: {
          select: { nombre: true, email: true },
        },
      },
    });

    if (!solicitud || !solicitud.cliente) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const s = solicitud as any;
    const c = solicitud.cliente as any;
    const p = solicitud.prestamo as any;

    return NextResponse.json({
      success: true,
      data: {
        solicitud: {
          id: solicitud.id,
          estado: solicitud.estado,
          scoringRiesgo: s.scoring_riesgo ?? s.scoringRiesgo ?? null,
          notasEvaluacion: s.notas_evaluacion ?? s.notasEvaluacion ?? null,
          metodoDesembolso: s.metodo_desembolso ?? s.metodoDesembolso ?? null,
          numeroCuentaCelular: s.numero_cuenta_celular ?? s.numeroCuentaCelular ?? null,
          montoSolicitado: parseFloat((s.monto_solicitado ?? s.montoSolicitado ?? 0).toString()),
          periodicidadSolicitada: s.periodicidad_solicitada ?? s.periodicidadSolicitada ?? null,
          createdAt: solicitud.createdAt.toISOString(),
          revisadoPor: solicitud.admin ?? null,
        },
        cliente: {
          id: c.id,
          dni: c.dni,
          nombres: c.nombres,
          apellidos: c.apellidos,
          celular: c.celular,
          email: c.email ?? null,
          direccion: c.direccion ?? null,
          departamento: c.departamento ?? null,
          provincia: c.provincia ?? null,
          distrito: c.distrito ?? null,
          fotoRostroUrl: c.foto_rostro_url ?? c.fotoRostroUrl ?? null,
        },
        datosLaborales: c.datosLaborales
          ? {
            tipoOcupacion: c.datosLaborales.tipo_ocupacion ?? c.datosLaborales.tipoOcupacion ?? "",
            nombreEmpresaNegocio: c.datosLaborales.nombre_empresa_negocio ?? c.datosLaborales.nombreEmpresaNegocio ?? "",
            ingresoMensualEstimado: parseFloat(
              (c.datosLaborales.ingreso_mensual_estimado ?? c.datosLaborales.ingresoMensualEstimado ?? 0).toString()
            ),
            antiguedadLaboral: c.datosLaborales.antiguedad_laboral ?? c.datosLaborales.antiguedadLaboral ?? "",
            direccionLaboral: c.datosLaborales.direccion_laboral ?? c.datosLaborales.direccionLaboral ?? "",
          }
          : null,
        documentos: (c.documentosKYC || []).map((d: any) => ({
          id: d.id,
          tipo: d.tipo,
          url: d.url,
          mimeType: d.mime_type ?? d.mimeType ?? null,
          nombreArchivo: d.nombre_archivo ?? d.nombreArchivo ?? null,
          tamanoBytes: d.tamano_bytes ?? d.tamanoBytes ?? null,
          createdAt: new Date(d.createdAt).toISOString(),
        })),
        referencias: (c.referencias || []).map((r: any) => ({
          id: r.id,
          numero: r.numero,
          nombreCompleto: r.nombre_completo ?? r.nombreCompleto ?? "",
          parentesco: r.parentesco ?? "",
          celular: r.celular ?? "",
        })),
        prestamo: p
          ? {
            id: p.id,
            montoAprobado: parseFloat((p.monto_aprobado ?? p.montoAprobado ?? 0).toString()),
            tipoTasa: p.tipo_tasa ?? p.tipoTasa,
            valorInteres: parseFloat((p.valor_interes ?? p.valorInteres ?? 0).toString()),
            modalidadPago: p.modalidad_pago ?? p.modalidadPago,
            frecuenciaPago: p.frecuencia_pago ?? p.frecuenciaPago,
            numeroCuotas: p.numero_cuotas ?? p.numeroCuotas,
            fechaPrimerPago: new Date(p.fecha_primer_pago ?? p.fechaPrimerPago).toISOString(),
            totalInteres: parseFloat((p.total_interes ?? p.totalInteres ?? 0).toString()),
            totalAPagar: parseFloat((p.total_a_pagar ?? p.totalAPagar ?? 0).toString()),
            gananciaEstimada: parseFloat((p.ganancia_estimada ?? p.gananciaEstimada ?? 0).toString()),
            metodoCobro: p.metodo_cobro ?? p.metodoCobro,
            numeroCobro: p.numero_cobro ?? p.numeroCobro,
            cuotas: (p.cuotas || []).map((cuota: any) => ({
              id: cuota.id,
              numeroCuota: cuota.numero_cuota ?? cuota.numeroCuota,
              fechaVencimiento: new Date(cuota.fecha_vencimiento ?? cuota.fechaVencimiento).toISOString(),
              capital: parseFloat((cuota.capital ?? 0).toString()),
              interes: parseFloat((cuota.interes ?? 0).toString()),
              cuotaTotal: parseFloat((cuota.cuota_total ?? cuota.cuotaTotal ?? 0).toString()),
              saldoRestante: parseFloat((cuota.saldo_restante ?? cuota.saldoRestante ?? 0).toString()),
              mora: parseFloat((cuota.mora ?? 0).toString()),
              estado: cuota.estado,
              fechaPagoReal: (cuota.fecha_pago_real ?? cuota.fechaPagoReal)
                ? new Date(cuota.fecha_pago_real ?? cuota.fechaPagoReal).toISOString()
                : null,
              vouchers: (cuota.vouchers || []).map((v: any) => ({
                id: v.id,
                url: v.url,
                montoDeclarado: parseFloat((v.monto_declarado ?? v.montoDeclarado ?? 0).toString()),
                aprobado: v.aprobado,
                notasAdmin: v.notas_admin ?? v.notasAdmin ?? null,
                createdAt: new Date(v.createdAt).toISOString(),
              })),
            })),
          }
          : null,
      },
    });
  } catch (error) {
    console.error("[API /admin/solicitudes/[id]] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/admin/solicitudes/[id] — Actualizar estado, scoring, notas
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.solicitudPrestamo.update({
      where: { id },
      data: {
        ...(body.estado && { estado: body.estado }),
        ...(body.scoringRiesgo && { scoring_riesgo: body.scoringRiesgo }),
        ...(body.notasEvaluacion !== undefined && { notas_evaluacion: body.notasEvaluacion }),
      },
    });

    return NextResponse.json({ success: true, data: { estado: updated.estado } });
  } catch (error) {
    console.error("[API /admin/solicitudes/[id] PATCH] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/admin/solicitudes/[id] — Eliminar solicitud y todos sus datos asociados
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id },
      select: {
        id: true,
        prestamo: { select: { id: true } },
      },
    });

    if (!solicitud) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (solicitud.prestamo) {
        const prestamoId = solicitud.prestamo.id;

        // 1. Eliminar vouchers de pago asociados a las cuotas
        await (tx as any).voucherPago.deleteMany({
          where: { cuota: { prestamoId } },
        });

        // 2. Eliminar cuotas del cronograma
        await (tx as any).cronogramaCuota.deleteMany({
          where: { prestamoId },
        });

        // 3. Eliminar el préstamo
        await (tx as any).prestamo.delete({
          where: { id: prestamoId },
        });
      }

      // 4. Eliminar documentos KYC asociados a la solicitud
      await (tx as any).documentoKYC.deleteMany({
        where: { solicitudId: id },
      });

      // 5. Eliminar la solicitud
      await tx.solicitudPrestamo.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud eliminada con éxito junto con todos sus datos asociados.",
    });
  } catch (error) {
    console.error("[API DELETE /admin/solicitudes/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al eliminar la solicitud." },
      { status: 500 }
    );
  }
}