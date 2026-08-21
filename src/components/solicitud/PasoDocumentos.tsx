"use client";

import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import type { FormularioPaso3, DocumentoArchivo } from "@/types";

interface Props {
  defaultValues?: Partial<FormularioPaso3>;
  onNext: (data: FormularioPaso3) => void;
  onBack: () => void;
}

interface DocumentoConfig {
  key: keyof FormularioPaso3;
  id: string;
  label: string;
  description: string;
  required: boolean;
  captureMode?: "user" | "environment";
  acceptPDF: boolean;
}

const DOCUMENTOS: DocumentoConfig[] = [
  {
    key: "fotoRostro",
    id: "doc-foto-rostro",
    label: "Foto de rostro",
    description: "Captura tu cara de frente, con buena iluminación y sin lentes.",
    required: true,
    captureMode: "user",
    acceptPDF: false,
  },
  {
    key: "dniAnverso",
    id: "doc-dni-anverso",
    label: "DNI — Frente",
    description: "Foto del frente de tu DNI con todos los datos visibles.",
    required: true,
    captureMode: "environment",
    acceptPDF: true,
  },
  {
    key: "dniReverso",
    id: "doc-dni-reverso",
    label: "DNI — Reverso",
    description: "Foto del reverso de tu DNI con el código de barras visible.",
    required: true,
    captureMode: "environment",
    acceptPDF: true,
  },
  {
    key: "reciboServicio",
    id: "doc-recibo",
    label: "Recibo de Luz o Agua",
    description: "Recibo de servicio de los últimos 3 meses a tu nombre o de familiar.",
    required: true,
    captureMode: "environment",
    acceptPDF: true,
  },
  {
    key: "selfieConDni",
    id: "doc-selfie-dni",
    label: "Selfie sosteniendo tu DNI",
    description: "Sostén tu DNI al lado de tu rostro. Ambos deben verse claramente (prueba de vida KYC).",
    required: true,
    captureMode: "user",
    acceptPDF: false,
  },
  {
    key: "sustentoLaboral",
    id: "doc-sustento-laboral",
    label: "Sustento Laboral",
    description: "Opcional: boleta de pago, contrato, constancia de trabajo o foto de tu local/negocio.",
    required: false,
    captureMode: undefined,
    acceptPDF: true,
  },
];

function vacioDocumento(): DocumentoArchivo {
  return { archivo: null };
}

export default function PasoDocumentos({ defaultValues, onNext, onBack }: Props) {
  const [documentos, setDocumentos] = useState<FormularioPaso3>({
    fotoRostro: defaultValues?.fotoRostro ?? vacioDocumento(),
    dniAnverso: defaultValues?.dniAnverso ?? vacioDocumento(),
    dniReverso: defaultValues?.dniReverso ?? vacioDocumento(),
    reciboServicio: defaultValues?.reciboServicio ?? vacioDocumento(),
    selfieConDni: defaultValues?.selfieConDni ?? vacioDocumento(),
    sustentoLaboral: defaultValues?.sustentoLaboral ?? vacioDocumento(),
  });

  const [errores, setErrores] = useState<Partial<Record<keyof FormularioPaso3, string>>>({});

  const handleFileChange = (key: keyof FormularioPaso3, file: File | null) => {
    setDocumentos((prev) => ({
      ...prev,
      [key]: {
        archivo: file,
        previewUrl: file && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        mimeType: file?.type,
        tamanoBytes: file?.size,
      },
    }));
    // Limpiar error si se adjuntó un archivo
    if (file && errores[key]) {
      setErrores((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar obligatorios
    const nuevosErrores: Partial<Record<keyof FormularioPaso3, string>> = {};
    const obligatorios = DOCUMENTOS.filter((d) => d.required).map((d) => d.key);

    for (const key of obligatorios) {
      if (!documentos[key]?.archivo) {
        nuevosErrores[key] = "Este documento es obligatorio";
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      // Scroll al primer error
      const firstErrorKey = Object.keys(nuevosErrores)[0];
      document.getElementById(`doc-${firstErrorKey.replace(/([A-Z])/g, "-$1").toLowerCase()}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    onNext(documentos);
  };

  const completados = DOCUMENTOS.filter((d) => documentos[d.key]?.archivo).length;
  const obligatorios = DOCUMENTOS.filter((d) => d.required).length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-outfit)" }}>
          Documentación y Verificación KYC
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Necesitamos verificar tu identidad. Máximo 5 MB por archivo (JPG, PNG o PDF).
        </p>
      </div>

      {/* Progreso de documentos */}
      <div className="p-4 rounded-xl"
        style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-200)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: "var(--color-primary-700)" }}>
            Documentos adjuntados
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--color-primary-700)" }}>
            {completados} / {DOCUMENTOS.length}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--color-primary-200)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completados / DOCUMENTOS.length) * 100}%`,
              background: "linear-gradient(90deg, var(--color-primary-600), var(--color-primary-400))",
            }}
          />
        </div>
        {completados < obligatorios && (
          <p className="text-xs mt-2" style={{ color: "var(--color-primary-600)" }}>
            ℹ Faltan {obligatorios - Math.min(completados, obligatorios)} documentos obligatorios
          </p>
        )}
      </div>

      {/* Grid de documentos */}
      <div className="grid sm:grid-cols-2 gap-6">
        {DOCUMENTOS.map((doc) => (
          <div key={doc.key}>
            <DocumentUploader
              id={doc.id}
              label={doc.label}
              description={doc.description}
              required={doc.required}
              captureMode={doc.captureMode}
              acceptPDF={doc.acceptPDF}
              value={documentos[doc.key]?.archivo ?? null}
              onChange={(file) => handleFileChange(doc.key, file)}
              error={errores[doc.key]}
            />
          </div>
        ))}
      </div>

      {/* Aviso de privacidad */}
      <div className="p-4 rounded-xl text-sm"
        style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
        <p className="font-semibold mb-1">🔒 Tu información está protegida</p>
        <p style={{ color: "var(--color-text-muted)" }}>
          Los documentos se almacenan con encriptación y solo son revisados por nuestro equipo
          de verificación. No son compartidos con terceros.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onBack} className="btn btn-secondary flex-1" id="paso3-atras">
          ← Atrás
        </button>
        <button type="submit" className="btn btn-primary flex-1" id="paso3-siguiente">
          Continuar → Desembolso
        </button>
      </div>
    </form>
  );
}
