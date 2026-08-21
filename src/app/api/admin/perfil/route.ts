import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/perfil — Obtener información del perfil administrativo
export async function GET(): Promise<NextResponse> {
  try {
    const adminEnvEmail = (process.env.ADMIN_EMAIL || "admin@prestamos.pe").toLowerCase();

    // Buscar admin en la base de datos
    let admin = await prisma.adminUser.findFirst({
      where: { activo: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        updatedAt: true,
      },
    });

    // Si no existe ningún admin en la base de datos, crear el inicial basado en env
    if (!admin) {
      const defaultPassword = process.env.ADMIN_PASSWORD || "Admin123!";
      admin = await prisma.adminUser.create({
        data: {
          email: adminEnvEmail,
          password_hash: defaultPassword,
          nombre: "Administrador General",
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("[API /admin/perfil GET] Error:", error);
    // En caso de error en base de datos, retornar datos seguros por defecto
    return NextResponse.json({
      success: true,
      data: {
        nombre: "Administrador General",
        email: process.env.ADMIN_EMAIL || "admin@prestamos.pe",
        updatedAt: new Date().toISOString(),
      },
    });
  }
}

// PATCH /api/admin/perfil — Actualizar nombre y correo del perfil
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { nombre, email } = body;

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

    const cleanNombre = nombre.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Buscar si ya existe el admin
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { activo: true },
      orderBy: { createdAt: "asc" },
    });

    let updatedAdmin;

    if (existingAdmin) {
      // Verificar si el nuevo email ya está en uso por otro admin
      const emailInUse = await prisma.adminUser.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: existingAdmin.id },
        },
      });

      if (emailInUse) {
        return NextResponse.json(
          { success: false, error: "El correo electrónico ya está registrado por otro usuario." },
          { status: 400 }
        );
      }

      updatedAdmin = await prisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: {
          nombre: cleanNombre,
          email: cleanEmail,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          updatedAt: true,
        },
      });
    } else {
      const defaultPassword = process.env.ADMIN_PASSWORD || "Admin123!";
      updatedAdmin = await prisma.adminUser.create({
        data: {
          nombre: cleanNombre,
          email: cleanEmail,
          password_hash: defaultPassword,
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Datos del perfil administrativo actualizados exitosamente.",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("[API /admin/perfil PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al guardar los cambios en la base de datos." },
      { status: 500 }
    );
  }
}
