"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  User,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatPEN, LABELS_ESTADO_SOLICITUD, COLOR_ESTADO_SOLICITUD } from "@/lib/utils/formatters";
import type { EstadoSolicitud } from "@/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ClienteItem {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  celular: string;
  foto_rostro_url: string | null;
}

export interface SolicitudItem {
  id: string;
  createdAt: string | Date;
  estado: string;
  monto_solicitado: number;
  cliente: ClienteItem;
}

interface Props {
  solicitudes: SolicitudItem[];
}

// ─── Modal de Confirmación "Type to Confirm" ─────────────────────────────────

interface ModalEliminarProps {
  solicitud: SolicitudItem;
  onCancelar: () => void;
  onEliminado: () => void;
}

function ModalEliminar({ solicitud, onCancelar, onEliminado }: ModalEliminarProps) {
  const [textoConfirm, setTextoConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmacionValida = textoConfirm === "ELIMINAR";

  const handleEliminar = async () => {
    if (!confirmacionValida) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/solicitudes/${solicitud.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al eliminar la solicitud.");
      }

      onEliminado();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancelar();
      }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-base text-rose-900">
                ¿Eliminar permanentemente esta solicitud?
              </h2>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                Esta acción borrará la solicitud de{" "}
                <strong>
                  {solicitud.cliente.nombres} {solicitud.cliente.apellidos}
                </strong>{" "}
                (DNI: <span className="font-mono">{solicitud.cliente.dni}</span>), sus cronogramas de
                cuotas, vouchers de pago y todos los registros asociados. Esta acción{" "}
                <strong>no se puede deshacer</strong>.
              </p>
            </div>
            {!isDeleting && (
              <button
                type="button"
                onClick={onCancelar}
                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition flex-shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Resumen de lo que se eliminará */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
            <p className="font-bold text-slate-700 mb-1.5">Se eliminarán permanentemente:</p>
            {[
              "✗ La solicitud de préstamo y su expediente",
              "✗ El préstamo aprobado (si existe)",
              "✗ El cronograma de cuotas completo",
              "✗ Los vouchers y comprobantes de pago",
              "✗ Los documentos KYC cargados",
            ].map((item) => (
              <p key={item} className="text-rose-700 font-medium">
                {item}
              </p>
            ))}
          </div>

          {/* Input de confirmación */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Para confirmar, escribe{" "}
              <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                ELIMINAR
              </span>{" "}
              en el campo de abajo:
            </label>
            <input
              type="text"
              value={textoConfirm}
              onChange={(e) => {
                setTextoConfirm(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Escribe ELIMINAR"
              autoFocus
              disabled={isDeleting}
              className={`w-full h-11 px-4 rounded-xl border text-sm font-mono font-bold tracking-widest text-center focus:outline-none transition ${
                confirmacionValida
                  ? "border-rose-500 bg-rose-50 text-rose-800 focus:ring-2 focus:ring-rose-300"
                  : "border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              } disabled:opacity-60`}
              id="confirm-eliminar-input"
            />
            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer de acciones */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            id="cancelar-eliminar-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={!confirmacionValida || isDeleting}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-rose-200"
            id="confirmar-eliminar-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Eliminación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast de notificación ────────────────────────────────────────────────────

interface ToastProps {
  mensaje: string;
  tipo: "success" | "error";
}

function Toast({ mensaje, tipo }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
        tipo === "success"
          ? "bg-emerald-600 text-white"
          : "bg-rose-600 text-white"
      }`}
    >
      <span>{tipo === "success" ? "✅" : "❌"}</span>
      <span>{mensaje}</span>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function BandejaConEliminar({ solicitudes: initialSolicitudes }: Props) {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(initialSolicitudes);
  const [modalEliminar, setModalEliminar] = useState<SolicitudItem | null>(null);
  const [toast, setToast] = useState<ToastProps | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: "success" | "error") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleEliminado = useCallback(() => {
    if (!modalEliminar) return;
    const eliminadoId = modalEliminar.id;
    setModalEliminar(null);
    setSolicitudes((prev) => prev.filter((s) => s.id !== eliminadoId));
    mostrarToast("Solicitud eliminada exitosamente.", "success");
    router.refresh();
  }, [modalEliminar, mostrarToast, router]);

  return (
    <>
      <div className="card overflow-hidden">
        {solicitudes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-5xl block mb-3">📭</span>
            <p className="font-bold text-slate-700">No hay solicitudes en esta categoría</p>
            <p className="text-xs mt-1 text-slate-400">Selecciona otro filtro para ver los registros.</p>
          </div>
        ) : (
          <>
            {/* ─── VISTA TABLA (Desktop ≥ 768px) ─── */}
            <div className="hidden md:block table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>DNI</th>
                    <th>Celular</th>
                    <th className="text-right">Monto Solicitado</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => {
                    const fechaStr = new Date(s.createdAt).toLocaleDateString("es-PE");
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
                              {s.cliente.foto_rostro_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.cliente.foto_rostro_url}
                                  alt="Foto de rostro"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <p className="font-bold text-sm text-slate-900">
                              {s.cliente.nombres} {s.cliente.apellidos}
                            </p>
                          </div>
                        </td>
                        <td className="font-mono text-sm">{s.cliente.dni}</td>
                        <td className="text-sm">{s.cliente.celular}</td>
                        <td className="text-right font-black text-slate-900 font-mono">
                          {formatPEN(parseFloat(s.monto_solicitado.toString()))}
                        </td>
                        <td>
                          <span className={`badge ${COLOR_ESTADO_SOLICITUD[s.estado as EstadoSolicitud]}`}>
                            {LABELS_ESTADO_SOLICITUD[s.estado as EstadoSolicitud]}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{fechaStr}</td>
                        <td>
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/admin/solicitudes/${s.id}`}
                              className="btn btn-sm btn-secondary font-bold inline-flex items-center gap-1.5"
                              id={`ver-solicitud-${s.id}`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Expediente</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => setModalEliminar(s)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200 cursor-pointer"
                              title="Eliminar solicitud"
                              id={`eliminar-solicitud-${s.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── VISTA TARJETAS (Móvil < 768px) ─── */}
            <div className="md:hidden divide-y divide-slate-100">
              {solicitudes.map((s) => {
                const fechaStr = new Date(s.createdAt).toLocaleDateString("es-PE");
                return (
                  <div key={s.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
                          {s.cliente.foto_rostro_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.cliente.foto_rostro_url}
                              alt="Foto de rostro"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 leading-snug">
                            {s.cliente.nombres} {s.cliente.apellidos}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">DNI: {s.cliente.dni}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[11px] px-2.5 py-1 ${COLOR_ESTADO_SOLICITUD[s.estado as EstadoSolicitud]}`}>
                          {LABELS_ESTADO_SOLICITUD[s.estado as EstadoSolicitud]}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalEliminar(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Monto</span>
                        <span className="font-black text-slate-900 font-mono text-sm">
                          {formatPEN(parseFloat(s.monto_solicitado.toString()))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha</span>
                        <span className="text-slate-600 font-medium">{fechaStr}</span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/solicitudes/${s.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Expediente Completo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de eliminación */}
      {modalEliminar && (
        <ModalEliminar
          solicitud={modalEliminar}
          onCancelar={() => setModalEliminar(null)}
          onEliminado={handleEliminado}
        />
      )}

      {/* Toast de notificación */}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} />}
    </>
  );
}
