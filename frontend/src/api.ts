import type {
  Actividad,
  AlumnoLista,
  AsistenciaHistorial,
  Rol,
  Usuario,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) msg = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Usuarios
  usuarios: (rol?: Rol) =>
    req<Usuario[]>(`/usuarios${rol ? `?rol=${rol}` : ""}`),
  crearUsuario: (nombre: string, rol: Rol) =>
    req<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify({ nombre, rol }),
    }),
  editarUsuario: (id: number, nombre: string, rol: Rol) =>
    req<Usuario>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nombre, rol }),
    }),
  borrarUsuario: (id: number) =>
    req<{ ok: boolean }>(`/usuarios/${id}`, { method: "DELETE" }),

  // Actividades
  actividades: (profesorId?: number) =>
    req<Actividad[]>(
      `/actividades${profesorId ? `?profesor_id=${profesorId}` : ""}`
    ),
  actividadesDisponibles: (estudianteId: number) =>
    req<Actividad[]>(`/actividades/disponibles?estudiante_id=${estudianteId}`),
  crearActividad: (data: {
    nombre: string;
    fecha: string;
    cupo: number;
    profesor_id: number;
  }) =>
    req<Actividad>("/actividades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  borrarActividad: (id: number) =>
    req<{ ok: boolean }>(`/actividades/${id}`, { method: "DELETE" }),

  // Inscripciones
  inscribirse: (estudiante_id: number, actividad_id: number) =>
    req<{ ok: boolean }>("/inscripciones", {
      method: "POST",
      body: JSON.stringify({ estudiante_id, actividad_id }),
    }),

  // Asistencia
  lista: (actividadId: number) =>
    req<AlumnoLista[]>(`/actividades/${actividadId}/lista`),
  marcar: (inscripcion_id: number, presente: boolean) =>
    req<{ ok: boolean }>("/asistencias", {
      method: "POST",
      body: JSON.stringify({ inscripcion_id, presente }),
    }),
  historial: (estudianteId: number) =>
    req<AsistenciaHistorial[]>(`/estudiantes/${estudianteId}/asistencias`),
};
