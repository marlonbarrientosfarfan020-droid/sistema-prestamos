"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paso4Schema, type Paso4Data } from "@/lib/validations/solicitud";
import { LABELS_METODO_DESEMBOLSO, ICONS_METODO } from "@/lib/utils/formatters";
import type { MetodoDesembolso } from "@/types";
import { Info, Banknote, ShieldCheck } from "lucide-react";

interface Props {
  defaultValues?: Partial<Paso4Data>;
  onNext: (data: Paso4Data) => void;
  onBack: () => void;
}

const METODOS: { id: MetodoDesembolso; title: string; desc: string; icon: string }[] = [
  { id: "EFECTIVO", title: "Efectivo", desc: "Entrega personal / Oficina", icon: "💵" },
  { id: "YAPE", title: "Yape", desc: "Billetera digital móvil", icon: "💜" },
  { id: "PLIN", title: "Plin", desc: "Billetera digital móvil", icon: "🟣" },
  { id: "BCP", title: "BCP", desc: "Banco de Crédito del Perú", icon: "🏦" },
  { id: "BBVA", title: "BBVA", desc: "Banco BBVA Continental", icon: "🔵" },
  { id: "INTERBANK", title: "Interbank", desc: "Transferencia bancaria", icon: "🟢" },
  { id: "BANCO_NACION", title: "Banco de la Nación", desc: "Cuenta BN Corriente/Ahorros", icon: "🏛️" },
  { id: "OTRO_CCI", title: "Otro Banco / CCI", desc: "Código de Cuenta Interbancario", icon: "🏧" },
];

const PARENTESCOS = [
  "Cónyuge", "Padre/Madre", "Hermano/a", "Hijo/a", "Tío/a", "Amigo/a", "Compañero/a de trabajo", "Otro",
];

export default function PasoDesembolso({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Paso4Data>({
    resolver: zodResolver(paso4Schema),
    defaultValues: {
      metodoDesembolso: defaultValues?.metodoDesembolso || "EFECTIVO",
      numeroCuentaCelular: defaultValues?.numeroCuentaCelular || (defaultValues?.metodoDesembolso === "EFECTIVO" ? "EFECTIVO" : ""),
      referencia1: { nombreCompleto: "", parentesco: "", celular: "" },
      referencia2: { nombreCompleto: "", parentesco: "", celular: "" },
      ...defaultValues,
    },
  });

  const metodoSeleccionado = watch("metodoDesembolso");

  const handleMetodoSelect = (m: MetodoDesembolso) => {
    setValue("metodoDesembolso", m, { shouldValidate: true });
    if (m === "EFECTIVO") {
      setValue("numeroCuentaCelular", "EFECTIVO", { shouldValidate: true });
    } else {
      if (watch("numeroCuentaCelular") === "EFECTIVO") {
        setValue("numeroCuentaCelular", "", { shouldValidate: true });
      }
    }
  };

  const onSubmit = handleSubmit((data: Paso4Data) => {
    if (data.metodoDesembolso === "EFECTIVO" && (!data.numeroCuentaCelular || data.numeroCuentaCelular === "")) {
      data.numeroCuentaCelular = "EFECTIVO";
    }
    onNext(data);
  });

  const labelNumero: Record<MetodoDesembolso, string> = {
    EFECTIVO: "Modalidad Presencial",
    YAPE: "Número de Celular Yape (9 dígitos)",
    PLIN: "Número de Celular Plin (9 dígitos)",
    BCP: "Número de Cuenta BCP",
    BBVA: "Número de Cuenta BBVA",
    INTERBANK: "Número de Cuenta Interbank",
    BANCO_NACION: "Número de Cuenta Banco de la Nación",
    OTRO_CCI: "Código de Cuenta Interbancario (CCI - 20 dígitos)",
  };

  const placeholderNumero: Record<MetodoDesembolso, string> = {
    EFECTIVO: "Entrega presencial en efectivo",
    YAPE: "987654321",
    PLIN: "987654321",
    BCP: "Ej: 191-12345678-0-12",
    BBVA: "Ej: 0011-0123-0200123456",
    INTERBANK: "Ej: 200-3001234567",
    BANCO_NACION: "Ej: 04-012-345678",
    OTRO_CCI: "00219100000000000000",
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-outfit)" }}>
          Desembolso y Referencias
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          ¿Cómo deseas recibir tu dinero? Y dos referencias personales para contacto.
        </p>
      </div>

      {/* Método de desembolso */}
      <div>
        <label className="label mb-2 block">
          Método de desembolso <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {METODOS.map((m) => {
            const isSelected = metodoSeleccionado === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMetodoSelect(m.id)}
                className={`p-3 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 text-left cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                }`}
                id={`metodo-${m.id.toLowerCase()}`}
              >
                <span className="text-2xl flex-shrink-0">{m.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs leading-tight text-slate-900">{m.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.metodoDesembolso && (
          <p className="error-text mt-2" role="alert">
            <span>⚠</span> {errors.metodoDesembolso.message}
          </p>
        )}
      </div>

      {/* Banner Informativo o Input de Cuenta */}
      {metodoSeleccionado === "EFECTIVO" ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-150">
          <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-950 flex items-center gap-1.5">
              <span>Entrega Personal en Efectivo</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-semibold">
                Sin comisión bancaria
              </span>
            </p>
            <p className="text-emerald-800 text-xs leading-relaxed">
              El dinero será entregado en efectivo personalmente o en el punto de encuentro / oficina acordado con el asesor crediticio al momento de la firma. No necesitas ingresar ningún número de cuenta.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          <label htmlFor="p4-numero-cuenta" className="label">
            {metodoSeleccionado ? labelNumero[metodoSeleccionado] : "Número de cuenta o celular"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="p4-numero-cuenta"
            type="text"
            inputMode={metodoSeleccionado === "YAPE" || metodoSeleccionado === "PLIN" ? "tel" : "text"}
            maxLength={metodoSeleccionado === "YAPE" || metodoSeleccionado === "PLIN" ? 9 : 30}
            placeholder={metodoSeleccionado ? placeholderNumero[metodoSeleccionado] : "Ingrese número"}
            className={`input-base ${errors.numeroCuentaCelular ? "input-error" : ""}`}
            {...register("numeroCuentaCelular")}
            aria-invalid={!!errors.numeroCuentaCelular}
          />
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Debe estar a nombre del titular (DNI ingresado en el paso 1).</span>
          </p>
          {errors.numeroCuentaCelular && (
            <p className="error-text" role="alert">
              <span>⚠</span> {errors.numeroCuentaCelular.message}
            </p>
          )}
        </div>
      )}

      {/* Referencias personales */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div>
          <h3 className="font-bold text-base text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
            Referencias Personales
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Dos personas de confianza que puedan confirmar tus datos (familiares, amigos o compañeros de trabajo).
          </p>
        </div>

        {([1, 2] as const).map((num) => {
          const prefix = num === 1 ? "referencia1" : "referencia2";
          return (
            <div
              key={num}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4"
            >
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                  {num}
                </span>
                <span>Referencia {num}</span>
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Nombre completo */}
                <div>
                  <label htmlFor={`ref${num}-nombre`} className="label">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`ref${num}-nombre`}
                    type="text"
                    placeholder="Ej: Rosa Martínez"
                    className={`input-base ${errors[prefix]?.nombreCompleto ? "input-error" : ""}`}
                    {...register(`${prefix}.nombreCompleto`)}
                  />
                  {errors[prefix]?.nombreCompleto && (
                    <p className="error-text" role="alert">
                      <span>⚠</span> {errors[prefix]?.nombreCompleto?.message}
                    </p>
                  )}
                </div>

                {/* Parentesco */}
                <div>
                  <label htmlFor={`ref${num}-parentesco`} className="label">
                    Parentesco / Relación <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`ref${num}-parentesco`}
                    className={`input-base ${errors[prefix]?.parentesco ? "input-error" : ""}`}
                    {...register(`${prefix}.parentesco`)}
                  >
                    <option value="">Seleccionar parentesco...</option>
                    {PARENTESCOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors[prefix]?.parentesco && (
                    <p className="error-text" role="alert">
                      <span>⚠</span> {errors[prefix]?.parentesco?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Celular con prefijo fijo +51 */}
              <div>
                <label htmlFor={`ref${num}-celular`} className="label">
                  Celular de la referencia <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span
                    className="absolute left-3.5 text-sm font-semibold pointer-events-none select-none z-10"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    +51
                  </span>
                  <input
                    id={`ref${num}-celular`}
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="987654321"
                    className={`input-base pr-4 w-full ${errors[prefix]?.celular ? "input-error" : ""}`}
                    style={{ paddingLeft: "3rem" }}
                    {...register(`${prefix}.celular`, {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 9);
                      },
                    })}
                  />
                </div>
                {errors[prefix]?.celular && (
                  <p className="error-text" role="alert">
                    <span>⚠</span> {errors[prefix]?.celular?.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary w-1/3 cursor-pointer"
          id="paso4-atras"
        >
          ← Atrás
        </button>
        <button
          type="submit"
          className="btn btn-primary w-2/3 cursor-pointer"
          id="paso4-siguiente"
        >
          Continuar a Simulación →
        </button>
      </div>
    </form>
  );
}
