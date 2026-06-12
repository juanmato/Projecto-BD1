# Asistencia y Actividades — Proyecto Final BD I

App web con 3 roles (estudiante, profesor, admin). En el login se elige rol +
usuario (sin contraseña) y se va a la pantalla correspondiente.

- **Profesor**: ve sus actividades y pasa lista (presente/ausente).
- **Estudiante**: ve actividades disponibles, se anota, y consulta su historial
  de asistencias.
- **Admin**: ABM de usuarios y actividades.

## Stack

- **Backend**: Python + FastAPI + SQLAlchemy (`backend/`)
- **Base de datos**: MySQL 8 (en Docker)
- **Frontend**: React + TypeScript + Vite (`frontend/`)

## Cómo correr (Docker)

```bash
docker compose up --build
```

Servicios:
- Frontend: http://localhost:5170
- API (Swagger): http://localhost:8000/docs
- MySQL: localhost:3309 (db `asistencia`, user `app` / pass `app`)

Al arrancar, el backend crea las tablas y carga **datos de prueba** (un admin, dos
profesores, tres estudiantes y tres actividades).

## Prueba end-to-end

1. Entrá como **admin** → creá/verificá usuarios y actividades.
2. Entrá como **estudiante** (ej. *Bruno Díaz*) → anotate en una actividad.
3. Entrá como **profesor** (ej. *Prof. García*) → abrí la actividad y marcá presente.
4. Volvé como ese **estudiante** → mirá la asistencia en *Mis asistencias*.

## Modelo de datos

- `usuario(id, nombre, rol)` — rol ∈ {estudiante, profesor, admin}
- `actividad(id, nombre, fecha, cupo, profesor_id→usuario)`
- `inscripcion(id, estudiante_id→usuario, actividad_id→actividad)` — único por par
- `asistencia(id, inscripcion_id→inscripcion, presente, marcada_en)`

## Desarrollo sin Docker (opcional)

Backend (necesitás un MySQL corriendo y `DATABASE_URL` apuntando a él):

```bash
cd backend
pip install -r requirements.txt
# ej: $env:DATABASE_URL="mysql+pymysql://app:app@localhost:3306/asistencia"
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
