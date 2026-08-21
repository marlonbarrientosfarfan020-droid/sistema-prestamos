// ─────────────────────────────────────────────────────────────────────────────
// Tipos globales TypeScript — Sistema de Préstamos Perú
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums (reflejan schema Prisma) ──────────────────────────────────────────

export type TipoOcupacion = 'PLANILLA' | 'NEGOCIO_PROPIO' | 'HONORARIOS' | 'INFORMAL';
export type MetodoDesembolso = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'BCP' | 'BBVA' | 'INTERBANK' | 'BANCO_NACION' | 'OTRO_CCI';
export type PeriodicidadPago = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'PAGO_UNICO';
export type EstadoSolicitud = 'PENDIENTE' | 'EN_EVALUACION' | 'APROBADO' | 'RECHAZADO' | 'FINALIZADO';
export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
export type TipoDocumentoKYC = 'FOTO_ROSTRO' | 'DNI_ANVERSO' | 'DNI_REVERSO' | 'RECIBO_SERVICIO' | 'SELFIE_CON_DNI' | 'SUSTENTO_LABORAL' | 'VOUCHER_PAGO';
export type TipoTasa = 'PORCENTAJE_MENSUAL' | 'PORCENTAJE_TOTAL' | 'MONTO_FIJO_GANANCIA';
export type ModalidadPago = 'CUOTA_FIJA_AMORTIZABLE' | 'SOLO_INTERES_CAPITAL_FINAL';
export type ScoringRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type AntiguedadLaboral = 'MENOS_3_MESES' | 'TRES_A_SEIS_MESES' | 'SEIS_A_UN_ANIO' | 'UNO_A_TRES_ANIOS' | 'MAS_TRES_ANIOS';

// ─── Motor de Amortización ────────────────────────────────────────────────────

export interface ParametrosPrestamo {
  montoAprobado: number;
  tipoTasa: TipoTasa;
  valorInteres: number;
  modalidadPago: ModalidadPago;
  frecuenciaPago: PeriodicidadPago;
  numeroCuotas: number;
  fechaPrimerPago: Date;
}

export interface CuotaProyectada {
  numeroCuota: number;
  fechaVencimiento: Date;
  capital: number;
  interes: number;
  cuotaTotal: number;
  saldoRestante: number;
}

export interface ResultadoCronograma {
  cuotas: CuotaProyectada[];
  totalInteres: number;
  totalAPagar: number;
  gananciaEstimada: number;
  valorCuotaBase: number;
}

// ─── Formulario Multi-Paso ────────────────────────────────────────────────────

export interface FormularioPaso1 {
  dni: string;
  nombres: string;
  apellidos: string;
  celular: string;
  email?: string;
  fechaNacimiento?: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface FormularioPaso2 {
  tipoOcupacion: TipoOcupacion;
  nombreEmpresaNegocio: string;
  ingresoMensualEstimado: number;
  antiguedadLaboral: AntiguedadLaboral;
  direccionLaboral: string;
}

export interface DocumentoArchivo {
  archivo: File | null;
  previewUrl?: string;
  mimeType?: string;
  tamanoBytes?: number;
}

export interface FormularioPaso3 {
  fotoRostro: DocumentoArchivo;
  dniAnverso: DocumentoArchivo;
  dniReverso: DocumentoArchivo;
  reciboServicio: DocumentoArchivo;
  selfieConDni: DocumentoArchivo;
  sustentoLaboral?: DocumentoArchivo;
}

export interface ReferenciaPersonal {
  nombreCompleto: string;
  parentesco: string;
  celular: string;
}

export interface FormularioPaso4 {
  metodoDesembolso: MetodoDesembolso;
  numeroCuentaCelular: string;
  referencia1: ReferenciaPersonal;
  referencia2: ReferenciaPersonal;
}

export interface FormularioPaso5 {
  montoSolicitado: number;
  periodicidadSolicitada: PeriodicidadPago;
}

export interface FormularioCompleto {
  paso1: FormularioPaso1;
  paso2: FormularioPaso2;
  paso3: FormularioPaso3;
  paso4: FormularioPaso4;
  paso5: FormularioPaso5;
}

// ─── Alias de tipos inferidos de Zod (para compatibilidad con solicitud/page.tsx) ─
// Estos tipos reflejan los schemas Zod de @/lib/validations/solicitud
export type Paso1Data = FormularioPaso1;
export type Paso2Data = FormularioPaso2;
export type Paso4Data = FormularioPaso4;
export type Paso5Data = FormularioPaso5;

// ─── Respuesta API ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  mensaje?: string;
}

export interface SolicitudCreada {
  solicitudId: string;
  estado: EstadoSolicitud;
  mensaje: string;
}

// ─── Consulta Cliente ─────────────────────────────────────────────────────────

export interface DatosConsultaCliente {
  cliente: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  solicitud: {
    id: string;
    estado: EstadoSolicitud;
  };
  prestamo?: {
    id: string;
    montoAprobado: number;
    totalAPagar: number;
    metodoCobro: MetodoDesembolso;
    numeroCobro: string;
    proximaCuota?: CuotaDetalle;
    cuotas: CuotaDetalle[];
  };
}

export interface CuotaDetalle {
  id: string;
  numeroCuota: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  cuotaTotal: number;
  saldoRestante: number;
  mora: number;
  estado: EstadoCuota;
  fecha_pago_real?: string | null;
  diasRestantes?: number;
  vouchers?: VoucherDetalle[];
}

export interface VoucherDetalle {
  id: string;
  url: string;
  montoDeclarado: number;
  aprobado: boolean | null;
  createdAt: string;
}

// ─── Admin / Expediente ───────────────────────────────────────────────────────

export interface ExpedienteCompleto {
  solicitud: {
    id: string;
    estado: EstadoSolicitud;
    scoringRiesgo: ScoringRiesgo | null;
    notasEvaluacion: string | null;
    metodoDesembolso: MetodoDesembolso;
    numeroCuentaCelular: string;
    montoSolicitado: number;
    periodicidadSolicitada: PeriodicidadPago;
    createdAt: string;
  };
  cliente: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    celular: string;
    email: string | null;
    direccion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    fotoRostroUrl: string | null;
  };
  datosLaborales: {
    tipoOcupacion: TipoOcupacion;
    nombreEmpresaNegocio: string;
    ingresoMensualEstimado: number;
    antiguedadLaboral: AntiguedadLaboral;
    direccionLaboral: string;
  } | null;
  documentos: {
    id: string;
    tipo: TipoDocumentoKYC;
    url: string;
    mimeType: string;
    nombreArchivo: string;
  }[];
  referencias: {
    id: string;
    numero: number;
    nombreCompleto: string;
    parentesco: string;
    celular: string;
  }[];
  prestamo: {
    id: string;
    montoAprobado: number;
    frecuenciaPago: PeriodicidadPago;
    numeroCuotas: number;
    totalAPagar: number;
    cuotas: CuotaDetalle[];
  } | null;
}

// ─── Parámetros de aprobación con Tasa Libre ─────────────────────────────────

export interface ParametrosAprobacion {
  montoAprobado: number;
  tipoTasa: TipoTasa;
  valorInteres: number;
  modalidadPago: ModalidadPago;
  frecuenciaPago: PeriodicidadPago;
  numeroCuotas: number;
  fechaPrimerPago: string; // ISO string
  metodoCobro: MetodoDesembolso;
  numeroCobro: string;
}

// ─── Ubigeo ──────────────────────────────────────────────────────────────────

export interface Departamento {
  id: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface Distrito {
  id: string;
  nombre: string;
  provinciaId: string;
}
