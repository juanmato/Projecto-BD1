import os
import time

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Por defecto apunta al servicio "db" de docker-compose (MySQL).
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://app:app@db:3306/asistencia",
)

engine = create_engine(DATABASE_URL, echo=False, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: abre una sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(retries: int = 10, delay: float = 3.0):
    """Crea las tablas. Reintenta porque MySQL tarda en levantar en Docker."""
    from sqlalchemy.exc import OperationalError

    import models  # noqa: F401  (registra los modelos en Base.metadata)

    last_err = None
    for intento in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.close()
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError as e:
            last_err = e
            print(f"[init_db] MySQL no disponible (intento {intento}/{retries})...")
            time.sleep(delay)
    raise RuntimeError(f"No se pudo conectar a la base de datos: {last_err}")
