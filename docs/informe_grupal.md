# Informe grupal — Decisiones de diseño

**Obligatorio Base de Datos I — 2026**
Sistema de Gestión de Actividades Deportivas Universitarias

**Integrantes:** _(completar nombres y números de estudiante)_

---

## 1. Modelo de datos

### 1.1 Entidades y justificación

- **`facultad` y `carrera` normalizadas.** El enunciado pide registrar carrera
  y facultad del estudiante y luego consultar inscriptos "por carrera o
  facultad". Si guardáramos ambos como texto libre en `estudiante`,
  tendríamos redundancia y riesgo de inconsistencias ("Fing", "F. Ingeniería").
  Con `carrera → facultad` como tablas, la facultad del estudiante se deriva
  de su carrera y las agrupaciones de los reportes son exactas.

- **`disciplina` separada de `actividad`.** La letra distingue disciplinas
  (fútbol, yoga...) de actividades concretas ("Fútbol recreativo mixto").
  Son un catálogo 1:N: una disciplina genera muchas actividades.

- **`espacio` como entidad.** Permite el ABM pedido y habilita consultas de
  uso de infraestructura (consulta adicional 8c).

- **`actividad`** con `cupo_maximo`, `dia` (ENUM), `hora_inicio`/`hora_fin`
  (TIME) y `estado` (ENUM: abierta/cerrada/finalizada/cancelada). Modelamos
  el horario como día de semana + rango horario (actividad recurrente
  semanal), que es lo que describe la letra, y no como fecha puntual.

- **`inscripcion`** relaciona estudiante–actividad con **estado propio**
  (`confirmada` / `lista_espera`) y `fecha_inscripcion`. La fecha no es solo
  auditoría: define la **prioridad en la lista de espera** (FIFO).

- **`asistencia`** cuelga de la inscripción con una **fecha** concreta y un
  booleano `presente`. Una fila por (inscripción, fecha) permite pasar lista
  cada semana, calcular % de asistencia y contar inasistencias.

### 1.2 Claves y restricciones

| Restricción | Dónde | Qué garantiza |
|---|---|---|
| `UNIQUE (estudiante_id, actividad_id)` | `inscripcion` | Regla 4: nadie se inscribe dos veces (garantizado por la BD, no solo por la app) |
| `UNIQUE (inscripcion_id, fecha)` | `asistencia` | Una sola marca de asistencia por estudiante y fecha |
| `UNIQUE documento`, `UNIQUE correo` | `estudiante` | Identidad única del estudiante |
| `CHECK (cupo_maximo > 0)` | `actividad` | Cupos válidos |
| `CHECK (hora_fin > hora_inicio)` | `actividad` | Horarios coherentes |
| `CHECK` de formato de correo | `estudiante` | Validación también en la capa de datos |
| `ENUM` en `dia`, `estado` de actividad e inscripción | — | Dominios cerrados de valores |
| FKs en todas las relaciones | — | Integridad referencial |

Usamos claves sustitutas (`id AUTO_INCREMENT`) en todas las tablas y claves
naturales como `UNIQUE` (documento, correo, nombres de catálogo): las FKs
quedan estables aunque un documento se corrija.

## 2. Reglas de negocio: dónde se controlan

Decidimos que cada regla tuviera **su control en la capa más confiable
posible**, y en más de una capa cuando fue viable:

1. **Solo actividades abiertas** — backend: el endpoint de inscripción lee la
   actividad y rechaza con 409 si `estado != 'abierta'` (cubre también la
   regla 6: canceladas/finalizadas no aceptan inscripciones).
2. **No superar el cupo** — backend con `SELECT ... FOR UPDATE` sobre la
   actividad: dos inscripciones simultáneas no pueden contar el mismo cupo
   libre (condición de carrera resuelta con bloqueo de fila de InnoDB).
3. **Lista de espera** — si `confirmados >= cupo_maximo`, la inscripción se
   inserta con estado `lista_espera` en lugar de rechazarse.
4. **Sin inscripciones duplicadas** — restricción `UNIQUE` en la BD; el
   backend traduce el error de integridad a un mensaje claro (409).
5. **Asistencia solo de confirmados** — backend: rechaza si la inscripción
   no está `confirmada`.
6. **Promoción automática**: al borrarse una inscripción confirmada de una
   actividad abierta, se promueve al primero de la lista de espera (orden
   `fecha_inscripcion`). Decisión propia del equipo: la letra no lo exige,
   pero sin esto la lista de espera no cumple su propósito.

## 3. Acceso a datos sin ORM

Cumplimos la restricción de la letra usando **PyMySQL con SQL crudo**:

- `db/script.sql` crea la base completa; la aplicación **no** crea tablas.
- `backend/db.py` abre una conexión por request (dependencia de FastAPI) con
  commit/rollback automático según el resultado del endpoint.
- Todas las consultas usan **parámetros `%s`** (nunca concatenación de
  strings), lo que evita inyección SQL.
- Las consultas de reportes son el mismo SQL de `db/consultas.sql`.

## 4. Validación en tres capas

- **BD**: NOT NULL, UNIQUE, FK, ENUM, CHECK (última línea de defensa).
- **Backend**: Pydantic valida tipos, rangos, formatos (documento numérico,
  correo, cupo > 0, hora_fin > hora_inicio) antes de tocar la BD.
- **Frontend**: inputs tipados (time, date, number), campos requeridos y
  visualización de los errores que devuelve la API.

## 5. Consultas adicionales propuestas (justificación)

1. **Lista de espera por actividad en orden de prioridad** — operativa: ante
   una baja, saber quién entra; ordenada por `fecha_inscripcion` (FIFO).
2. **Estudiantes sin ninguna inscripción** — útil para difusión del programa
   deportivo; patrón `LEFT JOIN ... IS NULL` (anti-join).
3. **Uso de espacios (actividades y horas semanales)** — planificación de
   infraestructura; usa funciones de tiempo (`TIMEDIFF`, `TIME_TO_SEC`).

## 6. Dificultades y cómo las resolvimos

_(completar por el equipo; sugerencias: condición de carrera del cupo,
modelado de la asistencia por fecha vs. por inscripción, decisión de
promoción automática de la lista de espera)_
