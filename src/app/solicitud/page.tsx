"use client";

import { useState } from "react";
import type { Metadata } from "next";
import StepIndicator from "@/components/solicitud/StepIndicator";
import PasoIdentificacion from "@/components/solicitud/PasoIdentificacion";
import PasoLaboral from "@/components/solicitud/PasoLaboral";
import PasoDocumentos from "@/components/solicitud/PasoDocumentos";
import PasoDesembolso from "@/components/solicitud/PasoDesembolso";
import PasoFinanciero from "@/components/solicitud/PasoFinanciero";
import Link from "next/link";
import type { Paso1Data, Paso2Data, FormularioPaso3, Paso4Data, Paso5Data } from "@/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormularioState {
  paso1?: Paso1Data;
  paso2?: Paso2Data;
  paso3?: FormularioPaso3;
  paso4?: Paso4Data;
  paso5?: Paso5Data;
}

const PASOS = [
  { numero: 1, titulo: "Identificación", icono: "🪪" },
  { numero: 2, titulo: "Laboral", icono: "💼" },
  { numero: 3, titulo: "Documentos", icono: "📎" },
  { numero: 4, titulo: "Desembolso", icono: "💳" },
  { numero: 5, titulo: "Solicitud", icono: "📋" },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SolicitudPage() {
  const [pasoActual, setPasoActual] = useState(1);
  const [formulario, setFormulario] = useState<FormularioState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exito, setExito] = useState<{ solicitudId: string } | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // ─── Navegación entre pasos ────────────────────────────────────────────────

  const handlePaso1 = (data: Paso1Data) => {
    setFormulario((prev) => ({ ...prev, paso1: data }));
    setPasoActual(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaso2 = (data: Paso2Data) => {
    setFormulario((prev) => ({ ...prev, paso2: data }));
    setPasoActual(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaso3 = (data: FormularioPaso3) => {
    setFormulario((prev) => ({ ...prev, paso3: data }));
    setPasoActual(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaso4 = (data: Paso4Data) => {
    setFormulario((prev) => ({ ...prev, paso4: data }));
    setPasoActual(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Envío final ──────────────────────────────────────────────────────────

  const handlePaso5 = async (data: Paso5Data) => {
    const formCompleto = { ...formulario, paso5: data };
    setIsSubmitting(true);
    setErrorGeneral(null);

    try {
      const formData = new FormData();

      // Paso 1
      if (formCompleto.paso1) {
        Object.entries(formCompleto.paso1).forEach(([key, val]) => {
          if (val !== undefined && val !== "") formData.append(key, String(val));
        });
      }

      // Paso 2
      if (formCompleto.paso2) {
        formData.append("tipoOcupacion", formCompleto.paso2.tipoOcupacion);
        formData.append("nombreEmpresaNegocio", formCompleto.paso2.nombreEmpresaNegocio);
        formData.append("ingresoMensualEstimado", String(formCompleto.paso2.ingresoMensualEstimado));
        formData.append("antiguedadLaboral", formCompleto.paso2.antiguedadLaboral);
        formData.append("direccionLaboral", formCompleto.paso2.direccionLaboral);
      }

      // Paso 3 — Archivos
      if (formCompleto.paso3) {
        const docs = formCompleto.paso3;
        if (docs.fotoRostro?.archivo) formData.append("fotoRostro", docs.fotoRostro.archivo);
        if (docs.dniAnverso?.archivo) formData.append("dniAnverso", docs.dniAnverso.archivo);
        if (docs.dniReverso?.archivo) formData.append("dniReverso", docs.dniReverso.archivo);
        if (docs.reciboServicio?.archivo) formData.append("reciboServicio", docs.reciboServicio.archivo);
        if (docs.selfieConDni?.archivo) formData.append("selfieConDni", docs.selfieConDni.archivo);
        if (docs.sustentoLaboral?.archivo) formData.append("sustentoLaboral", docs.sustentoLaboral.archivo);
      }

      // Paso 4
      if (formCompleto.paso4) {
        formData.append("metodoDesembolso", formCompleto.paso4.metodoDesembolso);
        formData.append("numeroCuentaCelular", formCompleto.paso4.numeroCuentaCelular);
        formData.append("referencia1_nombreCompleto", formCompleto.paso4.referencia1.nombreCompleto);
        formData.append("referencia1_parentesco", formCompleto.paso4.referencia1.parentesco);
        formData.append("referencia1_celular", formCompleto.paso4.referencia1.celular);
        formData.append("referencia2_nombreCompleto", formCompleto.paso4.referencia2.nombreCompleto);
        formData.append("referencia2_parentesco", formCompleto.paso4.referencia2.parentesco);
        formData.append("referencia2_celular", formCompleto.paso4.referencia2.celular);
      }

      // Paso 5
      formData.append("montoSolicitado", String(data.montoSolicitado));
      formData.append("periodicidadSolicitada", data.periodicidadSolicitada);

      const response = await fetch("/api/solicitudes", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setExito({ solicitudId: result.data.solicitudId });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorGeneral(result.error ?? "Error al enviar la solicitud. Intenta nuevamente.");
      }
    } catch {
      setErrorGeneral("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Pantalla de éxito ────────────────────────────────────────────────────

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--color-surface-2)" }}>
        <div className="card-elevated p-8 max-w-lg w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            style={{ background: "var(--color-success)", color: "white" }}>
            ✓
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
            ¡Solicitud Enviada!
          </h1>
          <p className="mb-2" style={{ color: "var(--color-text-secondary)" }}>
            Tu solicitud fue recibida exitosamente y está en revisión.
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            ID de solicitud: <code className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--color-surface-3)" }}>
              {exito.solicitudId}
            </code>
          </p>
          <div className="p-4 rounded-xl mb-6"
            style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-200)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary-700)" }}>
              ¿Qué sigue?
            </p>
            <p className="text-sm" style={{ color: "var(--color-primary-600)" }}>
              Revisaremos tus documentos y te contactaremos dentro de las próximas horas.
              Puedes consultar el estado de tu solicitud en cualquier momento con tu DNI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/consulta?dni=${formulario.paso1?.dni}`}
              className="btn btn-primary flex-1" id="exito-consultar-btn">
              🔍 Consultar mi Estado
            </Link>
            <Link href="/" className="btn btn-secondary flex-1" id="exito-inicio-btn">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario multi-paso ────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-2)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm"
        style={{ background: "white", borderBottom: "1px solid var(--color-border)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold"
            style={{ fontFamily: "var(--font-outfit)", color: "var(--color-primary-800)" }}>
            <span>💰</span>
            <span>PréstamosPE</span>
          </Link>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Nueva Solicitud de Préstamo
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator pasoActual={pasoActual} pasos={PASOS} />
        </div>

        {/* Error general */}
        {errorGeneral && (
          <div className="toast toast-error mb-6" role="alert">
            <span>❌</span> {errorGeneral}
          </div>
        )}

        {/* Card del formulario */}
        <div className="card-elevated p-6 sm:p-8">
          {pasoActual === 1 && (
            <PasoIdentificacion defaultValues={formulario.paso1} onNext={handlePaso1} />
          )}
          {pasoActual === 2 && (
            <PasoLaboral
              defaultValues={formulario.paso2}
              onNext={handlePaso2}
              onBack={() => { setPasoActual(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
          {pasoActual === 3 && (
            <PasoDocumentos
              defaultValues={formulario.paso3}
              onNext={handlePaso3}
              onBack={() => { setPasoActual(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
          {pasoActual === 4 && (
            <PasoDesembolso
              defaultValues={formulario.paso4}
              onNext={handlePaso4}
              onBack={() => { setPasoActual(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
          {pasoActual === 5 && (
            <PasoFinanciero
              defaultValues={formulario.paso5}
              onNext={handlePaso5}
              onBack={() => { setPasoActual(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Aviso de seguridad */}
        <div className="text-center mt-6 text-xs" style={{ color: "var(--color-text-muted)" }}>
          🔒 Tus datos están protegidos con encriptación SSL. No compartimos tu información con terceros.
        </div>
      </div>
    </div>
  );
}
