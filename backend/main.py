from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db, init_db

app = FastAPI(title="Asistencia y Actividades - BD I")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    # Carga datos de prueba si la BD está vacía.
    from seed import seed
    seed()


def _actividad_out(act: models.Actividad, db: Session) -> schemas.ActividadOut:
    inscriptos = (
        db.query(func.count(models.Inscripcion.id))
        .filter(models.Inscripcion.actividad_id == act.id)
        .scalar()
    )
    return schemas.ActividadOut(
        id=act.id,
        nombre=act.nombre,
        fecha=act.fecha,
        cupo=act.cupo,
        profesor_id=act.profesor_id,
        profesor_nombre=act.profesor.nombre if act.profesor else None,
        inscriptos=inscriptos or 0,
    )


# ===================== USUARIOS =====================
@app.get("/usuarios", response_model=List[schemas.UsuarioOut])
def listar_usuarios(rol: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Usuario)
    if rol:
        q = q.filter(models.Usuario.rol == rol)
    return q.order_by(models.Usuario.nombre).all()


@app.post("/usuarios", response_model=schemas.UsuarioOut)
def crear_usuario(data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if data.rol not in models.ROLES:
        raise HTTPException(400, f"Rol inválido. Use uno de {models.ROLES}")
    u = models.Usuario(nombre=data.nombre, rol=data.rol)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@app.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioOut)
def editar_usuario(usuario_id: int, data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    u = db.get(models.Usuario, usuario_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    u.nombre = data.nombre
    u.rol = data.rol
    db.commit()
    db.refresh(u)
    return u


@app.delete("/usuarios/{usuario_id}")
def borrar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.get(models.Usuario, usuario_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    db.delete(u)
    db.commit()
    return {"ok": True}


# ===================== ACTIVIDADES =====================
@app.get("/actividades", response_model=List[schemas.ActividadOut])
def listar_actividades(profesor_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Actividad)
    if profesor_id:
        q = q.filter(models.Actividad.profesor_id == profesor_id)
    return [_actividad_out(a, db) for a in q.order_by(models.Actividad.fecha).all()]


@app.get("/actividades/disponibles", response_model=List[schemas.ActividadOut])
def actividades_disponibles(estudiante_id: int, db: Session = Depends(get_db)):
    """Actividades donde el estudiante NO está inscripto y queda cupo."""
    inscripto_en = (
        select(models.Inscripcion.actividad_id)
        .where(models.Inscripcion.estudiante_id == estudiante_id)
    )
    actividades = (
        db.query(models.Actividad)
        .filter(models.Actividad.id.notin_(inscripto_en))
        .order_by(models.Actividad.fecha)
        .all()
    )
    out = [_actividad_out(a, db) for a in actividades]
    return [a for a in out if a.inscriptos < a.cupo]


@app.post("/actividades", response_model=schemas.ActividadOut)
def crear_actividad(data: schemas.ActividadCreate, db: Session = Depends(get_db)):
    prof = db.get(models.Usuario, data.profesor_id)
    if not prof or prof.rol != "profesor":
        raise HTTPException(400, "profesor_id no corresponde a un profesor")
    a = models.Actividad(
        nombre=data.nombre, fecha=data.fecha, cupo=data.cupo, profesor_id=data.profesor_id
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _actividad_out(a, db)


@app.put("/actividades/{actividad_id}", response_model=schemas.ActividadOut)
def editar_actividad(actividad_id: int, data: schemas.ActividadCreate, db: Session = Depends(get_db)):
    a = db.get(models.Actividad, actividad_id)
    if not a:
        raise HTTPException(404, "Actividad no encontrada")
    a.nombre = data.nombre
    a.fecha = data.fecha
    a.cupo = data.cupo
    a.profesor_id = data.profesor_id
    db.commit()
    db.refresh(a)
    return _actividad_out(a, db)


@app.delete("/actividades/{actividad_id}")
def borrar_actividad(actividad_id: int, db: Session = Depends(get_db)):
    a = db.get(models.Actividad, actividad_id)
    if not a:
        raise HTTPException(404, "Actividad no encontrada")
    db.delete(a)
    db.commit()
    return {"ok": True}


# ===================== INSCRIPCIONES =====================
@app.post("/inscripciones")
def inscribirse(data: schemas.InscripcionCreate, db: Session = Depends(get_db)):
    est = db.get(models.Usuario, data.estudiante_id)
    if not est or est.rol != "estudiante":
        raise HTTPException(400, "estudiante_id no corresponde a un estudiante")
    act = db.get(models.Actividad, data.actividad_id)
    if not act:
        raise HTTPException(404, "Actividad no encontrada")

    ya = (
        db.query(models.Inscripcion)
        .filter_by(estudiante_id=data.estudiante_id, actividad_id=data.actividad_id)
        .first()
    )
    if ya:
        raise HTTPException(409, "Ya estás inscripto en esta actividad")

    inscriptos = (
        db.query(func.count(models.Inscripcion.id))
        .filter(models.Inscripcion.actividad_id == act.id)
        .scalar()
    )
    if inscriptos >= act.cupo:
        raise HTTPException(409, "No hay cupo disponible")

    ins = models.Inscripcion(estudiante_id=data.estudiante_id, actividad_id=data.actividad_id)
    db.add(ins)
    db.commit()
    db.refresh(ins)
    return {"ok": True, "inscripcion_id": ins.id}


# ===================== PASAR LISTA / ASISTENCIA =====================
@app.get("/actividades/{actividad_id}/lista", response_model=List[schemas.AlumnoLista])
def lista_actividad(actividad_id: int, db: Session = Depends(get_db)):
    act = db.get(models.Actividad, actividad_id)
    if not act:
        raise HTTPException(404, "Actividad no encontrada")
    filas = []
    for ins in act.inscripciones:
        filas.append(
            schemas.AlumnoLista(
                inscripcion_id=ins.id,
                estudiante_id=ins.estudiante_id,
                estudiante_nombre=ins.estudiante.nombre,
                presente=ins.asistencia.presente if ins.asistencia else None,
            )
        )
    return filas


@app.post("/asistencias")
def marcar_asistencia(data: schemas.AsistenciaMarcar, db: Session = Depends(get_db)):
    ins = db.get(models.Inscripcion, data.inscripcion_id)
    if not ins:
        raise HTTPException(404, "Inscripción no encontrada")
    if ins.asistencia:
        ins.asistencia.presente = data.presente
        ins.asistencia.marcada_en = datetime.utcnow()
    else:
        db.add(
            models.Asistencia(
                inscripcion_id=ins.id, presente=data.presente, marcada_en=datetime.utcnow()
            )
        )
    db.commit()
    return {"ok": True}


@app.get("/estudiantes/{estudiante_id}/asistencias", response_model=List[schemas.AsistenciaHistorial])
def historial_estudiante(estudiante_id: int, db: Session = Depends(get_db)):
    inscripciones = (
        db.query(models.Inscripcion)
        .filter(models.Inscripcion.estudiante_id == estudiante_id)
        .all()
    )
    out = []
    for ins in inscripciones:
        out.append(
            schemas.AsistenciaHistorial(
                actividad_id=ins.actividad_id,
                actividad_nombre=ins.actividad.nombre,
                fecha=ins.actividad.fecha,
                presente=ins.asistencia.presente if ins.asistencia else None,
            )
        )
    return out
