import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPEN } from "@/lib/utils/formatters";

export const metadata: Metadata = { title: "Dashboard Admin | PréstamosPE" };

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const [
    totalSolicitudes,
    pendientes,
    enEvaluacion,
    aprobadas,
    rechazadas,
    totalClientes,
    totalPrestamos,
  ] = await Promise.all([
    prisma.solicitudPrestamo.count(),
    prisma.solicitudPrestamo.count({ where: { estado: "PENDIENTE" } }),
    prisma.solicitudPrestamo.count({ where: { estado: "EN_EVALUACION" } }),
    prisma.solicitudPrestamo.count({ where: { estado: "APROBADO" } }),
    prisma.solicitudPrestamo.count({ where: { estado: "RECHAZADO" } }),
    prisma.cliente.count(),
    prisma.prestamo.aggregate({ _sum: { monto_aprobado: true, ganancia_estimada: true } }),
  ]);

  const solicitudesRecientes = await prisma.solicitudPrestamo.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      cliente: {
        select: { nombres: true, apellidos: true, dni: true, foto_rostro_url: true },
      },
    },
  });

  const cuotasVencidas = await prisma.cronogramaCuota.count({
    where: {
      estado: "PENDIENTE",
      fecha_vencimiento: { lt: new Date() },
    },
  });

  return {
    totalSolicitudes,
    pendientes,
    enEvaluacion,
    aprobadas,
    rechazadas,
    totalClientes,
    totalCapital: parseFloat(totalPrestamos._sum.monto_aprobado?.toString() ?? "0"),
    gananciaEstimada: parseFloat(totalPrestamos._sum.ganancia_estimada?.toString() ?? "0"),
    solicitudesRecientes,
    cuotasVencidas,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const KPIs = [
    { label: "Solicitudes Totales", valor: stats.totalSolicitudes, icon: "📋", color: "var(--color-primary-600)" },
    { label: "Pendientes de Revisión", valor: stats.pendientes + stats.enEvaluacion, icon: "⏳", color: "#d97706", alerta: true },
    { label: "Préstamos Aprobados", valor: stats.aprobadas, icon: "✅", color: "var(--color-success)" },
    { label: "Capital Colocado", valor: formatPEN(stats.totalCapital), icon: "💵", color: "var(--color-primary-700)" },
    { label: "Ganancia Estimada", valor: formatPEN(stats.gananciaEstimada), icon: "📈", color: "#d97706" },
    { label: "Cuotas Vencidas", valor: stats.cuotasVencidas, icon: "🚨", color: "var(--color-danger)", alerta: stats.cuotasVencidas > 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Resumen general del sistema de préstamos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KPIs.map((kpi) => (
          <div
            key={kpi.label}
            className="card p-6 relative overflow-hidden"
            style={{
              borderLeft: `4px solid ${kpi.color}`,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--color-text-muted)" }}>
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: kpi.color }}>
                  {kpi.valor}
                </p>
              </div>
              <span className="text-3xl opacity-50">{kpi.icon}</span>
            </div>
            {kpi.alerta && (kpi.valor as number) > 0 && (
              <div className="absolute top-2 right-8 w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--color-danger)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/solicitudes?estado=PENDIENTE", label: "Revisar pendientes", icon: "📋", count: stats.pendientes },
          { href: "/admin/cobranzas", label: "Cuotas vencidas", icon: "🚨", count: stats.cuotasVencidas, danger: stats.cuotasVencidas > 0 },
          { href: "/admin/solicitudes", label: "Ver todas las solicitudes", icon: "📊", count: stats.totalSolicitudes },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="card p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            id={`dashboard-accion-${a.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: a.danger ? "#fef2f2" : "var(--color-primary-50)" }}>
              {a.icon}
            </div>
            <div>
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-2xl font-bold mt-0.5"
                style={{ fontFamily: "var(--font-outfit)", color: a.danger ? "var(--color-danger)" : "var(--color-primary-700)" }}>
                {a.count}
              </p>
            </div>
            <span className="ml-auto text-slate-400">→</span>
          </Link>
        ))}
      </div>

      {/* Solicitudes recientes */}
      <div className="card">
        <div className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            Solicitudes Recientes
          </h2>
          <Link href="/admin/solicitudes" className="btn btn-secondary btn-sm"
            id="dashboard-ver-todas">
            Ver todas →
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--color-border-light)" }}>
          {stats.solicitudesRecientes.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
              <span className="text-4xl block mb-2">📭</span>
              No hay solicitudes aún
            </div>
          ) : (
            stats.solicitudesRecientes.map((s) => (
              <Link
                key={s.id}
                href={`/admin/solicitudes/${s.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                id={`reciente-${s.id}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                  {s.cliente.foto_rostro_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cliente.foto_rostro_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-sm">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {s.cliente.nombres} {s.cliente.apellidos}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    DNI: {s.cliente.dni} · {formatPEN(parseFloat(s.monto_solicitado.toString()))}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge ${
                    s.estado === "PENDIENTE" ? "bg-gray-100 text-gray-700" :
                    s.estado === "EN_EVALUACION" ? "bg-amber-50 text-amber-700" :
                    s.estado === "APROBADO" ? "bg-emerald-50 text-emerald-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {s.estado}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
