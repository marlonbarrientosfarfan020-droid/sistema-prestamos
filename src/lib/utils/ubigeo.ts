// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de Ubigeo Perú — Capa de Compatibilidad y Acceso Rápido
// ─────────────────────────────────────────────────────────────────────────────

export {
  UBIGEO_DATA,
  getDepartamentos,
  getProvincias,
  getDistritos,
  type UbigeoPeru,
} from "@/lib/data/ubigeo";

import { UBIGEO_DATA, getDepartamentos, getProvincias, getDistritos } from "@/lib/data/ubigeo";

export interface Departamento {
  id: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface Distrito {
  id: string;
  nombre: string;
  provinciaId: string;
}

// Lista de Departamentos formateados para selects
export const DEPARTAMENTOS: Departamento[] = getDepartamentos().map((nombre, index) => ({
  id: nombre,
  nombre,
}));

/**
 * Retorna las provincias asociadas a un departamento (por nombre o ID).
 */
export function getProvinciasByDepartamento(depIdOrNombre: string): Provincia[] {
  if (!depIdOrNombre) return [];
  const nombreDep = depIdOrNombre.trim();
  const provs = getProvincias(nombreDep);

  return provs.map((nombre) => ({
    id: nombre,
    nombre,
    departamentoId: nombreDep,
  }));
}

/**
 * Retorna los distritos pertenecientes a una provincia (y opcionalmente departamento).
 */
export function getDistritosByProvincia(provIdOrNombre: string, depNombre?: string): Distrito[] {
  if (!provIdOrNombre) return [];
  const nombreProv = provIdOrNombre.trim();

  // Si se pasa departamento, buscar directamente
  if (depNombre && UBIGEO_DATA[depNombre]) {
    const dists = getDistritos(depNombre, nombreProv);
    return dists.map((nombre) => ({
      id: nombre,
      nombre,
      provinciaId: nombreProv,
    }));
  }

  // Búsqueda global por provincia a través de todos los departamentos
  for (const dep of Object.keys(UBIGEO_DATA)) {
    if (UBIGEO_DATA[dep].provincias[nombreProv]) {
      const dists = UBIGEO_DATA[dep].provincias[nombreProv];
      return dists.map((nombre) => ({
        id: nombre,
        nombre,
        provinciaId: nombreProv,
      }));
    }
  }

  return [];
}
