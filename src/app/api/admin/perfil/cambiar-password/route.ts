import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// POST /api/admin/perfil/cambiar-password — Cambiar contraseña del usuario autenticado
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthSession(request);

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Sesión no válida." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 1. Validaciones de presencia
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Todos los campos de contraseña son obligatorios." },
        { status: 400 }
      );
    }

    // 2. Validación de longitud
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // 3. Validación de coincidencia
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "La confirmación de la contraseña no coincide." },
        { status: 400 }
      );
    }

    // 4. Buscar usuario autenticado en BD
    let admin = null;
    if (authUser.id !== "env_admin") {
      admin = await prisma.adminUser.findUnique({
        where: { id: authUser.id },
      });
    }

    if (!admin && authUser.email) {
      admin = await prisma.adminUser.findUnique({
        where: { email: authUser.email.toLowerCase() },
      });
    }

    const adminEnvPassword = process.env.ADMIN_PASSWORD || "Admin123!";

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado en la base de datos." },
        { status: 404 }
      );
    }

    // 5. Verificar contraseña actual
    let isPasswordCorrect = false;

    if (admin.password_hash.startsWith("$2a$") || admin.password_hash.startsWith("$2b$")) {
      isPasswordCorrect = await bcrypt.compare(currentPassword, admin.password_hash);
    } else {
      isPasswordCorrect =
        admin.password_hash === currentPassword || currentPassword === adminEnvPassword;
    }

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, error: "La contraseña actual ingresada es incorrecta." },
        { status: 400 }
      );
    }

    // 6. Hashear la nueva contraseña
    const saltRounds = 10;
    const newPasswordHashed = await bcrypt.hash(newPassword, saltRounds);

    // 7. Guardar en base de datos
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password_hash: newPasswordHashed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "¡Contraseña actualizada exitosamente!",
    });
  } catch (error) {
    console.error("[API /admin/perfil/cambiar-password] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al procesar el cambio de contraseña." },
      { status: 500 }
    );
  }
}
