// Tipos de datos que devuelve el backend (FastAPI)

export interface Facultad {
  id: number;
  nombre: string;
}

export interface Carrera {
  id: number;
  nombre: string;
  facultad_id: number;
  facultad: string;
}

export interface Estudiante {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  carrera_id: number;
  carrera: string;
  facultad: string;
}

// Cuerpo que se envía al crear/editar un estudiante
export interface EstudianteInput {
  documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  carrera_id: number;
}

export interface Disciplina {
  id: number;
  nombre: string;
}

export interface Espacio {
  id: number;
  nombre: string;
  ubicacion: string;
}

export type Dia =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type EstadoActividad = "abierta" | "cerrada" | "finalizada" | "cancelada";

export interface Actividad {
  id: number;
  nombre: string;
  disciplina_id: number;
  disciplina: string;
  espacio_id: number;
  espacio: string;
  cupo_maximo: number;
  dia: Dia;
  hora_inicio: string; // "HH:MM"
  hora_fin: string; // "HH:MM"
  estado: EstadoActividad;
  confirmados: number;
  en_espera: number;
}

// Cuerpo que se envía al crear/editar una actividad
export interface ActividadInput {
  nombre: string;
  disciplina_id: number;
  espacio_id: number;
  cupo_maximo: number;
  dia: Dia;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoActividad;
}

export type EstadoInscripcion = "confirmada" | "lista_espera";

// Inscripción vista desde una actividad
export interface InscripcionDeActividad {
  id: number;
  estado: EstadoInscripcion;
  fecha_inscripcion: string;
  estudiante_id: number;
  documento: string;
  estudiante: string;
}

// Inscripción vista desde un estudiante
export interface InscripcionDeEstudiante {
  id: number;
  estado: EstadoInscripcion;
  fecha_inscripcion: string;
  actividad_id: number;
  actividad: string;
  dia: Dia;
  hora_inicio: string;
  estado_actividad: EstadoActividad;
}

// Respuesta del POST /inscripciones
export interface InscripcionCreada {
  id: number;
  estado: EstadoInscripcion;
}

// Respuesta del DELETE /inscripciones/{id}
export interface BajaInscripcion {
  ok: boolean;
  promovido_de_lista_espera: string | number | null;
}

// Fila de la planilla de asistencia de una actividad en una fecha
export interface AsistenciaFila {
  inscripcion_id: number;
  estudiante: string;
  documento: string;
  presente: boolean | null;
}

// Los reportes devuelven arrays de objetos con claves variables
export type ReporteFila = Record<string, string | number | null>;
