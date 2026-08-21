import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/solicitudes — Lista de solicitudes para la bandeja del admin
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const estadoParam = searchParams.get("estado");
    const pagina = parseInt(searchParams.get("pagina") ?? "1", 10);
    const porPagina = 20;

    const estadosValidos = ["PENDIENTE", "EN_EVALUACION", "APROBADO", "RECHAZADO", "FINALIZADO"];

    const where: any = estadoParam && estadosValidos.includes(estadoParam)
      ? { estado: estadoParam }
      : {};

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudPrestamo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          cliente: {
            select: {
              id: true,
              dni: true,
              nombres: true,
              apellidos: true,
              celular: true,
              foto_rostro_url: true,
            },
          },
          prestamo: {
            select: {
              id: true,
              monto_aprobado: true,
            },
          },
        },
      }),
      prisma.solicitudPrestamo.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        solicitudes: solicitudes.map((s: any) => ({
          id: s.id,
          estado: s.estado,
          scoringRiesgo: s.scoring_riesgo,
          montoSolicitado: parseFloat(s.monto_solicitado.toString()),
          periodicidadSolicitada: s.periodicidad_solicitada,
          createdAt: new Date(s.createdAt).toISOString(),
          cliente: {
            id: s.cliente.id,
            dni: s.cliente.dni,
            nombres: s.cliente.nombres,
            apellidos: s.cliente.apellidos,
            celular: s.cliente.celular,
            fotoRostroUrl: s.cliente.foto_rostro_url,
          },
          montoAprobado: s.prestamo ? parseFloat(s.prestamo.monto_aprobado.toString()) : null,
        })),
        paginacion: {
          total,
          pagina,
          porPagina,
          totalPaginas: Math.ceil(total / porPagina),
        },
      },
    });
  } catch (error) {
    console.error("[API /admin/solicitudes] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}