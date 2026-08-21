"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Percent,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Calculator,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { formatPEN, LABELS_PERIODICIDAD } from "@/lib/utils/formatters";
import type { PeriodicidadPago } from "@/types";

interface ConfiguracionFinanciera {
  id: string;
  tasaDiaria: number;
  tasaSemanal: number;
  tasaQuincenal: number;
  tasaMensual: number;
  tasaTrimestral: number;
  tasaSemestral: number;
  cuotasDefaultDiario: number;
  cuotasDefaultSemanal: number;
  cuotasDefaultQuincenal: number;
  cuotasDefaultMensual: number;
  cuotasDefaultTrimestral: number;
  cuotasDefaultSemestral: number;
  montoMinimo: number;
  montoMaximo: number;
  tasaMoraDiaria: number;
  whatsappNumero?: string | null;
  whatsappMensaje?: string | null;
}

export default function TasasInteresPage() {
  const [config, setConfig] = useState<ConfiguracionFinanciera>({
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
    whatsappNumero: "51987654321",
    whatsappMensaje: "Hola, deseo solicitar información sobre los préstamos.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del Simulador en Vivo Integrado
  const [simMonto, setSimMonto] = useState<number>(1000);
  const [simFrecuencia, setSimFrecuencia] = useState<PeriodicidadPago>("QUINCENAL");

  // Cargar configuración activa
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/configuracion");
        const json = await res.json();
        if (json.success && json.data) {
          setConfig({
            ...json.data,
            tasaTrimestral: json.data.tasaTrimestral ?? 15.0,
            tasaSemestral: json.data.tasaSemanal ?? 25.0,
            cuotasDefaultTrimestral: json.data.cuotasDefaultTrimestral ?? 1,
            cuotasDefaultSemestral: json.data.cuotasDefaultSemestral ?? 1,
          });
        }
      } catch (err) {
        console.error("Error al cargar tasas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // ─── CÁLCULO EN VIVO DEL SIMULADOR ───
  const simulacion = useMemo(() => {
    let tasaPct = config.tasaQuincenal;
    let cuotas = config.cuotasDefaultQuincenal;

    if (simFrecuencia === "DIARIO") {
      tasaPct = config.tasaDiaria;
      cuotas = config.cuotasDefaultDiario;
    } else if (simFrecuencia === "SEMANAL") {
      tasaPct = config.tasaSemanal;
      cuotas = config.cuotasDefaultSemanal;
    } else if (simFrecuencia === "QUINCENAL") {
      tasaPct = config.tasaQuincenal;
      cuotas = config.cuotasDefaultQuincenal;
    } else if (simFrecuencia === "MENSUAL") {
      tasaPct = config.tasaMensual;
      cuotas = config.cuotasDefaultMensual;
    } else if (simFrecuencia === "TRIMESTRAL") {
      tasaPct = config.tasaTrimestral;
      cuotas = config.cuotasDefaultTrimestral;
    } else if (simFrecuencia === "SEMESTRAL") {
      tasaPct = config.tasaSemestral;
      cuotas = config.cuotasDefaultSemestral;
    }

    const interesTotal = (simMonto * tasaPct) / 100;
    const totalAPagar = simMonto + interesTotal;
    const valorCuota = cuotas > 0 ? totalAPagar / cuotas : totalAPagar;

    return {
      tasaPct,
      cuotas,
      interesTotal,
      totalAPagar,
      valorCuota,
    };
  }, [simMonto, simFrecuencia, config]);

  // ─── GUARDAR CONFIGURACIÓN ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (config.montoMaximo < config.montoMinimo) {
      setErrorMsg("El monto máximo no puede ser menor al monto mínimo.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar las tasas financieras.");
      }

      setSuccessMsg("¡Tasas de interés y parámetros actualizados! El cotizador público ya está sincronizado en vivo.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* ─── ENCABEZADO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Motor Financiero & Cotizador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
            Tasas de Interés y Parámetros del Simulador
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Ajusta los porcentajes de interés para cada periodicidad. Todos los cambios se reflejan inmediatamente en el cotizador público y en el motor de préstamos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronización en Vivo</span>
        </div>
      </div>

      {/* ─── FEEDBACK ALERTS ─── */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-200" role="alert">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-200" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Cargando tasas de interés y parámetros...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 1: GRID DE LAS 6 PERIODICIDADES
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="card p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 font-outfit">
                    Tasas por Frecuencia de Pago
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Configura la tasa de interés base aplicada y el número de cuotas sugeridas.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* 1. DIARIO */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">📅</span> Pago Diario
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Días Hábiles
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaDiaria}
                      onChange={(e) => setConfig({ ...config, tasaDiaria: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultDiario}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultDiario: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* 2. SEMANAL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">🗓️</span> Pago Semanal
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Cada 7 Días
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaSemanal}
                      onChange={(e) => setConfig({ ...config, tasaSemanal: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultSemanal}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultSemanal: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* 3. QUINCENAL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">📆</span> Pago Quincenal
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Cada 15 Días
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaQuincenal}
                      onChange={(e) => setConfig({ ...config, tasaQuincenal: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultQuincenal}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultQuincenal: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* 4. MENSUAL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">🗒️</span> Pago Mensual
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Cada 30 Días
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaMensual}
                      onChange={(e) => setConfig({ ...config, tasaMensual: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultMensual}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultMensual: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* 5. TRIMESTRAL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">🏛️</span> Pago Trimestral
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    Cada 3 Meses
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaTrimestral}
                      onChange={(e) => setConfig({ ...config, tasaTrimestral: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultTrimestral}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultTrimestral: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* 6. SEMESTRAL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="text-base">📈</span> Pago Semestral
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Medio Año
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={config.tasaSemestral}
                      onChange={(e) => setConfig({ ...config, tasaSemestral: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.cuotasDefaultSemestral}
                    onChange={(e) => setConfig({ ...config, cuotasDefaultSemanal: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Parámetros Globales */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Monto Mínimo (S/)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={config.montoMinimo}
                  onChange={(e) => setConfig({ ...config, montoMinimo: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Monto Máximo (S/)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={config.montoMaximo}
                  onChange={(e) => setConfig({ ...config, montoMaximo: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tasa de Mora Diaria (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={config.tasaMoraDiaria}
                    onChange={(e) => setConfig({ ...config, tasaMoraDiaria: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full h-11 pl-3.5 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                  <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">% diario</span>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECCIÓN WHATSAPP & ATENCIÓN AL CLIENTE
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="pt-5 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Atención por WhatsApp y Botón Flotante</h3>
                  <p className="text-xs text-slate-500 font-normal">Configura el canal directo de contacto para la landing page y el sitio público.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Número de WhatsApp (con código de país 51)
                  </label>
                  <input
                    type="text"
                    placeholder="51987654321"
                    value={config.whatsappNumero || ""}
                    onChange={(e) => setConfig({ ...config, whatsappNumero: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">Ejemplo: 51987654321 (código Perú + número de 9 dígitos)</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Mensaje Inicial del Chat
                  </label>
                  <input
                    type="text"
                    placeholder="Hola, deseo solicitar información sobre los préstamos."
                    value={config.whatsappMensaje || ""}
                    onChange={(e) => setConfig({ ...config, whatsappMensaje: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">Texto precargado cuando el cliente abre el chat</p>
                </div>
              </div>

              {/* Vista previa interactiva del enlace */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-emerald-900 flex-shrink-0">Enlace en vivo:</span>
                  <span className="font-mono text-[11px] text-emerald-800 truncate">
                    {`https://wa.me/${(config.whatsappNumero || "51987654321").replace(/\D/g, "")}?text=${encodeURIComponent(config.whatsappMensaje || "Hola, deseo solicitar información sobre los préstamos.")}`}
                  </span>
                </div>
                <a
                  href={`https://wa.me/${(config.whatsappNumero || "51987654321").replace(/\D/g, "")}?text=${encodeURIComponent(config.whatsappMensaje || "Hola, deseo solicitar información sobre los préstamos.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Probar Chat en WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                id="btn-guardar-tasas-modulo"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando tasas...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar y Sincronizar Tasas</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 2: SIMULADOR INTERACTIVO EN TIEMPO REAL (PRUEBA EN VIVO)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="card p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-white font-outfit">
                    Simulador en Vivo de Pruebas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprueba instantáneamente el cálculo de cuotas y ganancias según los valores actuales.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                ⚡ Cálculo Dinámico
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Controles de Simulación */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Monto de Prueba (S/): <span className="text-emerald-400 font-extrabold text-base">{formatPEN(simMonto)}</span>
                  </label>
                  <input
                    type="range"
                    min={config.montoMinimo}
                    max={config.montoMaximo}
                    step="50"
                    value={simMonto}
                    onChange={(e) => setSimMonto(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Mín: {formatPEN(config.montoMinimo)}</span>
                    <span>Máx: {formatPEN(config.montoMaximo)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Frecuencia de Prueba:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL", "TRIMESTRAL", "SEMESTRAL"] as PeriodicidadPago[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSimFrecuencia(f)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                          simFrecuencia === f
                            ? "bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20"
                            : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {LABELS_PERIODICIDAD[f]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tarjeta de Resultados */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700/60">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Tasa Aplicada</p>
                    <p className="text-xl font-bold text-white mt-0.5">{simulacion.tasaPct}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">N° de Cuotas</p>
                    <p className="text-xl font-bold text-white mt-0.5">{simulacion.cuotas} cuota{simulacion.cuotas !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Ganancia Estimada</p>
                    <p className="text-xl font-bold text-amber-400 mt-0.5">{formatPEN(simulacion.interesTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Total a Cobrar</p>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatPEN(simulacion.totalAPagar)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-300">Valor de cada cuota:</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit mt-0.5">
                      {formatPEN(simulacion.valorCuota)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg">
                      Fija Amortizable
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
