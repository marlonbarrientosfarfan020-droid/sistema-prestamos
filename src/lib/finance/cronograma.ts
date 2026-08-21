// ─────────────────────────────────────────────────────────────────────────────
// Motor de Amortización — Generador de Cronograma de Cuotas (Perú)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ParametrosPrestamo,
  CuotaProyectada,
  ResultadoCronograma,
  PeriodicidadPago,
  TipoTasa,
  ModalidadPago,
} from '@/types';
import { avanzarFechaCuotaPeru, calcularPrimerPagoPeru } from '@/lib/utils/dates';

// ─── Funciones auxiliares financieras ─────────────────────────────────────────

/**
 * Convierte una tasa mensual a la tasa periódica correspondiente
 * según la frecuencia de pago.
 */
function convertirTasaMensualAPeriodica(
  tasaMensual: number,
  frecuencia: PeriodicidadPago
): number {
  // Tasa efectiva anual (TEA) desde la mensual
  const tea = Math.pow(1 + tasaMensual, 12) - 1;

  switch (frecuencia) {
    case 'DIARIO':
      // Base 300 días hábiles aproximados o 365
      return Math.pow(1 + tea, 1 / 365) - 1;
    case 'SEMANAL':
      return Math.pow(1 + tea, 7 / 365) - 1;
    case 'QUINCENAL':
      return Math.pow(1 + tea, 15 / 365) - 1;
    case 'MENSUAL':
      return tasaMensual;
    case 'TRIMESTRAL':
      return Math.pow(1 + tasaMensual, 3) - 1;
    case 'SEMESTRAL':
      return Math.pow(1 + tasaMensual, 6) - 1;
    case 'PAGO_UNICO':
      return tasaMensual;
  }
}

/**
 * Calcula la tasa periódica según el tipo de tasa configurado por el prestamista.
 */
function calcularTasaPeriodica(
  tipoTasa: TipoTasa,
  valorInteres: number,
  numeroCuotas: number,
  frecuencia: PeriodicidadPago
): number {
  switch (tipoTasa) {
    case 'PORCENTAJE_MENSUAL': {
      const tasaMensual = valorInteres / 100;
      return convertirTasaMensualAPeriodica(tasaMensual, frecuencia);
    }
    case 'PORCENTAJE_TOTAL': {
      // Porcentaje total sobre el capital distribuido equitativamente por cuota
      return (valorInteres / 100) / (numeroCuotas || 1);
    }
    case 'MONTO_FIJO_GANANCIA': {
      return -1;
    }
  }
}

// ─── Redondeo monetario a 2 decimales ─────────────────────────────────────────

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Sistema Francés: Cuota Fija Amortizable ─────────────────────────────────

function generarCuotaFijaAmortizable(
  capital: number,
  tasaPeriodica: number,
  numeroCuotas: number,
  fechaPrimerPago: Date,
  frecuencia: PeriodicidadPago
): CuotaProyectada[] {
  const cuotas: CuotaProyectada[] = [];

  // Cuota constante: C = P * i / (1 - (1+i)^-n)
  const cuotaFija =
    tasaPeriodica === 0
      ? capital / numeroCuotas
      : (capital * tasaPeriodica) / (1 - Math.pow(1 + tasaPeriodica, -numeroCuotas));

  let saldo = capital;

  for (let i = 1; i <= numeroCuotas; i++) {
    const fechaVencimiento = avanzarFechaCuotaPeru(fechaPrimerPago, frecuencia, i - 1);
    const interes = saldo * tasaPeriodica;
    const capitalCuota = cuotaFija - interes;
    saldo = Math.max(0, saldo - capitalCuota);

    const esUltima = i === numeroCuotas;
    const capitalAjustado = esUltima ? saldo + capitalCuota : capitalCuota;
    const cuotaAjustada = esUltima ? capitalAjustado + interes : cuotaFija;
    const saldoAjustado = esUltima ? 0 : saldo;

    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      capital: roundTwo(capitalAjustado),
      interes: roundTwo(interes),
      cuotaTotal: roundTwo(cuotaAjustada),
      saldoRestante: roundTwo(saldoAjustado),
    });
  }

  return cuotas;
}

// ─── Sistema Bullet: Solo Interés + Capital al Final ─────────────────────────

function generarSoloInteresCapitalFinal(
  capital: number,
  interesPorCuota: number,
  numeroCuotas: number,
  fechaPrimerPago: Date,
  frecuencia: PeriodicidadPago
): CuotaProyectada[] {
  const cuotas: CuotaProyectada[] = [];

  for (let i = 1; i <= numeroCuotas; i++) {
    const fechaVencimiento = avanzarFechaCuotaPeru(fechaPrimerPago, frecuencia, i - 1);
    const esUltima = i === numeroCuotas;
    const capitalCuota = esUltima ? capital : 0;
    const cuotaTotal = capitalCuota + interesPorCuota;
    const saldoRestante = esUltima ? 0 : capital;

    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      capital: roundTwo(capitalCuota),
      interes: roundTwo(interesPorCuota),
      cuotaTotal: roundTwo(cuotaTotal),
      saldoRestante: roundTwo(saldoRestante),
    });
  }

  return cuotas;
}

// ─── Sistema Monto Fijo de Ganancia ──────────────────────────────────────────

function generarMontoFijoGanancia(
  capital: number,
  montoFijoGanancia: number,
  numeroCuotas: number,
  modalidadPago: ModalidadPago,
  fechaPrimerPago: Date,
  frecuencia: PeriodicidadPago
): CuotaProyectada[] {
  const interesTotalDistribuido = montoFijoGanancia / (numeroCuotas || 1);

  if (modalidadPago === 'CUOTA_FIJA_AMORTIZABLE') {
    const capitalPorCuota = capital / numeroCuotas;
    const cuotas: CuotaProyectada[] = [];
    let saldo = capital;

    for (let i = 1; i <= numeroCuotas; i++) {
      const fechaVencimiento = avanzarFechaCuotaPeru(fechaPrimerPago, frecuencia, i - 1);
      const esUltima = i === numeroCuotas;
      const capitalCuota = esUltima ? saldo : capitalPorCuota;
      saldo = Math.max(0, saldo - capitalCuota);

      cuotas.push({
        numeroCuota: i,
        fechaVencimiento,
        capital: roundTwo(capitalCuota),
        interes: roundTwo(interesTotalDistribuido),
        cuotaTotal: roundTwo(capitalCuota + interesTotalDistribuido),
        saldoRestante: roundTwo(saldo),
      });
    }
    return cuotas;
  } else {
    return generarSoloInteresCapitalFinal(
      capital,
      interesTotalDistribuido,
      numeroCuotas,
      fechaPrimerPago,
      frecuencia
    );
  }
}

// ─── FUNCIÓN PRINCIPAL: Generar Cronograma ────────────────────────────────────

/**
 * Genera el cronograma completo de cuotas para un préstamo.
 *
 * @param params - Parámetros definidos por el prestamista al aprobar el préstamo
 * @returns ResultadoCronograma con el array de cuotas y totales calculados
 */
export function generarCronograma(params: ParametrosPrestamo): ResultadoCronograma {
  const {
    montoAprobado,
    tipoTasa,
    valorInteres,
    modalidadPago,
    frecuenciaPago,
    numeroCuotas,
    fechaPrimerPago,
  } = params;

  let cuotas: CuotaProyectada[];

  if (tipoTasa === 'MONTO_FIJO_GANANCIA') {
    cuotas = generarMontoFijoGanancia(
      montoAprobado,
      valorInteres,
      numeroCuotas,
      modalidadPago,
      fechaPrimerPago,
      frecuenciaPago
    );
  } else {
    const tasaPeriodica = calcularTasaPeriodica(
      tipoTasa,
      valorInteres,
      numeroCuotas,
      frecuenciaPago
    );

    if (modalidadPago === 'CUOTA_FIJA_AMORTIZABLE') {
      cuotas = generarCuotaFijaAmortizable(
        montoAprobado,
        tasaPeriodica,
        numeroCuotas,
        fechaPrimerPago,
        frecuenciaPago
      );
    } else {
      const interesPorCuota = montoAprobado * tasaPeriodica;
      cuotas = generarSoloInteresCapitalFinal(
        montoAprobado,
        interesPorCuota,
        numeroCuotas,
        fechaPrimerPago,
        frecuenciaPago
      );
    }
  }

  // Calcular totales
  const totalInteres = roundTwo(cuotas.reduce((acc, c) => acc + c.interes, 0));
  const totalAPagar = roundTwo(cuotas.reduce((acc, c) => acc + c.cuotaTotal, 0));
  const gananciaEstimada = totalInteres;
  const valorCuotaBase = cuotas[0]?.cuotaTotal ?? 0;

  return {
    cuotas,
    totalInteres,
    totalAPagar,
    gananciaEstimada,
    valorCuotaBase,
  };
}

/**
 * Función de simulación referencial con zona horaria de Perú.
 */
export function simularPrestamo(
  monto: number,
  tasaMensualPct: number,
  numeroCuotas: number,
  frecuencia: PeriodicidadPago
): ResultadoCronograma {
  const fechaPrimerPago = calcularPrimerPagoPeru(frecuencia);

  return generarCronograma({
    montoAprobado: monto,
    tipoTasa: 'PORCENTAJE_MENSUAL',
    valorInteres: tasaMensualPct,
    modalidadPago: 'CUOTA_FIJA_AMORTIZABLE',
    frecuenciaPago: frecuencia,
    numeroCuotas,
    fechaPrimerPago,
  });
}

export type { ParametrosPrestamo, CuotaProyectada, ResultadoCronograma };
