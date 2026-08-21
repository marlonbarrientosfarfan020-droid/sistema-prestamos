import { NextResponse } from "next/server";

// POST /api/admin/auth/logout — Cierra la sesión administrativa
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada exitosamente.",
  });

  // Eliminar la cookie de sesión admin
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
