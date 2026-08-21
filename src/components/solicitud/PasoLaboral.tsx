"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paso2Schema } from "@/lib/validations/solicitud";
import type { Paso2Data } from "@/lib/validations/solicitud";
import { LABELS_TIPO_OCUPACION, LABELS_ANTIGUEDAD } from "@/lib/utils/formatters";
import type { TipoOcupacion, AntiguedadLaboral } from "@/types";

interface Props {
  defaultValues?: Partial<Paso2Data>;
  onNext: (data: Paso2Data) => void;
  onBack: () => void;
}

const OCUPACIONES: { value: TipoOcupacion; icon: string }[] = [
  { value: "PLANILLA", icon: "🏢" },
  { value: "NEGOCIO_PROPIO", icon: "🏪" },
  { value: "HONORARIOS", icon: "📋" },
  { value: "INFORMAL", icon: "🛒" },
];

const ANTIGUEDADES: { value: AntiguedadLaboral }[] = [
  { value: "MENOS_3_MESES" },
  { value: "TRES_A_SEIS_MESES" },
  { value: "SEIS_A_UN_ANIO" },
  { value: "UNO_A_TRES_ANIOS" },
  { value: "MAS_TRES_ANIOS" },
];

export default function PasoLaboral({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Paso2Data>({
    resolver: zodResolver(paso2Schema),
    defaultValues: {
      nombreEmpresaNegocio: "",
      ingresoMensualEstimado: undefined,
      direccionLaboral: "",
      ...defaultValues,
    },
  });

  const tipoOcupacionSeleccionado = watch("tipoOcupacion");
  const antiguedadSeleccionada = watch("antiguedadLaboral");

  const onSubmit = handleSubmit((data) => {
    onNext(data);
  });

  const labelNombreEmpresa: Record<TipoOcupacion, string> = {
    PLANILLA: "Nombre de la empresa",
    NEGOCIO_PROPIO: "Nombre o giro del negocio",
    HONORARIOS: "Nombre del cliente o empresa contratante",
    INFORMAL: "Descripción de la actividad",
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-outfit)" }}>
          Situación Laboral e Ingresos
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Esta información nos ayuda a evaluar tu capacidad de pago
        </p>
      </div>

      {/* Tipo de ocupación */}
      <div>
        <label className="label">
          Tipo de ocupación <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {OCUPACIONES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue("tipoOcupacion", o.value, { shouldValidate: true })}
              className="p-4 rounded-xl border-2 text-left transition-all duration-200"
              style={{
                borderColor: tipoOcupacionSeleccionado === o.value
                  ? "var(--color-primary-500)"
                  : "var(--color-border)",
                background: tipoOcupacionSeleccionado === o.value
                  ? "var(--color-primary-50)"
                  : "white",
              }}
              id={`tipo-ocup-${o.value.toLowerCase()}`}
            >
              <span className="text-2xl block mb-1">{o.icon}</span>
              <span className="text-sm font-semibold block"
                style={{ color: tipoOcupacionSeleccionado === o.value ? "var(--color-primary-700)" : "var(--color-text-primary)" }}>
                {LABELS_TIPO_OCUPACION[o.value]}
              </span>
            </button>
          ))}
        </div>
        {errors.tipoOcupacion && (
          <p className="error-text mt-2" role="alert">
            <span>⚠</span> {errors.tipoOcupacion.message}
          </p>
        )}
      </div>

      {/* Nombre empresa/negocio */}
      <div>
        <label htmlFor="p2-empresa" className="label">
          {tipoOcupacionSeleccionado
            ? labelNombreEmpresa[tipoOcupacionSeleccionado]
            : "Nombre de empresa o negocio"}{" "}
          <span className="text-red-500">*</span>
        </label>
        <input
          id="p2-empresa"
          type="text"
          placeholder="Ingrese el nombre"
          className={`input-base ${errors.nombreEmpresaNegocio ? "input-error" : ""}`}
          {...register("nombreEmpresaNegocio")}
          aria-invalid={!!errors.nombreEmpresaNegocio}
        />
        {errors.nombreEmpresaNegocio && (
          <p className="error-text" role="alert">
            <span>⚠</span> {errors.nombreEmpresaNegocio.message}
          </p>
        )}
      </div>

      {/* Ingreso mensual */}
      <div>
        <label htmlFor="p2-ingreso" className="label">
          Ingreso mensual estimado <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none select-none z-10"
            style={{ color: "var(--color-text-muted)" }}
          >
            S/
          </span>
          <input
            id="p2-ingreso"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            placeholder="1500.00"
            className={`input-base pr-4 w-full ${errors.ingresoMensualEstimado ? "input-error" : ""}`}
            style={{ paddingLeft: "2.5rem" }}
            {...register("ingresoMensualEstimado", { valueAsNumber: true })}
            aria-invalid={!!errors.ingresoMensualEstimado}
          />
        </div>
        {errors.ingresoMensualEstimado && (
          <p className="error-text" role="alert">
            <span>⚠</span> {errors.ingresoMensualEstimado.message}
          </p>
        )}
      </div>

      {/* Antigüedad laboral */}
      <div>
        <label className="label">
          Antigüedad laboral <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ANTIGUEDADES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setValue("antiguedadLaboral", a.value, { shouldValidate: true })}
              className="p-3 rounded-lg border text-sm font-medium text-left transition-all duration-200"
              style={{
                borderColor: antiguedadSeleccionada === a.value
                  ? "var(--color-primary-500)"
                  : "var(--color-border)",
                background: antiguedadSeleccionada === a.value
                  ? "var(--color-primary-50)"
                  : "white",
                color: antiguedadSeleccionada === a.value
                  ? "var(--color-primary-700)"
                  : "var(--color-text-primary)",
              }}
              id={`antiguedad-${a.value.toLowerCase()}`}
            >
              {antiguedadSeleccionada === a.value ? "✓ " : "○ "}
              {LABELS_ANTIGUEDAD[a.value]}
            </button>
          ))}
        </div>
        {errors.antiguedadLaboral && (
          <p className="error-text mt-2" role="alert">
            <span>⚠</span> {errors.antiguedadLaboral.message}
          </p>
        )}
      </div>

      {/* Dirección laboral */}
      <div>
        <label htmlFor="p2-dir-laboral" className="label">
          Dirección de trabajo o negocio <span className="text-red-500">*</span>
        </label>
        <input
          id="p2-dir-laboral"
          type="text"
          placeholder="Av. Industrial 456, Piso 3, Oficina 301"
          className={`input-base ${errors.direccionLaboral ? "input-error" : ""}`}
          {...register("direccionLaboral")}
          aria-invalid={!!errors.direccionLaboral}
        />
        {errors.direccionLaboral && (
          <p className="error-text" role="alert">
            <span>⚠</span> {errors.direccionLaboral.message}
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onBack} className="btn btn-secondary flex-1" id="paso2-atras">
          ← Atrás
        </button>
        <button type="submit" className="btn btn-primary flex-1" id="paso2-siguiente">
          Continuar → Documentos
        </button>
      </div>
    </form>
  );
}
