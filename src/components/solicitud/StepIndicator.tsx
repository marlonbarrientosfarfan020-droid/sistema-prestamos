"use client";

interface Step {
  numero: number;
  titulo: string;
  icono: string;
}

interface StepIndicatorProps {
  pasoActual: number;
  pasos: Step[];
}

export default function StepIndicator({ pasoActual, pasos }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Pasos del formulario"
      className="w-full py-6 px-4"
    >
      {/* Desktop: pasos horizontales con línea conectora */}
      <ol className="hidden sm:flex items-center justify-between max-w-3xl mx-auto">
        {pasos.map((paso, index) => {
          const isCompleted = pasoActual > paso.numero;
          const isActive = pasoActual === paso.numero;
          const isLast = index === pasos.length - 1;

          return (
            <li key={paso.numero} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                {/* Círculo del paso */}
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(135deg, var(--color-success), #059669)"
                      : isActive
                      ? "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))"
                      : "var(--color-surface-3)",
                    color: isCompleted || isActive ? "white" : "var(--color-text-muted)",
                    border: isActive
                      ? "3px solid var(--color-primary-300)"
                      : isCompleted
                      ? "none"
                      : "2px solid var(--color-border)",
                    boxShadow: isActive ? "var(--shadow-glow)" : undefined,
                  }}
                  aria-label={`Paso ${paso.numero}: ${paso.titulo} - ${
                    isCompleted ? "completado" : isActive ? "actual" : "pendiente"
                  }`}
                >
                  {isCompleted ? (
                    <span aria-hidden>✓</span>
                  ) : (
                    <span aria-hidden>{paso.icono}</span>
                  )}
                </div>

                {/* Título */}
                <span
                  className="text-xs font-semibold text-center max-w-16 leading-tight"
                  style={{
                    color: isActive
                      ? "var(--color-primary-700)"
                      : isCompleted
                      ? "var(--color-success)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {paso.titulo}
                </span>
              </div>

              {/* Línea conectora */}
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-3 mt-[-1.25rem] rounded-full transition-all duration-500"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(90deg, var(--color-success), #34d399)"
                      : "var(--color-border)",
                  }}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: indicador compacto */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: "var(--color-primary-700)" }}>
            {pasos.find((p) => p.numero === pasoActual)?.icono}{" "}
            {pasos.find((p) => p.numero === pasoActual)?.titulo}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
            {pasoActual} / {pasos.length}
          </span>
        </div>

        {/* Barra de progreso móvil */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--color-border)" }}
          role="progressbar"
          aria-valuenow={pasoActual}
          aria-valuemin={1}
          aria-valuemax={pasos.length}
          aria-label={`Progreso: paso ${pasoActual} de ${pasos.length}`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((pasoActual - 1) / (pasos.length - 1)) * 100}%`,
              background: "linear-gradient(90deg, var(--color-primary-600), var(--color-primary-400))",
            }}
          />
        </div>

        {/* Puntos mini */}
        <div className="flex justify-between mt-2">
          {pasos.map((paso) => (
            <div
              key={paso.numero}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background:
                  pasoActual > paso.numero
                    ? "var(--color-success)"
                    : pasoActual === paso.numero
                    ? "var(--color-primary-600)"
                    : "var(--color-border)",
              }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
