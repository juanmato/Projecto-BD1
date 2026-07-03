# Sistema de Gestión de Actividades Deportivas Universitarias

Obligatorio **Base de Datos I — 2026**.

La universidad administra inscripciones de estudiantes a actividades deportivas
(fútbol, atletismo, yoga, funcional, etc.), controlando cupos, lista de espera
y registro de asistencias.

## Stack

- **Base de datos**: MySQL 8 — esquema y datos maestros creados por
  [`db/script.sql`](db/script.sql) (sin ORM: la app no crea tablas).
- **Backend**: Python + FastAPI + **PyMySQL con SQL crudo** (`backend/`).
  No se utiliza ningún ORM, según lo exigido por la letra.
- **Frontend**: React + TypeScript + Vite (`frontend/`), opcional valorado.
- **Docker**: `docker-compose.yml` levanta base + backend + frontend.

## Estructura

```
db/script.sql       Creación de la BD completa + datos maestros
db/consultas.sql    Las 8 consultas requeridas + 3 adicionales del equipo
backend/            API FastAPI (SQL crudo vía PyMySQL)
frontend/           Interfaz web React/TS
docs/               Informes (grupal e individual)
```

## Cómo correr (Docker — recomendado)

Requisito: Docker Desktop.

```bash
docker compose up --build
```

- Frontend: http://localhost:5170
- API (Swagger): http://localhost:8000/docs
- MySQL: localhost:3309 — base `deportes_ucu`, usuario `app` / clave `app`

Al crear el contenedor de MySQL por primera vez, se ejecuta automáticamente
`db/script.sql`, que crea todas las tablas, restricciones y datos maestros
(facultades, carreras, disciplinas, espacios, estudiantes y actividades de
ejemplo).

> Para reiniciar la base desde cero: `docker compose down -v` y volver a
> levantar (el `-v` borra el volumen de datos).

## Cómo correr sin Docker

1. Tener un MySQL 8 local y ejecutar el script:

   ```bash
   mysql -u root -p < db/script.sql
   ```

2. Backend:

   ```bash
   cd backend
   pip install -r requirements.txt
   export DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=<tu_clave> DB_NAME=deportes_ucu
   uvicorn main:app --reload
   ```

3. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Modelo de datos

```
facultad(id, nombre)
carrera(id, nombre, facultad_id → facultad)
estudiante(id, documento ÚNICO, nombre, apellido, correo ÚNICO, carrera_id → carrera)
disciplina(id, nombre ÚNICO)
espacio(id, nombre ÚNICO, ubicacion)
actividad(id, nombre, disciplina_id → disciplina, espacio_id → espacio,
          cupo_maximo, dia, hora_inicio, hora_fin,
          estado ∈ {abierta, cerrada, finalizada, cancelada})
inscripcion(id, estudiante_id → estudiante, actividad_id → actividad,
            estado ∈ {confirmada, lista_espera}, fecha_inscripcion)
            ÚNICO (estudiante_id, actividad_id)
asistencia(id, inscripcion_id → inscripcion, fecha, presente)
           ÚNICO (inscripcion_id, fecha)
```

## Reglas de negocio implementadas

1. Solo se aceptan inscripciones en actividades **abiertas** (las canceladas,
   cerradas o finalizadas se rechazan con 409).
2. Nunca se supera el `cupo_maximo` de confirmados; la actividad se bloquea
   con `SELECT ... FOR UPDATE` para evitar condiciones de carrera.
3. Sin cupo disponible, la inscripción queda en **lista de espera**.
4. Un estudiante no puede inscribirse dos veces a la misma actividad
   (restricción `UNIQUE` en la BD + manejo del error en el backend).
5. Solo se registra asistencia de inscripciones **confirmadas**.
6. Al darse de baja un confirmado de una actividad abierta, se **promueve
   automáticamente** al primero de la lista de espera.

## Validación de datos (tres capas)

- **Base de datos**: `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `ENUM`,
  `CHECK` (cupo > 0, horario válido, formato de correo).
- **Backend**: esquemas Pydantic (`backend/schemas.py`) + reglas de negocio
  en los endpoints.
- **Frontend**: campos requeridos, tipos de input (time, date, number) y
  mensajes de error de la API.

## Consultas requeridas

Las 8 consultas del enunciado (+3 adicionales propuestas por el equipo) están
en [`db/consultas.sql`](db/consultas.sql) y expuestas como endpoints REST bajo
`/reportes/...` (visibles en la pestaña **Reportes** del frontend y en Swagger).

## Prueba end-to-end sugerida

1. **Actividades**: verificá que "Funcional turno mañana" (cupo 3) tiene
   3 confirmados y 1 en lista de espera (datos de ejemplo).
2. **Inscripciones**: inscribí a un estudiante más → queda en lista de espera.
   Dá de baja a un confirmado → el primero de la espera se promueve solo.
3. **Asistencia**: elegí la actividad y una fecha, marcá presentes/ausentes.
4. **Reportes**: revisá ocupación, % de asistencia e inasistencias.
5. Intentá inscribir a alguien a "Vóleibol verano" (finalizada) → rechazo 409.
