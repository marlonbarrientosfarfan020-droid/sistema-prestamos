"use client";

import React, { useCallback, useRef, useState } from "react";
import { formatFileSize } from "@/lib/utils/formatters";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DocumentUploaderProps {
  /** Identificador único del campo */
  id: string;
  /** Etiqueta visible */
  label: string;
  /** Descripción adicional */
  description?: string;
  /** Es obligatorio */
  required?: boolean;
  /** Modo de captura de cámara: 'user' (frontal), 'environment' (trasera), undefined (libre) */
  captureMode?: "user" | "environment";
  /** También acepta PDF */
  acceptPDF?: boolean;
  /** Valor actual (File) */
  value?: File | null;
  /** Preview URL (para imágenes ya subidas) */
  defaultPreviewUrl?: string;
  /** Callback al cambiar el archivo */
  onChange: (file: File | null) => void;
  /** Mensaje de error */
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DocumentUploader({
  id,
  label,
  description,
  required = false,
  captureMode,
  acceptPDF = true,
  value,
  defaultPreviewUrl,
  onChange,
  error,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultPreviewUrl ?? null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    isPDF: boolean;
  } | null>(null);

  const allowedTypes = acceptPDF ? ALLOWED_ALL_TYPES : ALLOWED_IMAGE_TYPES;

  // ─── Validación ──────────────────────────────────────────────────────────

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return acceptPDF
        ? "Solo se permiten imágenes JPG, PNG o archivos PDF"
        : "Solo se permiten imágenes JPG o PNG";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo supera el límite de 5 MB (${formatFileSize(file.size)})`;
    }
    return null;
  };

  // ─── Procesar archivo ─────────────────────────────────────────────────────

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      setLocalError(null);
      setFileInfo({
        name: file.name,
        size: file.size,
        isPDF: file.type === "application/pdf",
      });

      // Generar preview solo para imágenes
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      onChange(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, acceptPDF]
  );

  // ─── Drag & Drop handlers ─────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ─── Input change ─────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ─── Limpiar selección ────────────────────────────────────────────────────

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setFileInfo(null);
    setLocalError(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayError = error ?? localError;
  const hasFile = !!(value ?? previewUrl);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Label */}
      <label htmlFor={id} className="label">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="obligatorio">
            *
          </span>
        )}
      </label>

      {description && (
        <p className="text-sm text-slate-500 mb-2 leading-relaxed">{description}</p>
      )}

      {/* Zona de carga */}
      <div
        className={`drop-zone relative transition-all duration-200 ${
          isDragOver ? "drag-over" : ""
        } ${displayError ? "border-red-400 bg-red-50" : ""} ${
          hasFile ? "border-solid border-primary-300 bg-primary-50" : ""
        }`}
        style={{
          borderColor: hasFile
            ? "var(--color-primary-400)"
            : isDragOver
            ? "var(--color-primary-400)"
            : displayError
            ? "#f87171"
            : undefined,
          background: hasFile
            ? "var(--color-primary-50)"
            : isDragOver
            ? "var(--color-primary-50)"
            : undefined,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Cargar ${label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            inputRef.current?.click();
          }
        }}
      >
        {/* Preview o placeholder */}
        {previewUrl ? (
          /* Preview de imagen */
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Preview de ${label}`}
              className="mx-auto max-h-48 object-contain rounded-lg shadow-sm"
              style={{ maxWidth: "100%" }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              aria-label="Eliminar archivo"
            >
              ✕
            </button>
          </div>
        ) : fileInfo?.isPDF ? (
          /* Preview de PDF */
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-20 bg-red-100 rounded-lg flex flex-col items-center justify-center border border-red-200 shadow-sm">
              <span className="text-2xl">📄</span>
              <span className="text-xs font-bold text-red-600 mt-1">PDF</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 truncate max-w-48">
                {fileInfo.name}
              </p>
              <p className="text-xs text-slate-500">{formatFileSize(fileInfo.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-sm btn-secondary text-red-600 border-red-200"
            >
              ✕ Eliminar
            </button>
          </div>
        ) : (
          /* Placeholder */
          <div className="flex flex-col items-center gap-3 py-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "var(--color-primary-100)" }}
            >
              {captureMode === "user" ? "🤳" : captureMode === "environment" ? "📷" : "📎"}
            </div>

            {/* Instrucciones según dispositivo */}
            <div className="text-center">
              {/* Móvil — captura directa */}
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-primary-700)" }}
              >
                <span className="sm:hidden">
                  {captureMode === "user"
                    ? "Tomar foto con cámara frontal"
                    : captureMode === "environment"
                    ? "Tomar foto con cámara trasera"
                    : "Seleccionar archivo"}
                </span>
                {/* Desktop — drag & drop */}
                <span className="hidden sm:inline">
                  Arrastra aquí o haz clic para seleccionar
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {acceptPDF ? "JPG, PNG o PDF" : "JPG o PNG"} — Máx. 5 MB
              </p>
            </div>
          </div>
        )}

        {/* Input real (oculto) */}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={allowedTypes.join(",")}
          capture={captureMode}
          className="sr-only"
          onChange={handleInputChange}
          aria-required={required}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${id}-error` : undefined}
        />
      </div>

      {/* Indicador de archivo exitoso */}
      {hasFile && !displayError && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--color-success)" }}>
          <span>✓</span>
          <span>Archivo listo para enviar</span>
        </p>
      )}

      {/* Mensaje de error */}
      {displayError && (
        <p
          id={`${id}-error`}
          className="error-text"
          role="alert"
          aria-live="polite"
        >
          <span>⚠</span> {displayError}
        </p>
      )}
    </div>
  );
}
