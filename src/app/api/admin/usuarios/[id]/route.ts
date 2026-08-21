import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

// PATCH /api/admin/usuarios/[id] — Modificar estado, rol, nombre o contraseña
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
        { success: false, error: "Acceso denegado. Se requieren privilegios de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, activo, role, password } = body;

    // 1. Buscar usuario objetivo
    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const adminEnvEmail = (process.env.ADMIN_EMAIL || "admin@prestamos.pe").toLowerCase();
    const isMasterAccount = targetUser.email.toLowerCase() === adminEnvEmail || targetUser.role === "SUPER_ADMIN";

    // ─── 🛡️ PROTECCIÓN INVIOLABLE DEL SOFTWARE / SUPER_ADMIN ─────────────────
    if (isMasterAccount) {
      // Prohibir desactivar la cuenta del Super Admin
      if (activo === false) {
        return NextResponse.json(
          {
            success: false,
            error: "La cuenta de SUPER_ADMIN está protegida y no puede ser suspendida ni desactivada.",
          },
          { status: 403 }
        );
      }

      // Prohibir degradar de rol a la cuenta Super Admin
      if (role === "ADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: "La cuenta de SUPER_ADMIN no puede ser degradada a rol de Operador.",
          },
          { status: 403 }
        );
      }
    }

    // 2. Preparar datos a actualizar
    const updateData: {
      nombre?: string;
      activo?: boolean;
      role?: Role;
      password_hash?: string;
    } = {};

    if (nombre && typeof nombre === "string" && nombre.trim().length >= 3) {
      updateData.nombre = nombre.trim();
    }

    if (typeof activo === "boolean") {
      updateData.activo = activo;
    }

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      updateData.role = role as Role;
    }

    if (password && typeof password === "string" && password.length >= 6) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data: updateData,
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
      message: "Usuario actualizado exitosamente.",
      data: {
        ...updatedUser,
        role: (updatedUser.role as Role) || "ADMIN",
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /api/admin/usuarios/[id] PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar los datos del usuario." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/usuarios/[id] — Eliminar usuario operador (Solo SUPER_ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
        { success: false, error: "Acceso denegado. Se requieren privilegios de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 1. Buscar usuario objetivo
    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const adminEnvEmail = (process.env.ADMIN_EMAIL || "admin@prestamos.pe").toLowerCase();
    const isMasterAccount = targetUser.email.toLowerCase() === adminEnvEmail || targetUser.role === "SUPER_ADMIN";

    // ─── 🛡️ PROTECCIÓN INVIOLABLE: PROHIBIR ELIMINAR AL SUPER ADMIN ───────────
    if (isMasterAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Operación rechazada por seguridad: La cuenta de SUPER_ADMIN no puede ser eliminada.",
        },
        { status: 403 }
      );
    }

    // No permitir auto-eliminación
    if (targetUser.id === authUser.id) {
      return NextResponse.json(
        { success: false, error: "No puedes eliminar tu propia cuenta en sesión activa." },
        { status: 400 }
      );
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `El usuario ${targetUser.nombre} (${targetUser.email}) ha sido eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[API /api/admin/usuarios/[id] DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al eliminar el usuario." },
      { status: 500 }
    );
  }
}
