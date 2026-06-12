export type Rol = "estudiante" | "profesor" | "admin";

export interface Usuario {
  id: number;
  nombre: string;
  rol: Rol;
}

export interface Actividad {
  id: number;
  nombre: string;
  fecha: string;
  cupo: number;
  profesor_id: number;
  profesor_nombre?: string | null;
  inscriptos: number;
}

export interface AlumnoLista {
  inscripcion_id: number;
  estudiante_id: number;
  estudiante_nombre: string;
  presente: boolean | null;
}

export interface AsistenciaHistorial {
  actividad_id: number;
  actividad_nombre: string;
  fecha: string;
  presente: boolean | null;
}
