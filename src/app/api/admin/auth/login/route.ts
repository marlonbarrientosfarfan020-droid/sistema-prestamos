import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import bcrypt from "bcryptjs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Por favor complete todos los campos obligatorios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminEnvEmail = (process.env.ADMIN_EMAIL || "admin@prestamos.pe").toLowerCase();
    const adminEnvPassword = process.env.ADMIN_PASSWORD || "CambiarEstaClaveSegura123!";

    // Validación contra variables de entorno o contra base de datos
    let isValid = false;
    let userName = "Administrador";

    try {
      const adminUser = await prisma.adminUser.findUnique({
        where: { email: cleanEmail },
      });

      if (adminUser && adminUser.activo) {
        if (adminUser.password_hash.startsWith("$2a$") || adminUser.password_hash.startsWith("$2b$")) {
          isValid = await bcrypt.compare(password, adminUser.password_hash);
        } else {
          isValid = adminUser.password_hash === password || password === adminEnvPassword;
        }
        if (isValid) {
          userName = adminUser.nombre;
        }
      } else if (cleanEmail === adminEnvEmail && password === adminEnvPassword) {
        isValid = true;
      }
    } catch (dbErr) {
      console.warn("[Auth API] DB lookup skipped or failed:", dbErr);
      if (cleanEmail === adminEnvEmail && password === adminEnvPassword) {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciales incorrectas. Verifique su correo electrónico y contraseña.",
        },
        { status: 401 }
      );
    }

    // Configurar respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: "Autenticación exitosa. Redirigiendo...",
      user: {
        email: cleanEmail,
        nombre: userName,
      },
    });

    // Establecer cookie básica de sesión administrativa
    response.cookies.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8, // 30 días o 8 horas
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[API /admin/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error inesperado en el servidor." },
      { status: 500 }
    );
  }
}
