'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Percent,
  Users,
  Sparkles,
  User,
} from 'lucide-react';
import type { Role } from '@/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Datos del usuario en sesión
  const [userData, setUserData] = useState<{
    nombre: string;
    email: string;
    role: Role;
  } | null>(null);

  useEffect(() => {
    async function loadSessionUser() {
      try {
        const res = await fetch('/api/admin/auth/me');
        const json = await res.json();
        if (json.success && json.data) {
          setUserData(json.data);
        }
      } catch (err) {
        console.error('Error al cargar datos del usuario en layout:', err);
      }
    }
    loadSessionUser();
  }, []);

  // No mostrar layout en la pantalla de login
  if (pathname === '/admin/login' || pathname?.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      window.location.replace('/admin/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Solicitudes', href: '/admin/solicitudes', icon: ClipboardList },
    { label: 'Cobranzas', href: '/admin/cobranzas', icon: CreditCard },
    { label: 'Tasas de Interés', href: '/admin/tasas', icon: Percent },
    ...(userData?.role === 'SUPER_ADMIN'
      ? [{ label: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users, badge: 'SUPER' }]
      : []),
    { label: 'Mi Cuenta & Perfil', href: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* ─── SIDEBAR ESCRITORIO (md: y superior) ─── */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-slate-200 flex-col justify-between p-4 shadow-xl z-20 flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-5 border-b border-slate-800">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center font-black text-white shadow-md">
              P
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base leading-tight">
                Préstamos<span className="text-emerald-400">PE</span>
              </h2>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Panel Administrativo
              </p>
            </div>
          </div>

          {/* Tarjeta de Usuario en Sesión */}
          {userData && (
            <div className="mx-1 mb-5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-xs ${
                  userData.role === 'SUPER_ADMIN'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                }`}
              >
                {userData.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-snug">{userData.nombre}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {userData.role === 'SUPER_ADMIN' ? (
                    <span className="text-[10px] font-extrabold text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      SUPER_ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      OPERADOR
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Menú de navegación */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver sitio público</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition text-left cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>

      {/* ─── HEADER MÓVIL (Fijo arriba en celulares/tablets) ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
            P
          </div>
          <div>
            <span className="font-bold text-sm text-white leading-tight block">PréstamosPE Admin</span>
            {userData && (
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {userData.role === 'SUPER_ADMIN' ? '👑 SUPER_ADMIN' : '👤 OPERADOR'}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 text-slate-300 hover:text-white bg-slate-800 rounded-xl focus:outline-none cursor-pointer"
          aria-label="Toggle navegación móvil"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ─── DRAWER LATERAL MÓVIL DESLIZABLE ─── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop oscuro */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel deslizante lateral */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-slate-200 h-full p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250 border-r border-slate-800">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">PréstamosPE</h3>
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      {userData?.role === 'SUPER_ADMIN' ? '👑 SUPER_ADMIN' : '👤 OPERADOR'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links de navegación */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Acciones inferiores */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ver sitio público</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-900/30"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO PRINCIPAL ─── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}