import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/admin/perfil — Obtener información del perfil del usuario autenticado
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthSession(request);

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión no válida." },
        { status: 401 }
      );
    }

    // Si es env_admin fallback
    if (authUser.id === "env_admin") {
      return NextResponse.json({
        success: true,
        data: {
          id: authUser.id,
          nombre: authUser.nombre,
          email: authUser.email,
          role: authUser.role,
          activo: true,
        },
      });
    }

    // Consultar datos actualizados directamente del usuario en BD
    const user = await prisma.adminUser.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        activo: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado en la base de datos." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: (user.role as Role) || "ADMIN",
        activo: user.activo,
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /api/admin/perfil GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al obtener los datos del perfil." },
      { status: 500 }
    );
  }
}

// Handler común para actualizar perfil (aplica tanto para PUT como para PATCH)
async function updateProfileHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validación de Sesión y Autenticación
    const authUser = await getAuthSession(request);

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión no válida." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nombre, email } = body;

    // 2. Validación de campos requeridos
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "El nombre completo debe tener al menos 3 caracteres." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { success: false, error: "Ingrese un correo electrónico válido." },
        { status: 400 }
      );
    }

    // 3. Sanitización
    const cleanNombre = nombre.trim();
    const cleanEmail = email.toLowerCase().trim();

    // 4. Validación de Unicidad de Correo
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.id !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico ya está en uso por otra cuenta." },
        { status: 400 }
      );
    }

    // 5. Actualización Segura por ID de Sesión
    let updatedUser;

    if (authUser.id === "env_admin") {
      // Si operaba con env_admin, upsert en BD
      const defaultPassword = process.env.ADMIN_PASSWORD || "Admin123!";
      updatedUser = await prisma.adminUser.upsert({
        where: { email: cleanEmail },
        update: {
          nombre: cleanNombre,
          email: cleanEmail,
        },
        create: {
          nombre: cleanNombre,
          email: cleanEmail,
          password_hash: defaultPassword,
          role: "SUPER_ADMIN",
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          role: true,
          activo: true,
        },
      });
    } else {
      updatedUser = await prisma.adminUser.update({
        where: { id: authUser.id },
        data: {
          nombre: cleanNombre,
          email: cleanEmail,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          role: true,
          activo: true,
        },
      });
    }

    // 6. Generar respuesta con sesión actualizada
    const response = NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente.",
      user: updatedUser,
      data: updatedUser,
    });

    // Refrescar cookie de sesión con el nuevo nombre y correo
    response.cookies.set(
      "admin_session",
      JSON.stringify({
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        role: updatedUser.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("[API /api/admin/perfil UPDATE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar el perfil." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/perfil — Actualizar perfil
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return updateProfileHandler(request);
}

// PATCH /api/admin/perfil — Actualizar perfil
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return updateProfileHandler(request);
}
