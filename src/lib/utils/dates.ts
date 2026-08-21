// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de Fechas y Zona Horaria Perú (America/Lima / UTC-5)
// ─────────────────────────────────────────────────────────────────────────────

import type { PeriodicidadPago } from "@/types";

export const TIMEZONE_PERU = "America/Lima";

/**
 * Obtiene un objeto Date ajustado a la fecha y hora actual en Perú (America/Lima).
 */
export function getFechaPeru(date: Date = new Date()): Date {
  const str = date.toLocaleString("en-US", { timeZone: TIMEZONE_PERU });
  return new Date(str);
}

/**
 * Parsea un string de fecha (ej. "YYYY-MM-DD" o ISO) fijándolo a mediodía hora peruana (UTC-5)
 * para evitar el clásico desfase de medianoche de V8/Node UTC donde se mostraba el día anterior.
 */
export function parseISODatePeru(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return getFechaPeru();
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return getFechaPeru();
    return new Date(dateStr);
  }

  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = clean.split("-").map(Number);
  if (!year || !month || !day) return new Date(dateStr);

  // Fijar a las 12:00:00 mediodía con timezone explícito de Perú (-05:00)
  return new Date(`${clean}T12:00:00-05:00`);
}

/**
 * Formatea una fecha en formato corto estándar peruano DD/MM/YYYY asegurando America/Lima.
 */
export function formatFechaPeru(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISODatePeru(date) : date;
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: TIMEZONE_PERU,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Formatea una fecha y hora completa en formato peruano DD/MM/YYYY, HH:MM am/pm.
 */
export function formatFechaHoraPeru(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: TIMEZONE_PERU,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Obtiene la fecha en formato ISO YYYY-MM-DD según la zona horaria de Perú
 * (Ideal para default values en <input type="date" />).
 */
export function getFechaISODatePeru(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_PERU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Retorna "YYYY-MM-DD"
}

/**
 * Calcula la fecha sugerida del primer pago según la frecuencia y el modelo peruano:
 * - DIARIO: Siguiente día hábil (+1 día: lunes a sábado). Si cae domingo, se traslada al Lunes.
 * - SEMANAL: 7 días calendario.
 * - QUINCENAL: 15 días calendario.
 * - MENSUAL: 1 mes calendario (mismo día del mes siguiente).
 */
export function calcularPrimerPagoPeru(
  frecuencia: PeriodicidadPago,
  fechaBase?: Date
): Date {
  const hoyPeru = getFechaPeru(fechaBase || new Date());
  const inicio = new Date(hoyPeru);
  inicio.setHours(12, 0, 0, 0);

  switch (frecuencia) {
    case "DIARIO": {
      // Inicia obligatoriamente al día siguiente (+1 día de desembolso)
      inicio.setDate(inicio.getDate() + 1);
      // Si el día siguiente es Domingo (0), se traslada al Lunes (+1 día más)
      if (inicio.getDay() === 0) {
        inicio.setDate(inicio.getDate() + 1);
      }
      return inicio;
    }
    case "SEMANAL": {
      inicio.setDate(inicio.getDate() + 7);
      return inicio;
    }
    case "QUINCENAL": {
      inicio.setDate(inicio.getDate() + 15);
      return inicio;
    }
    case "MENSUAL": {
      inicio.setMonth(inicio.getMonth() + 1);
      return inicio;
    }
    case "TRIMESTRAL": {
      inicio.setMonth(inicio.getMonth() + 3);
      return inicio;
    }
    case "SEMESTRAL": {
      inicio.setMonth(inicio.getMonth() + 6);
      return inicio;
    }
    case "PAGO_UNICO": {
      // Por defecto sugerido a 3 meses (90 días) o configurable libremente
      inicio.setMonth(inicio.getMonth() + 3);
      return inicio;
    }
  }
}

/**
 * Avanza una fecha N cuotas según la frecuencia de pago considerando la operativa peruana:
 * En préstamos DIARIOS, los cobros se realizan de Lunes a Sábado (omitiendo Domingos).
 */
export function avanzarFechaCuotaPeru(
  fechaInicio: Date,
  frecuencia: PeriodicidadPago,
  indiceCuota: number // 0-indexed (0 = primera cuota, 1 = segunda cuota, etc.)
): Date {
  const fecha = new Date(fechaInicio);
  fecha.setHours(12, 0, 0, 0);

  if (indiceCuota === 0) {
    // Si la cuota 1 cae en domingo por algún motivo, mover a lunes
    if (frecuencia === "DIARIO" && fecha.getDay() === 0) {
      fecha.setDate(fecha.getDate() + 1);
    }
    return fecha;
  }

  switch (frecuencia) {
    case "DIARIO": {
      // Avanzar día a día saltando domingos
      let diasAgregados = 0;
      while (diasAgregados < indiceCuota) {
        fecha.setDate(fecha.getDate() + 1);
        // Si no es domingo, cuenta como día de cobro
        if (fecha.getDay() !== 0) {
          diasAgregados++;
        }
      }
      return fecha;
    }
    case "SEMANAL": {
      fecha.setDate(fecha.getDate() + 7 * indiceCuota);
      return fecha;
    }
    case "QUINCENAL": {
      fecha.setDate(fecha.getDate() + 15 * indiceCuota);
      return fecha;
    }
    case "MENSUAL": {
      fecha.setMonth(fecha.getMonth() + indiceCuota);
      return fecha;
    }
    case "TRIMESTRAL": {
      fecha.setMonth(fecha.getMonth() + 3 * indiceCuota);
      return fecha;
    }
    case "SEMESTRAL": {
      fecha.setMonth(fecha.getMonth() + 6 * indiceCuota);
      return fecha;
    }
    case "PAGO_UNICO": {
      fecha.setMonth(fecha.getMonth() + indiceCuota);
      return fecha;
    }
  }
}
