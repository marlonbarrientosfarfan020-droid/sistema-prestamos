"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TarjetaProximaCuota from "@/components/consulta/TarjetaProximaCuota";
import CronogramaTable from "@/components/consulta/CronogramaTable";
import {
  COLOR_ESTADO_SOLICITUD,
  LABELS_ESTADO_SOLICITUD,
  formatPEN,
  maskDNI,
} from "@/lib/utils/formatters";
import type { DatosConsultaCliente, EstadoSolicitud } from "@/types";
import { Shield, ShieldAlert, LogOut, RefreshCw, Lock } from "lucide-react";

// ─── Componente de búsqueda ───────────────────────────────────────────────────

function ConsultaForm({
  initialDni,
  onBuscar,
}: {
  initialDni: string;
  onBuscar: (dni: string) => void;
}) {
  const [dni, setDni] = useState(initialDni);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos");
      return;
    }
    onBuscar(dni);
  };

  return (
    <div className="card-elevated p-8 max-w-md w-full animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
          Consulta tu Préstamo
        </h1>
        <p className="text-xs sm:text-sm mt-1.5 text-slate-500">
          Ingresa tu número de DNI para consultar el estado de tu solicitud, cuotas y cronograma en tiempo real.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="consulta-dni" className="label text-xs font-bold uppercase tracking-wider text-slate-700">
            Número de DNI
          </label>
          <input
            id="consulta-dni"
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={dni}
            onChange={(e) => {
              setDni(e.target.value.replace(/\D/g, "").slice(0, 8));
              if (error) setError("");
            }}
            placeholder="Ej: 12345678"
            className={`input-base text-xl text-center tracking-widest font-mono font-bold ${error ? "input-error" : ""}`}
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? "dni-error" : undefined}
          />
          {error && (
            <p id="dni-error" className="error-text mt-1.5" role="alert">
              <span>⚠</span> {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full font-bold shadow-md cursor-pointer"
          id="consulta-buscar-btn"
        >
          🔎 Consultar Estado
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
        <p className="text-xs text-slate-500">
          ¿Aún no tienes una solicitud en curso?{" "}
          <Link
            href="/solicitud"
            className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
          >
            Solicita tu préstamo aquí →
          </Link>
        </p>
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Consulta protegida con encriptación segura SSL</span>
        </p>
      </div>
    </div>
  );
}

// ─── Componente de resultado ─────────────────────────────────────────────────

function ResultadoConsulta({
  datos,
  onCerrarConsulta,
  onRefresh,
}: {
  datos: DatosConsultaCliente;
  onCerrarConsulta: () => void;
  onRefresh: () => void;
}) {
  const { cliente, solicitud, prestamo } = datos;

  const estadoColor = COLOR_ESTADO_SOLICITUD[solicitud.estado as EstadoSolicitud];
  const estadoLabel = LABELS_ESTADO_SOLICITUD[solicitud.estado as EstadoSolicitud];

  return (
    <div className="w-full max-w-4xl space-y-6 animate-fade-in-up">
      {/* Header del cliente con botón de privacidad y cierre */}
      <div className="card p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {cliente.nombres.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                {cliente.nombres} {cliente.apellidos}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">DNI: {maskDNI(cliente.dni)}</span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" /> Vista Segura
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`badge text-xs sm:text-sm px-3.5 py-1.5 font-bold ${estadoColor}`}>
              {estadoLabel}
            </span>

            {/* Botón de Refrescar */}
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Actualizar datos"
              id="refrescar-consulta-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Botón de Salir / Cerrar Consulta para privacidad */}
            <button
              type="button"
              onClick={onCerrarConsulta}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              id="cerrar-consulta-btn"
              title="Cerrar consulta para proteger tu privacidad"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar Consulta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estado: solo solicitud sin préstamo aprobado */}
      {!prestamo && (
        <div className="card-elevated p-8 text-center">
          {solicitud.estado === "PENDIENTE" || solicitud.estado === "EN_EVALUACION" ? (
            <div className="space-y-3">
              <div className="text-5xl mb-2">⏳</div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                Tu solicitud está {estadoLabel.toLowerCase()}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Estamos revisando tu información y documentos crediticios. Te notificaremos vía WhatsApp o SMS en cuanto tengamos una respuesta.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
                  🕒 Tiempo estimado de evaluación: 15 - 30 minutos
                </span>
              </div>
            </div>
          ) : solicitud.estado === "RECHAZADO" ? (
            <div className="space-y-3">
              <div className="text-5xl mb-2">❌</div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                Solicitud No Aprobada
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Tu solicitud no pudo ser aprobada en esta oportunidad. Si tus ingresos o situación laboral cambiaron, puedes solicitar nuevamente.
              </p>
              <Link href="/solicitud" className="btn btn-primary mt-4 inline-flex">
                Realizar nueva solicitud
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-slate-900">Préstamo Finalizado</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Tu préstamo ha sido completado exitosamente y todas tus cuotas están saldadas. ¡Gracias por tu puntualidad!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Préstamo activo */}
      {prestamo && (
        <>
          {/* Resumen del préstamo */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Monto Aprobado", valor: formatPEN(prestamo.montoAprobado), icon: "💵" },
              { label: "Total a Pagar", valor: formatPEN(prestamo.totalAPagar), icon: "💳" },
              { label: "Cuotas Totales", valor: `${prestamo.cuotas.length}`, icon: "📋" },
            ].map((item) => (
              <div key={item.label} className="card p-4 text-center border border-slate-200/80 shadow-xs">
                <span className="text-2xl block mb-1">{item.icon}</span>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
                <p className="text-xl font-black mt-1 text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                  {item.valor}
                </p>
              </div>
            ))}
          </div>

          {/* Próxima cuota */}
          {prestamo.proximaCuota && (
            <TarjetaProximaCuota
              cuota={prestamo.proximaCuota}
              metodoCobro={prestamo.metodoCobro as never}
              numeroCobro={prestamo.numeroCobro}
              montoAprobado={prestamo.montoAprobado}
            />
          )}

          {/* Todas las cuotas pagadas */}
          {!prestamo.proximaCuota && prestamo.cuotas.every((c) => c.estado === "PAGADO") && (
            <div className="card-elevated p-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-1 text-emerald-800" style={{ fontFamily: "var(--font-outfit)" }}>
                ¡Préstamo 100% Pagado!
              </h3>
              <p className="text-sm text-slate-600">
                Has cumplido satisfactoriamente con el pago de todas tus cuotas. ¡Felicidades!
              </p>
            </div>
          )}

          {/* Cronograma completo */}
          <CronogramaTable cuotas={prestamo.cuotas as never} onRefresh={onRefresh} />
        </>
      )}
    </div>
  );
}

// ─── Página principal con Suspense ────────────────────────────────────────────

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inactividad

function ConsultaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dniParam = searchParams.get("dni") ?? "";

  const [dniActual, setDniActual] = useState(dniParam);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState<DatosConsultaCliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avisoInactividad, setAvisoInactividad] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(!dniParam);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Función completa para cerrar consulta y limpiar datos
  const handleCerrarConsulta = useCallback((razon?: string) => {
    setDatos(null);
    setDniActual("");
    setError(null);
    setMostrarForm(true);

    if (razon) {
      setAvisoInactividad(razon);
    } else {
      setAvisoInactividad(null);
    }

    // Limpiar almacenamiento local y de sesión
    try {
      sessionStorage.removeItem("ultimoDniConsultado");
      sessionStorage.clear();
      localStorage.removeItem("ultimoDniConsultado");
    } catch {
      // Ignorar errores de almacenamiento
    }

    // Limpiar parámetros en la barra de direcciones
    router.replace("/consulta");
  }, [router]);

  // Manejo de inactividad (5 minutos)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (datos) {
      inactivityTimerRef.current = setTimeout(() => {
        handleCerrarConsulta("La consulta se cerró automáticamente por inactividad (5 min) para proteger tu privacidad.");
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [datos, handleCerrarConsulta]);

  // Escuchar eventos de interacción del usuario cuando hay datos en pantalla
  useEffect(() => {
    if (!datos) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    resetInactivityTimer();

    const eventos = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleUserActivity = () => resetInactivityTimer();

    eventos.forEach((evento) => window.addEventListener(evento, handleUserActivity));

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      eventos.forEach((evento) => window.removeEventListener(evento, handleUserActivity));
    };
  }, [datos, resetInactivityTimer]);

  const buscar = async (dni: string) => {
    setLoading(true);
    setError(null);
    setAvisoInactividad(null);
    setDatos(null);
    setDniActual(dni);

    try {
      const response = await fetch(`/api/consulta?dni=${dni}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setDatos(result.data);
        setMostrarForm(false);
      } else {
        setError(result.error ?? "No encontramos ninguna solicitud registrada con ese DNI.");
        setMostrarForm(true);
      }
    } catch {
      setError("Error de conexión con el servidor. Verifica tu acceso a internet.");
      setMostrarForm(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-buscar si viene DNI en URL al cargar inicialmente
  useEffect(() => {
    if (dniParam && /^\d{8}$/.test(dniParam)) {
      buscar(dniParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-2)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 shadow-xs"
        style={{ background: "white", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold"
            style={{ fontFamily: "var(--font-outfit)", color: "var(--color-primary-800)" }}
          >
            <span>💰</span>
            <span>PréstamosPE</span>
          </Link>
          <div className="flex items-center gap-3">
            {datos && (
              <button
                type="button"
                onClick={() => handleCerrarConsulta()}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Consulta</span>
              </button>
            )}
            <Link href="/solicitud" className="btn btn-primary btn-sm" id="header-solicitar-btn">
              Solicitar Préstamo
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
        {/* Aviso de Cierre por Inactividad */}
        {avisoInactividad && (
          <div
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5 max-w-md w-full animate-in fade-in duration-200"
            role="alert"
          >
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Privacidad Protegida</p>
              <p className="text-amber-800 mt-0.5">{avisoInactividad}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card-elevated p-12 text-center animate-fade-in">
            <div className="inline-block">
              <svg
                className="animate-spin w-12 h-12 mx-auto"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--color-primary-600)" }}
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="mt-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Buscando tu información crediticia...
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              DNI: {maskDNI(dniActual)}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="toast toast-error w-full max-w-md" role="alert">
            <span>❌</span> {error}
          </div>
        )}

        {/* Formulario de búsqueda */}
        {(mostrarForm || !datos) && !loading && (
          <ConsultaForm initialDni={dniActual} onBuscar={buscar} />
        )}

        {/* Resultados */}
        {datos && !loading && (
          <ResultadoConsulta
            datos={datos}
            onCerrarConsulta={() => handleCerrarConsulta()}
            onRefresh={() => buscar(dniActual)}
          />
        )}
      </div>
    </div>
  );
}

export default function ConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{ borderColor: "var(--color-primary-200)", borderTopColor: "var(--color-primary-600)" }}
          />
        </div>
      }
    >
      <ConsultaContent />
    </Suspense>
  );
}
