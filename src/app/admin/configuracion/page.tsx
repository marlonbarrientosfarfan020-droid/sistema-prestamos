"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ShieldCheck,
  Percent,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { Role } from "@/types";

export default function ConfiguracionAdminPage() {
  const router = useRouter();

  // ─── ESTADOS DE PERFIL (Carga Dinámica desde Sesión Activa) ───
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Estados de Envío y Feedback
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

  // ─── CARGA INICIAL DE DATOS DINÁMICOS DESDE LA SESIÓN ACTIVA ───
  useEffect(() => {
    async function loadSessionProfile() {
      try {
        setInitialLoading(true);
        setProfileError(null);

        const resProfile = await fetch("/api/admin/perfil");
        const jsonProfile = await resProfile.json();

        if (!resProfile.ok || !jsonProfile.success) {
          throw new Error(jsonProfile.error || "No se pudo cargar la información de la sesión.");
        }

        if (jsonProfile.data) {
          setNombre(jsonProfile.data.nombre || "");
          setEmail(jsonProfile.data.email || "");
          setUserRole(jsonProfile.data.role || "ADMIN");
        }
      } catch (err: unknown) {
        console.error("[Configuración] Error al cargar perfil:", err);
        setProfileError(
          err instanceof Error ? err.message : "Error al conectar con el servidor."
        );
      } finally {
        setInitialLoading(false);
      }
    }

    loadSessionProfile();
  }, []);

  // ─── MANEJO DEL ENVÍO DE ACTUALIZACIÓN DE PERFIL (PUT /api/admin/perfil) ───
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const cleanNombre = nombre.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanNombre || cleanNombre.length < 3) {
      setProfileError("El nombre completo debe tener al menos 3 caracteres.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setProfileError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch("/api/admin/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: cleanNombre,
          email: cleanEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el perfil.");
      }

      // Notificación de éxito
      setProfileSuccess(data.message || "Perfil actualizado correctamente.");

      // Disparar evento para refrescar inmediatamente el sidebar y header sin recargar
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session-updated"));
      }
      router.refresh();

      setTimeout(() => setProfileSuccess(null), 6000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Error al actualizar el perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── ACTUALIZACIÓN DE CONTRASEÑA ───
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
      setTimeout(() => setPasswordSuccess(null), 6000);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Error al procesar el cambio de clave."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* ─── ENCABEZADO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Seguridad de Cuenta</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Mi Cuenta Administrativa
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Gestiona tus datos personales de acceso, actualiza tu contraseña de seguridad y accede a los módulos del sistema.
          </p>
        </div>

        {/* Badge Dinámico de Rol */}
        {!initialLoading && userRole && (
          <div>
            {userRole === "SUPER_ADMIN" ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-extrabold shadow-2xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>SUPER_ADMIN • Control Total</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>OPERADOR (ADMIN)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── HUB DE ACCESOS RÁPIDOS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Acceso a Tasas */}
        <Link
          href="/admin/tasas"
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/10 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group flex items-center justify-between"
          id="link-acceso-tasas"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                Módulo de Tasas de Interés
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurar tasas diarias, semanales, quincenales y mensuales en vivo
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Acceso a Gestión de Usuarios (SUPER_ADMIN) */}
        {userRole === "SUPER_ADMIN" ? (
          <Link
            href="/admin/usuarios"
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-indigo-500/10 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group flex items-center justify-between"
            id="link-acceso-usuarios"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                  Gestión de Cuentas y Operadores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crear operadores, asignar roles y switch de bloqueo/suspensión
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between opacity-80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-700">
                  Gestión de Operadores (Solo SUPER_ADMIN)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acceso reservado a la cuenta principal del software
                </p>
              </div>
            </div>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      {/* ─── GRID DE FORMULARIOS: PERFIL Y CONTRASEÑA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════════════════
            TARJETA 1: DATOS DEL PERFIL (NOMBRE Y CORREO)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-outfit">
                Datos del Perfil
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Información identificatoria de tu cuenta activa en el sistema.
              </p>
            </div>
          </div>

          {/* Notificación de Éxito */}
          {profileSuccess && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{profileSuccess}</span>
            </div>
          )}

          {/* Notificación de Error */}
          {profileError && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{profileError}</span>
            </div>
          )}

          {initialLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Cargando datos de la sesión activa...</span>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="perfil-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Nombre Completo
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="perfil-nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="perfil-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="perfil-email"
                    type="email"
                    placeholder="correo@prestamos.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  id="btn-guardar-perfil"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando perfil...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Actualizar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TARJETA 2: CAMBIO DE CONTRASEÑA
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0 shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-outfit">
                Seguridad de Contraseña
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Actualiza tu clave de acceso periódico para mayor seguridad.
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div
              className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Contraseña Actual
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 pl-3.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nueva Contraseña (mín. 6 caracteres)
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 pl-3.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 pl-3.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                id="btn-cambiar-password"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando contraseña...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Cambiar Contraseña</span>
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
