from datetime import datetime, timedelta

import models
from database import SessionLocal


def seed():
    """Carga datos de prueba sólo si la BD está vacía (idempotente)."""
    db = SessionLocal()
    try:
        if db.query(models.Usuario).count() > 0:
            return

        admin = models.Usuario(nombre="Admin", rol="admin")
        prof1 = models.Usuario(nombre="Prof. García", rol="profesor")
        prof2 = models.Usuario(nombre="Prof. Pérez", rol="profesor")
        est1 = models.Usuario(nombre="Ana López", rol="estudiante")
        est2 = models.Usuario(nombre="Bruno Díaz", rol="estudiante")
        est3 = models.Usuario(nombre="Carla Ruiz", rol="estudiante")
        db.add_all([admin, prof1, prof2, est1, est2, est3])
        db.flush()

        hoy = datetime.utcnow()
        act1 = models.Actividad(
            nombre="Base de Datos I - Teórico", fecha=hoy, cupo=30, profesor_id=prof1.id
        )
        act2 = models.Actividad(
            nombre="Taller de SQL", fecha=hoy + timedelta(days=1), cupo=2, profesor_id=prof1.id
        )
        act3 = models.Actividad(
            nombre="Programación II - Laboratorio",
            fecha=hoy + timedelta(days=2),
            cupo=25,
            profesor_id=prof2.id,
        )
        db.add_all([act1, act2, act3])
        db.flush()

        # Ana ya inscripta en act1
        db.add(models.Inscripcion(estudiante_id=est1.id, actividad_id=act1.id))

        db.commit()
        print("[seed] Datos de prueba cargados.")
    finally:
        db.close()


if __name__ == "__main__":
    from database import init_db

    init_db()
    seed()
