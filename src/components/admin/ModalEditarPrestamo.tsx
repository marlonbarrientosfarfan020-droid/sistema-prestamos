"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { aprobacionSchema, type AprobacionData } from "@/lib/validations/solicitud";
import { generarCronograma } from "@/lib/finance/cronograma";
import {
  getFechaISODatePeru,
  parseISODatePeru,
  formatFechaPeru,
} from "@/lib/utils/dates";
import {
  LABELS_METODO_DESEMBOLSO,
  LABELS_PERIODICIDAD,
  ICONS_METODO,
  formatPEN as fmtPEN,
  formatDate,
} from "@/lib/utils/formatters";
import type {
  TipoTasa,
  ModalidadPago,
  PeriodicidadPago,
  MetodoDesembolso,
  ResultadoCronograma,
} from "@/types";
import {
  Pencil,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Save,
  Calculator,
  Calendar,
} from "lucide-react";

interface PrestamoExistente {
  id: string;
  solicitudId: string;
  montoAprobado: number;
  tipoTasa: TipoTasa;
  valorInteres: number;
  modalidadPago: ModalidadPago;
  frecuenciaPago: PeriodicidadPago;
  numeroCuotas: number;
  fechaPrimerPago: string | Date;
  metodoCobro: MetodoDesembolso;
  numeroCobro: string;
}

interface Props {
  prestamo: PrestamoExistente;
  onActualizado?: () => void;
}

const TIPOS_TASA: { value: TipoTasa; icon: string; title: string }[] = [
  { value: "PORCENTAJE_TOTAL", icon: "💹", title: "% Total sobre Capital" },
  { value: "PORCENTAJE_MENSUAL", icon: "📊", title: "% Tasa Mensual" },
  { value: "MONTO_FIJO_GANANCIA", icon: "💵", title: "Monto Fijo (S/)" },
];

const MODALIDADES: { value: ModalidadPago; title: string }[] = [
  { value: "CUOTA_FIJA_AMORTIZABLE", title: "Cuota Fija Amortizable" },
  { value: "SOLO_INTERES_CAPITAL_FINAL", title: "Solo Interés + Capital Final" },
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

/**
 * Calcula automáticamente la fecha del primer cobro en hora de Perú (America/Lima)
 * según la frecuencia seleccionada:
 * - Diario: Siguiente día (+1), si es domingo pasa a lunes.
 * - Semanal: +7 días.
 * - Quincenal: +15 días.
 * - Mensual: +1 mes.
 * - Trimestral: +3 meses.
 * - Semestral: +6 meses.
 * - Pago Único: +3 meses (90 días por defecto, configurable).
 */
export function calcularSiguienteFechaCobro(frecuencia: string, fechaBase: Date = new Date()): string {
  const strLima = fechaBase.toLocaleString("en-US", { timeZone: "America/Lima" });
  const fecha = new Date(strLima);
  fecha.setHours(12, 0, 0, 0);

  if (frecuencia === "Diario" || frecuencia === "DIARIO") {
    fecha.setDate(fecha.getDate() + 1);
    if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1); // Salta domingo a lunes
  } else if (frecuencia === "Semanal" || frecuencia === "SEMANAL") {
    fecha.setDate(fecha.getDate() + 7);
  } else if (frecuencia === "Quincenal" || frecuencia === "QUINCENAL") {
    fecha.setDate(fecha.getDate() + 15);
  } else if (frecuencia === "Mensual" || frecuencia === "MENSUAL") {
    fecha.setMonth(fecha.getMonth() + 1);
  } else if (frecuencia === "Trimestral" || frecuencia === "TRIMESTRAL") {
    fecha.setMonth(fecha.getMonth() + 3);
  } else if (frecuencia === "Semestral" || frecuencia === "SEMESTRAL") {
    fecha.setMonth(fecha.getMonth() + 6);
  } else if (frecuencia === "Pago Unico" || frecuencia === "PAGO_UNICO") {
    fecha.setMonth(fecha.getMonth() + 3);
  }

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ModalEditarPrestamo({ prestamo, onActualizado }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [simulacion, setSimulacion] = useState<ResultadoCronograma | null>(null);
  const [mostrarCronograma, setMostrarCronograma] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formatear fecha inicial para el input <input type="date">
  const fechaInicialStr = (() => {
    if (prestamo.fechaPrimerPago) {
      const d =
        typeof prestamo.fechaPrimerPago === "string"
          ? parseISODatePeru(prestamo.fechaPrimerPago)
          : prestamo.fechaPrimerPago;
      return getFechaISODatePeru(d);
    }
    return calcularSiguienteFechaCobro(prestamo.frecuenciaPago);
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AprobacionData>({
    resolver: zodResolver(aprobacionSchema),
    defaultValues: {
      montoAprobado: prestamo.montoAprobado,
      tipoTasa: prestamo.tipoTasa,
      valorInteres: prestamo.valorInteres,
      modalidadPago: prestamo.modalidadPago,
      frecuenciaPago: prestamo.frecuenciaPago,
      numeroCuotas: prestamo.numeroCuotas,
      fechaPrimerPago: fechaInicialStr,
      metodoCobro: prestamo.metodoCobro,
      numeroCobro: prestamo.numeroCobro,
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

  // Recalcular proyección en tiempo real
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
      const fecha = parseISODatePeru(fechaPrimerPago);
      const resultado = generarCronograma({
        montoAprobado: montoNum,
        tipoTasa,
        valorInteres: valorNum,
        modalidadPago,
        frecuenciaPago,
        numeroCuotas: cuotasNum,
        fechaPrimerPago: fecha,
      });
      setSimulacion(resultado);
    } catch (e) {
      console.error("Error en simulación:", e);
    }
  }, [montoAprobado, valorInteres, numeroCuotas, tipoTasa, modalidadPago, frecuenciaPago, fechaPrimerPago]);

  // Recalcular reactivamente ante cualquier cambio de valor
  useEffect(() => {
    if (isOpen) {
      recalcular();
    }
  }, [isOpen, recalcular]);

  // Al abrir el modal, sincronizar los datos y calcular la fecha adecuada
  const handleOpenModal = () => {
    reset({
      montoAprobado: prestamo.montoAprobado,
      tipoTasa: prestamo.tipoTasa,
      valorInteres: prestamo.valorInteres,
      modalidadPago: prestamo.modalidadPago,
      frecuenciaPago: prestamo.frecuenciaPago,
      numeroCuotas: prestamo.numeroCuotas,
      fechaPrimerPago: fechaInicialStr,
      metodoCobro: prestamo.metodoCobro,
      numeroCobro: prestamo.numeroCobro,
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSaving) {
      setIsOpen(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/prestamos/${prestamo.id}/editar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo actualizar el préstamo.");
      }

      setSuccessMsg("¡Préstamo y cronograma actualizados correctamente!");
      setTimeout(() => {
        setIsOpen(false);
        onActualizado?.();
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error de conexión al guardar cambios.");
      }
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <>
      {/* ─── Botón Gatillador ─── */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs hover:bg-emerald-50 hover:border-emerald-400 active:scale-[0.98] transition cursor-pointer"
        id="btn-editar-prestamo"
      >
        <Pencil className="w-3.5 h-3.5 text-emerald-600" />
        <span>Editar Préstamo</span>
      </button>

      {/* ─── Modal de Edición (Bottom Sheet en Móvil / Centrado en Desktop) ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="card max-w-2xl w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                    Modificar Préstamo Aprobado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajusta los parámetros y regenera el cronograma de cobros en la base de datos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Alertas */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form id="form-editar-prestamo" onSubmit={onSubmit} noValidate className="space-y-4">
                {/* 1. Monto Aprobado */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-monto" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Monto Aprobado (Capital) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-bold text-slate-500 pointer-events-none select-none z-10">
                      S/
                    </span>
                    <input
                      id="edit-monto"
                      type="number"
                      step="any"
                      min="1"
                      placeholder="500.00"
                      className={`w-full h-11 pr-4 bg-slate-50/50 border rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition ${
                        errors.montoAprobado ? "border-red-400" : "border-slate-200"
                      }`}
                      style={{ paddingLeft: "2.75rem" }}
                      {...register("montoAprobado", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.montoAprobado && (
                    <p className="text-xs text-red-600 font-medium">⚠ {errors.montoAprobado.message}</p>
                  )}
                </div>

                {/* 2. Tipo de Tasa y Valor */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tipo de Ganancia <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TIPOS_TASA.map((t) => {
                      const selected = tipoTasa === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setValue("tipoTasa", t.value, { shouldValidate: true, shouldDirty: true })}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 text-xs font-medium"
                          }`}
                        >
                          <span className="text-xs flex items-center gap-1.5">
                            <span>{t.icon}</span>
                            <span>{t.title}</span>
                          </span>
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input condicional de Valor de Ganancia */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label htmlFor="edit-valor-interes" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {tipoTasa === "PORCENTAJE_TOTAL"
                      ? "Porcentaje Total de Ganancia (%)"
                      : tipoTasa === "PORCENTAJE_MENSUAL"
                      ? "Tasa Mensual Efectiva (%)"
                      : "Monto Fijo de Ganancia en Soles (S/)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative flex items-center">
                    {tipoTasa === "MONTO_FIJO_GANANCIA" && (
                      <span className="absolute left-3.5 text-sm font-bold text-slate-500 pointer-events-none select-none z-10">
                        S/
                      </span>
                    )}

                    <input
                      id="edit-valor-interes"
                      type="number"
                      step="any"
                      min="0"
                      placeholder={tipoTasa === "MONTO_FIJO_GANANCIA" ? "100.00" : "20.0"}
                      className="w-full h-10 pr-10 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      style={{ paddingLeft: tipoTasa === "MONTO_FIJO_GANANCIA" ? "2.75rem" : "0.75rem" }}
                      {...register("valorInteres", { valueAsNumber: true })}
                    />

                    {tipoTasa !== "MONTO_FIJO_GANANCIA" && (
                      <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                    )}
                  </div>
                  {errors.valorInteres && (
                    <p className="text-xs text-red-600 font-medium">⚠ {errors.valorInteres.message}</p>
                  )}
                </div>

                {/* 3. Modalidad de Pago */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Modalidad de Amortización <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODALIDADES.map((m) => {
                      const selected = modalidadPago === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setValue("modalidadPago", m.value, { shouldValidate: true, shouldDirty: true })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{m.title}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Frecuencia y Número de Cuotas con Cálculo Automático de Fecha */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Frecuencia de Cobro <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {FRECUENCIAS.map((f) => {
                        const selected = frecuenciaPago === f.value;
                        return (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => {
                              setValue("frecuenciaPago", f.value, { shouldValidate: true, shouldDirty: true });
                              // Actualizar automáticamente la fecha de primer pago según la frecuencia elegida
                              const nuevaFecha = calcularSiguienteFechaCobro(f.value);
                              setValue("fechaPrimerPago", nuevaFecha, { shouldValidate: true, shouldDirty: true });
                              if (["PAGO_UNICO", "TRIMESTRAL", "SEMESTRAL", "MENSUAL"].includes(f.value) && (!numeroCuotas || numeroCuotas > 12)) {
                                setValue("numeroCuotas", 1, { shouldValidate: true, shouldDirty: true });
                              }
                            }}
                            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                              selected
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-sm">{f.icon}</span>
                            <span className="font-bold">{f.label}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{f.tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-cuotas" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      N° de Cuotas a Cobrar <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="edit-cuotas"
                        type="number"
                        step="1"
                        min="1"
                        max="365"
                        className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        {...register("numeroCuotas", { valueAsNumber: true })}
                      />
                      <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">cuotas</span>
                    </div>
                    {errors.numeroCuotas && (
                      <p className="text-xs text-red-600 font-medium">⚠ {errors.numeroCuotas.message}</p>
                    )}
                  </div>
                </div>

                {/* 5. Fecha del Primer Pago con selector de calendario editable */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="edit-fecha" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Fecha del Primer Cobro <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatFechaPeru(fechaPrimerPago)}</span>
                    </span>
                  </div>

                  <input
                    id="edit-fecha"
                    type="date"
                    min={getFechaISODatePeru()}
                    className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition ${
                      errors.fechaPrimerPago ? "border-red-400" : "border-slate-200"
                    }`}
                    {...register("fechaPrimerPago")}
                  />
                  {errors.fechaPrimerPago && (
                    <p className="text-xs text-red-600 font-medium">⚠ {errors.fechaPrimerPago.message}</p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Se calcula automáticamente según la frecuencia, pero puedes modificar la fecha libremente si lo deseas.
                  </p>
                </div>

                {/* 6. Método y Número de Cobro */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Método de Cobro <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {METODOS_COBRO.map((m) => {
                        const selected = metodoCobro === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setValue("metodoCobro", m, { shouldValidate: true, shouldDirty: true })}
                            className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                              selected
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{ICONS_METODO[m]}</span>
                            <span>{LABELS_METODO_DESEMBOLSO[m]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-numero-cobro" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Número o Cuenta de Cobro <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-numero-cobro"
                      type="text"
                      placeholder="Ej: 987654321 o 00219100000000000000"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      {...register("numeroCobro")}
                    />
                  </div>
                </div>

                {/* ─── Proyección en Vivo del Nuevo Cronograma ─── */}
                {simulacion && (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 shadow-xs">
                    <div className="p-3.5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white">
                      <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Nuevo Cronograma Proyectado</span>
                        </span>
                        <span className="text-emerald-300 font-normal">
                          {simulacion.cuotas.length} cuotas ({LABELS_PERIODICIDAD[frecuenciaPago].toLowerCase()})
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-base font-bold text-white">{fmtPEN(simulacion.valorCuotaBase)}</p>
                          <p className="text-[10px] text-slate-400">Cuota Base</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-base font-bold text-amber-400">{fmtPEN(simulacion.gananciaEstimada)}</p>
                          <p className="text-[10px] text-slate-400">Ganancia</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-base font-bold text-emerald-400">{fmtPEN(simulacion.totalAPagar)}</p>
                          <p className="text-[10px] text-slate-400">Total a Cobrar</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMostrarCronograma(!mostrarCronograma)}
                      className="w-full p-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between border-t border-slate-100 transition cursor-pointer"
                    >
                      <span>Ver fechas de las {simulacion.cuotas.length} cuotas</span>
                      {mostrarCronograma ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {mostrarCronograma && (
                      <div className="overflow-x-auto max-h-48 border-t border-slate-100 bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <th className="p-2">#</th>
                              <th className="p-2">Vencimiento</th>
                              <th className="p-2 text-right">Capital</th>
                              <th className="p-2 text-right">Ganancia</th>
                              <th className="p-2 text-right font-bold">Cuota</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {simulacion.cuotas.map((c) => (
                              <tr key={c.numeroCuota} className="hover:bg-slate-50">
                                <td className="p-2 font-bold">{c.numeroCuota}</td>
                                <td className="p-2">{formatDate(c.fechaVencimiento)}</td>
                                <td className="p-2 text-right font-mono">{fmtPEN(c.capital)}</td>
                                <td className="p-2 text-right font-mono text-amber-600">{fmtPEN(c.interes)}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900">{fmtPEN(c.cuotaTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Footer de Acciones */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="form-editar-prestamo"
                disabled={isSaving || !simulacion}
                id="btn-guardar-edicion-prestamo"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-[0.99] transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando y Recalculando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios y Recalcular</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { ModalEditarPrestamo as ModalModificarPrestamo };
