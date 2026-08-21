"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Activity,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Estados de validación y respuesta
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validación básica en cliente
    if (!email.trim()) {
      setErrorMessage("Por favor, ingresa tu correo electrónico administrativo.");
      return;
    }
    if (!password) {
      setErrorMessage("Por favor, ingresa tu contraseña de seguridad.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Credenciales incorrectas o servidor no disponible."
        );
      }

      // Autenticación exitosa
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Error inesperado al conectar con el servidor de autenticación.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 antialiased font-sans">
      {/* ─── FONDOS AMBIENTALES Y RESPLANDOR FINTECH ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glow Superior Izquierdo (Esmeralda) */}
        <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-emerald-600/20 rounded-full blur-[100px] sm:blur-[140px]" />

        {/* Glow Inferior Derecho (Cian / Teal) */}
        <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-[520px] sm:h-[520px] bg-teal-500/15 rounded-full blur-[100px] sm:blur-[150px]" />

        {/* Resplandor Central Sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[650px] h-[300px] sm:h-[650px] bg-emerald-950/30 rounded-full blur-[120px]" />

        {/* Patrón de Malla de Fondo Sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ─── BARRA SUPERIOR BRANDING ─── */}
      <header className="relative z-10 w-full max-w-6xl px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
          id="brand-logo-link"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
            <span className="text-lg sm:text-xl">💰</span>
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-outfit">
            Préstamos<span className="text-emerald-400">PE</span>
          </span>
        </Link>

        {/* Indicador de Seguridad Superior */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-slate-400 text-xs shadow-sm backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso Privado y Seguro</span>
        </div>
      </header>

      {/* ─── CONTENEDOR PRINCIPAL / CARD GLASSMORPHISM ─── */}
      <main className="relative z-10 w-full max-w-md px-4 sm:px-0 my-auto py-4 sm:py-6">
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.06)] p-6 sm:p-9 transition-all duration-300">
          {/* Línea Superior de Brillo Neón */}
          <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          {/* ─── HEADER DE LA TARJETA ─── */}
          <div className="text-center mb-7">
            {/* Insignia Superior */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(16,185,129,0.12)] mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>ACCESO ADMINISTRATIVO • PRESTAMISTA</span>
            </div>

            {/* Icono con Brillo Esmeralda */}
            <div className="relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-800 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)] mb-3 group hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              <Sparkles className="w-3.5 h-3.5 text-teal-300 absolute -top-1 -right-1 animate-pulse" />
            </div>

            {/* Título y Subtítulo */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-outfit">
              Portal Prestamista
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Ingresa tus credenciales autorizadas para gestionar solicitudes, cuotas y desembolsos.
            </p>
          </div>

          {/* ─── ALERTA DE ERROR / ESTADO ─── */}
          {errorMessage && (
            <div
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-in fade-in slide-in-from-top-2 duration-200"
              role="alert"
              id="login-error-alert"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <p className="font-medium text-rose-200">Error de autenticación</p>
                <p className="text-rose-300/90 text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ─── ALERTA DE ÉXITO ─── */}
          {isSuccess && (
            <div
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-in fade-in duration-200"
              id="login-success-alert"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="font-medium">Credenciales verificadas. Accediendo al panel...</p>
            </div>
          )}

          {/* ─── FORMULARIO ─── */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Campo: Correo Electrónico */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isSuccess}
                  placeholder="admin@prestamos.pe"
                  required
                  autoComplete="email"
                  className="w-full min-h-[48px] h-12 pl-11 pr-4 bg-slate-950/60 border border-slate-800/90 rounded-xl text-white placeholder-slate-500 text-sm transition-all duration-200 outline-none hover:border-slate-700 focus:border-emerald-500/80 focus:bg-slate-950/90 focus:ring-4 focus:ring-emerald-500/15 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Contraseña de Seguridad
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isSuccess}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full min-h-[48px] h-12 pl-11 pr-12 bg-slate-950/60 border border-slate-800/90 rounded-xl text-white placeholder-slate-500 text-sm transition-all duration-200 outline-none hover:border-slate-700 focus:border-emerald-500/80 focus:bg-slate-950/90 focus:ring-4 focus:ring-emerald-500/15 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors min-h-[48px] min-w-[48px] justify-center focus:outline-none"
                  id="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones Adicionales: Checkbox & Cifrado SSL */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Checkbox Recordar Sesión */}
              <label
                htmlFor="remember-session"
                className="flex items-center gap-2.5 cursor-pointer text-slate-300 select-none group min-h-[32px]"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    id="remember-session"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isSuccess}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded-md border border-slate-700 bg-slate-950/80 peer-checked:bg-emerald-500 peer-checked:border-emerald-400 transition-all duration-200 group-hover:border-slate-600 peer-focus:ring-2 peer-focus:ring-emerald-500/30 flex items-center justify-center" />
                  <svg
                    className={`absolute w-3 h-3 text-slate-950 pointer-events-none transition-opacity duration-150 ${
                      rememberMe ? "opacity-100" : "opacity-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-slate-300 group-hover:text-slate-200 transition-colors">
                  Mantener sesión iniciada
                </span>
              </label>

              {/* Indicador de Cifrado */}
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cifrado SSL 256-bit</span>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                id="submit-admin-login"
                className="w-full min-h-[48px] h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                    <span>Acceso Autorizado</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Panel</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ─── NOTA DE SEGURIDAD INTERNA ─── */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>IP y eventos de autenticación auditados por seguridad</span>
            </p>
          </div>
        </div>
      </main>

      {/* ─── FOOTER RESPONSIVO ─── */}
      <footer className="relative z-10 w-full max-w-6xl px-4 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/5 sm:border-transparent">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-900/50"
          id="footer-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al sitio público</span>
        </Link>

        <div className="flex items-center gap-2 text-slate-400 text-center text-[11px] sm:text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>PrestaPerú v1.0 • Sistema Operativo</span>
        </div>
      </footer>
    </div>
  );
}
