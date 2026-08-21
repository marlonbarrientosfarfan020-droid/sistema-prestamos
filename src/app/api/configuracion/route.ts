import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/configuracion — Obtiene la configuración financiera activa (Público)
export async function GET(): Promise<NextResponse> {
  try {
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
    console.error("[API /api/configuracion] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener la configuración financiera.",
        data: {
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
      },
      { status: 500 }
    );
  }
}
