import type {
  Actividad,
  ActividadInput,
  AsistenciaFila,
  BajaInscripcion,
  Carrera,
  Disciplina,
  Espacio,
  Estudiante,
  EstudianteInput,
  Facultad,
  InscripcionCreada,
  InscripcionDeActividad,
  InscripcionDeEstudiante,
  ReporteFila,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Helper genérico: hace el fetch y si el backend devuelve 4xx/5xx
// lanza un Error con el "detail" del JSON de FastAPI.
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
  // Catálogos académicos
  facultades: () => req<Facultad[]>("/facultades"),
  carreras: () => req<Carrera[]>("/carreras"),

  // Estudiantes
  estudiantes: () => req<Estudiante[]>("/estudiantes"),
  crearEstudiante: (data: EstudianteInput) =>
    req<Estudiante>("/estudiantes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  editarEstudiante: (id: number, data: EstudianteInput) =>
    req<Estudiante>(`/estudiantes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  borrarEstudiante: (id: number) =>
    req<{ ok: boolean }>(`/estudiantes/${id}`, { method: "DELETE" }),

  // Disciplinas
  disciplinas: () => req<Disciplina[]>("/disciplinas"),
  crearDisciplina: (nombre: string) =>
    req<Disciplina>("/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nombre }),
    }),
  editarDisciplina: (id: number, nombre: string) =>
    req<Disciplina>(`/disciplinas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nombre }),
    }),
  borrarDisciplina: (id: number) =>
    req<{ ok: boolean }>(`/disciplinas/${id}`, { method: "DELETE" }),

  // Espacios deportivos
  espacios: () => req<Espacio[]>("/espacios"),
  crearEspacio: (nombre: string, ubicacion: string) =>
    req<Espacio>("/espacios", {
      method: "POST",
      body: JSON.stringify({ nombre, ubicacion }),
    }),
  editarEspacio: (id: number, nombre: string, ubicacion: string) =>
    req<Espacio>(`/espacios/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nombre, ubicacion }),
    }),
  borrarEspacio: (id: number) =>
    req<{ ok: boolean }>(`/espacios/${id}`, { method: "DELETE" }),

  // Actividades deportivas
  actividades: (estado?: string) =>
    req<Actividad[]>(`/actividades${estado ? `?estado=${estado}` : ""}`),
  crearActividad: (data: ActividadInput) =>
    req<Actividad>("/actividades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  editarActividad: (id: number, data: ActividadInput) =>
    req<Actividad>(`/actividades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  borrarActividad: (id: number) =>
    req<{ ok: boolean }>(`/actividades/${id}`, { method: "DELETE" }),

  // Inscripciones
  inscripcionesDeActividad: (actividadId: number) =>
    req<InscripcionDeActividad[]>(`/actividades/${actividadId}/inscripciones`),
  inscripcionesDeEstudiante: (estudianteId: number) =>
    req<InscripcionDeEstudiante[]>(`/estudiantes/${estudianteId}/inscripciones`),
  inscribir: (estudiante_id: number, actividad_id: number) =>
    req<InscripcionCreada>("/inscripciones", {
      method: "POST",
      body: JSON.stringify({ estudiante_id, actividad_id }),
    }),
  bajaInscripcion: (id: number) =>
    req<BajaInscripcion>(`/inscripciones/${id}`, { method: "DELETE" }),

  // Asistencias
  asistencias: (actividadId: number, fecha: string) =>
    req<AsistenciaFila[]>(`/actividades/${actividadId}/asistencias?fecha=${fecha}`),
  marcarAsistencia: (inscripcion_id: number, fecha: string, presente: boolean) =>
    req<{ ok: boolean }>("/asistencias", {
      method: "POST",
      body: JSON.stringify({ inscripcion_id, fecha, presente }),
    }),

  // Reportes: reciben la ruta completa (ej: "/reportes/ocupacion")
  reporte: (path: string) => req<ReporteFila[]>(path),
};
