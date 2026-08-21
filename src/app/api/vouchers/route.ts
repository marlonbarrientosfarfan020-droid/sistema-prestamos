import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf"];

// POST /api/vouchers — Subida de comprobante de pago por el cliente
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const cuotaId = String(formData.get("cuotaId") ?? "");
    const montoDeclaradoStr = String(formData.get("montoDeclarado") ?? "");
    const voucherFile = formData.get("voucher");

    // Validaciones básicas
    if (!cuotaId) {
      return NextResponse.json({ success: false, error: "ID de cuota requerido" }, { status: 400 });
    }

    const montoDeclarado = parseFloat(montoDeclaradoStr);
    if (isNaN(montoDeclarado) || montoDeclarado <= 0) {
      return NextResponse.json({ success: false, error: "Monto declarado inválido" }, { status: 400 });
    }

    if (!voucherFile || !(voucherFile instanceof File)) {
      return NextResponse.json({ success: false, error: "Archivo de voucher requerido" }, { status: 400 });
    }

    // Validar MIME y tamaño
    if (!ALLOWED_MIMES.includes(voucherFile.type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de archivo no permitido. Use JPG, PNG o PDF." },
        { status: 400 }
      );
    }

    if (voucherFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "El archivo supera el límite de 5 MB" },
        { status: 400 }
      );
    }

    // Verificar que la cuota existe y está pendiente
    const cuota = await prisma.cronogramaCuota.findUnique({
      where: { id: cuotaId },
      include: { prestamo: { include: { solicitud: { include: { cliente: true } } } } },
    });

    if (!cuota) {
      return NextResponse.json({ success: false, error: "Cuota no encontrada" }, { status: 404 });
    }

    if (cuota.estado === "PAGADO") {
      return NextResponse.json({ success: false, error: "Esta cuota ya está marcada como pagada" }, { status: 409 });
    }

    // Guardar archivo
    const dni = cuota.prestamo.solicitud.cliente.dni;
    const uploadBase = process.env.UPLOAD_DIR ?? "public/uploads";
    const dir = path.join(process.cwd(), uploadBase, dni, "vouchers");
    await fs.mkdir(dir, { recursive: true });

    const ext = voucherFile.name.split(".").pop() ?? "bin";
    const filename = `voucher_${cuotaId}_${uuidv4()}.${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await voucherFile.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    const relativePath = `/uploads/${dni}/vouchers/${filename}`;

    // Guardar en base de datos
    const voucher = await prisma.voucherPago.create({
      data: {
        cuotaId,
        url: relativePath,
        nombre_archivo: voucherFile.name,
        mime_type: voucherFile.type,
        tamano_bytes: voucherFile.size,
        monto_declarado: montoDeclarado,
        aprobado: null, // Pendiente de revisión por el admin
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        voucherId: voucher.id,
        mensaje: "Comprobante enviado exitosamente. Será revisado en breve.",
      },
    });
  } catch (error) {
    console.error("[API /vouchers] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
