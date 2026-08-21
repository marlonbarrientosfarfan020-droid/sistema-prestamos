"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsultaRapidaDNI() {
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos");
      return;
    }

    setLoading(true);
    // Redirigir a la página de consulta con el DNI precargado
    router.push(`/consulta?dni=${dni}`);
  };

  return (
    <section
      id="consulta-rapida"
      className="py-16 px-4"
      style={{
        background: "linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-800) 100%)",
      }}
      aria-label="Consulta rápida de estado"
    >
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-block text-4xl mb-4">🔍</span>
        <h2
          className="text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          Consulta el estado de tu préstamo
        </h2>
        <p className="text-blue-200 mb-8">
          Solo necesitas tu DNI para ver el estado de tu solicitud,
          el cronograma de pagos y registrar tus abonos.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          noValidate
        >
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              🪪
            </div>
            <input
              id="consulta-dni-input"
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setDni(v);
                if (error) setError("");
              }}
              placeholder="Ingresa tu DNI (8 dígitos)"
              className="input-base pl-10 text-base"
              style={{ height: "3.25rem" }}
              aria-label="Número de DNI"
              aria-invalid={!!error}
              aria-describedby={error ? "consulta-dni-error" : undefined}
            />
          </div>
          <button
            type="submit"
            className="btn btn-gold"
            style={{ height: "3.25rem", minWidth: "9rem" }}
            disabled={loading}
            id="consulta-dni-btn"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Buscando...
              </span>
            ) : (
              <>🔎 Consultar</>
            )}
          </button>
        </form>

        {error && (
          <p
            id="consulta-dni-error"
            className="mt-3 text-red-300 text-sm flex items-center justify-center gap-1"
            role="alert"
          >
            <span>⚠</span> {error}
          </p>
        )}

        <p className="text-blue-300 text-xs mt-6">
          🔒 Tus datos están protegidos con encriptación de extremo a extremo
        </p>
      </div>
    </section>
  );
}
