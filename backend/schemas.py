from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ---------- Usuario ----------
class UsuarioBase(BaseModel):
    nombre: str
    rol: str  # estudiante | profesor | admin


class UsuarioCreate(UsuarioBase):
    pass


class UsuarioOut(UsuarioBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Actividad ----------
class ActividadBase(BaseModel):
    nombre: str
    fecha: datetime
    cupo: int = 30
    profesor_id: int


class ActividadCreate(ActividadBase):
    pass


class ActividadOut(ActividadBase):
    id: int
    profesor_nombre: Optional[str] = None
    inscriptos: int = 0

    class Config:
        from_attributes = True


# ---------- Inscripcion ----------
class InscripcionCreate(BaseModel):
    estudiante_id: int
    actividad_id: int


# ---------- Asistencia ----------
class AsistenciaMarcar(BaseModel):
    inscripcion_id: int
    presente: bool


class AlumnoLista(BaseModel):
    """Una fila de la pantalla 'pasar lista' del profesor."""
    inscripcion_id: int
    estudiante_id: int
    estudiante_nombre: str
    presente: Optional[bool] = None


class AsistenciaHistorial(BaseModel):
    """Una fila del historial del estudiante."""
    actividad_id: int
    actividad_nombre: str
    fecha: datetime
    presente: Optional[bool] = None
