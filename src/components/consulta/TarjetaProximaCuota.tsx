"use client";

import { formatPEN, formatDate, diasRestantes, LABELS_METODO_DESEMBOLSO, ICONS_METODO } from "@/lib/utils/formatters";
import type { CuotaDetalle, MetodoDesembolso } from "@/types";
import { useState } from "react";
import { copiarAlPortapapeles } from "@/lib/utils/formatters";

interface Props {
  cuota: CuotaDetalle;
  metodoCobro: MetodoDesembolso;
  numeroCobro: string;
  montoAprobado: number;
}

export default function TarjetaProximaCuota({ cuota, metodoCobro, numeroCobro, montoAprobado }: Props) {
  const [copiado, setCopiado] = useState(false);
  const dias = diasRestantes(cuota.fechaVencimiento);
  const estaVencida = dias < 0;
  const esCritica = dias >= 0 && dias <= 3;

  const urgenciaBg = estaVencida
    ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
    : esCritica
    ? "linear-gradient(135deg, #78350f, #92400e)"
    : "linear-gradient(135deg, #1e3a8a, #1d4ed8)";

  const handleCopiar = async () => {
    const ok = await copiarAlPortapapeles(numeroCobro);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tarjeta principal de próxima cuota */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: urgenciaBg }}
      >
        {/* Efectos decorativos */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: "white", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: "white", transform: "translate(-30%, 30%)" }} />

        {/* Badge de urgencia */}
        {estaVencida && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            🚨 CUOTA VENCIDA — Se está acumulando mora
          </div>
        )}
        {esCritica && !estaVencida && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            ⚠ Vence en {dias === 0 ? "HOY" : `${dias} día${dias > 1 ? "s" : ""}`}
          </div>
        )}
        {!estaVencida && !esCritica && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            📅 Próxima Cuota — Faltan {dias} días
          </div>
        )}

        <p className="text-sm opacity-80 mb-1">Cuota N° {cuota.numeroCuota}</p>
        <p className="text-5xl font-bold mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
          {formatPEN(cuota.cuotaTotal + cuota.mora)}
        </p>
        {cuota.mora > 0 && (
          <p className="text-sm opacity-80">
            (incluye mora de {formatPEN(cuota.mora)})
          </p>
        )}
        <p className="text-sm opacity-80 mt-2">
          Fecha límite: <strong>{formatDate(cuota.fechaVencimiento)}</strong>
        </p>

        {/* Desglose */}
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-70">Capital</p>
            <p className="text-lg font-semibold">{formatPEN(cuota.capital)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Interés</p>
            <p className="text-lg font-semibold">{formatPEN(cuota.interes)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Saldo restante</p>
            <p className="text-lg font-semibold">{formatPEN(cuota.saldoRestante)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Capital total</p>
            <p className="text-lg font-semibold">{formatPEN(montoAprobado)}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de datos de cobro */}
      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}>
          💳 Datos para realizar tu pago
        </h3>
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ICONS_METODO[metodoCobro]}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                {LABELS_METODO_DESEMBOLSO[metodoCobro]}
              </p>
              <p className="text-lg font-bold font-mono" style={{ color: "var(--color-text-primary)" }}>
                {numeroCobro}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopiar}
            className="btn btn-secondary btn-sm"
            id="copiar-numero-cobro"
            aria-label="Copiar número de cuenta"
          >
            {copiado ? "✓ Copiado" : "📋 Copiar"}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          ⚠ Después de pagar, sube tu comprobante de pago en la sección de abajo.
        </p>
      </div>
    </div>
  );
}
