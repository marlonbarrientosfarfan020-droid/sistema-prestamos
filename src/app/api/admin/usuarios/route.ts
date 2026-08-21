import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/admin/usuarios — Lista de usuarios administradores y operadores (Solo SUPER_ADMIN)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthSession(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado. Se requieren privilegios de SUPER_ADMIN para gestionar usuarios.",
        },
        { status: 403 }
      );
    }

    const users = await prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        role: (u.role as Role) || "ADMIN",
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API /api/admin/usuarios GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la lista de usuarios." },
      { status: 500 }
    );
  }
}

// POST /api/admin/usuarios — Crear nuevo usuario operador o administrador (Solo SUPER_ADMIN)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthSession(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión requerida." },
        { status: 401 }
      );
    }

    if (authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado. Solo un SUPER_ADMIN puede crear nuevos accesos.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, email, password, role = "ADMIN" } = body;

    // 1. Validaciones
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

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre.trim();
    const targetRole: Role = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

    // 2. Verificar si el correo ya está registrado
    const existing = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ya existe un usuario registrado con este correo electrónico." },
        { status: 409 }
      );
    }

    // 3. Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Crear en base de datos
    const newUser = await prisma.adminUser.create({
      data: {
        nombre: cleanNombre,
        email: cleanEmail,
        password_hash: passwordHash,
        role: targetRole,
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡Usuario ${cleanNombre} creado exitosamente con rol ${targetRole}!`,
      data: {
        ...newUser,
        role: (newUser.role as Role) || "ADMIN",
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /api/admin/usuarios POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el nuevo usuario en el sistema." },
      { status: 500 }
    );
  }
}
