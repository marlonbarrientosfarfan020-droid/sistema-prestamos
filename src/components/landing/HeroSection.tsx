"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { valor: "+1,200", label: "Clientes activos" },
    { valor: "24h", label: "Desembolso máximo" },
    { valor: "100%", label: "Digital y seguro" },
    { valor: "S/0", label: "Comisión por solicitud" },
  ];

  return (
    <section
      className="gradient-hero relative overflow-hidden min-h-[90vh] flex items-center"
      aria-label="Sección principal"
    >
      {/* Efectos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/3 -right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />
        {/* Patrón de puntos */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Columna de texto */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge de confianza */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
              style={{ background: "rgba(245,158,11,0.2)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.3)" }}>
              <span>🇵🇪</span>
              <span>Financiamiento 100% Peruano</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "var(--font-outfit)" }}>
              Tu préstamo en{" "}
              <span className="relative">
                <span style={{
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Soles
                </span>
              </span>
              <br />en minutos
            </h1>

            <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-lg">
              Proceso 100% digital. Sin fiadores, sin trámites presenciales.
              Recibe tu dinero por{" "}
              <strong className="text-white">Yape, Plin o transferencia bancaria</strong> hoy mismo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/solicitud"
                className="btn btn-gold btn-lg animate-pulse-glow"
                id="hero-cta-solicitar"
              >
                <span>💰</span>
                Solicitar Préstamo Ahora
              </Link>
              <Link
                href="/consulta"
                className="btn btn-lg"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                }}
                id="hero-cta-consultar"
              >
                <span>🔍</span>
                Consultar mi Estado
              </Link>
            </div>

            {/* Garantías */}
            <div className="flex flex-wrap gap-4 mt-8">
              {["✓ Sin buró crediticio", "✓ Respuesta inmediata", "✓ Datos protegidos"].map(
                (item) => (
                  <span
                    key={item}
                    className="text-sm text-blue-200 flex items-center gap-1"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Columna de estadísticas */}
          <div
            className={`grid grid-cols-2 gap-4 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="card-glass p-6 text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "var(--font-outfit)",
                  }}
                >
                  {stat.valor}
                </div>
                <div className="text-sm text-blue-100">{stat.label}</div>
              </div>
            ))}

            {/* Tarjeta de proceso rápido */}
            <div
              className="card-glass p-6 col-span-2"
              style={{ border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <h3 className="text-white font-bold mb-4 text-center">
                ¿Cómo funciona?
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { paso: "1", icon: "📝", texto: "Completa el formulario" },
                  { paso: "2", icon: "⚡", texto: "Evaluación rápida" },
                  { paso: "3", icon: "💸", texto: "Recibe tu dinero" },
                ].map((p) => (
                  <div key={p.paso} className="text-center">
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div
                      className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mx-auto mb-1"
                      style={{ background: "var(--color-gold-500)", color: "white" }}
                    >
                      {p.paso}
                    </div>
                    <p className="text-xs text-blue-100">{p.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L60 68C120 56 240 32 360 24C480 16 600 24 720 32C840 40 960 48 1080 44C1200 40 1320 24 1380 16L1440 8V80H0Z"
            fill="var(--color-surface-2)"
          />
        </svg>
      </div>
    </section>
  );
}
