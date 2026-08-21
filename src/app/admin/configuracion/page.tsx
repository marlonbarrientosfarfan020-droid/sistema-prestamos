"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldAlert,
  Percent,
  Sliders,
  Info,
  Check,
  X,
} from "lucide-react";

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

export default function ConfiguracionAdminPage() {
  // ─── ESTADOS DE CONFIGURACIÓN FINANCIERA ───
  const [financialConfig, setFinancialConfig] = useState<ConfiguracionFinanciera>({
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
  });
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialSuccess, setFinancialSuccess] = useState<string | null>(null);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // ─── ESTADOS DE PERFIL ───
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ─── ESTADOS DE CONTRASEÑA ───
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ─── CARGA INICIAL DE DATOS ───
  useEffect(() => {
    async function loadData() {
      try {
        setInitialLoading(true);
        // Cargar perfil
        const resProfile = await fetch("/api/admin/perfil");
        const jsonProfile = await resProfile.json();
        if (jsonProfile.success && jsonProfile.data) {
          setNombre(jsonProfile.data.nombre || "");
          setEmail(jsonProfile.data.email || "");
        }

        // Cargar configuración financiera
        const resConfig = await fetch("/api/admin/configuracion");
        const jsonConfig = await resConfig.json();
        if (jsonConfig.success && jsonConfig.data) {
          setFinancialConfig(jsonConfig.data);
        }
      } catch (err) {
        console.error("Error al cargar datos administrativos:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── GUARDAR PARÁMETROS FINANCIEROS Y TASAS ───
  const handleFinancialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFinancialError(null);
    setFinancialSuccess(null);

    if (financialConfig.montoMaximo < financialConfig.montoMinimo) {
      setFinancialError("El monto máximo no puede ser menor al monto mínimo.");
      return;
    }

    setFinancialLoading(true);

    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(financialConfig),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudieron guardar las tasas financieras.");
      }

      setFinancialSuccess(data.message || "¡Tasas y parámetros financieros actualizados correctamente!");
      setTimeout(() => setFinancialSuccess(null), 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFinancialError(err.message);
      } else {
        setFinancialError("Error de conexión al guardar los parámetros.");
      }
    } finally {
      setFinancialLoading(false);
    }
  };

  // ─── GUARDAR PERFIL (NOMBRE & EMAIL) ───
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setProfileError("El nombre completo debe tener al menos 3 caracteres.");
      return;
    }

    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setProfileError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch("/api/admin/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudieron guardar los cambios.");
      }

      setProfileSuccess(data.message || "Perfil administrativo actualizado con éxito.");
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError("Error de conexión al actualizar el perfil.");
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── ACTUALIZAR CONTRASEÑA ───
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Ingresa tu contraseña actual.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener como mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la contraseña actual.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/admin/perfil/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar la contraseña.");
      }

      setPasswordSuccess(data.message || "¡Contraseña actualizada exitosamente!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError("Error al procesar la solicitud de cambio de clave.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* ─── ENCABEZADO DE SECCIÓN ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Parámetros & Sistema</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Configuración del Sistema y Tasas
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Ajusta en tiempo real los porcentajes de interés, cuotas sugeridas, límites de préstamo y gestiona tu perfil administrativo.
          </p>
        </div>

        {/* Badge de Estado */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronización en Vivo</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BLOQUE 1: CONFIGURACIÓN FINANCIERA Y TASAS (FULL WIDTH CARD)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="card p-5 sm:p-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                Tasas de Interés y Modalidades de Pago
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Define el porcentaje de ganancia total aplicado al capital y el número de cuotas sugeridas para cada frecuencia.
              </p>
            </div>
          </div>

          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
            Impacta inmediatamente al simulador público
          </span>
        </div>

        {/* Alertas */}
        {financialSuccess && (
          <div
            className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            role="alert"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{financialSuccess}</span>
          </div>
        )}

        {financialError && (
          <div
            className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{financialError}</span>
          </div>
        )}

        {initialLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Cargando parámetros financieros...</span>
          </div>
        ) : (
          <form onSubmit={handleFinancialSubmit} className="mt-6 space-y-6">
            {/* Grid de 4 Frecuencias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Modalidad 1: Diario */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>📅</span> Pago Diario
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Días Hábiles
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaDiaria}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaDiaria: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultDiario}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultDiario: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>

              {/* Modalidad 2: Semanal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>🗓️</span> Pago Semanal
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    7 Días
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaSemanal}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaSemanal: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultSemanal}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultSemanal: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>

              {/* Modalidad 3: Quincenal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>📆</span> Pago Quincenal
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    15 Días
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaQuincenal}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaQuincenal: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultQuincenal}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultQuincenal: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>

              {/* Modalidad 4: Mensual */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>🗒️</span> Pago Mensual
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    30 Días
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaMensual}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaMensual: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultMensual}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultMensual: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>

              {/* Modalidad 5: Trimestral */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>🏛️</span> Pago Trimestral
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    Cada 3 Meses
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaTrimestral ?? 15.0}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaTrimestral: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultTrimestral ?? 1}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultTrimestral: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>

              {/* Modalidad 6: Semestral */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>📈</span> Pago Semestral
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Medio Año
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Tasa de Interés (%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={financialConfig.tasaSemestral ?? 25.0}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, tasaSemestral: parseFloat(e.target.value) || 0 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Cuotas Sugeridas
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={financialConfig.cuotasDefaultSemestral ?? 1}
                      onChange={(e) =>
                        setFinancialConfig({ ...financialConfig, cuotasDefaultSemestral: parseInt(e.target.value) || 1 })
                      }
                      required
                      className="w-full h-10 pl-3 pr-14 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">cuotas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetros Globales: Montos y Mora */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Monto Mínimo Solicitud (S/)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-500 pointer-events-none select-none z-10">
                    S/
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={financialConfig.montoMinimo}
                    onChange={(e) =>
                      setFinancialConfig({ ...financialConfig, montoMinimo: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full h-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition"
                    style={{ paddingLeft: "2.75rem" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Monto Máximo Solicitud (S/)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-500 pointer-events-none select-none z-10">
                    S/
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={financialConfig.montoMaximo}
                    onChange={(e) =>
                      setFinancialConfig({ ...financialConfig, montoMaximo: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full h-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition"
                    style={{ paddingLeft: "2.75rem" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tasa de Mora Diaria (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={financialConfig.tasaMoraDiaria}
                    onChange={(e) =>
                      setFinancialConfig({ ...financialConfig, tasaMoraDiaria: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full h-11 pl-3.5 pr-14 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                  <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">% diario</span>
                </div>
              </div>
            </div>

            {/* Botón Guardar Parámetros Financieros */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={financialLoading}
                id="btn-guardar-tasas"
                className="w-full sm:w-auto min-h-[44px] h-11 px-7 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {financialLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando tasas...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Tasas y Parámetros</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── GRID RESPONSIVO: PERFIL Y CONTRASEÑA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════════════════
            TARJETA 2: DATOS DEL ADMINISTRADOR
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 sm:p-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                Perfil del Administrador
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Datos identificatorios del operador de la cuenta.
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{profileError}</span>
            </div>
          )}

          {initialLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Cargando datos del perfil...</span>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Nombre Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={profileLoading}
                    placeholder="Ej. Juan Pérez Martínez"
                    required
                    className="w-full min-h-[44px] h-11 pl-10 pr-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm transition-all duration-150 outline-none hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email-field"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={profileLoading}
                    placeholder="admin@prestamos.pe"
                    required
                    className="w-full min-h-[44px] h-11 pl-10 pr-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm transition-all duration-150 outline-none hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>Este correo es el identificador principal para iniciar sesión.</span>
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={profileLoading}
                  id="btn-guardar-perfil"
                  className="w-full sm:w-auto min-h-[44px] h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TARJETA 3: SEGURIDAD Y CAMBIO DE CONTRASEÑA
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 sm:p-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                Seguridad y Contraseña
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Actualiza tu clave para reforzar la protección del sistema.
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="current-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Contraseña Actual
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  placeholder="Tu contraseña actual"
                  required
                  autoComplete="current-password"
                  className="w-full min-h-[44px] h-11 pl-10 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm transition-all duration-150 outline-none hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] justify-center focus:outline-none transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Nueva Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full min-h-[44px] h-11 pl-10 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm transition-all duration-150 outline-none hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                  aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] justify-center focus:outline-none transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                  {hasMinLength ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Mínimo 6 caracteres cumplido
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Faltan {6 - newPassword.length} caracteres
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  placeholder="Repite la nueva contraseña"
                  required
                  autoComplete="new-password"
                  className={`w-full min-h-[44px] h-11 pl-10 pr-11 bg-slate-50/50 border rounded-xl text-slate-900 placeholder-slate-400 text-sm transition-all duration-150 outline-none hover:border-slate-300 focus:bg-white focus:ring-4 disabled:opacity-60 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                        : "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] justify-center focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                  {passwordsMatch ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Las contraseñas coinciden
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1 font-medium">
                      <X className="w-3 h-3" /> Las contraseñas no coinciden
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                Para mayor seguridad, combina letras mayúsculas, minúsculas, números y caracteres especiales.
              </span>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={passwordLoading}
                id="btn-actualizar-password"
                className="w-full sm:w-auto min-h-[44px] h-11 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando clave...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
