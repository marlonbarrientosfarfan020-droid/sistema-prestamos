"use client";

import { useState, useCallback, useEffect } from "react";
import { generarCronograma } from "@/lib/finance/cronograma";
import { aprobacionSchema, type AprobacionData } from "@/lib/validations/solicitud";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  LABELS_METODO_DESEMBOLSO,
  LABELS_TIPO_TASA,
  LABELS_MODALIDAD_PAGO,
  LABELS_PERIODICIDAD,
  ICONS_METODO,
  formatPEN as fmtPEN,
  formatDate,
} from "@/lib/utils/formatters";
import type { TipoTasa, ModalidadPago, PeriodicidadPago, MetodoDesembolso, ResultadoCronograma } from "@/types";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

import { getFechaISODatePeru, calcularPrimerPagoPeru } from "@/lib/utils/dates";

interface Props {
  solicitudId: string;
  montoSolicitado: number;
  periodicidadSolicitada?: PeriodicidadPago;
  metodoSugerido?: MetodoDesembolso;
  numeroSugerido?: string;
  onAprobado?: () => void;
}

const TIPOS_TASA: { value: TipoTasa; icon: string; title: string; desc: string }[] = [
  {
    value: "PORCENTAJE_TOTAL",
    icon: "💹",
    title: "% Total sobre Capital (Recomendado)",
    desc: "Ganancia global fija dividida en partes iguales entre las cuotas (ej. 20%).",
  },
  {
    value: "PORCENTAJE_MENSUAL",
    icon: "📊",
    title: "% Tasa Mensual Efectiva",
    desc: "Calcula el interés mensual amortizable según el sistema estándar.",
  },
  {
    value: "MONTO_FIJO_GANANCIA",
    icon: "💵",
    title: "Monto Fijo de Ganancia (S/)",
    desc: "Monto neto en soles añadido al capital total a devolver.",
  },
];

const MODALIDADES: { value: ModalidadPago; title: string; desc: string }[] = [
  {
    value: "CUOTA_FIJA_AMORTIZABLE",
    title: "Cuota Fija Amortizable (Estándar)",
    desc: "Cada cuota incluye una fracción del capital prestado más la ganancia proporcional.",
  },
  {
    value: "SOLO_INTERES_CAPITAL_FINAL",
    title: "Solo Interés + Capital al Vencimiento",
    desc: "El prestatario solo paga intereses periódicos y devuelve el capital íntegro al final.",
  },
];

const FRECUENCIAS: { value: PeriodicidadPago; icon: string; tag: string; label: string }[] = [
  { value: "DIARIO", icon: "📅", tag: "Días Hábiles", label: "Diario" },
  { value: "SEMANAL", icon: "🗓️", tag: "Cada 7 Días", label: "Semanal" },
  { value: "QUINCENAL", icon: "📆", tag: "Cada 15 Días", label: "Quincenal" },
  { value: "MENSUAL", icon: "🗒️", tag: "Cada 30 Días", label: "Mensual" },
  { value: "TRIMESTRAL", icon: "🏛️", tag: "Cada 3 Meses", label: "Trimestral" },
  { value: "SEMESTRAL", icon: "📈", tag: "Cada 6 Meses", label: "Semestral" },
  { value: "PAGO_UNICO", icon: "🎯", tag: "Vencimiento", label: "Pago Único" },
];

const METODOS_COBRO: MetodoDesembolso[] = ["EFECTIVO", "YAPE", "PLIN", "BCP", "BBVA", "INTERBANK", "BANCO_NACION", "OTRO_CCI"];

export default function SimuladorTasaLibre({
  solicitudId,
  montoSolicitado,
  periodicidadSolicitada = "SEMANAL",
  metodoSugerido = "YAPE",
  numeroSugerido = "",
  onAprobado,
}: Props) {
  const router = useRouter();
  const [simulacion, setSimulacion] = useState<ResultadoCronograma | null>(null);
  const [mostrarCronograma, setMostrarCronograma] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  // Calcular fecha de primer pago sugerida con zona horaria de Perú
  const getFechaSugerida = (frec: PeriodicidadPago) => {
    const d = calcularPrimerPagoPeru(frec);
    return getFechaISODatePeru(d);
  };

  const getCuotasSugeridas = (frec: PeriodicidadPago) => {
    if (frec === "DIARIO") return 24;
    if (frec === "SEMANAL") return 4;
    if (frec === "QUINCENAL") return 2;
    if (frec === "MENSUAL") return 1;
    if (frec === "TRIMESTRAL") return 1;
    if (frec === "SEMESTRAL") return 1;
    return 1;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AprobacionData>({
    resolver: zodResolver(aprobacionSchema),
    defaultValues: {
      montoAprobado: montoSolicitado,
      tipoTasa: "PORCENTAJE_TOTAL",
      valorInteres: 20,
      modalidadPago: "CUOTA_FIJA_AMORTIZABLE",
      frecuenciaPago: periodicidadSolicitada,
      numeroCuotas: getCuotasSugeridas(periodicidadSolicitada),
      fechaPrimerPago: getFechaSugerida(periodicidadSolicitada),
      metodoCobro: metodoSugerido,
      numeroCobro: numeroSugerido,
    },
  });

  const tipoTasa = watch("tipoTasa");
  const modalidadPago = watch("modalidadPago");
  const frecuenciaPago = watch("frecuenciaPago");
  const metodoCobro = watch("metodoCobro");
  const montoAprobado = watch("montoAprobado");
  const valorInteres = watch("valorInteres");
  const numeroCuotas = watch("numeroCuotas");
  const fechaPrimerPago = watch("fechaPrimerPago");

  // Recalcular en tiempo real cuando cambian los campos
  const recalcular = useCallback(() => {
    const montoNum = parseFloat(String(montoAprobado));
    const valorNum = parseFloat(String(valorInteres));
    const cuotasNum = parseInt(String(numeroCuotas));

    if (
      !montoNum ||
      isNaN(valorNum) ||
      valorNum < 0 ||
      !cuotasNum ||
      !tipoTasa ||
      !modalidadPago ||
      !frecuenciaPago ||
      !fechaPrimerPago
    ) {
      return;
    }

    try {
      const resultado = generarCronograma({
        montoAprobado: montoNum,
        tipoTasa,
        valorInteres: valorNum,
        modalidadPago,
        frecuenciaPago,
        numeroCuotas: cuotasNum,
        fechaPrimerPago: new Date(fechaPrimerPago),
      });
      setSimulacion(resultado);
    } catch (e) {
      console.error("Error en simulación:", e);
    }
  }, [montoAprobado, valorInteres, numeroCuotas, tipoTasa, modalidadPago, frecuenciaPago, fechaPrimerPago]);

  useEffect(() => {
    recalcular();
  }, [recalcular]);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setMensaje(null);

    try {
      const response = await fetch(`/api/admin/solicitudes/${solicitudId}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setMensaje({ tipo: "success", texto: "¡Préstamo aprobado y cronograma registrado exitosamente!" });
        onAprobado?.();
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: result.error ?? "Error al aprobar el préstamo" });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor" });
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* ─── Encabezado del Módulo ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Calculator className="w-3.5 h-3.5" />
            <span>Aprobación & Condiciones</span>
          </div>
          <h3 className="font-bold text-lg text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
            Aprobación del Préstamo (Tasa Libre)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Define la ganancia, modalidad y frecuencia. La proyección se calcula en tiempo real.
          </p>
        </div>

        {/* Botón de Ayuda / Manual */}
        <button
          type="button"
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Manual de Modalidades</span>
          {mostrarGuia ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </div>

      {/* ─── Acordeón de Ayuda Operativa Perú ─── */}
      {mostrarGuia && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100 text-xs text-slate-700 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Guía de Parámetros para Microcréditos en Perú</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-xs">
              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                <span>🔄</span> Cuota Fija Amortizable
              </p>
              <p className="text-slate-600 leading-relaxed">
                Cada cuota reduce capital y paga ganancia. Es la modalidad estándar más usada por prestamistas locales.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-xs">
              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                <span>🎯</span> Solo Interés (Bullet)
              </p>
              <p className="text-slate-600 leading-relaxed">
                El cliente abona únicamente la ganancia en cada cuota y liquida el 100% del capital en la última fecha.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-xs">
              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                <span>📅</span> Diario / Semanal
              </p>
              <p className="text-slate-600 leading-relaxed">
                Ideal para comerciantes de mercado, bodegas y talleres con flujo de caja diario o de fin de semana.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-blue-100/80 shadow-xs">
              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                <span>📆</span> Quincenal / Mensual
              </p>
              <p className="text-slate-600 leading-relaxed">
                Recomendado para trabajadores en planilla con fechas de cobro fijas (quincena y fin de mes).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Formulario de Aprobación ─── */}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* 1. Monto aprobado */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="apro-monto" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Monto Aprobado <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              Solicitado por cliente: <strong className="text-slate-900">{fmtPEN(montoSolicitado)}</strong>
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-sm font-bold text-slate-500 pointer-events-none select-none z-10">
              S/
            </span>
            <input
              id="apro-monto"
              type="number"
              step="any"
              min="1"
              placeholder="500.00"
              className={`w-full h-12 pr-4 bg-slate-50/50 border rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition ${
                errors.montoAprobado ? "border-red-400 focus:ring-red-500/10" : "border-slate-200"
              }`}
              style={{ paddingLeft: "2.75rem" }}
              {...register("montoAprobado", { valueAsNumber: true })}
            />
          </div>
          {errors.montoAprobado && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <span>⚠</span> {errors.montoAprobado.message}
            </p>
          )}
        </div>

        {/* 2. Selector Dinámico de Tipo de Tasa */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Definición de Ganancia / Interés <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {TIPOS_TASA.map((t) => {
              const selected = tipoTasa === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("tipoTasa", t.value, { shouldValidate: true })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    selected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{t.icon}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-bold block ${selected ? "text-emerald-950" : "text-slate-800"}`}>
                    {t.title}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">{t.desc}</span>
                </button>
              );
            })}
          </div>
          {errors.tipoTasa && (
            <p className="text-xs text-red-600 font-medium">
              <span>⚠</span> {errors.tipoTasa.message}
            </p>
          )}
        </div>

        {/* Input condicional de Valor de Interés */}
        {tipoTasa && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 animate-in fade-in duration-150">
            <label htmlFor="apro-valor-interes" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {tipoTasa === "PORCENTAJE_TOTAL"
                ? "Porcentaje Total de Ganancia (%)"
                : tipoTasa === "PORCENTAJE_MENSUAL"
                ? "Tasa Mensual Efectiva (%)"
                : "Monto Fijo de Ganancia en Soles (S/)"}{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative flex items-center">
              {tipoTasa === "MONTO_FIJO_GANANCIA" ? (
                <span className="absolute left-3.5 text-sm font-bold text-slate-500 pointer-events-none select-none z-10">
                  S/
                </span>
              ) : null}

              <input
                id="apro-valor-interes"
                type="number"
                step="any"
                min="0"
                placeholder={tipoTasa === "MONTO_FIJO_GANANCIA" ? "100.00" : "20.0"}
                className={`w-full h-11 pr-10 bg-white border rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition ${
                  errors.valorInteres ? "border-red-400" : "border-slate-200"
                }`}
                style={{ paddingLeft: tipoTasa === "MONTO_FIJO_GANANCIA" ? "2.75rem" : "0.875rem" }}
                {...register("valorInteres", { valueAsNumber: true })}
              />

              {tipoTasa !== "MONTO_FIJO_GANANCIA" && (
                <span className="absolute right-3.5 text-sm font-bold text-slate-400 pointer-events-none">%</span>
              )}
            </div>

            {errors.valorInteres && (
              <p className="text-xs text-red-600 font-medium">
                <span>⚠</span> {errors.valorInteres.message}
              </p>
            )}
          </div>
        )}

        {/* 3. Modalidad de Pago */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Modalidad de Amortización <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODALIDADES.map((m) => {
              const selected = modalidadPago === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setValue("modalidadPago", m.value, { shouldValidate: true })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{m.title}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">{m.desc}</span>
                </button>
              );
            })}
          </div>
          {errors.modalidadPago && (
            <p className="text-xs text-red-600 font-medium">
              <span>⚠</span> {errors.modalidadPago.message}
            </p>
          )}
        </div>

        {/* 4. Frecuencia y Número de Cuotas */}
        <div className="space-y-4">
          {/* Frecuencia */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Frecuencia de Cobro <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FRECUENCIAS.map((f) => {
                const selected = frecuenciaPago === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setValue("frecuenciaPago", f.value, { shouldValidate: true });
                      setValue("numeroCuotas", getCuotasSugeridas(f.value));
                      setValue("fechaPrimerPago", getFechaSugerida(f.value));
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{f.icon}</span>
                    <span className="font-bold">{f.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{f.tag}</span>
                  </button>
                );
              })}
            </div>
            {errors.frecuenciaPago && (
              <p className="text-xs text-red-600 font-medium">
                <span>⚠</span> {errors.frecuenciaPago.message}
              </p>
            )}
          </div>

          {/* Número de cuotas */}
          <div className="space-y-1.5">
            <label htmlFor="apro-cuotas" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              N° de Cuotas a Pagar <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="apro-cuotas"
                type="number"
                step="1"
                min="1"
                max="365"
                placeholder="4"
                className={`w-full h-11 pl-3.5 pr-14 bg-white border rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition ${
                  errors.numeroCuotas ? "border-red-400" : "border-slate-200"
                }`}
                {...register("numeroCuotas", { valueAsNumber: true })}
              />
              <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">cuotas</span>
            </div>
            {errors.numeroCuotas && (
              <p className="text-xs text-red-600 font-medium">
                <span>⚠</span> {errors.numeroCuotas.message}
              </p>
            )}
          </div>
        </div>

        {/* 5. Fecha del primer pago */}
        <div className="space-y-1.5">
          <label htmlFor="apro-fecha" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Fecha del Primer Cobro <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="apro-fecha"
              type="date"
              className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition ${
                errors.fechaPrimerPago ? "border-red-400" : "border-slate-200"
              }`}
              min={getFechaISODatePeru()}
              {...register("fechaPrimerPago")}
            />
          </div>
          {errors.fechaPrimerPago && (
            <p className="text-xs text-red-600 font-medium">
              <span>⚠</span> {errors.fechaPrimerPago.message}
            </p>
          )}
        </div>

        {/* 6. Método de Cobro y Número */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Método de Cobro (Dónde debe abonar el cliente) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {METODOS_COBRO.map((m) => {
                const selected = metodoCobro === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setValue("metodoCobro", m, { shouldValidate: true })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{ICONS_METODO[m]}</span>
                    <span>{LABELS_METODO_DESEMBOLSO[m]}</span>
                  </button>
                );
              })}
            </div>
            {errors.metodoCobro && (
              <p className="text-xs text-red-600 font-medium">
                <span>⚠</span> {errors.metodoCobro.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apro-numero-cobro" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {metodoCobro ? `Número o Cuenta de ${LABELS_METODO_DESEMBOLSO[metodoCobro]}` : "Número de cuenta / celular"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="apro-numero-cobro"
              type="text"
              placeholder="Ej: 987654321 o 00219100000000000000"
              className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition ${
                errors.numeroCobro ? "border-red-400" : "border-slate-200"
              }`}
              {...register("numeroCobro")}
            />
            {errors.numeroCobro && (
              <p className="text-xs text-red-600 font-medium">
                <span>⚠</span> {errors.numeroCobro.message}
              </p>
            )}
          </div>
        </div>

        {/* ─── Proyección del Cronograma en Tiempo Real ─── */}
        {simulacion && (
          <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm animate-in fade-in duration-150">
            {/* Header del Card de Proyección */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Proyección Financiera en Tiempo Real</span>
                </p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {simulacion.cuotas.length} {simulacion.cuotas.length === 1 ? "Cuota" : "Cuotas"} (
                  {LABELS_PERIODICIDAD[frecuenciaPago].toLowerCase()})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
                  <p className="text-lg sm:text-2xl font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                    {fmtPEN(simulacion.valorCuotaBase)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Monto por Cuota</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
                  <p className="text-lg sm:text-2xl font-black text-amber-400" style={{ fontFamily: "var(--font-outfit)" }}>
                    {fmtPEN(simulacion.gananciaEstimada)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Ganancia Neta</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 backdrop-blur-xs">
                  <p className="text-lg sm:text-2xl font-black text-emerald-400" style={{ fontFamily: "var(--font-outfit)" }}>
                    {fmtPEN(simulacion.totalAPagar)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total a Cobrar</p>
                </div>
              </div>
            </div>

            {/* Toggle de Tabla de Cronograma */}
            <div className="bg-white">
              <button
                type="button"
                onClick={() => setMostrarCronograma(!mostrarCronograma)}
                className="w-full p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer border-t border-slate-100"
                id="sim-toggle-cronograma-admin"
              >
                <span className="flex items-center gap-2">
                  <span>📑</span>
                  <span>Ver tabla de amortización detallada ({simulacion.cuotas.length} cuotas)</span>
                </span>
                {mostrarCronograma ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {mostrarCronograma && (
                <div className="border-t border-slate-100 overflow-x-auto max-h-72">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Vencimiento</th>
                        <th className="p-2.5 text-right">Capital</th>
                        <th className="p-2.5 text-right">Ganancia</th>
                        <th className="p-2.5 text-right font-bold text-slate-900">Cuota</th>
                        <th className="p-2.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulacion.cuotas.map((c) => (
                        <tr key={c.numeroCuota} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-bold text-slate-700">{c.numeroCuota}</td>
                          <td className="p-2.5 text-slate-600">{formatDate(c.fechaVencimiento)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">{fmtPEN(c.capital)}</td>
                          <td className="p-2.5 text-right font-mono text-amber-600 font-semibold">{fmtPEN(c.interes)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{fmtPEN(c.cuotaTotal)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">{fmtPEN(c.saldoRestante)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alertas de Resultado */}
        {mensaje && (
          <div
            className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200 ${
              mensaje.tipo === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
            role="alert"
          >
            {mensaje.tipo === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{mensaje.texto}</span>
          </div>
        )}

        {/* Botón de Confirmación */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !simulacion}
            id="aprobar-prestamo-btn"
            className="w-full min-h-[48px] h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 hover:shadow-lg active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Préstamo y Cronograma...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Aprobación del Préstamo</span>
              </>
            )}
          </button>

          {!simulacion && (
            <p className="text-xs text-center text-slate-400 mt-2">
              Completa los datos requeridos para calcular el cronograma y habilitar la aprobación.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
