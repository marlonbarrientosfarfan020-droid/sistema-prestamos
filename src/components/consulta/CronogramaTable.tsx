"use client";

import React, { useState } from "react";
import { formatPEN, formatDate, LABELS_ESTADO_CUOTA, COLOR_ESTADO_CUOTA, diasRestantes } from "@/lib/utils/formatters";
import type { CuotaDetalle } from "@/types";
import SubidaVoucher from "./SubidaVoucher";

interface Props {
  cuotas: CuotaDetalle[];
  onRefresh?: () => void;
}

export default function CronogramaTable({ cuotas, onRefresh }: Props) {
  const [cuotaExpandida, setCuotaExpandida] = useState<string | null>(null);
  const [vistaActiva, setVistaActiva] = useState<"tabla" | "tarjetas">("tabla");

  const pagadas = cuotas.filter((c) => c.estado === "PAGADO").length;
  const totalCuotas = cuotas.length;
  const progreso = totalCuotas > 0 ? Math.round((pagadas / totalCuotas) * 100) : 0;

  return (
    <div className="card">
      {/* Header del cronograma */}
      <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
              📋 Cronograma de Pagos
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {pagadas} de {totalCuotas} cuotas pagadas
            </p>
          </div>
          {/* Toggle vista */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
            {(["tabla", "tarjetas"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVistaActiva(v)}
                className="px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                style={{
                  background: vistaActiva === v ? "var(--color-primary-600)" : "white",
                  color: vistaActiva === v ? "white" : "var(--color-text-muted)",
                }}
                id={`cronograma-vista-${v}`}
              >
                {v === "tabla" ? "📊 Tabla" : "🃏 Tarjetas"}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1">
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progreso}%`,
                background: "linear-gradient(90deg, var(--color-success), #34d399)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span>{progreso}% completado</span>
            <span>{totalCuotas - pagadas} restantes</span>
          </div>
        </div>
      </div>

      {/* Vista Tabla */}
      {vistaActiva === "tabla" && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vencimiento</th>
                <th className="text-right">Capital</th>
                <th className="text-right">Interés</th>
                <th className="text-right">Mora</th>
                <th className="text-right">Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((cuota, index) => {
                const dias = diasRestantes(cuota.fechaVencimiento);
                const cuotaKey = cuota.id || `cuota-${cuota.numeroCuota ?? index}`;

                return (
                  <React.Fragment key={cuotaKey}>
                    <tr>
                      <td className="font-semibold">{cuota.numeroCuota}</td>
                      <td>
                        <div>
                          <span className="text-sm">{formatDate(cuota.fechaVencimiento)}</span>
                          {cuota.estado === "PENDIENTE" && (
                            <p className="text-xs mt-0.5" style={{
                              color: dias < 0 ? "var(--color-danger)" : dias <= 3 ? "#d97706" : "var(--color-text-muted)"
                            }}>
                              {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : dias === 0 ? "Vence hoy" : `Faltan ${dias} días`}
                            </p>
                          )}
                          {cuota.estado === "PAGADO" && cuota.fecha_pago_real && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-success)" }}>
                              Pagado: {formatDate(cuota.fecha_pago_real)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-right font-mono text-sm">{formatPEN(cuota.capital)}</td>
                      <td className="text-right font-mono text-sm" style={{ color: "var(--color-gold-600)" }}>
                        {formatPEN(cuota.interes)}
                      </td>
                      <td className="text-right font-mono text-sm" style={{ color: cuota.mora > 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                        {formatPEN(cuota.mora)}
                      </td>
                      <td className="text-right font-mono font-bold text-sm">
                        {formatPEN(cuota.cuotaTotal + cuota.mora)}
                      </td>
                      <td>
                        <span className={`badge ${COLOR_ESTADO_CUOTA[cuota.estado]}`}>
                          {cuota.estado === "PAGADO" ? "✓ " : cuota.estado === "VENCIDO" ? "⚠ " : "○ "}
                          {LABELS_ESTADO_CUOTA[cuota.estado]}
                        </span>
                      </td>
                      <td>
                        {cuota.estado === "PENDIENTE" && (
                          <button
                            type="button"
                            onClick={() => setCuotaExpandida(cuotaExpandida === cuota.id ? null : cuota.id)}
                            className="btn btn-sm btn-secondary"
                            id={`pagar-cuota-${cuota.numeroCuota}`}
                          >
                            {cuotaExpandida === cuota.id ? "▲ Cerrar" : "📤 Pagar"}
                          </button>
                        )}
                        {cuota.estado === "PAGADO" && <span className="text-sm">✅</span>}
                      </td>
                    </tr>
                    {/* Row expandida para subir voucher */}
                    {cuotaExpandida === cuota.id && (
                      <tr>
                        <td colSpan={8} className="p-4" style={{ background: "var(--color-surface-2)" }}>
                          <SubidaVoucher
                            cuotaId={cuota.id}
                            numeroCuota={cuota.numeroCuota}
                            montoEsperado={cuota.cuotaTotal}
                            onSuccess={() => {
                              setCuotaExpandida(null);
                              onRefresh?.();
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Tarjetas (mobile-friendly) */}
      {vistaActiva === "tarjetas" && (
        <div className="p-4 space-y-3">
          {cuotas.map((cuota, index) => {
            const dias = diasRestantes(cuota.fechaVencimiento);
            const cuotaKey = cuota.id || `tarjeta-cuota-${cuota.numeroCuota ?? index}`;
            return (
              <div key={cuotaKey} className={`cuota-card ${cuota.estado.toLowerCase()}`}>
                <div className="flex items-start justify-between gap-4 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">Cuota {cuota.numeroCuota}</span>
                      <span className={`badge ${COLOR_ESTADO_CUOTA[cuota.estado]}`}>
                        {LABELS_ESTADO_CUOTA[cuota.estado]}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      Vence: {formatDate(cuota.fechaVencimiento)}
                      {cuota.estado === "PENDIENTE" && (
                        <span style={{ color: dias < 0 ? "var(--color-danger)" : dias <= 3 ? "#d97706" : "inherit" }}>
                          {" "}({dias < 0 ? `venció hace ${Math.abs(dias)}d` : dias === 0 ? "hoy" : `en ${dias}d`})
                        </span>
                      )}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Capital</p>
                        <p className="text-sm font-semibold">{formatPEN(cuota.capital)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Interés</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-gold-600)" }}>
                          {formatPEN(cuota.interes)}
                        </p>
                      </div>
                      {cuota.mora > 0 && (
                        <div>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Mora</p>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
                            {formatPEN(cuota.mora)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                      {formatPEN(cuota.cuotaTotal + cuota.mora)}
                    </p>
                    {cuota.estado === "PENDIENTE" && (
                      <button
                        type="button"
                        onClick={() => setCuotaExpandida(cuotaExpandida === cuota.id ? null : cuota.id)}
                        className="btn btn-sm btn-primary mt-2"
                        id={`tarjeta-pagar-${cuota.numeroCuota}`}
                      >
                        📤 Pagar
                      </button>
                    )}
                    {cuota.estado === "PAGADO" && <span className="text-xl">✅</span>}
                  </div>
                </div>

                {/* SubidaVoucher inline */}
                {cuotaExpandida === cuota.id && (
                  <div className="mt-4 pl-4">
                    <SubidaVoucher
                      cuotaId={cuota.id}
                      numeroCuota={cuota.numeroCuota}
                      montoEsperado={cuota.cuotaTotal}
                      onSuccess={() => {
                        setCuotaExpandida(null);
                        onRefresh?.();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
