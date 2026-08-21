"use client";

import { useState, useEffect, useCallback } from "react";
import { simularPrestamo } from "@/lib/finance/cronograma";
import { formatPEN, formatDate, LABELS_PERIODICIDAD } from "@/lib/utils/formatters";
import type { PeriodicidadPago, ResultadoCronograma } from "@/types";
import Link from "next/link";

const FRECUENCIAS: { value: PeriodicidadPago; label: string; icon: string }[] = [
  { value: "SEMANAL", label: "Semanal", icon: "📅" },
  { value: "QUINCENAL", label: "Quincenal", icon: "🗓️" },
  { value: "MENSUAL", label: "Mensual", icon: "📆" },
];

export default function SimuladorPrestamo() {
  const [monto, setMonto] = useState(2000);
  const [cuotas, setCuotas] = useState(12);
  const [frecuencia, setFrecuencia] = useState<PeriodicidadPago>("MENSUAL");
  const [tasaDisplay] = useState(5); // Tasa referencial para demo (% mensual)
  const [resultado, setResultado] = useState<ResultadoCronograma | null>(null);
  const [mostrarCronograma, setMostrarCronograma] = useState(false);

  const calcular = useCallback(() => {
    const res = simularPrestamo(monto, tasaDisplay, cuotas, frecuencia);
    setResultado(res);
  }, [monto, cuotas, frecuencia, tasaDisplay]);

  useEffect(() => {
    calcular();
  }, [calcular]);

  const montoMin = 200;
  const montoMax = 50000;
  const cuotasMax = frecuencia === "MENSUAL" ? 36 : frecuencia === "QUINCENAL" ? 24 : 52;

  return (
    <section
      id="simulador"
      className="py-16 px-4"
      style={{ background: "var(--color-surface-2)" }}
      aria-label="Simulador de préstamo"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--color-primary-600)" }}>
            Calculadora Gratuita
          </span>
          <h2 className="text-3xl font-bold mt-2 mb-3"
            style={{ fontFamily: "var(--font-outfit)", color: "var(--color-text-primary)" }}>
            Simula tu préstamo en Soles
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Mueve los controles para ver cuánto pagarías. La tasa final la define el
            prestamista según tu perfil.
          </p>
        </div>

        <div className="card-elevated p-6 sm:p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Panel de controles */}
            <div className="space-y-6">
              {/* Monto */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="label" htmlFor="sim-monto">
                    Monto a solicitar
                  </label>
                  <div className="text-2xl font-bold"
                    style={{ fontFamily: "var(--font-outfit)", color: "var(--color-primary-700)" }}>
                    {formatPEN(monto)}
                  </div>
                </div>
                <input
                  id="sim-monto"
                  type="range"
                  min={montoMin}
                  max={montoMax}
                  step={100}
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary-600) ${
                      ((monto - montoMin) / (montoMax - montoMin)) * 100
                    }%, var(--color-border) ${
                      ((monto - montoMin) / (montoMax - montoMin)) * 100
                    }%)`,
                  }}
                  aria-label={`Monto: ${formatPEN(monto)}`}
                />
                <div className="flex justify-between text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}>
                  <span>{formatPEN(montoMin)}</span>
                  <span>{formatPEN(montoMax)}</span>
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <label className="label">Frecuencia de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {FRECUENCIAS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => {
                        setFrecuencia(f.value);
                        setCuotas(Math.min(cuotas, cuotasMax));
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                        frecuencia === f.value
                          ? "text-white shadow-sm"
                          : "text-slate-600 hover:border-blue-300"
                      }`}
                      style={{
                        background: frecuencia === f.value
                          ? "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))"
                          : "white",
                        borderColor: frecuencia === f.value
                          ? "var(--color-primary-600)"
                          : "var(--color-border)",
                      }}
                      id={`sim-freq-${f.value.toLowerCase()}`}
                    >
                      <span className="block text-center">{f.icon}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Número de cuotas */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="label" htmlFor="sim-cuotas">
                    Número de cuotas
                  </label>
                  <div className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-outfit)", color: "var(--color-primary-700)" }}>
                    {cuotas} {LABELS_PERIODICIDAD[frecuencia].toLowerCase()}s
                  </div>
                </div>
                <input
                  id="sim-cuotas"
                  type="range"
                  min={1}
                  max={cuotasMax}
                  step={1}
                  value={cuotas}
                  onChange={(e) => setCuotas(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary-600) ${
                      ((cuotas - 1) / (cuotasMax - 1)) * 100
                    }%, var(--color-border) ${
                      ((cuotas - 1) / (cuotasMax - 1)) * 100
                    }%)`,
                  }}
                  aria-label={`Cuotas: ${cuotas}`}
                />
                <div className="flex justify-between text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}>
                  <span>1</span>
                  <span>{cuotasMax}</span>
                </div>
              </div>

              {/* Nota sobre tasa */}
              <div className="p-3 rounded-lg text-sm"
                style={{ background: "var(--color-gold-50)", border: "1px solid var(--color-gold-200)", color: "var(--color-gold-700)" }}>
                <strong>⚠ Simulación referencial:</strong> La tasa real ({tasaDisplay}% mensual usada aquí) la asigna
                el prestamista según tu perfil crediticio.
              </div>
            </div>

            {/* Panel de resultados */}
            {resultado && (
              <div className="space-y-4">
                {/* Tarjeta cuota principal */}
                <div
                  className="rounded-2xl p-6 text-white text-center"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)" }}
                >
                  <p className="text-blue-200 text-sm font-medium mb-1">
                    Cuota {LABELS_PERIODICIDAD[frecuencia].toLowerCase()}
                  </p>
                  <p className="text-4xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-outfit)" }}>
                    {formatPEN(resultado.valorCuotaBase)}
                  </p>
                  <p className="text-blue-200 text-xs">Valor referencial</p>
                </div>

                {/* Desglose */}
                <div className="space-y-3">
                  {[
                    { label: "Capital solicitado", valor: formatPEN(monto), icon: "💵" },
                    { label: "Total interés (referencial)", valor: formatPEN(resultado.totalInteres), icon: "📊", highlight: true },
                    { label: "Total a devolver", valor: formatPEN(resultado.totalAPagar), icon: "💳", bold: true },
                    { label: "Número de cuotas", valor: `${cuotas}`, icon: "📋" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        background: item.bold ? "var(--color-primary-50)" : "var(--color-surface-3)",
                        border: item.bold ? "1px solid var(--color-primary-200)" : "none",
                      }}
                    >
                      <span className="text-sm flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}>
                        {item.icon} {item.label}
                      </span>
                      <span className={`text-sm font-bold ${item.bold ? "text-blue-800" : ""}`}
                        style={{ color: item.highlight ? "var(--color-gold-600)" : undefined }}>
                        {item.valor}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ver cronograma */}
                <button
                  type="button"
                  onClick={() => setMostrarCronograma(!mostrarCronograma)}
                  className="btn btn-secondary w-full"
                  id="sim-toggle-cronograma"
                >
                  {mostrarCronograma ? "▲ Ocultar" : "▼ Ver"} cronograma de pagos
                </button>

                {/* Mini-cronograma (primeras 5 cuotas) */}
                {mostrarCronograma && (
                  <div className="border rounded-xl overflow-hidden"
                    style={{ borderColor: "var(--color-border)" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--color-surface-3)" }}>
                          <th className="p-2 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>#</th>
                          <th className="p-2 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>Fecha</th>
                          <th className="p-2 text-right font-semibold" style={{ color: "var(--color-text-muted)" }}>Capital</th>
                          <th className="p-2 text-right font-semibold" style={{ color: "var(--color-text-muted)" }}>Interés</th>
                          <th className="p-2 text-right font-semibold" style={{ color: "var(--color-text-muted)" }}>Cuota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.cuotas.slice(0, 5).map((c) => (
                          <tr key={c.numeroCuota} className="border-t"
                            style={{ borderColor: "var(--color-border-light)" }}>
                            <td className="p-2">{c.numeroCuota}</td>
                            <td className="p-2">{formatDate(c.fechaVencimiento)}</td>
                            <td className="p-2 text-right">{formatPEN(c.capital)}</td>
                            <td className="p-2 text-right" style={{ color: "var(--color-gold-600)" }}>
                              {formatPEN(c.interes)}
                            </td>
                            <td className="p-2 text-right font-semibold">{formatPEN(c.cuotaTotal)}</td>
                          </tr>
                        ))}
                        {resultado.cuotas.length > 5 && (
                          <tr style={{ background: "var(--color-surface-3)" }}>
                            <td colSpan={5} className="p-2 text-center"
                              style={{ color: "var(--color-text-muted)" }}>
                              ... y {resultado.cuotas.length - 5} cuotas más
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CTA */}
                <Link
                  href="/solicitud"
                  className="btn btn-gold btn-lg w-full"
                  id="sim-cta-solicitar"
                >
                  <span>🚀</span>
                  Solicitar este préstamo
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
