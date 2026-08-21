import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import SimuladorTasaLibre from "@/components/admin/SimuladorTasaLibre";
import ModalEditarPrestamo from "@/components/admin/ModalEditarPrestamo";
import {
  formatPEN,
  formatDate,
  formatFechaPeru,
  LABELS_TIPO_OCUPACION,
  LABELS_ANTIGUEDAD,
  LABELS_METODO_DESEMBOLSO,
  LABELS_PERIODICIDAD,
  LABELS_ESTADO_SOLICITUD,
  COLOR_ESTADO_SOLICITUD,
  COLOR_SCORING,
  LABELS_SCORING,
  LABELS_DOCUMENTO_KYC,
} from "@/lib/utils/formatters";
import { calcularPrimerPagoPeru } from "@/lib/utils/dates";
import type { EstadoSolicitud, ScoringRiesgo, TipoDocumentoKYC, TipoOcupacion, AntiguedadLaboral } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await prisma.solicitudPrestamo.findUnique({
    where: { id },
    include: { cliente: { select: { nombres: true, apellidos: true } } },
  });
  if (!s) return { title: "Expediente no encontrado" };
  return { title: `Expediente: ${s.cliente.nombres} ${s.cliente.apellidos} | Admin` };
}

async function getExpediente(id: string) {
  return prisma.solicitudPrestamo.findUnique({
    where: { id },
    include: {
      cliente: {
        include: {
          datosLaborales: true,
          documentosKYC: { where: { solicitudId: id }, orderBy: { createdAt: "asc" } },
          referencias: { orderBy: { numero: "asc" } },
        },
      },
      prestamo: {
        include: {
          cuotas: {
            orderBy: { numero_cuota: "asc" },
            include: { vouchers: { orderBy: { createdAt: "desc" }, take: 3 } },
          },
        },
      },
    },
  });
}

// ─── Visor de documentos ──────────────────────────────────────────────────────

function DocumentoViewer({
  documentos,
}: {
  documentos: { id: string; tipo: string; url: string; mimeType: string; nombreArchivo: string }[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm" style={{ color: "var(--color-text-muted)" }}>
        DOCUMENTOS KYC ({documentos.length})
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {documentos.map((doc) => {
          const esPDF = doc.mimeType === "application/pdf";
          const label = LABELS_DOCUMENTO_KYC[doc.tipo as TipoDocumentoKYC] ?? doc.tipo;
          return (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              id={`doc-${doc.tipo.toLowerCase()}`}
            >
              <div
                className="aspect-video rounded-xl overflow-hidden relative border-2 border-transparent group-hover:border-blue-400 transition-all duration-200"
                style={{ background: "var(--color-surface-3)" }}
              >
                {esPDF ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">📄</span>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">PDF</span>
                    <span className="text-xs text-center px-2" style={{ color: "var(--color-text-muted)" }}>
                      {doc.nombreArchivo}
                    </span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.url}
                    alt={label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">
                    🔍 Ver completo
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold mt-1.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                {label}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const solicitud = await getExpediente(id);

  if (!solicitud) notFound();

  const { cliente } = solicitud;
  const docs = cliente.documentosKYC;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <nav className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/admin" className="hover:underline">Admin</Link>
            {" / "}
            <Link href="/admin/solicitudes" className="hover:underline">Solicitudes</Link>
            {" / "}
            <span>Expediente</span>
          </nav>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            {cliente.nombres} {cliente.apellidos}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-sm" style={{ color: "var(--color-text-muted)" }}>
              DNI: {cliente.dni}
            </span>
            <span className={`badge ${COLOR_ESTADO_SOLICITUD[solicitud.estado as EstadoSolicitud]}`}>
              {LABELS_ESTADO_SOLICITUD[solicitud.estado as EstadoSolicitud]}
            </span>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 flex-wrap">
          <a
            href={`tel:+51${cliente.celular}`}
            className="btn btn-secondary btn-sm"
            id="llamar-cliente"
          >
            📞 Llamar
          </a>
          <a
            href={`https://wa.me/51${cliente.celular}?text=Hola%20${encodeURIComponent(cliente.nombres)}%2C%20le%20contactamos%20sobre%20su%20solicitud%20de%20pr%C3%A9stamo.`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn btn-sm"
            id="whatsapp-cliente"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* Split-screen: documentos | datos + aprobación */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Panel Izquierdo: Documentos ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Foto de rostro grande */}
          {cliente.foto_rostro_url && (
            <div className="card overflow-hidden">
              <div className="relative h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cliente.foto_rostro_url}
                  alt="Foto de rostro del solicitante"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                  <p className="text-white text-sm font-semibold">
                    {cliente.nombres} {cliente.apellidos}
                  </p>
                  <p className="text-white/70 text-xs">DNI: {cliente.dni}</p>
                </div>
              </div>
            </div>
          )}

          {/* Grid de documentos */}
          <div className="card p-5">
            <DocumentoViewer documentos={docs.map((d) => ({
              id: d.id,
              tipo: d.tipo,
              url: d.url,
              mimeType: d.mime_type,
              nombreArchivo: d.nombre_archivo,
            }))} />
          </div>
        </div>

        {/* ─── Panel Derecho: Datos + Evaluación ───────────────────────────── */}
        <div className="space-y-5 lg:split-pane">
          {/* Datos personales */}
          <div className="card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>🪪</span> Datos Personales
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "DNI", valor: cliente.dni },
                { label: "Celular", valor: `+51 ${cliente.celular}` },
                { label: "Email", valor: cliente.email ?? "—" },
                { label: "Dirección", valor: cliente.direccion },
                { label: "Distrito", valor: cliente.distrito },
                { label: "Solicitud", valor: formatDate(solicitud.createdAt) },
                { label: "Método Desembolso", valor: LABELS_METODO_DESEMBOLSO[solicitud.metodo_desembolso] },
                { label: "N° Cuenta/Celular", valor: solicitud.numero_cuenta_celular },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                  <p className="font-semibold mt-0.5 break-all">{item.valor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Datos laborales */}
          {cliente.datosLaborales && (
            <div className="card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span>💼</span> Situación Laboral
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Tipo de ocupación</p>
                  <p className="font-semibold">{LABELS_TIPO_OCUPACION[cliente.datosLaborales.tipo_ocupacion as TipoOcupacion]}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Empresa/Negocio</p>
                  <p className="font-semibold">{cliente.datosLaborales.nombre_empresa_negocio}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ingreso mensual</p>
                  <p className="font-semibold text-emerald-700">{formatPEN(parseFloat(cliente.datosLaborales.ingreso_mensual_estimado.toString()))}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Antigüedad</p>
                  <p className="font-semibold">{LABELS_ANTIGUEDAD[cliente.datosLaborales.antiguedad_laboral as AntiguedadLaboral]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Solicitud financiera */}
          <div className="card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>💰</span> Solicitud Financiera
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Monto solicitado</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: "var(--color-primary-700)" }}>
                  {formatPEN(parseFloat(solicitud.monto_solicitado.toString()))}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Periodicidad preferida</p>
                <p className="font-semibold">{LABELS_PERIODICIDAD[solicitud.periodicidad_solicitada]}</p>
              </div>
            </div>

            {/* Scoring de riesgo */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs mb-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>
                SCORING DE RIESGO
              </p>
              <div className="flex gap-2">
                {(["BAJO", "MEDIO", "ALTO"] as ScoringRiesgo[]).map((nivel) => (
                  <form key={nivel} action={`/api/admin/solicitudes/${id}`} method="PATCH">
                    <input type="hidden" name="scoringRiesgo" value={nivel} />
                    <button
                      type="submit"
                      className={`badge cursor-pointer transition-all ${
                        solicitud.scoring_riesgo === nivel
                          ? COLOR_SCORING[nivel] + " ring-2 ring-offset-1"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                      id={`scoring-${nivel.toLowerCase()}`}
                    >
                      {LABELS_SCORING[nivel]}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>

          {/* Referencias */}
          <div className="card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>👥</span> Referencias Personales
            </h3>
            <div className="space-y-3">
              {cliente.referencias.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-start justify-between p-3 rounded-xl"
                  style={{ background: "var(--color-surface-3)" }}
                >
                  <div>
                    <p className="font-semibold text-sm">{ref.nombre_completo}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {ref.parentesco} · +51 {ref.celular}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:+51${ref.celular}`} className="btn btn-icon btn-secondary btn-sm" aria-label="Llamar">
                      📞
                    </a>
                    <a
                      href={`https://wa.me/51${ref.celular}?text=Hola%2C%20soy%20prestamista%20y%20necesito%20verificar%20datos%20de%20${encodeURIComponent(ref.nombre_completo)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                      style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem" }}
                      id={`whatsapp-ref-${ref.numero}`}
                    >
                      💬
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Módulo de aprobación — solo si no está aprobado aún */}
          {!solicitud.prestamo && solicitud.estado !== "RECHAZADO" && (
            <div className="card p-5">
              <SimuladorTasaLibre
                solicitudId={id}
                montoSolicitado={parseFloat(solicitud.monto_solicitado.toString())}
                periodicidadSolicitada={solicitud.periodicidad_solicitada}
                metodoSugerido={solicitud.metodo_desembolso}
                numeroSugerido={solicitud.numero_cuenta_celular}
              />
            </div>
          )}

          {/* Préstamo ya aprobado */}
          {solicitud.prestamo && (
            <div className="card p-5"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #a7f3d0" }}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "#065f46" }}>Préstamo Aprobado</h3>
                    <p className="text-xs" style={{ color: "#047857" }}>Cronograma generado automáticamente</p>
                  </div>
                </div>

                {/* Botón y Modal de Edición */}
                <ModalEditarPrestamo
                  prestamo={{
                    id: solicitud.prestamo.id,
                    solicitudId: id,
                    montoAprobado: parseFloat(solicitud.prestamo.monto_aprobado.toString()),
                    tipoTasa: solicitud.prestamo.tipo_tasa,
                    valorInteres: parseFloat(solicitud.prestamo.valor_interes.toString()),
                    modalidadPago: solicitud.prestamo.modalidad_pago,
                    frecuenciaPago: solicitud.prestamo.frecuencia_pago,
                    numeroCuotas: solicitud.prestamo.numero_cuotas,
                    fechaPrimerPago: solicitud.prestamo.fecha_primer_pago,
                    metodoCobro: solicitud.prestamo.metodo_cobro,
                    numeroCobro: solicitud.prestamo.numero_cobro,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs" style={{ color: "#047857" }}>Monto aprobado</p>
                  <p className="font-bold text-xl" style={{ color: "#065f46" }}>
                    {formatPEN(parseFloat(solicitud.prestamo.monto_aprobado.toString()))}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#047857" }}>Ganancia estimada</p>
                  <p className="font-bold text-xl" style={{ color: "#d97706" }}>
                    {formatPEN(parseFloat(solicitud.prestamo.ganancia_estimada.toString()))}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#047857" }}>Total cuotas</p>
                  <p className="font-bold">{solicitud.prestamo.numero_cuotas}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#047857" }}>Primer pago</p>
                  <p className="font-bold">
                    {solicitud.prestamo.cuotas?.[0]?.fecha_vencimiento
                      ? formatFechaPeru(solicitud.prestamo.cuotas[0].fecha_vencimiento)
                      : solicitud.prestamo.fecha_primer_pago
                      ? formatFechaPeru(solicitud.prestamo.fecha_primer_pago)
                      : formatFechaPeru(calcularPrimerPagoPeru(solicitud.prestamo.frecuencia_pago, solicitud.prestamo.createdAt))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
