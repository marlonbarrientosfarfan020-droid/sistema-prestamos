import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LABELS_ESTADO_SOLICITUD } from "@/lib/utils/formatters";
import type { EstadoSolicitud } from "@/types";
import BandejaConEliminar, { type SolicitudItem } from "@/components/admin/BandejaConEliminar";

export const metadata: Metadata = { title: "Bandeja de Solicitudes | Admin PréstamosPE" };
export const dynamic = "force-dynamic";

const ESTADOS: (EstadoSolicitud | "TODAS")[] = [
  "TODAS",
  "PENDIENTE",
  "EN_EVALUACION",
  "APROBADO",
  "RECHAZADO",
  "FINALIZADO",
];

async function getSolicitudes(estado?: string): Promise<SolicitudItem[]> {
  const where = estado && estado !== "TODAS" ? { estado: estado as any } : {};

  const rawSolicitudes = await prisma.solicitudPrestamo.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
    },
  });

  // Mapeo seguro a plain objects para el Client Component
  return rawSolicitudes.map((s: any) => ({
    id: s.id,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
    estado: s.estado,
    monto_solicitado: Number(s.monto_solicitado ?? s.montoSolicitado ?? 0),
    montoSolicitado: Number(s.monto_solicitado ?? s.montoSolicitado ?? 0),
    cliente: {
      id: s.cliente.id,
      dni: s.cliente.dni,
      nombres: s.cliente.nombres,
      apellidos: s.cliente.apellidos,
      celular: s.cliente.celular,
      foto_rostro_url: s.cliente.foto_rostro_url ?? null,
    },
  })) as unknown as SolicitudItem[];
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export default async function SolicitudesAdminPage({ searchParams }: PageProps) {
  // Resolver searchParams compatible con Next.js 14 y 15
  const resolvedParams = searchParams instanceof Promise ? await searchParams : await Promise.resolve(searchParams);
  const estadoParam = resolvedParams?.estado;
  const estado = Array.isArray(estadoParam) ? estadoParam[0] : estadoParam;

  const solicitudes = await getSolicitudes(estado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
            Bandeja de Solicitudes
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-slate-500">
            {solicitudes.length} solicitudes
            {estado && estado !== "TODAS"
              ? ` — ${(LABELS_ESTADO_SOLICITUD as any)[estado] ?? estado}`
              : " registradas en total"}
          </p>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ESTADOS.map((e) => {
          const isActive = (e === "TODAS" && !estado) || estado === e;
          return (
            <Link
              key={e}
              href={e === "TODAS" ? "/admin/solicitudes" : `/admin/solicitudes?estado=${e}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              id={`filtro-${e.toLowerCase()}`}
            >
              {e === "TODAS" ? "📋 Todas" : (LABELS_ESTADO_SOLICITUD as any)[e] ?? e}
            </Link>
          );
        })}
      </div>

      {/* Tabla y Tarjetas — Client Component */}
      <BandejaConEliminar solicitudes={solicitudes} />
    </div>
  );
}