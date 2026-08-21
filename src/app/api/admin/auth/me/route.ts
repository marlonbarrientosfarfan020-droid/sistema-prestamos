import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/auth/me — Obtiene la sesión actual del usuario autenticado
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthSession(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado o cuenta inactiva." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
        activo: user.activo,
      },
    });
  } catch (error) {
    console.error("[API /api/admin/auth/me] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al recuperar la sesión." },
      { status: 500 }
    );
  }
}
