import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const configuracionSchema = z
  .object({
    tasaDiaria: z.number({ message: "Ingrese una tasa diaria válida" }).min(0, "La tasa diaria no puede ser negativa"),
    tasaSemanal: z.number({ message: "Ingrese una tasa semanal válida" }).min(0, "La tasa semanal no puede ser negativa"),
    tasaQuincenal: z.number({ message: "Ingrese una tasa quincenal válida" }).min(0, "La tasa quincenal no puede ser negativa"),
    tasaMensual: z.number({ message: "Ingrese una tasa mensual válida" }).min(0, "La tasa mensual no puede ser negativa"),
    tasaTrimestral: z.number({ message: "Ingrese una tasa trimestral válida" }).min(0, "La tasa trimestral no puede ser negativa").default(15.0),
    tasaSemestral: z.number({ message: "Ingrese una tasa semestral válida" }).min(0, "La tasa semestral no puede ser negativa").default(25.0),
    cuotasDefaultDiario: z.number().int().min(1, "Debe ser al menos 1 cuota"),
    cuotasDefaultSemanal: z.number().int().min(1, "Debe ser al menos 1 cuota"),
    cuotasDefaultQuincenal: z.number().int().min(1, "Debe ser al menos 1 cuota"),
    cuotasDefaultMensual: z.number().int().min(1, "Debe ser al menos 1 cuota"),
    cuotasDefaultTrimestral: z.number().int().min(1, "Debe ser al menos 1 cuota").default(1),
    cuotasDefaultSemestral: z.number().int().min(1, "Debe ser al menos 1 cuota").default(1),
    montoMinimo: z.number().positive("El monto mínimo debe ser mayor a 0"),
    montoMaximo: z.number().positive("El monto máximo debe ser mayor a 0"),
    tasaMoraDiaria: z.number().min(0, "La mora diaria no puede ser negativa"),
    whatsappNumero: z.string().optional().nullable(),
    whatsappMensaje: z.string().optional().nullable(),
  })
  .refine((data) => data.montoMaximo >= data.montoMinimo, {
    message: "El monto máximo debe ser mayor o igual al monto mínimo",
    path: ["montoMaximo"],
  });

// GET /api/admin/configuracion — Obtiene la configuración financiera actual
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    const config = await prisma.configuracionFinanciera.upsert({
      where: { id: "default_config" },
      update: {},
      create: {
        id: "default_config",
        tasaDiaria: 20.0,
        tasaSemanal: 20.0,
        tasaQuincenal: 15.0,
        tasaMensual: 10.0,
        tasaTrimestral: 15.0,
        tasaSemestral: 25.0,
        cuotasDefaultDiario: 24,
        cuotasDefaultSemanal: 4,
        cuotasDefaultQuincenal: 2,
        cuotasDefaultMensual: 1,
        cuotasDefaultTrimestral: 1,
        cuotasDefaultSemestral: 1,
        montoMinimo: 50.0,
        montoMaximo: 10000.0,
        tasaMoraDiaria: 1.5,
        whatsappNumero: "51987654321",
        whatsappMensaje: "Hola, deseo solicitar información sobre los préstamos.",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        whatsappNumero: config.whatsappNumero || "51987654321",
        whatsappMensaje: config.whatsappMensaje || "Hola, deseo solicitar información sobre los préstamos.",
      },
    });
  } catch (error) {
    console.error("[API /api/admin/configuracion GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la configuración financiera." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/configuracion — Actualiza las tasas y parámetros financieros
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = configuracionSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg =
        validation.error.flatten().formErrors[0] ||
        Object.values(validation.error.flatten().fieldErrors)[0]?.[0] ||
        "Datos de configuración inválidos.";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const data = validation.data;

    const updatedConfig = await prisma.configuracionFinanciera.upsert({
      where: { id: "default_config" },
      update: data,
      create: { id: "default_config", ...data },
    });

    return NextResponse.json({
      success: true,
      message: "¡Parámetros financieros y tasas actualizados exitosamente!",
      data: updatedConfig,
    });
  } catch (error) {
    console.error("[API /api/admin/configuracion PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al guardar la configuración en la base de datos." },
      { status: 500 }
    );
  }
}
