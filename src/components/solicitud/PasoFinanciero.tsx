"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paso5Schema, type Paso5Data } from "@/lib/validations/solicitud";
import { LABELS_PERIODICIDAD, formatPEN } from "@/lib/utils/formatters";
import type { PeriodicidadPago } from "@/types";
import { useState, useEffect } from "react";
import { Sparkles, Calendar, Calculator, ShieldCheck } from "lucide-react";

interface Props {
  defaultValues?: Partial<Paso5Data>;
  onNext: (data: Paso5Data) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface ConfiguracionFinanciera {
  id: string;
  tasaDiaria: number;
  tasaSemanal: number;
  tasaQuincenal: number;
  tasaMensual: number;
  tasaTrimestral?: number;
  tasaSemestral?: number;
  cuotasDefaultDiario: number;
  cuotasDefaultSemanal: number;
  cuotasDefaultQuincenal: number;
  cuotasDefaultMensual: number;
  cuotasDefaultTrimestral?: number;
  cuotasDefaultSemestral?: number;
  montoMinimo: number;
  montoMaximo: number;
  tasaMoraDiaria: number;
}

const DEFAULT_CONFIG: ConfiguracionFinanciera = {
  id: "default_config",
  tasaDiaria: 20.0,
  tasaSemanal: 20.0,
  tasaQuincenal: 15.0,
  tasaMensual: 10.0,
  tasaTrimestral: 15.0,
  tasaSemestral: 25.0,
  cuotasDefaultDiario: 24,
  cuotasDefaultSemanal: 4,
  cuotasDefaultQuincenal: 2,
  cuotasDefaultMensual: 1,
  cuotasDefaultTrimestral: 1,
  cuotasDefaultSemestral: 1,
  montoMinimo: 50.0,
  montoMaximo: 10000.0,
  tasaMoraDiaria: 1.5,
};

const PERIODICIDADES: { value: PeriodicidadPago; icon: string; titulo: string; descripcion: string }[] = [
  { value: "DIARIO", icon: "📅", titulo: "Diario", descripcion: "Pagos todos los días hábiles" },
  { value: "SEMANAL", icon: "🗓️", titulo: "Semanal", descripcion: "Un abono por semana" },
  { value: "QUINCENAL", icon: "📆", titulo: "Quincenal", descripcion: "Pagos cada 15 días" },
  { value: "MENSUAL", icon: "🗒️", titulo: "Mensual", descripcion: "Un pago cada 30 días" },
  { value: "TRIMESTRAL", icon: "🏛️", titulo: "Trimestral", descripcion: "Un pago cada 3 meses" },
  { value: "SEMESTRAL", icon: "📈", titulo: "Semestral", descripcion: "Un pago cada 6 meses (Medio año)" },
];

const MONTOS_RAPIDOS = [500, 1000, 2000, 5000, 10000];

export default function PasoFinanciero({ defaultValues, onNext, onBack, isSubmitting }: Props) {
  const [config, setConfig] = useState<ConfiguracionFinanciera>(DEFAULT_CONFIG);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Paso5Data>({
    resolver: zodResolver(paso5Schema),
    defaultValues: {
      montoSolicitado: defaultValues?.montoSolicitado || undefined,
      periodicidadSolicitada: defaultValues?.periodicidadSolicitada || "SEMANAL",
      ...defaultValues,
    },
  });

  const monto = watch("montoSolicitado");
  const periodicidad = watch("periodicidadSolicitada");
  const [simulacion, setSimulacion] = useState<{
    cuota: number;
    total: number;
    cuotas: number;
    tasa: number;
    interesTotal: number;
  } | null>(null);

  // Cargar configuración de tasas desde la API
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/configuracion");
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
        }
      } catch (err) {
        console.error("Error al cargar configuración financiera:", err);
      }
    }
    loadConfig();
  }, []);

  const getTasa = (p: PeriodicidadPago) => {
    switch (p) {
      case "DIARIO":
        return config.tasaDiaria;
      case "SEMANAL":
        return config.tasaSemanal;
      case "QUINCENAL":
        return config.tasaQuincenal;
      case "MENSUAL":
        return config.tasaMensual;
      case "TRIMESTRAL":
        return config.tasaTrimestral ?? 15.0;
      case "SEMESTRAL":
        return config.tasaSemestral ?? 25.0;
      case "PAGO_UNICO":
      default:
        return config.tasaMensual;
    }
  };

  const getCuotas = (p: PeriodicidadPago) => {
    switch (p) {
      case "DIARIO":
        return config.cuotasDefaultDiario;
      case "SEMANAL":
        return config.cuotasDefaultSemanal;
      case "QUINCENAL":
        return config.cuotasDefaultQuincenal;
      case "MENSUAL":
        return config.cuotasDefaultMensual;
      case "TRIMESTRAL":
        return config.cuotasDefaultTrimestral ?? 1;
      case "SEMESTRAL":
        return config.cuotasDefaultSemestral ?? 1;
      case "PAGO_UNICO":
      default:
        return 1;
    }
  };

  // Simulación dinámica en tiempo real basada en tasas y cuotas de la BD
  useEffect(() => {
    if (monto && monto > 0 && periodicidad) {
      const tasaAplicada = getTasa(periodicidad);
      const numeroCuotas = getCuotas(periodicidad);

      const interes = (monto * tasaAplicada) / 100;
      const totalAPagar = monto + interes;
      const cuota = totalAPagar / (numeroCuotas || 1);

      setSimulacion({
        cuota: Math.round(cuota * 100) / 100,
        total: Math.round(totalAPagar * 100) / 100,
        cuotas: numeroCuotas,
        tasa: tasaAplicada,
        interesTotal: Math.round(interes * 100) / 100,
      });
    } else {
      setSimulacion(null);
    }
  }, [monto, periodicidad, config]);

  const onSubmit = handleSubmit((data: Paso5Data) => onNext(data));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-outfit)" }}>
          Solicitud Financiera
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Ingresa el monto que necesitas y la frecuencia de pago de tu preferencia.
        </p>
      </div>

      {/* Monto solicitado */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="p5-monto" className="label mb-0">
            Monto a solicitar <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Rango: {formatPEN(config.montoMinimo)} - {formatPEN(config.montoMaximo)}
          </span>
        </div>

        {/* Montos rápidos */}
        <div className="flex flex-wrap gap-2 mb-3">
          {MONTOS_RAPIDOS.filter((m) => m >= config.montoMinimo && m <= config.montoMaximo).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setValue("montoSolicitado", m, { shouldValidate: true })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer"
              style={{
                borderColor: monto === m ? "var(--color-primary-500)" : "var(--color-border)",
                background: monto === m ? "var(--color-primary-50)" : "white",
                color: monto === m ? "var(--color-primary-700)" : "var(--color-text-secondary)",
              }}
              id={`monto-rapido-${m}`}
            >
              S/ {m.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none select-none z-10"
            style={{ color: "var(--color-text-muted)" }}
          >
            S/
          </span>
          <input
            id="p5-monto"
            type="number"
            inputMode="numeric"
            min={config.montoMinimo}
            max={config.montoMaximo}
            step="any"
            placeholder="500"
            className={`input-base pr-4 w-full text-base font-semibold ${errors.montoSolicitado ? "input-error" : ""}`}
            style={{ paddingLeft: "2.75rem" }}
            {...register("montoSolicitado", { valueAsNumber: true })}
            aria-invalid={!!errors.montoSolicitado}
          />
        </div>
        {errors.montoSolicitado && (
          <p className="error-text mt-1.5" role="alert">
            <span>⚠</span> {errors.montoSolicitado.message}
          </p>
        )}
      </div>

      {/* Periodicidad */}
      <div>
        <label className="label mb-2 block">
          ¿Cómo prefieres pagar? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PERIODICIDADES.map((p) => {
            const isSelected = periodicidad === p.value;
            const tasaInfo = getTasa(p.value);

            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue("periodicidadSolicitada", p.value, { shouldValidate: true })}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
                id={`periodicidad-${p.value.toLowerCase()}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-2xl">{p.icon}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    Tasa: {tasaInfo}%
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold block text-slate-900 leading-tight">
                    {p.titulo}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block leading-normal">
                    {p.descripcion}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {errors.periodicidadSolicitada && (
          <p className="error-text mt-2" role="alert">
            <span>⚠</span> {errors.periodicidadSolicitada.message}
          </p>
        )}
      </div>

      {/* Simulación referencial dinámica */}
      {simulacion && (
        <div
          className="p-5 rounded-2xl animate-in fade-in duration-200"
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #e0f2fe 100%)",
            border: "1px solid #a7f3d0",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span>📊</span> Estimación de Pagos en Tiempo Real
            </p>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
              Tasa aplicada: {simulacion.tasa}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 shadow-xs">
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                {formatPEN(simulacion.cuota)}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Cuota ({LABELS_PERIODICIDAD[periodicidad!].toLowerCase()})
              </p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                {simulacion.cuotas}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Número de Cuotas</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-emerald-700" style={{ fontFamily: "var(--font-outfit)" }}>
                {formatPEN(simulacion.total)}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Total a Devolver</p>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-[11px] text-emerald-800 font-medium">
              Interés total estimado: <span className="font-bold">{formatPEN(simulacion.interesTotal)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Aviso final */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-sm">
        <p className="font-bold text-amber-900 flex items-center gap-1.5">
          <span>ℹ</span> Información Transparente
        </p>
        <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed">
          Al enviar esta solicitud, nuestro equipo evaluará tus documentos en minutos para procesar el desembolso con las condiciones pactadas y sin costos ocultos.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onBack} className="btn btn-secondary flex-1 cursor-pointer" id="paso5-atras">
          ← Atrás
        </button>
        <button
          type="submit"
          className="btn btn-gold flex-1 cursor-pointer font-bold"
          disabled={isSubmitting}
          id="paso5-enviar"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando solicitud...
            </span>
          ) : (
            "🚀 Enviar Solicitud"
          )}
        </button>
      </div>
    </form>
  );
}
