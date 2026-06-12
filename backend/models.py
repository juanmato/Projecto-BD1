from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base

ROLES = ("estudiante", "profesor", "admin")


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    rol = Column(Enum(*ROLES, name="rol_enum"), nullable=False)

    actividades = relationship(
        "Actividad", back_populates="profesor", cascade="all, delete-orphan"
    )
    inscripciones = relationship(
        "Inscripcion", back_populates="estudiante", cascade="all, delete-orphan"
    )


class Actividad(Base):
    __tablename__ = "actividad"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    fecha = Column(DateTime, nullable=False, default=datetime.utcnow)
    cupo = Column(Integer, nullable=False, default=30)
    profesor_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    profesor = relationship("Usuario", back_populates="actividades")
    inscripciones = relationship(
        "Inscripcion", back_populates="actividad", cascade="all, delete-orphan"
    )


class Inscripcion(Base):
    __tablename__ = "inscripcion"
    __table_args__ = (
        UniqueConstraint("estudiante_id", "actividad_id", name="uq_estudiante_actividad"),
    )

    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    actividad_id = Column(Integer, ForeignKey("actividad.id"), nullable=False)

    estudiante = relationship("Usuario", back_populates="inscripciones")
    actividad = relationship("Actividad", back_populates="inscripciones")
    asistencia = relationship(
        "Asistencia",
        back_populates="inscripcion",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Asistencia(Base):
    __tablename__ = "asistencia"

    id = Column(Integer, primary_key=True, index=True)
    inscripcion_id = Column(
        Integer, ForeignKey("inscripcion.id"), nullable=False, unique=True
    )
    presente = Column(Boolean, nullable=False, default=False)
    marcada_en = Column(DateTime, nullable=False, default=datetime.utcnow)

    inscripcion = relationship("Inscripcion", back_populates="asistencia")
