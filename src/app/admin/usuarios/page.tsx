"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Mail,
  User,
  Key,
} from "lucide-react";
import type { AdminUserItem, Role } from "@/types";

export default function GestionUsuariosPage() {
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estados de lista de usuarios
  const [usuarios, setUsuarios] = useState<AdminUserItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"TODOS" | "SUPER_ADMIN" | "ADMIN">("TODOS");

  // Alertas globales
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Estados de Modales
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Formulario Crear Usuario
  const [createNombre, setCreateNombre] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<Role>("ADMIN");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Formulario Editar / Resetear Clave
  const [editNombre, setEditNombre] = useState("");
  const [editRole, setEditRole] = useState<Role>("ADMIN");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Estado de acción rápida (switch)
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Cargar sesión y verificar rol
  const fetchSessionAndUsers = useCallback(async () => {
    try {
      setAuthLoading(true);
      const resMe = await fetch("/api/admin/auth/me");
      const jsonMe = await resMe.json();

      if (jsonMe.success && jsonMe.data) {
        setCurrentUserRole(jsonMe.data.role);
        setCurrentUserId(jsonMe.data.id);

        if (jsonMe.data.role === "SUPER_ADMIN") {
          // Cargar lista de usuarios
          setLoadingList(true);
          const resUsers = await fetch("/api/admin/usuarios");
          const jsonUsers = await resUsers.json();
          if (jsonUsers.success && jsonUsers.data) {
            setUsuarios(jsonUsers.data);
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setAuthLoading(false);
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionAndUsers();
  }, [fetchSessionAndUsers]);

  // Recargar únicamente la lista de usuarios
  const reloadUsers = async () => {
    try {
      const resUsers = await fetch("/api/admin/usuarios");
      const jsonUsers = await resUsers.json();
      if (jsonUsers.success && jsonUsers.data) {
        setUsuarios(jsonUsers.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── SWITCH RÁPIDO DE SUSPENSIÓN / ACTIVACIÓN ──────────────────────────────
  const handleToggleStatus = async (user: AdminUserItem) => {
    if (user.role === "SUPER_ADMIN") return;

    setToggleLoadingId(user.id);
    const nuevoEstado = !user.activo;

    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el estado del usuario.");
      }

      showFeedback(
        "success",
        nuevoEstado
          ? `La cuenta de ${user.nombre} ha sido ACTIVADA.`
          : `La cuenta de ${user.nombre} ha sido SUSPENDIDA inmediatamente.`
      );
      await reloadUsers();
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Error al cambiar estado.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  // ─── SUBMIT CREAR USUARIO ──────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createNombre.trim() || createNombre.length < 3) {
      setCreateError("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    if (!createEmail.trim() || !createEmail.includes("@")) {
      setCreateError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!createPassword || createPassword.length < 6) {
      setCreateError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCreateLoading(true);

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: createNombre.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear el usuario.");
      }

      showFeedback("success", data.message || "Usuario creado exitosamente.");
      setModalCreateOpen(false);
      setCreateNombre("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("ADMIN");
      await reloadUsers();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error inesperado al crear usuario.");
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── SUBMIT EDITAR USUARIO ─────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);

    if (!editNombre.trim() || editNombre.length < 3) {
      setEditError("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    if (editNewPassword && editNewPassword.length < 6) {
      setEditError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEditLoading(true);

    try {
      const payload: { nombre: string; role?: Role; password?: string } = {
        nombre: editNombre.trim(),
      };

      if (selectedUser.role !== "SUPER_ADMIN") {
        payload.role = editRole;
      }

      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar el usuario.");
      }

      showFeedback("success", "Datos del usuario actualizados correctamente.");
      setModalEditOpen(false);
      setSelectedUser(null);
      await reloadUsers();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar usuario.");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── ELIMINAR USUARIO ──────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo eliminar el usuario.");
      }

      showFeedback("success", data.message || "Usuario eliminado con éxito.");
      setModalDeleteOpen(false);
      setSelectedUser(null);
      await reloadUsers();
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Error al eliminar usuario.");
      setModalDeleteOpen(false);
    }
  };

  // ─── VISTA SI NO ES SUPER_ADMIN ────────────────────────────────────────────
  if (!authLoading && currentUserRole !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-600/10 mb-5">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
          Acceso Restringido • Solo SUPER_ADMIN
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          El módulo de <strong>Gestión de Cuentas, Operadores y Asignación de Roles</strong> está protegido y reservado exclusivamente para la cuenta de Control del Software.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>
    );
  }

  // Filtrado de usuarios
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "TODOS" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalSuperAdmins = usuarios.filter((u) => u.role === "SUPER_ADMIN").length;
  const totalOperadores = usuarios.filter((u) => u.role === "ADMIN").length;
  const totalActivos = usuarios.filter((u) => u.activo).length;
  const totalSuspendidos = usuarios.filter((u) => !u.activo).length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* ─── ENCABEZADO DE SECCIÓN ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Control de Seguridad & RBAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
            Gestión de Cuentas y Operadores
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Control de accesos del sistema. Crea nuevos operadores, asigna roles y gestiona el switch de suspensión en tiempo real.
          </p>
        </div>

        {/* Botón Crear Usuario */}
        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setModalCreateOpen(true);
          }}
          className="self-start sm:self-center px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-purple-600/20 hover:shadow-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          id="btn-crear-nuevo-usuario"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* ─── FEEDBACK TOAST ─── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
          role="alert"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* ─── KPIS DE USUARIOS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cuentas Totales</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
            {usuarios.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registradas en el software</p>
        </div>

        <div className="card p-4 sm:p-5 bg-purple-50/50 rounded-2xl border border-purple-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Super Admins</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-900 mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
            {totalSuperAdmins}
          </p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Control Maestro Inviolable</p>
        </div>

        <div className="card p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operadores Activos</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
            {totalOperadores}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">{totalActivos} habilitados para operar</p>
        </div>

        <div className="card p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Suspendidos</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
            {totalSuspendidos}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bloqueo de acceso en vivo</p>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Barra de Búsqueda */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
          />
        </div>

        {/* Filtros de Rol */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["TODOS", "SUPER_ADMIN", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r === "TODOS" ? "📋 Todos" : r === "SUPER_ADMIN" ? "👑 Super Admin" : "👤 Operador"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TABLA DE USUARIOS ─── */}
      <div className="card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingList ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
            <span className="text-xs font-medium">Cargando usuarios autorizados...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron usuarios</p>
            <p className="text-xs text-slate-400">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Usuario</th>
                  <th className="py-3.5 px-4">Rol & Nivel</th>
                  <th className="py-3.5 px-4 text-center">Estado / Switch</th>
                  <th className="py-3.5 px-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((user) => {
                  const isSuper = user.role === "SUPER_ADMIN";
                  const isSelf = user.id === currentUserId;
                  const isToggling = toggleLoadingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Usuario */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm ${
                              isSuper
                                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20"
                                : "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20"
                            }`}
                          >
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 truncate">{user.nombre}</p>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-4">
                        {isSuper ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 text-xs font-extrabold shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>SUPER_ADMIN</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            <span>OPERADOR (ADMIN)</span>
                          </div>
                        )}
                      </td>

                      {/* Switch de Estado */}
                      <td className="py-4 px-4 text-center">
                        {isSuper ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold" title="Cuenta protegida por el software. No puede ser desactivada.">
                            <Lock className="w-3.5 h-3.5 text-purple-600" />
                            <span>Inviolable (Activo)</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              disabled={isToggling}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                user.activo ? "bg-emerald-500" : "bg-slate-300"
                              } disabled:opacity-50`}
                              id={`toggle-user-status-${user.id}`}
                              aria-label={user.activo ? "Suspender usuario" : "Activar usuario"}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  user.activo ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-bold ${
                                user.activo ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {isToggling ? "Guardando..." : user.activo ? "Activo" : "Suspendido"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditNombre(user.nombre);
                              setEditRole(user.role);
                              setEditNewPassword("");
                              setEditError(null);
                              setModalEditOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                            title="Editar usuario o restablecer contraseña"
                            id={`btn-edit-user-${user.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Eliminar (deshabilitado para Super Admin) */}
                          {isSuper ? (
                            <span
                              className="p-2 text-slate-300 cursor-not-allowed"
                              title="El Super Admin no puede ser eliminado."
                            >
                              <Trash2 className="w-4 h-4 opacity-40" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setModalDeleteOpen(true);
                              }}
                              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Eliminar usuario"
                              id={`btn-delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: CREAR NUEVO USUARIO
          ═══════════════════════════════════════════════════════════════════════ */}
      {modalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-outfit">Nuevo Acceso al Sistema</h3>
                  <p className="text-xs text-slate-500">Crea un operador o administrador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={createNombre}
                  onChange={(e) => setCreateNombre(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="operador@prestamos.pe"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contraseña Inicial (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nivel de Rol
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as Role)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500"
                >
                  <option value="ADMIN">👤 OPERADOR (ADMIN) — Gestión de préstamos y cobranzas</option>
                  <option value="SUPER_ADMIN">👑 SUPER_ADMIN — Control total y gestión de usuarios</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  id="submit-create-user"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Guardar Usuario</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: EDITAR USUARIO / RESTABLECER CLAVE
          ═══════════════════════════════════════════════════════════════════════ */}
      {modalEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-outfit">Editar Usuario</h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {selectedUser.role !== "SUPER_ADMIN" && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Rol Asignado
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="ADMIN">👤 OPERADOR (ADMIN)</option>
                    <option value="SUPER_ADMIN">👑 SUPER_ADMIN</option>
                  </select>
                </div>
              )}

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Restablecer Contraseña</span>
                  <span className="text-[10px] font-normal text-slate-400">(Opcional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 placeholder-slate-400 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  id="submit-edit-user"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: CONFIRMAR ELIMINACIÓN
          ═══════════════════════════════════════════════════════════════════════ */}
      {modalDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-outfit">¿Eliminar Usuario?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente a <strong>{selectedUser.nombre}</strong> ({selectedUser.email})?
              Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setModalDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
                id="confirm-delete-user"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
