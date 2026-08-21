import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPEN, formatDate } from "@/lib/utils/formatters";

export const metadata: Metadata = { title: "Control de Cobranzas | Admin PréstamosPE" };
export const dynamic = "force-dynamic";

async function getVoucheresParaRevisar() {
  return prisma.voucherPago.findMany({
    where: { aprobado: null },
    orderBy: { createdAt: "asc" },
    include: {
      cuota: {
        include: {
          prestamo: {
            include: {
              solicitud: {
                include: {
                  cliente: {
                    select: { nombres: true, apellidos: true, dni: true, celular: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function getCuotasVencidas() {
  return prisma.cronogramaCuota.findMany({
    where: {
      estado: "PENDIENTE",
      fecha_vencimiento: { lt: new Date() },
    },
    orderBy: { fecha_vencimiento: "asc" },
    take: 50,
    include: {
      prestamo: {
        include: {
          solicitud: {
            include: {
              cliente: {
                select: { nombres: true, apellidos: true, dni: true, celular: true },
              },
            },
          },
        },
      },
    },
  });
}

export default async function CobranzasPage() {
  const [vouchers, cuotasVencidas] = await Promise.all([
    getVoucheresParaRevisar(),
    getCuotasVencidas(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
          Control de Cobranzas
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Revisa comprobantes de pago y gestiona cuotas vencidas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>
            Vouchers por revisar
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--color-warning)", fontFamily: "var(--font-outfit)" }}>
            {vouchers.length}
          </p>
        </div>
        <div className="card p-5" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>
            Cuotas vencidas
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--color-danger)", fontFamily: "var(--font-outfit)" }}>
            {cuotasVencidas.length}
          </p>
        </div>
      </div>

      {/* Vouchers pendientes */}
      <div className="card">
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-bold flex items-center gap-2">
            <span>📤</span> Comprobantes Pendientes de Revisión
          </h2>
        </div>
        {vouchers.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
            <span className="text-4xl block mb-2">✅</span>
            No hay comprobantes pendientes
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border-light)" }}>
            {vouchers.map((v) => {
              const cliente = v.cuota.prestamo.solicitud.cliente;
              const solicitudId = v.cuota.prestamo.solicitudId;
              return (
                <div key={v.id} className="p-4 flex items-start gap-4 flex-wrap">
                  {/* Preview del voucher */}
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                    id={`ver-voucher-${v.id}`}
                  >
                    {v.mime_type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.url}
                        alt="Voucher"
                        className="w-16 h-16 rounded-xl object-cover border"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                        📄
                      </div>
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {cliente.nombres} {cliente.apellidos}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      DNI: {cliente.dni} · Cuota N° {v.cuota.numero_cuota} ·
                      Monto declarado: {formatPEN(parseFloat(v.monto_declarado.toString()))}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      Enviado: {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <Link
                      href={`/admin/solicitudes/${solicitudId}`}
                      className="btn btn-secondary btn-sm"
                      id={`expediente-voucher-${v.id}`}
                    >
                      📂 Expediente
                    </Link>
                    {/* Botones de aprobación/rechazo — acción server */}
                    <form action={`/api/admin/vouchers/${v.id}`} method="POST">
                      <input type="hidden" name="_method" value="PATCH" />
                      <input type="hidden" name="aprobado" value="true" />
                      <button type="submit" className="btn btn-sm"
                        style={{ background: "var(--color-success)", color: "white" }}
                        id={`aprobar-voucher-${v.id}`}>
                        ✓ Aprobar
                      </button>
                    </form>
                    <form action={`/api/admin/vouchers/${v.id}`} method="POST">
                      <input type="hidden" name="_method" value="PATCH" />
                      <input type="hidden" name="aprobado" value="false" />
                      <button type="submit" className="btn btn-danger btn-sm"
                        id={`rechazar-voucher-${v.id}`}>
                        ✕ Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cuotas vencidas */}
      <div className="card">
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-bold flex items-center gap-2">
            <span>🚨</span> Cuotas Vencidas
          </h2>
        </div>
        {cuotasVencidas.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
            <span className="text-4xl block mb-2">🎉</span>
            No hay cuotas vencidas
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Celular</th>
                  <th>Cuota</th>
                  <th className="text-right">Monto</th>
                  <th>Vencimiento</th>
                  <th>Días vencida</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cuotasVencidas.map((c) => {
                  const cliente = c.prestamo.solicitud.cliente;
                  const solicitudId = c.prestamo.solicitudId;
                  const diasVencida = Math.floor(
                    (Date.now() - new Date(c.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={c.id}>
                      <td>
                        <p className="font-semibold text-sm">
                          {cliente.nombres} {cliente.apellidos}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          DNI: {cliente.dni}
                        </p>
                      </td>
                      <td className="text-sm">{cliente.celular}</td>
                      <td className="text-sm">N° {c.numero_cuota}</td>
                      <td className="text-right font-semibold text-sm">
                        {formatPEN(parseFloat(c.cuota_total.toString()))}
                      </td>
                      <td className="text-sm" style={{ color: "var(--color-danger)" }}>
                        {formatDate(c.fecha_vencimiento)}
                      </td>
                      <td>
                        <span className="badge bg-red-50 text-red-700 border-red-200">
                          {diasVencida} día{diasVencida !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <a href={`tel:+51${cliente.celular}`} className="btn btn-sm btn-secondary"
                            aria-label="Llamar">📞</a>
                          <a
                            href={`https://wa.me/51${cliente.celular}?text=Hola%20${encodeURIComponent(cliente.nombres)}%2C%20tiene%20una%20cuota%20vencida%20de%20${encodeURIComponent(formatPEN(parseFloat(c.cuota_total.toString())))}.%20Por%20favor%20regularice%20su%20pago.`}
                            target="_blank" rel="noopener noreferrer"
                            className="whatsapp-btn" style={{ fontSize: "0.75rem", padding: "0.375rem 0.5rem" }}
                            id={`ws-cobranza-${c.id}`}>
                            💬
                          </a>
                          <Link href={`/admin/solicitudes/${solicitudId}`}
                            className="btn btn-sm btn-secondary" id={`exp-cobranza-${c.id}`}>
                            📂
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
