import { z } from 'zod';

// ─── Constantes ─────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;

// ─── Helpers de validación ──────────────────────────────────────────────────
export const dniSchema = z
  .string()
  .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos');

export const celularPeruanoSchema = z
  .string()
  .regex(/^9\d{8}$/, 'El celular debe tener 9 dígitos y comenzar con 9');

export const montoSchema = z
  .number({ message: 'Ingrese un monto válido' })
  .positive('El monto debe ser mayor a 0')
  .max(500000, 'El monto máximo permitido es S/ 500,000');

// ─── Paso 1: Identificación y Datos Personales ──────────────────────────────
export const paso1Schema = z.object({
  dni: dniSchema,
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(100, 'Los nombres no pueden superar 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Los nombres solo pueden contener letras'),
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(100, 'Los apellidos no pueden superar 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Los apellidos solo pueden contener letras'),
  celular: celularPeruanoSchema,
  email: z.string().email('Ingrese un correo electrónico válido').optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  departamento: z.string().min(2, 'Seleccione un departamento'),
  provincia: z.string().min(2, 'Seleccione una provincia'),
  distrito: z.string().min(2, 'Seleccione un distrito'),
  direccion: z.string().min(5, 'Ingrese una dirección válida'),
});

export type Paso1Data = z.infer<typeof paso1Schema>;

// ─── Paso 2: Información Laboral e Ingresos ──────────────────────────────
export const paso2Schema = z.object({
  tipoOcupacion: z.enum(['PLANILLA', 'NEGOCIO_PROPIO', 'HONORARIOS', 'INFORMAL'], {
    message: 'Seleccione un tipo de ocupación',
  }),
  nombreEmpresaNegocio: z.string().min(2, 'Ingrese el nombre de la empresa o negocio'),
  ingresoMensualEstimado: montoSchema,
  antiguedadLaboral: z.enum(
    ['MENOS_3_MESES', 'TRES_A_SEIS_MESES', 'SEIS_A_UN_ANIO', 'UNO_A_TRES_ANIOS', 'MAS_TRES_ANIOS'],
    { message: 'Seleccione su antigüedad laboral' }
  ),
  direccionLaboral: z
    .string()
    .min(10, 'Ingrese la dirección de su trabajo o negocio')
    .max(300, 'La dirección no puede superar 300 caracteres'),
});

export type Paso2Data = z.infer<typeof paso2Schema>;

// ─── Paso 3: Documentos KYC (Compatible SSR/Client) ─────────────────────────
export const archivoKYCSchema = z
  .custom<any>((file) => file !== undefined && file !== null, 'Debe adjuntar un archivo')
  .refine((file: any) => !file?.size || file.size <= MAX_FILE_SIZE, {
    message: 'El archivo supera el límite de 5 MB',
  })
  .refine(
    (file: any) => !file?.type || (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type),
    {
      message: 'Solo se permiten imágenes JPG, PNG o documentos PDF',
    }
  );

export const archivoKYCOpcionalSchema = z
  .custom<any>()
  .optional()
  .refine((file: any) => !file || !file?.size || file.size <= MAX_FILE_SIZE, {
    message: 'El archivo supera el límite de 5 MB',
  })
  .refine(
    (file: any) => !file || !file?.type || (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type),
    {
      message: 'Solo se permiten imágenes JPG, PNG o documentos PDF',
    }
  );

export const paso3Schema = z.object({
  fotoRostro: archivoKYCSchema,
  dniAnverso: archivoKYCSchema,
  dniReverso: archivoKYCSchema,
  reciboServicio: archivoKYCSchema,
  selfieConDni: archivoKYCSchema,
  sustentoLaboral: archivoKYCOpcionalSchema,
});

export type Paso3Data = z.infer<typeof paso3Schema>;

// ─── Subschema reutilizable: Referencia personal ─────────────────────────────
const referenciaSchema = z.object({
  nombreCompleto: z
    .string()
    .min(3, 'Ingrese el nombre completo de la referencia')
    .max(120, 'El nombre no puede superar 120 caracteres'),
  parentesco: z.string().min(1, 'Seleccione el parentesco'),
  celular: celularPeruanoSchema,
});

// ─── Paso 4: Desembolso y Referencias Personales ─────────────────────────────
export const paso4Schema = z
  .object({
    metodoDesembolso: z.enum(
      ['EFECTIVO', 'YAPE', 'PLIN', 'BCP', 'BBVA', 'INTERBANK', 'BANCO_NACION', 'OTRO_CCI'],
      { message: 'Seleccione un método de desembolso' }
    ),
    numeroCuentaCelular: z.string(),
    referencia1: referenciaSchema,
    referencia2: referenciaSchema,
  })
  .superRefine((data, ctx) => {
    if (data.metodoDesembolso !== 'EFECTIVO') {
      if (!data.numeroCuentaCelular || data.numeroCuentaCelular.trim().length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['numeroCuentaCelular'],
          message: 'Ingrese el número de cuenta, CCI o celular (mínimo 6 caracteres)',
        });
      }
    }
  });

export type Paso4Data = z.infer<typeof paso4Schema>;

// ─── Consulta por DNI (uso en /api/consulta) ─────────────────────────────────
export const consultaDNISchema = z.object({
  dni: dniSchema,
});

export type ConsultaDNIData = z.infer<typeof consultaDNISchema>;

// ─── Paso 5: Simulación y Condiciones Financieras ────────────────────────────
export const paso5Schema = z.object({
  montoSolicitado: montoSchema,
  periodicidadSolicitada: z.enum(
    ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'PAGO_UNICO'],
    { message: 'Seleccione la frecuencia de pago' }
  ),
});

export type Paso5Data = z.infer<typeof paso5Schema>;

// ─── Server-side: validación de archivo File/Blob en FormData ────────────────
// Usado en /api/solicitudes/route.ts para verificar archivos recibidos
export const serverFileSchema = z
  .custom<File>(
    (val) => val instanceof File || (typeof val === "object" && val !== null && "size" in val && "name" in val),
    { message: "Debe ser un archivo válido" }
  )
  .refine((file) => file.size > 0, "El archivo no puede estar vacío")
  .refine((file) => file.size <= 5 * 1024 * 1024, "El archivo no debe superar 5 MB")
  .refine(
    (file) => ["image/jpeg", "image/png", "application/pdf"].includes(file.type || ""),
    "Solo se permiten imágenes JPG, PNG o documentos PDF"
  );

export type ServerFileData = z.infer<typeof serverFileSchema>;

// ─── Aprobación de solicitud (admin) ─────────────────────────────────────────
// Usado en SimuladorTasaLibre.tsx y /api/admin/solicitudes/[id]/aprobar
export const aprobacionSchema = z.object({
  montoAprobado: z
    .number({ message: 'Ingrese el monto aprobado' })
    .positive('El monto debe ser mayor a 0')
    .max(500000, 'El monto máximo es S/ 500,000'),
  tipoTasa: z.enum(
    ['PORCENTAJE_MENSUAL', 'PORCENTAJE_TOTAL', 'MONTO_FIJO_GANANCIA'],
    { message: 'Seleccione el tipo de tasa' }
  ),
  valorInteres: z
    .number({ message: 'Ingrese el valor de la tasa o ganancia' })
    .positive('El valor debe ser mayor a 0'),
  modalidadPago: z.enum(
    ['CUOTA_FIJA_AMORTIZABLE', 'SOLO_INTERES_CAPITAL_FINAL'],
    { message: 'Seleccione la modalidad de pago' }
  ),
  frecuenciaPago: z.enum(
    ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'PAGO_UNICO'],
    { message: 'Seleccione la frecuencia de cobro' }
  ),
  numeroCuotas: z
    .number({ message: 'Ingrese el número de cuotas' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 cuota')
    .max(360, 'Máximo 360 cuotas'),
  fechaPrimerPago: z
    .string()
    .min(1, 'Ingrese la fecha del primer pago')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  metodoCobro: z.enum(
    ['EFECTIVO', 'YAPE', 'PLIN', 'BCP', 'BBVA', 'INTERBANK', 'BANCO_NACION', 'OTRO_CCI'],
    { message: 'Seleccione el método de cobro' }
  ),
  numeroCobro: z.string(),
});

export type AprobacionData = z.infer<typeof aprobacionSchema>;