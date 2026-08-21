"use client";

import { useState, useRef } from "react";
import { formatPEN, formatFileSize } from "@/lib/utils/formatters";

interface Props {
  cuotaId: string;
  numeroCuota: number;
  montoEsperado: number;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export default function SubidaVoucher({ cuotaId, numeroCuota, montoEsperado, onSuccess }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [monto, setMonto] = useState<string>(montoEsperado.toFixed(2));
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const procesarArchivo = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorArchivo("Solo se permiten imágenes JPG, PNG o archivos PDF");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorArchivo(`Archivo demasiado grande (${formatFileSize(file.size)}). Máximo 5 MB.`);
      return;
    }
    setErrorArchivo(null);
    setArchivo(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) { setErrorArchivo("Selecciona el comprobante de pago"); return; }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    setLoading(true);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("cuotaId", cuotaId);
      formData.append("voucher", archivo);
      formData.append("montoDeclarado", montoNum.toString());

      const response = await fetch("/api/vouchers", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResultado({ success: true, mensaje: "✅ Comprobante enviado. Será revisado pronto." });
        setArchivo(null);
        setPreviewUrl(null);
        onSuccess?.();
      } else {
        setResultado({ success: false, mensaje: data.error ?? "Error al enviar el comprobante" });
      }
    } catch {
      setResultado({ success: false, mensaje: "Error de conexión. Intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  if (resultado?.success) {
    return (
      <div className="card p-6 text-center animate-fade-in-up">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="font-bold text-lg mb-2" style={{ color: "var(--color-success)" }}>
          Comprobante enviado
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {resultado.mensaje}
        </p>
        <button
          type="button"
          onClick={() => setResultado(null)}
          className="btn btn-secondary mt-4"
          id="voucher-enviar-otro"
        >
          Enviar otro comprobante
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-bold text-base mb-1" style={{ color: "var(--color-text-primary)" }}>
        📤 Subir Comprobante de Pago
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
        Cuota N° {numeroCuota} — Adjunta la foto o PDF de tu voucher de pago.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Monto declarado */}
        <div>
          <label htmlFor="voucher-monto" className="label">Monto pagado</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: "var(--color-text-muted)" }}>S/</span>
            <input
              id="voucher-monto"
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="input-base pl-9"
              placeholder={montoEsperado.toFixed(2)}
              required
            />
          </div>
        </div>

        {/* Zona de carga del voucher */}
        <div>
          <label className="label">Comprobante de pago <span className="text-red-500">*</span></label>
          <div
            className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) procesarArchivo(f);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
            style={{
              borderColor: archivo ? "var(--color-success)" : errorArchivo ? "#f87171" : undefined,
              background: archivo ? "#f0fdf4" : undefined,
            }}
          >
            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview del voucher" className="mx-auto max-h-40 object-contain rounded-lg" />
                <p className="text-xs mt-2 text-center" style={{ color: "var(--color-success)" }}>
                  ✓ {archivo?.name} — {formatFileSize(archivo?.size ?? 0)}
                </p>
              </div>
            ) : archivo ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">📄</span>
                <p className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                  ✓ {archivo.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {formatFileSize(archivo.size)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">📸</span>
                <p className="text-sm font-semibold" style={{ color: "var(--color-primary-700)" }}>
                  <span className="sm:hidden">Tomar foto del voucher</span>
                  <span className="hidden sm:inline">Arrastra o haz clic para adjuntar</span>
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  JPG, PNG o PDF — Máx. 5 MB
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) procesarArchivo(f);
              }}
            />
          </div>
          {errorArchivo && (
            <p className="error-text" role="alert"><span>⚠</span> {errorArchivo}</p>
          )}
        </div>

        {/* Error del servidor */}
        {resultado && !resultado.success && (
          <div className="toast toast-error" role="alert">
            <span>❌</span> {resultado.mensaje}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading || !archivo}
          id="voucher-submit"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : (
            "📤 Enviar Comprobante"
          )}
        </button>
      </form>
    </div>
  );
}
