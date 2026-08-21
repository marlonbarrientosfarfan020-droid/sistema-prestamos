"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { paso1Schema, type Paso1Data } from "@/lib/validations/solicitud";
import { getDepartamentos, getProvincias, getDistritos } from "@/lib/data/ubigeo";

interface Props {
  defaultValues?: Partial<Paso1Data>;
  onNext: (data: Paso1Data) => void;
}

export default function PasoIdentificacion({ defaultValues, onNext }: Props) {
  const [provincias, setProvincias] = useState<string[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);

  const departamentos = getDepartamentos();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso1Data>({
    resolver: zodResolver(paso1Schema),
    defaultValues: {
      dni: "",
      nombres: "",
      apellidos: "",
      celular: "",
      email: "",
      direccion: "",
      departamento: "",
      provincia: "",
      distrito: "",
      ...defaultValues,
    },
  });

  const departamentoSeleccionado = watch("departamento");
  const provinciaSeleccionada = watch("provincia");
  const distritoSeleccionado = watch("distrito");

  // Actualizar provincias cuando cambia departamento
  useEffect(() => {
    if (departamentoSeleccionado) {
      const nuevasProvincias = getProvincias(departamentoSeleccionado);
      setProvincias(nuevasProvincias);

      // Si la provincia actual no pertenece al nuevo departamento, resetearla
      if (!nuevasProvincias.includes(provinciaSeleccionada)) {
        setValue("provincia", "");
        setValue("distrito", "");
        setDistritos([]);
      }
    } else {
      setProvincias([]);
      setDistritos([]);
      setValue("provincia", "");
      setValue("distrito", "");
    }
  }, [departamentoSeleccionado, provinciaSeleccionada, setValue]);

  // Actualizar distritos cuando cambia provincia
  useEffect(() => {
    if (departamentoSeleccionado && provinciaSeleccionada) {
      const nuevosDistritos = getDistritos(departamentoSeleccionado, provinciaSeleccionada);
      setDistritos(nuevosDistritos);

      // Si el distrito actual no pertenece a la nueva provincia, resetearlo
      if (!nuevosDistritos.includes(distritoSeleccionado || "")) {
        setValue("distrito", "");
      }
    } else {
      setDistritos([]);
      setValue("distrito", "");
    }
  }, [departamentoSeleccionado, provinciaSeleccionada, distritoSeleccionado, setValue]);

  const onSubmit = handleSubmit((data) => {
    onNext(data);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-outfit)" }}>
          Datos de Identificación
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Información personal del solicitante según DNI vigente
        </p>
      </div>

      {/* DNI */}
      <div>
        <label htmlFor="p1-dni" className="label">
          Número de DNI <span className="text-red-500">*</span>
        </label>
        <input
          id="p1-dni"
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="Ej: 12345678"
          className={`input-base ${errors.dni ? "input-error" : ""}`}
          {...register("dni", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
            },
          })}
          aria-invalid={!!errors.dni}
          aria-describedby={errors.dni ? "p1-dni-error" : undefined}
        />
        {errors.dni && (
          <p id="p1-dni-error" className="error-text" role="alert">
            <span>⚠</span> {errors.dni.message}
          </p>
        )}
      </div>

      {/* Nombres y Apellidos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="p1-nombres" className="label">
            Nombres <span className="text-red-500">*</span>
          </label>
          <input
            id="p1-nombres"
            type="text"
            placeholder="Ej: Juan Carlos"
            className={`input-base ${errors.nombres ? "input-error" : ""}`}
            {...register("nombres")}
            aria-invalid={!!errors.nombres}
          />
          {errors.nombres && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.nombres.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="p1-apellidos" className="label">
            Apellidos <span className="text-red-500">*</span>
          </label>
          <input
            id="p1-apellidos"
            type="text"
            placeholder="Ej: García López"
            className={`input-base ${errors.apellidos ? "input-error" : ""}`}
            {...register("apellidos")}
            aria-invalid={!!errors.apellidos}
          />
          {errors.apellidos && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.apellidos.message}</p>
          )}
        </div>
      </div>

      {/* Celular y Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="p1-celular" className="label">
            Celular <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3.5 text-sm font-semibold pointer-events-none select-none z-10"
              style={{ color: "var(--color-text-muted)" }}
            >
              +51
            </span>
            <input
              id="p1-celular"
              type="tel"
              inputMode="numeric"
              maxLength={9}
              placeholder="987654321"
              className={`input-base pr-4 w-full ${errors.celular ? "input-error" : ""}`}
              style={{ paddingLeft: "3rem" }}
              {...register("celular", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 9);
                },
              })}
              aria-invalid={!!errors.celular}
            />
          </div>
          {errors.celular && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.celular.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="p1-email" className="label">
            Correo electrónico <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>(opcional)</span>
          </label>
          <input
            id="p1-email"
            type="email"
            inputMode="email"
            placeholder="ejemplo@correo.com"
            className={`input-base ${errors.email ? "input-error" : ""}`}
            {...register("email")}
          />
          {errors.email && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label htmlFor="p1-direccion" className="label">
          Dirección de domicilio <span className="text-red-500">*</span>
        </label>
        <input
          id="p1-direccion"
          type="text"
          placeholder="Av. Los Olivos 123, Mz. A, Lt. 5"
          className={`input-base ${errors.direccion ? "input-error" : ""}`}
          {...register("direccion")}
          aria-invalid={!!errors.direccion}
        />
        {errors.direccion && (
          <p className="error-text" role="alert"><span>⚠</span> {errors.direccion.message}</p>
        )}
      </div>

      {/* Ubigeo en Cascada */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* 1. Departamento */}
        <div>
          <label htmlFor="p1-departamento" className="label">
            Departamento <span className="text-red-500">*</span>
          </label>
          <select
            id="p1-departamento"
            className={`input-base ${errors.departamento ? "input-error" : ""}`}
            {...register("departamento")}
            aria-invalid={!!errors.departamento}
          >
            <option value="">Seleccionar departamento...</option>
            {departamentos.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          {errors.departamento && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.departamento.message}</p>
          )}
        </div>

        {/* 2. Provincia */}
        <div>
          <label htmlFor="p1-provincia" className="label">
            Provincia <span className="text-red-500">*</span>
          </label>
          <select
            id="p1-provincia"
            className={`input-base ${errors.provincia ? "input-error" : ""}`}
            {...register("provincia")}
            disabled={!departamentoSeleccionado || provincias.length === 0}
            aria-invalid={!!errors.provincia}
          >
            <option value="">
              {!departamentoSeleccionado
                ? "Primero elija departamento"
                : "Seleccionar provincia..."}
            </option>
            {provincias.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          {errors.provincia && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.provincia.message}</p>
          )}
        </div>

        {/* 3. Distrito */}
        <div>
          <label htmlFor="p1-distrito" className="label">
            Distrito <span className="text-red-500">*</span>
          </label>
          <select
            id="p1-distrito"
            className={`input-base ${errors.distrito ? "input-error" : ""}`}
            {...register("distrito")}
            disabled={!provinciaSeleccionada || distritos.length === 0}
            aria-invalid={!!errors.distrito}
          >
            <option value="">
              {!provinciaSeleccionada
                ? "Primero elija provincia"
                : "Seleccionar distrito..."}
            </option>
            {distritos.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
          {errors.distrito && (
            <p className="error-text" role="alert"><span>⚠</span> {errors.distrito.message}</p>
          )}
        </div>
      </div>

      {/* Botón siguiente */}
      <div className="pt-4">
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={isSubmitting}
          id="paso1-siguiente"
        >
          Continuar al Paso 2: Situación Laboral →
        </button>
      </div>
    </form>
  );
}
