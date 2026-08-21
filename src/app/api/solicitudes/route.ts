import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { paso1Schema, paso2Schema, paso5Schema, serverFileSchema } from "@/lib/validations/solicitud";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos de documento KYC esperados en el FormData
const DOC_FIELDS = [
  "fotoRostro",
  "dniAnverso",
  "dniReverso",
  "reciboServicio",
  "selfieConDni",
  "sustentoLaboral",
] as const;

const DOC_KYC_MAP: Record<typeof DOC_FIELDS[number], string> = {
  fotoRostro: "FOTO_ROSTRO",
  dniAnverso: "DNI_ANVERSO",
  dniReverso: "DNI_REVERSO",
  reciboServicio: "RECIBO_SERVICIO",
  selfieConDni: "SELFIE_CON_DNI",
  sustentoLaboral: "SUSTENTO_LABORAL",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf"];

// Asegurar que el directorio de uploads existe
async function ensureUploadDir(dni: string): Promise<string> {
  const uploadBase = process.env.UPLOAD_DIR ?? "public/uploads";
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), uploadBase, dni);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Guardar un archivo en disco
async function saveFile(file: File, dir: string): Promise<{ relativePath: string; filename: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(/*turbopackIgnore: true*/ dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  // Retornar path relativo para servir desde /uploads
  const dniFolder = path.basename(dir);
  return {
    relativePath: `/uploads/${dniFolder}/${filename}`,
    filename: file.name,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parsear multipart/form-data
    const formData = await request.formData();

    // ─── Extraer y validar datos textuales ──────────────────────────────────

    const rawPaso1 = {
      dni: formData.get("dni"),
      nombres: formData.get("nombres"),
      apellidos: formData.get("apellidos"),
      celular: formData.get("celular"),
      email: formData.get("email") ?? undefined,
      fechaNacimiento: formData.get("fechaNacimiento") ?? undefined,
      direccion: formData.get("direccion"),
      departamento: formData.get("departamento"),
      provincia: formData.get("provincia"),
      distrito: formData.get("distrito"),
    };

    const paso1Result = paso1Schema.safeParse(rawPaso1);
    if (!paso1Result.success) {
      return NextResponse.json(
        { success: false, error: "Datos personales inválidos", detalles: paso1Result.error.flatten() },
        { status: 400 }
      );
    }

    const rawPaso2 = {
      tipoOcupacion: formData.get("tipoOcupacion"),
      nombreEmpresaNegocio: formData.get("nombreEmpresaNegocio"),
      ingresoMensualEstimado: parseFloat(String(formData.get("ingresoMensualEstimado"))),
      antiguedadLaboral: formData.get("antiguedadLaboral"),
      direccionLaboral: formData.get("direccionLaboral"),
    };

    const paso2Result = paso2Schema.safeParse(rawPaso2);
    if (!paso2Result.success) {
      return NextResponse.json(
        { success: false, error: "Datos laborales inválidos", detalles: paso2Result.error.flatten() },
        { status: 400 }
      );
    }

    const rawPaso5 = {
      montoSolicitado: parseFloat(String(formData.get("montoSolicitado"))),
      periodicidadSolicitada: formData.get("periodicidadSolicitada"),
    };

    const paso5Result = paso5Schema.safeParse(rawPaso5);
    if (!paso5Result.success) {
      return NextResponse.json(
        { success: false, error: "Datos financieros inválidos", detalles: paso5Result.error.flatten() },
        { status: 400 }
      );
    }

    const metodoDesembolso = String(formData.get("metodoDesembolso") || "EFECTIVO");
    let numeroCuentaCelular = String(formData.get("numeroCuentaCelular") || "");
    if (metodoDesembolso === "EFECTIVO" && (!numeroCuentaCelular || numeroCuentaCelular.trim() === "")) {
      numeroCuentaCelular = "EFECTIVO";
    }

    if (!metodoDesembolso || (metodoDesembolso !== "EFECTIVO" && !numeroCuentaCelular)) {
      return NextResponse.json(
        { success: false, error: "Datos de desembolso requeridos" },
        { status: 400 }
      );
    }

    // ─── Procesar archivos ────────────────────────────────────────────────────

    const { dni } = paso1Result.data;
    const uploadDir = await ensureUploadDir(dni);

    const archivosGuardados: {
      tipo: string;
      url: string;
      nombreArchivo: string;
      mimeType: string;
      tamanoBytes: number;
    }[] = [];

    const LABELS_DOCS: Record<string, string> = {
      fotoRostro: "Fotografía del rostro",
      dniAnverso: "Foto del DNI (Frente / Anverso)",
      dniReverso: "Foto del DNI (Dorso / Reverso)",
      reciboServicio: "Recibo de servicio (Luz o Agua)",
      selfieConDni: "Selfie sosteniendo su DNI",
      sustentoLaboral: "Sustento de ingresos o laboral",
    };

    const OBLIGATORIOS: readonly string[] = [
      "fotoRostro",
      "dniAnverso",
      "dniReverso",
      "reciboServicio",
      "selfieConDni",
    ];

    for (const campo of DOC_FIELDS) {
      const rawArchivo = formData.get(campo);
      const label = LABELS_DOCS[campo] ?? campo;

      // Verificar si el archivo fue adjuntado correctamente
      const esArchivoValido =
        rawArchivo &&
        typeof rawArchivo === "object" &&
        "size" in rawArchivo &&
        (rawArchivo as File).size > 0;

      if (!esArchivoValido) {
        if (OBLIGATORIOS.includes(campo)) {
          return NextResponse.json(
            { success: false, error: `Por favor adjunte: ${label}` },
            { status: 400 }
          );
        }
        continue;
      }

      const archivo = rawArchivo as File;

      // Validar MIME y tamaño con Zod
      const fileValidation = serverFileSchema.safeParse(archivo);

      if (!fileValidation.success) {
        const errorMsg =
          fileValidation.error.flatten().formErrors[0] ||
          Object.values(fileValidation.error.flatten().fieldErrors)[0]?.[0] ||
          fileValidation.error.issues[0]?.message ||
          `El archivo "${label}" no cumple con el formato permitido (JPG, PNG o PDF hasta 5 MB).`;

        return NextResponse.json(
          { success: false, error: `${label}: ${errorMsg}` },
          { status: 400 }
        );
      }

      const { relativePath, filename } = await saveFile(archivo, uploadDir);
      archivosGuardados.push({
        tipo: DOC_KYC_MAP[campo],
        url: relativePath,
        nombreArchivo: filename,
        mimeType: archivo.type || "application/octet-stream",
        tamanoBytes: archivo.size,
      });
    }

    // ─── Procesar referencias ─────────────────────────────────────────────────

    const referencias = [1, 2].map((num) => ({
      numero: num,
      nombreCompleto: String(formData.get(`referencia${num}_nombreCompleto`) ?? ""),
      parentesco: String(formData.get(`referencia${num}_parentesco`) ?? ""),
      celular: String(formData.get(`referencia${num}_celular`) ?? ""),
    }));

    // ─── Transacción en base de datos ─────────────────────────────────────────

    const fotoRostroDoc = archivosGuardados.find((a) => a.tipo === "FOTO_ROSTRO");

    const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Buscar o crear cliente
      let cliente = await tx.cliente.findUnique({ where: { dni } });

      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            dni,
            nombres: paso1Result.data.nombres,
            apellidos: paso1Result.data.apellidos,
            celular: paso1Result.data.celular,
            email: paso1Result.data.email ?? null,
            direccion: paso1Result.data.direccion,
            departamento: paso1Result.data.departamento,
            provincia: paso1Result.data.provincia,
            distrito: paso1Result.data.distrito,
            foto_rostro_url: fotoRostroDoc?.url ?? null,
          },
        });
      } else {
        // Actualizar foto de rostro si se envió una nueva
        if (fotoRostroDoc) {
          await tx.cliente.update({
            where: { id: cliente.id },
            data: { foto_rostro_url: fotoRostroDoc.url },
          });
        }
      }

      // Crear/actualizar datos laborales
      await tx.datosLaborales.upsert({
        where: { clienteId: cliente.id },
        create: {
          clienteId: cliente.id,
          tipo_ocupacion: paso2Result.data.tipoOcupacion as never,
          nombre_empresa_negocio: paso2Result.data.nombreEmpresaNegocio,
          ingreso_mensual_estimado: paso2Result.data.ingresoMensualEstimado,
          antiguedad_laboral: paso2Result.data.antiguedadLaboral as never,
          direccion_laboral: paso2Result.data.direccionLaboral,
        },
        update: {
          tipo_ocupacion: paso2Result.data.tipoOcupacion as never,
          nombre_empresa_negocio: paso2Result.data.nombreEmpresaNegocio,
          ingreso_mensual_estimado: paso2Result.data.ingresoMensualEstimado,
          antiguedad_laboral: paso2Result.data.antiguedadLaboral as never,
          direccion_laboral: paso2Result.data.direccionLaboral,
        },
      });

      // Crear solicitud
      const solicitud = await tx.solicitudPrestamo.create({
        data: {
          clienteId: cliente.id,
          metodo_desembolso: metodoDesembolso as never,
          numero_cuenta_celular: numeroCuentaCelular,
          monto_solicitado: paso5Result.data.montoSolicitado,
          periodicidad_solicitada: paso5Result.data.periodicidadSolicitada as never,
          estado: "PENDIENTE",
        },
      });

      // Guardar documentos KYC
      if (archivosGuardados.length > 0) {
        await tx.documentoKYC.createMany({
          data: archivosGuardados.map((a) => ({
            clienteId: cliente!.id,
            solicitudId: solicitud.id,
            tipo: a.tipo as never,
            url: a.url,
            nombre_archivo: a.nombreArchivo,
            mime_type: a.mimeType,
            tamano_bytes: a.tamanoBytes,
          })),
        });
      }

      // Crear referencias
      for (const ref of referencias) {
        if (ref.nombreCompleto && ref.celular) {
          await tx.referencia.create({
            data: {
              clienteId: cliente!.id,
              numero: ref.numero,
              nombre_completo: ref.nombreCompleto,
              parentesco: ref.parentesco,
              celular: ref.celular,
            },
          });
        }
      }

      return { solicitudId: solicitud.id, clienteId: cliente.id };
    });

    return NextResponse.json({
      success: true,
      data: {
        solicitudId: resultado.solicitudId,
        estado: "PENDIENTE",
        mensaje: "Solicitud recibida exitosamente. Será evaluada pronto.",
      },
    });
  } catch (error) {
    console.error("[API /solicitudes] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor. Intenta nuevamente." },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}
