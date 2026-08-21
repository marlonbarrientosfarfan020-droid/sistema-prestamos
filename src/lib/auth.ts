import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export interface AuthSessionUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  activo: boolean;
}

/**
 * Obtiene el usuario autenticado actual a partir de la cookie de sesión
 * y verifica en la base de datos que la cuenta siga activa.
 */
export async function getAuthSession(request?: NextRequest): Promise<AuthSessionUser | null> {
  try {
    let sessionCookieValue: string | undefined;

    if (request) {
      sessionCookieValue = request.cookies.get("admin_session")?.value;
    } else {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get("admin_session")?.value;
    }

    if (!sessionCookieValue) {
      return null;
    }

    let userId: string | undefined;
    let userEmail: string | undefined;

    try {
      if (sessionCookieValue.startsWith("{")) {
        const parsed = JSON.parse(sessionCookieValue);
        userId = parsed.id;
        userEmail = parsed.email;
      }
    } catch {
      // Formato simple legacy fallback
    }

    let dbUser = null;

    // 1. Buscar por ID de usuario si está disponible y no es env_admin
    if (userId && userId !== "env_admin") {
      dbUser = await prisma.adminUser.findUnique({
        where: { id: userId },
      });
    }

    // 2. Si no se encontró por ID, buscar por correo electrónico
    if (!dbUser && userEmail) {
      dbUser = await prisma.adminUser.findUnique({
        where: { email: userEmail.toLowerCase() },
      });
    }

    const adminEnvEmail = (process.env.ADMIN_EMAIL || "admin@prestamos.pe").toLowerCase();

    if (!dbUser) {
      // Fallback si coincide con ENV
      if (userEmail === adminEnvEmail || (!userEmail && !userId)) {
        return {
          id: "env_admin",
          email: adminEnvEmail,
          nombre: "Administrador Principal",
          role: "SUPER_ADMIN",
          activo: true,
        };
      }
      return null;
    }

    // 🚨 REGLA CRÍTICA DE SEGURIDAD: Si la cuenta fue suspendida (activo = false), denegar acceso inmediatamente
    if (!dbUser.activo) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      nombre: dbUser.nombre,
      role: (dbUser.role as Role) || "ADMIN",
      activo: dbUser.activo,
    };
  } catch (error) {
    console.error("[getAuthSession Error]:", error);
    return null;
  }
}

/**
 * Guardia de autenticación general (SUPER_ADMIN o ADMIN)
 */
export async function requireAuth(request?: NextRequest): Promise<AuthSessionUser> {
  const user = await getAuthSession(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Guardia estricta de SUPER_ADMIN (Requerida para gestión de cuentas y control de software)
 */
export async function requireSuperAdmin(request?: NextRequest): Promise<AuthSessionUser> {
  const user = await requireAuth(request);
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN_NOT_SUPER_ADMIN");
  }
  return user;
}
