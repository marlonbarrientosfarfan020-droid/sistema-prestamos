"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Phone,
  MessageCircle,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Calculator,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Zap,
  Lock,
  Wallet,
  Search,
  Check,
  TrendingUp,
} from "lucide-react";
import { formatPEN, LABELS_PERIODICIDAD } from "@/lib/utils/formatters";
import type { PeriodicidadPago } from "@/types";

// ─── BENEFICIOS Y CARACTERÍSTICAS ──────────────────────────────────────────

const BENEFICIOS = [
  {
    icon: Zap,
    gradient: "from-amber-400 to-amber-600",
    glowColor: "rgba(251, 191, 36, 0.15)",
    titulo: "Aprobación en Minutos",
    desc: "Evaluamos tu solicitud al instante. Respuesta el mismo día directamente en tu celular.",
  },
  {
    icon: Wallet,
    gradient: "from-emerald-400 to-emerald-600",
    glowColor: "rgba(52, 211, 153, 0.15)",
    titulo: "Desembolso Flexible",
    desc: "Recibe tu dinero vía Yape, Plin, BCP, BBVA, Interbank, Banco de la Nación o Efectivo.",
  },
  {
    icon: ShieldCheck,
    gradient: "from-blue-400 to-blue-600",
    glowColor: "rgba(96, 165, 250, 0.15)",
    titulo: "Sin Comisiones Ocultas",
    desc: "Sabes exactamente cuánto pagar desde el primer día con tasas claras y cronograma transparente.",
  },
  {
    icon: Lock,
    gradient: "from-purple-400 to-purple-600",
    glowColor: "rgba(192, 132, 252, 0.15)",
    titulo: "100% Digital y Seguro",
    desc: "Tus datos personales y documentos están cifrados bajo estrictos estándares de seguridad.",
  },
];

const PASOS_PROCESO = [
  {
    numero: "01",
    titulo: "Completa tu Solicitud",
    desc: "Ingresa tus datos y adjunta tu DNI y recibo de servicio desde tu celular o computadora.",
    icon: "📝",
    tag: "Solo 3 minutos",
  },
  {
    numero: "02",
    titulo: "Evaluación Inmediata",
    desc: "Nuestro equipo revisa tu perfil y calcula la tasa preferencial ajustada a tu capacidad de pago.",
    icon: "⚡",
    tag: "Sin trámites engorrosos",
  },
  {
    numero: "03",
    titulo: "Firma y Desembolso",
    desc: "Aceptas las condiciones y recibes tu dinero por tu medio favorito o entrega en efectivo.",
    icon: "💵",
    tag: "Mismo día",
  },
];

const PREGUNTAS_FRECUENTES = [
  {
    pregunta: "¿Cuáles son los requisitos mínimos para solicitar un préstamo?",
    respuesta:
      "Solo necesitas ser mayor de 18 años, contar con DNI peruano vigente, un recibo de servicios (luz o agua) de tu domicilio actual y demostrar ingresos activos (en planilla, recibo por honorarios o negocio propio).",
  },
  {
    pregunta: "¿En cuánto tiempo recibo el dinero tras ser aprobado?",
    respuesta:
      "Una vez aprobada tu solicitud, el desembolso por Yape, Plin o transferencia bancaria se procesa en un plazo promedio de 15 a 45 minutos. Si elegiste entrega en efectivo, se coordina la entrega el mismo día.",
  },
  {
    pregunta: "¿Puedo pagar mis cuotas antes de tiempo o amortizar capital?",
    respuesta:
      "¡Sí! Puedes realizar pagos anticipados o cancelar la totalidad de tu deuda en cualquier momento sin ninguna penalidad ni comisión adicional.",
  },
  {
    pregunta: "¿Cómo consulto el estado de mi solicitud o mis cuotas pendientes?",
    respuesta:
      "Puedes ingresar a la sección 'Consultar Estado' en cualquier momento usando únicamente tu número de DNI para ver tu cronograma, próximas cuotas y subir tus comprobantes de pago.",
  },
];

interface ConfiguracionFinanciera {
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
  whatsappNumero?: string;
  whatsappMensaje?: string;
}

const DEFAULT_CONFIG: ConfiguracionFinanciera = {
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
  montoMinimo: 100,
  montoMaximo: 15000,
  whatsappNumero: "51987654321",
  whatsappMensaje: "¡Hola! Deseo información sobre cómo solicitar un préstamo personal.",
};

// ─── COMPONENTE: TARJETA CON EFECTO TILT 3D ──────────────────────────────────

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── COMPONENTE: MONEDA 3D FLOTANTE DEL HERO ─────────────────────────────────

function Hero3DFloatingBadge() {
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none my-6 lg:my-0">
      {/* Resplandor pulsante detrás */}
      <div className="absolute w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-tr from-amber-500/25 via-emerald-500/20 to-amber-300/20 rounded-full blur-3xl animate-pulse" />

      {/* Moneda 3D flotante */}
      <motion.div
        animate={{
          y: [0, -14, 0],
          rotateZ: [0, 2, -2, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
        }}
        className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 rounded-full p-2.5 bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-500 shadow-2xl shadow-amber-500/30 flex items-center justify-center border-4 border-amber-200/40"
      >
        {/* Anillo interior metálico */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-3 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden border border-amber-400/30">
          {/* Brillo diagonal */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

          <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent font-mono">
            S/ PEN
          </span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 mt-1">
            Garantía 100%
          </span>
          <span className="text-[9px] text-slate-400">Microcréditos Perú</span>
        </div>
      </motion.div>

      {/* Badge flotante satélite 1 */}
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
        className="absolute -top-4 sm:-top-6 right-2 sm:right-6 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 backdrop-blur-md text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-1.5"
      >
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Aprobación en 15 min</span>
      </motion.div>

      {/* Badge flotante satélite 2 */}
      <motion.div
        animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-4 sm:-bottom-6 left-2 sm:left-6 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/40 backdrop-blur-md text-amber-300 text-xs font-bold shadow-lg flex items-center gap-1.5"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span>Sin comisiones ocultas</span>
      </motion.div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const [dniConsulta, setDniConsulta] = useState("");
  const [dniError, setDniError] = useState("");

  // Configuración financiera dinámica
  const [config, setConfig] = useState<ConfiguracionFinanciera>(DEFAULT_CONFIG);

  // Estados del Simulador Hero
  const [monto, setMonto] = useState<number>(1500);
  const [frecuencia, setFrecuencia] = useState<PeriodicidadPago>("SEMANAL");
  const [cuotas, setCuotas] = useState<number>(4);

  // Cargar configuración de tasas desde backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/configuracion");
        const json = await res.json();
        if (json.success && json.data) {
          setConfig((prev) => ({ ...prev, ...json.data }));
          if (json.data.montoMinimo && json.data.montoMaximo) {
            setMonto((prev) => Math.min(Math.max(prev, json.data.montoMinimo), json.data.montoMaximo));
          }
        }
      } catch (err) {
        console.error("Error al cargar tasas públicas:", err);
      }
    }
    loadConfig();
  }, []);

  // Actualizar cuotas sugeridas al cambiar frecuencia
  const handleFrecuenciaChange = (nuevaFrec: PeriodicidadPago) => {
    setFrecuencia(nuevaFrec);
    if (nuevaFrec === "DIARIO") setCuotas(config.cuotasDefaultDiario || 24);
    else if (nuevaFrec === "SEMANAL") setCuotas(config.cuotasDefaultSemanal || 4);
    else if (nuevaFrec === "QUINCENAL") setCuotas(config.cuotasDefaultQuincenal || 2);
    else if (nuevaFrec === "MENSUAL") setCuotas(config.cuotasDefaultMensual || 1);
    else if (nuevaFrec === "TRIMESTRAL") setCuotas(config.cuotasDefaultTrimestral || 1);
    else if (nuevaFrec === "SEMESTRAL") setCuotas(config.cuotasDefaultSemestral || 1);
  };

  // Cálculo financiero de la cuota en vivo
  const getTasa = useCallback(
    (p: PeriodicidadPago) => {
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
          return config.tasaTrimestral;
        case "SEMESTRAL":
          return config.tasaSemestral;
        default:
          return config.tasaMensual;
      }
    },
    [config]
  );

  const tasaAplicada = getTasa(frecuencia);
  const interesTotal = (monto * tasaAplicada) / 100;
  const totalAPagar = monto + interesTotal;
  const cuotaEstimada = Math.round((totalAPagar / (cuotas || 1)) * 100) / 100;

  const cleanWhatsAppNumero = (config.whatsappNumero || "51987654321").replace(/\D/g, "");
  const cleanWhatsAppMensaje = encodeURIComponent(config.whatsappMensaje || "¡Hola! Deseo información sobre cómo solicitar un préstamo personal.");
  const whatsappUrl = `https://wa.me/${cleanWhatsAppNumero}?text=${cleanWhatsAppMensaje}`;

  const handleBuscarDNI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(dniConsulta)) {
      setDniError("Ingresa un DNI válido de 8 dígitos numéricos");
      return;
    }
    router.push(`/consulta?dni=${dniConsulta}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-x-hidden font-sans selection:bg-amber-400 selection:text-slate-900 relative">
      {/* ─── MALLA Y ESFERAS DE GRADIENTES EN MOVIMIENTO (FONDO 3D) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-[130px]"
        />

        {/* Patrón de cuadrícula tecnológica */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* ─── 1. HEADER & NAVEGACIÓN ADAPTATIVA ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                S/
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white block leading-none">
                  Préstamos<span className="text-amber-400">PE</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mt-0.5">
                  Microfinanzas Perú
                </span>
              </div>
            </Link>

            {/* Links Desktop */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <Link href="#inicio" className="hover:text-amber-400 transition-colors">
                Inicio
              </Link>
              <Link href="#simulador" className="hover:text-amber-400 transition-colors">
                Simulador
              </Link>
              <Link href="#beneficios" className="hover:text-amber-400 transition-colors">
                Beneficios
              </Link>
              <Link href="#proceso" className="hover:text-amber-400 transition-colors">
                Cómo Funciona
              </Link>
              <Link href="#faq" className="hover:text-amber-400 transition-colors">
                Preguntas Frecuentes
              </Link>
            </nav>

            {/* Acciones Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/consulta"
                className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex items-center gap-2 shadow-xs"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Consultar DNI</span>
              </Link>

              <Link
                href="/solicitud"
                className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20 hover:scale-102 flex items-center gap-2"
                id="nav-solicitar-desktop"
              >
                <span>Solicitar Préstamo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Acciones Móvil */}
            <div className="flex lg:hidden items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-xl hover:bg-emerald-900/80 transition"
                aria-label="Contactar por WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition"
                aria-label="Abrir menú"
              >
                {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl"
          >
            <Link
              href="#inicio"
              onClick={() => setMenuAbierto(false)}
              className="block py-2 px-3 text-base font-semibold text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              Inicio
            </Link>
            <Link
              href="#simulador"
              onClick={() => setMenuAbierto(false)}
              className="block py-2 px-3 text-base font-semibold text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              Simulador de Cuotas
            </Link>
            <Link
              href="#beneficios"
              onClick={() => setMenuAbierto(false)}
              className="block py-2 px-3 text-base font-semibold text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              Beneficios
            </Link>
            <Link
              href="#proceso"
              onClick={() => setMenuAbierto(false)}
              className="block py-2 px-3 text-base font-semibold text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              Cómo Funciona
            </Link>
            <Link
              href="#faq"
              onClick={() => setMenuAbierto(false)}
              className="block py-2 px-3 text-base font-semibold text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              Preguntas Frecuentes
            </Link>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <Link
                href="/consulta"
                onClick={() => setMenuAbierto(false)}
                className="w-full py-3 px-4 text-center font-bold text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Consultar con mi DNI</span>
              </Link>
              <Link
                href="/solicitud"
                onClick={() => setMenuAbierto(false)}
                className="w-full py-3.5 px-4 text-center font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
              >
                <span>Solicitar Préstamo Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ─── 2. HERO SECTION & SIMULADOR RESPONSIVO (2 COLUMNAS DESKTOP / 1 COL MÓVIL) ─── */}
      <section
        id="inicio"
        className="relative pt-24 sm:pt-32 lg:pt-36 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna Izquierda: Propuesta de Valor (7 columnas) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge de confianza */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs sm:text-sm font-semibold shadow-xs"
              >
                <span>🇵🇪</span>
                <span>Microcréditos Seguros y Flexibles en Perú</span>
              </motion.div>

              {/* Título Principal */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]"
              >
                Tu préstamo en Soles{" "}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent block sm:inline">
                  desembolsado hoy
                </span>
              </motion.h1>

              {/* Párrafo Descriptivo */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Sin avales ni trámites presenciales. Elige tu monto de{" "}
                <strong className="text-white font-semibold">{formatPEN(config.montoMinimo)}</strong> a{" "}
                <strong className="text-white font-semibold">{formatPEN(config.montoMaximo)}</strong> y recibe tu abono
                por <strong className="text-amber-300 font-semibold">Yape, Plin, Banco o Efectivo</strong> en minutos.
              </motion.p>

              {/* Elemento 3D Flotante Hero (Visible en Desktop y Móvil) */}
              <div className="py-2">
                <Hero3DFloatingBadge />
              </div>

              {/* Botones de Acción Primarios */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/solicitud"
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-base hover:from-amber-300 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 text-center flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                  id="hero-cta-solicitar"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Quiero mi Préstamo</span>
                </Link>

                <Link
                  href="/consulta"
                  className="px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-base border border-slate-700 transition-all text-center flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                  id="hero-cta-consultar"
                >
                  <Search className="w-5 h-5 text-slate-400" />
                  <span>Consultar mi Estado</span>
                </Link>
              </div>

              {/* Badges de Confianza Rápidos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Sin visitas a domicilio</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Respuesta el mismo día</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Atención en todo el Perú</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Simulador Interactivo Glassmorphism (5 columnas) con Tilt 3D */}
            <div className="lg:col-span-5 w-full" id="simulador">
              <TiltCard>
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/75 border border-slate-700/80 hover:border-amber-400/40 backdrop-blur-2xl shadow-2xl space-y-6 transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-white">Simulador en Vivo</h2>
                        <p className="text-xs text-slate-400">Cálculo referencial instantáneo</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Tasa: {tasaAplicada}%
                    </span>
                  </div>

                  {/* Control de Monto */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">Monto deseado</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                        {formatPEN(monto)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={config.montoMinimo}
                      max={config.montoMaximo}
                      step={50}
                      value={monto}
                      onChange={(e) => setMonto(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      aria-label="Monto deseado"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatPEN(config.montoMinimo)}</span>
                      <span>{formatPEN(config.montoMaximo)}</span>
                    </div>
                  </div>

                  {/* Selector de Frecuencia */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Frecuencia de Cobro
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: "DIARIO", label: "Diario", icon: "📅" },
                        { id: "SEMANAL", label: "Semanal", icon: "🗓️" },
                        { id: "QUINCENAL", label: "Quincenal", icon: "📆" },
                        { id: "MENSUAL", label: "Mensual", icon: "🗒️" },
                        { id: "TRIMESTRAL", label: "Trimestral", icon: "🏛️" },
                        { id: "SEMESTRAL", label: "Semestral", icon: "📈" },
                      ].map((f) => {
                        const selected = frecuencia === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleFrecuenciaChange(f.id as PeriodicidadPago)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              selected
                                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20"
                                : "bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-900"
                            }`}
                          >
                            <span className="text-base">{f.icon}</span>
                            <span>{f.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Número de Cuotas */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">Número de cuotas</span>
                      <span className="text-base font-bold text-white font-mono">{cuotas} cuotas</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={frecuencia === "DIARIO" ? 60 : frecuencia === "SEMANAL" ? 24 : frecuencia === "QUINCENAL" ? 12 : 6}
                      step={1}
                      value={cuotas}
                      onChange={(e) => setCuotas(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      aria-label="Número de cuotas"
                    />
                  </div>

                  {/* Tarjeta de Resumen en Tiempo Real */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-400/30 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Cuota Estimada ({LABELS_PERIODICIDAD[frecuencia].toLowerCase()}):</span>
                      <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                        {formatPEN(cuotaEstimada)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                      <span>Total a Devolver:</span>
                      <span className="font-bold text-white font-mono">{formatPEN(totalAPagar)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Interés Ganancia:</span>
                      <span className="font-semibold text-emerald-400 font-mono">+{formatPEN(interesTotal)}</span>
                    </div>
                  </div>

                  {/* Botón CTA dentro del simulador */}
                  <Link
                    href="/solicitud"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-amber-400 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Solicitar con estas condiciones</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. BENEFICIOS CON TILT 3D ─── */}
      <section id="beneficios" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-t border-slate-800/80 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
              ¿Por qué elegirnos?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              Diseñado para comerciantes y personas en Perú
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Operamos con total transparencia, adaptándonos al ritmo de tus ingresos diarios, semanales o mensuales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {BENEFICIOS.map((b) => {
              const IconComponent = b.icon;
              return (
                <TiltCard key={b.titulo}>
                  <div className="h-full p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 transition-all duration-300 space-y-4 group">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-slate-950 shadow-md group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {b.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. CÓMO OBTENER TU PRÉSTAMO (TIMELINE) ─── */}
      <section id="proceso" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800/80 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
              Paso a Paso
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              ¿Cómo obtener tu dinero en 3 simples pasos?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Todo el proceso es 100% online y no te tomará más de 5 minutos completarlo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {PASOS_PROCESO.map((paso) => (
              <TiltCard key={paso.numero}>
                <div className="h-full p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-emerald-400/40 relative space-y-4 flex flex-col justify-between transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl sm:text-4xl font-black text-amber-400/40 font-mono">
                        {paso.numero}
                      </span>
                      <span className="text-2xl">{paso.icon}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {paso.titulo}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {paso.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-amber-300 inline-block">
                      {paso.tag}
                    </span>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/solicitud"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/20 hover:scale-102 transition-all cursor-pointer"
            >
              <span>Comenzar mi Solicitud Ahora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. BANNER CONSULTA RÁPIDA DNI ─── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-t border-b border-slate-800 z-10 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">
            <Search className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              ¿Ya tienes una solicitud o préstamo activo?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Ingresa tu DNI para ver tus próximas fechas de pago, estado de aprobación y registrar tus comprobantes.
            </p>
          </div>

          <form onSubmit={handleBuscarDNI} className="max-w-md mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={dniConsulta}
                onChange={(e) => {
                  setDniConsulta(e.target.value.replace(/\D/g, "").slice(0, 8));
                  if (dniError) setDniError("");
                }}
                placeholder="Ingresa tu DNI (8 dígitos)"
                className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-center sm:text-left text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 h-12 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102"
              >
                <span>Consultar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {dniError && <p className="text-xs text-rose-400 text-center">{dniError}</p>}
          </form>
        </div>
      </section>

      {/* ─── 6. PREGUNTAS FRECUENTES (ACORDEÓN INTERACTIVO) ─── */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
              Resolvemos tus dudas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {PREGUNTAS_FRECUENTES.map((faq, idx) => {
              const isOpen = faqAbierta === idx;
              return (
                <div
                  key={faq.pregunta}
                  className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setFaqAbierta(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-200">
                      {faq.pregunta}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3"
                    >
                      {faq.respuesta}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 z-10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black">
                S/
              </div>
              <span className="text-lg font-black text-white">
                Préstamos<span className="text-amber-400">PE</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Plataforma de microfinanzas y préstamos directos en moneda nacional (PEN). Rapidez, seriedad y atención personalizada.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/solicitud" className="hover:text-amber-400 transition-colors">
                  Solicitar Préstamo
                </Link>
              </li>
              <li>
                <Link href="/consulta" className="hover:text-amber-400 transition-colors">
                  Consultar Estado con DNI
                </Link>
              </li>
              <li>
                <Link href="#simulador" className="hover:text-amber-400 transition-colors">
                  Simulador Financiero
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Atención al Cliente</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lunes a Sábado: 8:00 AM - 8:00 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <a
                  href={`https://wa.me/${(config.whatsappNumero || "51987654321").replace(/\D/g, "")}?text=${encodeURIComponent(config.whatsappMensaje || "¡Hola! Deseo información sobre cómo solicitar un préstamo personal.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp: +{config.whatsappNumero || "51 987 654 321"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Seguridad</h4>
            <p className="leading-relaxed">
              🇵🇪 Cumplimiento con las normativas locales de microfinanzas y protección de datos personales.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>© {new Date().getFullYear()} PréstamosPE. Todos los derechos reservados.</p>
            <span className="hidden sm:inline text-slate-800">•</span>
            <Link
              href="/admin/login"
              className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors font-medium select-none"
              title="Acceso administrativo"
              id="footer-acceso-interno"
            >
              Acceso Interno
            </Link>
          </div>
          <p className="text-slate-500">Hecho con ❤️ para emprendedores y familias en Perú</p>
        </div>
      </footer>

      {/* ─── 8. BOTÓN FLOTANTE DE WHATSAPP RESPONSIVO Y DINÁMICO ─── */}
      <a
        href={`https://wa.me/${(config.whatsappNumero || "51987654321").replace(/\D/g, "")}?text=${encodeURIComponent(config.whatsappMensaje || "¡Hola! Deseo información sobre cómo solicitar un préstamo personal.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 group flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all duration-300"
        aria-label="Chatear por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline text-xs font-black tracking-wide">
          ¿Dudas? Chatea con nosotros
        </span>
      </a>
    </div>
  );
}
