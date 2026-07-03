"""Validación de datos del backend (Pydantic).

Complementa las restricciones de la base de datos (NOT NULL, UNIQUE, FK,
ENUM, CHECK) y la validación del frontend.
"""

from datetime import date, time
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Dia(str, Enum):
    lunes = "lunes"
    martes = "martes"
    miercoles = "miercoles"
    jueves = "jueves"
    viernes = "viernes"
    sabado = "sabado"
    domingo = "domingo"


class EstadoActividad(str, Enum):
    abierta = "abierta"
    cerrada = "cerrada"
    finalizada = "finalizada"
    cancelada = "cancelada"


# ---------- Estudiante ----------
class EstudianteIn(BaseModel):
    documento: str = Field(min_length=6, max_length=20, pattern=r"^\d+$")
    nombre: str = Field(min_length=1, max_length=80)
    apellido: str = Field(min_length=1, max_length=80)
    correo: str = Field(max_length=160, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    carrera_id: int = Field(gt=0)


# ---------- Disciplina / Espacio ----------
class DisciplinaIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=80)


class EspacioIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    ubicacion: Optional[str] = Field(default=None, max_length=200)


# ---------- Actividad ----------
class ActividadIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=160)
    disciplina_id: int = Field(gt=0)
    espacio_id: int = Field(gt=0)
    cupo_maximo: int = Field(gt=0, le=1000)
    dia: Dia
    hora_inicio: time
    hora_fin: time
    estado: EstadoActividad = EstadoActividad.abierta

    @field_validator("hora_fin")
    @classmethod
    def horario_valido(cls, v, info):
        inicio = info.data.get("hora_inicio")
        if inicio is not None and v <= inicio:
            raise ValueError("hora_fin debe ser posterior a hora_inicio")
        return v


# ---------- Inscripción ----------
class InscripcionIn(BaseModel):
    estudiante_id: int = Field(gt=0)
    actividad_id: int = Field(gt=0)


# ---------- Asistencia ----------
class AsistenciaIn(BaseModel):
    inscripcion_id: int = Field(gt=0)
    fecha: date
    presente: bool
