// ─────────────────────────────────────────────────────────────────────────────
// Formatters — Utilidades de formato para el mercado peruano
// ─────────────────────────────────────────────────────────────────────────────

import type {
  TipoOcupacion,
  MetodoDesembolso,
  PeriodicidadPago,
  EstadoSolicitud,
  EstadoCuota,
  TipoTasa,
  ModalidadPago,
  ScoringRiesgo,
  AntiguedadLaboral,
  TipoDocumentoKYC,
} from '@/types';

// ─── Moneda PEN ───────────────────────────────────────────────────────────────

const penFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPEN(amount: number): string {
  return penFormatter.format(amount);
}

export function formatPENCompact(amount: number): string {
  if (amount >= 1000) {
    return `S/ ${(amount / 1000).toFixed(1)}K`;
  }
  return `S/ ${amount.toFixed(2)}`;
}

// ─── Fechas con Zona Horaria Perú (America/Lima) ──────────────────────────────
export { formatFechaPeru, formatFechaHoraPeru, getFechaPeru } from '@/lib/utils/dates';
import { formatFechaPeru, formatFechaHoraPeru } from '@/lib/utils/dates';

export function formatDate(date: Date | string | null | undefined): string {
  return formatFechaPeru(date);
}

export function formatDateFull(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const dateFullFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return dateFullFormatter.format(typeof date === 'string' ? new Date(date) : date);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatFechaHoraPeru(date);
}

export function diasRestantes(fechaVencimiento: Date | string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── DNI ──────────────────────────────────────────────────────────────────────

export function formatDNI(dni: string): string {
  return dni.replace(/(\d{8})/, '$1');
}

export function maskDNI(dni: string): string {
  return `****${dni.slice(4)}`;
}

// ─── Celular ──────────────────────────────────────────────────────────────────

export function formatCelular(celular: string): string {
  return celular.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

// ─── Tamaño de archivos ───────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Labels de enums ─────────────────────────────────────────────────────────

export const LABELS_TIPO_OCUPACION: Record<TipoOcupacion, string> = {
  PLANILLA: 'Empleado en Planilla',
  NEGOCIO_PROPIO: 'Negocio Propio',
  HONORARIOS: 'Recibo por Honorarios',
  INFORMAL: 'Trabajo Informal',
};

export const LABELS_METODO_DESEMBOLSO: Record<MetodoDesembolso, string> = {
  EFECTIVO: 'Efectivo (Entrega Personal)',
  YAPE: 'Yape',
  PLIN: 'Plin',
  BCP: 'BCP',
  BBVA: 'BBVA',
  INTERBANK: 'Interbank',
  BANCO_NACION: 'Banco de la Nación',
  OTRO_CCI: 'Cuenta CCI (Otro banco)',
};

export const LABELS_PERIODICIDAD: Record<PeriodicidadPago, string> = {
  DIARIO: 'Diario',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral (Cada 3 meses)',
  SEMESTRAL: 'Semestral (Cada 6 meses)',
  PAGO_UNICO: 'Al Vencimiento (Pago Único)',
};

export const LABELS_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  EN_EVALUACION: 'En Evaluación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  FINALIZADO: 'Finalizado',
};

export const LABELS_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  VENCIDO: 'Vencido',
};

export const LABELS_TIPO_TASA: Record<TipoTasa, string> = {
  PORCENTAJE_MENSUAL: '% Mensual',
  PORCENTAJE_TOTAL: '% Total sobre Capital',
  MONTO_FIJO_GANANCIA: 'Monto Fijo de Ganancia (S/)',
};

export const LABELS_MODALIDAD_PAGO: Record<ModalidadPago, string> = {
  CUOTA_FIJA_AMORTIZABLE: 'Cuota Fija Amortizable (Sistema Francés)',
  SOLO_INTERES_CAPITAL_FINAL: 'Solo Interés por Cuota + Capital al Final',
};

export const LABELS_SCORING: Record<ScoringRiesgo, string> = {
  BAJO: 'Riesgo Bajo',
  MEDIO: 'Riesgo Medio',
  ALTO: 'Riesgo Alto',
};

export const LABELS_ANTIGUEDAD: Record<AntiguedadLaboral, string> = {
  MENOS_3_MESES: 'Menos de 3 meses',
  TRES_A_SEIS_MESES: '3 a 6 meses',
  SEIS_A_UN_ANIO: '6 meses a 1 año',
  UNO_A_TRES_ANIOS: '1 a 3 años',
  MAS_TRES_ANIOS: 'Más de 3 años',
};

export const LABELS_DOCUMENTO_KYC: Record<TipoDocumentoKYC, string> = {
  FOTO_ROSTRO: 'Foto de Rostro',
  DNI_ANVERSO: 'DNI Frontal',
  DNI_REVERSO: 'DNI Reverso',
  RECIBO_SERVICIO: 'Recibo de Servicio',
  SELFIE_CON_DNI: 'Selfie con DNI',
  SUSTENTO_LABORAL: 'Sustento Laboral',
  VOUCHER_PAGO: 'Comprobante de Pago',
};

// ─── Colores de estado ────────────────────────────────────────────────────────

export const COLOR_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-700 border-gray-200',
  EN_EVALUACION: 'bg-amber-50 text-amber-700 border-amber-200',
  APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-200',
  FINALIZADO: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const COLOR_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  PAGADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VENCIDO: 'bg-red-50 text-red-700 border-red-200',
};

export const COLOR_SCORING: Record<ScoringRiesgo, string> = {
  BAJO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIO: 'bg-amber-50 text-amber-700 border-amber-200',
  ALTO: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Iconos de métodos de desembolso ─────────────────────────────────────────

export const ICONS_METODO: Record<MetodoDesembolso, string> = {
  EFECTIVO: '💵',
  YAPE: '💜',
  PLIN: '🟣',
  BCP: '🏦',
  BBVA: '🔵',
  INTERBANK: '🟢',
  BANCO_NACION: '🏛️',
  OTRO_CCI: '🏧',
};

// ─── Departamentos peruanos (para frecuencia calculada) ───────────────────────

export const DIAS_POR_FRECUENCIA: Record<PeriodicidadPago, number> = {
  DIARIO: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  PAGO_UNICO: 90,
};

// ─── Copia al portapapeles ───────────────────────────────────────────────────

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback para navegadores sin soporte
    const el = document.createElement('textarea');
    el.value = texto;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  }
}
