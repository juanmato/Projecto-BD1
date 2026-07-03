"""Sistema de Gestión de Actividades Deportivas Universitarias.

Obligatorio Base de Datos I - 2026.
Backend FastAPI SIN ORM: todo el acceso a datos es SQL crudo vía PyMySQL.
"""

from typing import Optional

import pymysql
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import schemas
from db import execute, fetch_all, fetch_one, get_conn

app = FastAPI(title="Actividades Deportivas Universitarias - BD I")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _o_404(fila, detalle):
    if not fila:
        raise HTTPException(404, detalle)
    return fila


# ===================== FACULTADES / CARRERAS =====================
@app.get("/facultades")
def listar_facultades(conn=Depends(get_conn)):
    return fetch_all(conn, "SELECT id, nombre FROM facultad ORDER BY nombre")


@app.get("/carreras")
def listar_carreras(conn=Depends(get_conn)):
    return fetch_all(
        conn,
        """
        SELECT c.id, c.nombre, c.facultad_id, f.nombre AS facultad
        FROM carrera c
        JOIN facultad f ON f.id = c.facultad_id
        ORDER BY f.nombre, c.nombre
        """,
    )


# ===================== ESTUDIANTES (ABM) =====================
SQL_ESTUDIANTE = """
    SELECT e.id, e.documento, e.nombre, e.apellido, e.correo,
           e.carrera_id, c.nombre AS carrera, f.nombre AS facultad
    FROM estudiante e
    JOIN carrera c ON c.id = e.carrera_id
    JOIN facultad f ON f.id = c.facultad_id
"""


@app.get("/estudiantes")
def listar_estudiantes(conn=Depends(get_conn)):
    return fetch_all(conn, SQL_ESTUDIANTE + " ORDER BY e.apellido, e.nombre")


@app.post("/estudiantes", status_code=201)
def crear_estudiante(data: schemas.EstudianteIn, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM carrera WHERE id = %s", (data.carrera_id,)),
        "Carrera no encontrada",
    )
    try:
        _, nuevo_id = execute(
            conn,
            """
            INSERT INTO estudiante (documento, nombre, apellido, correo, carrera_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (data.documento, data.nombre, data.apellido, data.correo, data.carrera_id),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Ya existe un estudiante con ese documento o correo")
    return fetch_one(conn, SQL_ESTUDIANTE + " WHERE e.id = %s", (nuevo_id,))


@app.put("/estudiantes/{estudiante_id}")
def editar_estudiante(estudiante_id: int, data: schemas.EstudianteIn, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM estudiante WHERE id = %s", (estudiante_id,)),
        "Estudiante no encontrado",
    )
    try:
        execute(
            conn,
            """
            UPDATE estudiante
            SET documento = %s, nombre = %s, apellido = %s, correo = %s, carrera_id = %s
            WHERE id = %s
            """,
            (data.documento, data.nombre, data.apellido, data.correo,
             data.carrera_id, estudiante_id),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Documento o correo ya usados por otro estudiante")
    return fetch_one(conn, SQL_ESTUDIANTE + " WHERE e.id = %s", (estudiante_id,))


@app.delete("/estudiantes/{estudiante_id}")
def borrar_estudiante(estudiante_id: int, conn=Depends(get_conn)):
    inscripciones = fetch_one(
        conn,
        "SELECT COUNT(*) AS n FROM inscripcion WHERE estudiante_id = %s",
        (estudiante_id,),
    )
    if inscripciones["n"] > 0:
        raise HTTPException(409, "No se puede borrar: el estudiante tiene inscripciones")
    filas, _ = execute(conn, "DELETE FROM estudiante WHERE id = %s", (estudiante_id,))
    if filas == 0:
        raise HTTPException(404, "Estudiante no encontrado")
    return {"ok": True}


# ===================== DISCIPLINAS (ABM) =====================
@app.get("/disciplinas")
def listar_disciplinas(conn=Depends(get_conn)):
    return fetch_all(conn, "SELECT id, nombre FROM disciplina ORDER BY nombre")


@app.post("/disciplinas", status_code=201)
def crear_disciplina(data: schemas.DisciplinaIn, conn=Depends(get_conn)):
    try:
        _, nuevo_id = execute(
            conn, "INSERT INTO disciplina (nombre) VALUES (%s)", (data.nombre,)
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Ya existe una disciplina con ese nombre")
    return {"id": nuevo_id, "nombre": data.nombre}


@app.put("/disciplinas/{disciplina_id}")
def editar_disciplina(disciplina_id: int, data: schemas.DisciplinaIn, conn=Depends(get_conn)):
    try:
        filas, _ = execute(
            conn, "UPDATE disciplina SET nombre = %s WHERE id = %s",
            (data.nombre, disciplina_id),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Ya existe una disciplina con ese nombre")
    if filas == 0 and not fetch_one(
        conn, "SELECT id FROM disciplina WHERE id = %s", (disciplina_id,)
    ):
        raise HTTPException(404, "Disciplina no encontrada")
    return {"id": disciplina_id, "nombre": data.nombre}


@app.delete("/disciplinas/{disciplina_id}")
def borrar_disciplina(disciplina_id: int, conn=Depends(get_conn)):
    usada = fetch_one(
        conn, "SELECT COUNT(*) AS n FROM actividad WHERE disciplina_id = %s",
        (disciplina_id,),
    )
    if usada["n"] > 0:
        raise HTTPException(409, "No se puede borrar: hay actividades de esta disciplina")
    filas, _ = execute(conn, "DELETE FROM disciplina WHERE id = %s", (disciplina_id,))
    if filas == 0:
        raise HTTPException(404, "Disciplina no encontrada")
    return {"ok": True}


# ===================== ESPACIOS (ABM) =====================
@app.get("/espacios")
def listar_espacios(conn=Depends(get_conn)):
    return fetch_all(conn, "SELECT id, nombre, ubicacion FROM espacio ORDER BY nombre")


@app.post("/espacios", status_code=201)
def crear_espacio(data: schemas.EspacioIn, conn=Depends(get_conn)):
    try:
        _, nuevo_id = execute(
            conn, "INSERT INTO espacio (nombre, ubicacion) VALUES (%s, %s)",
            (data.nombre, data.ubicacion),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Ya existe un espacio con ese nombre")
    return {"id": nuevo_id, "nombre": data.nombre, "ubicacion": data.ubicacion}


@app.put("/espacios/{espacio_id}")
def editar_espacio(espacio_id: int, data: schemas.EspacioIn, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM espacio WHERE id = %s", (espacio_id,)),
        "Espacio no encontrado",
    )
    try:
        execute(
            conn, "UPDATE espacio SET nombre = %s, ubicacion = %s WHERE id = %s",
            (data.nombre, data.ubicacion, espacio_id),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "Ya existe un espacio con ese nombre")
    return {"id": espacio_id, "nombre": data.nombre, "ubicacion": data.ubicacion}


@app.delete("/espacios/{espacio_id}")
def borrar_espacio(espacio_id: int, conn=Depends(get_conn)):
    usado = fetch_one(
        conn, "SELECT COUNT(*) AS n FROM actividad WHERE espacio_id = %s", (espacio_id,)
    )
    if usado["n"] > 0:
        raise HTTPException(409, "No se puede borrar: hay actividades en este espacio")
    filas, _ = execute(conn, "DELETE FROM espacio WHERE id = %s", (espacio_id,))
    if filas == 0:
        raise HTTPException(404, "Espacio no encontrado")
    return {"ok": True}


# ===================== ACTIVIDADES (ABM) =====================
SQL_ACTIVIDAD = """
    SELECT a.id, a.nombre, a.disciplina_id, d.nombre AS disciplina,
           a.espacio_id, es.nombre AS espacio,
           a.cupo_maximo, a.dia,
           TIME_FORMAT(a.hora_inicio, '%%H:%%i') AS hora_inicio,
           TIME_FORMAT(a.hora_fin, '%%H:%%i') AS hora_fin,
           a.estado,
           (SELECT COUNT(*) FROM inscripcion i
             WHERE i.actividad_id = a.id AND i.estado = 'confirmada') AS confirmados,
           (SELECT COUNT(*) FROM inscripcion i
             WHERE i.actividad_id = a.id AND i.estado = 'lista_espera') AS en_espera
    FROM actividad a
    JOIN disciplina d ON d.id = a.disciplina_id
    JOIN espacio es ON es.id = a.espacio_id
"""


@app.get("/actividades")
def listar_actividades(estado: Optional[str] = None, conn=Depends(get_conn)):
    if estado:
        return fetch_all(
            conn, SQL_ACTIVIDAD + " WHERE a.estado = %s ORDER BY a.nombre", (estado,)
        )
    return fetch_all(conn, SQL_ACTIVIDAD + " ORDER BY a.nombre")


@app.post("/actividades", status_code=201)
def crear_actividad(data: schemas.ActividadIn, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM disciplina WHERE id = %s", (data.disciplina_id,)),
        "Disciplina no encontrada",
    )
    _o_404(
        fetch_one(conn, "SELECT id FROM espacio WHERE id = %s", (data.espacio_id,)),
        "Espacio no encontrado",
    )
    _, nuevo_id = execute(
        conn,
        """
        INSERT INTO actividad
            (nombre, disciplina_id, espacio_id, cupo_maximo, dia,
             hora_inicio, hora_fin, estado)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (data.nombre, data.disciplina_id, data.espacio_id, data.cupo_maximo,
         data.dia.value, str(data.hora_inicio), str(data.hora_fin), data.estado.value),
    )
    return fetch_one(conn, SQL_ACTIVIDAD + " WHERE a.id = %s", (nuevo_id,))


@app.put("/actividades/{actividad_id}")
def editar_actividad(actividad_id: int, data: schemas.ActividadIn, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM actividad WHERE id = %s", (actividad_id,)),
        "Actividad no encontrada",
    )
    execute(
        conn,
        """
        UPDATE actividad
        SET nombre = %s, disciplina_id = %s, espacio_id = %s, cupo_maximo = %s,
            dia = %s, hora_inicio = %s, hora_fin = %s, estado = %s
        WHERE id = %s
        """,
        (data.nombre, data.disciplina_id, data.espacio_id, data.cupo_maximo,
         data.dia.value, str(data.hora_inicio), str(data.hora_fin),
         data.estado.value, actividad_id),
    )
    return fetch_one(conn, SQL_ACTIVIDAD + " WHERE a.id = %s", (actividad_id,))


@app.delete("/actividades/{actividad_id}")
def borrar_actividad(actividad_id: int, conn=Depends(get_conn)):
    inscriptos = fetch_one(
        conn, "SELECT COUNT(*) AS n FROM inscripcion WHERE actividad_id = %s",
        (actividad_id,),
    )
    if inscriptos["n"] > 0:
        raise HTTPException(
            409, "No se puede borrar: tiene inscripciones (cancelala en su lugar)"
        )
    filas, _ = execute(conn, "DELETE FROM actividad WHERE id = %s", (actividad_id,))
    if filas == 0:
        raise HTTPException(404, "Actividad no encontrada")
    return {"ok": True}


# ===================== INSCRIPCIONES =====================
@app.get("/actividades/{actividad_id}/inscripciones")
def inscripciones_de_actividad(actividad_id: int, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM actividad WHERE id = %s", (actividad_id,)),
        "Actividad no encontrada",
    )
    return fetch_all(
        conn,
        """
        SELECT i.id, i.estado, i.fecha_inscripcion,
               e.id AS estudiante_id, e.documento,
               CONCAT(e.apellido, ', ', e.nombre) AS estudiante
        FROM inscripcion i
        JOIN estudiante e ON e.id = i.estudiante_id
        WHERE i.actividad_id = %s
        ORDER BY i.estado, i.fecha_inscripcion
        """,
        (actividad_id,),
    )


@app.get("/estudiantes/{estudiante_id}/inscripciones")
def inscripciones_de_estudiante(estudiante_id: int, conn=Depends(get_conn)):
    _o_404(
        fetch_one(conn, "SELECT id FROM estudiante WHERE id = %s", (estudiante_id,)),
        "Estudiante no encontrado",
    )
    return fetch_all(
        conn,
        """
        SELECT i.id, i.estado, i.fecha_inscripcion,
               a.id AS actividad_id, a.nombre AS actividad, a.dia,
               TIME_FORMAT(a.hora_inicio, '%%H:%%i') AS hora_inicio,
               a.estado AS estado_actividad
        FROM inscripcion i
        JOIN actividad a ON a.id = i.actividad_id
        WHERE i.estudiante_id = %s
        ORDER BY i.fecha_inscripcion DESC
        """,
        (estudiante_id,),
    )


@app.post("/inscripciones", status_code=201)
def inscribir(data: schemas.InscripcionIn, conn=Depends(get_conn)):
    """Inscribe un estudiante aplicando las reglas de negocio:

    1. Solo actividades ABIERTAS aceptan inscripciones (canceladas,
       cerradas o finalizadas se rechazan).
    2. No se supera el cupo máximo de confirmados.
    3. Sin cupo, la inscripción queda en LISTA DE ESPERA.
    4. Un estudiante no puede inscribirse dos veces (UNIQUE en BD + chequeo).
    """
    _o_404(
        fetch_one(conn, "SELECT id FROM estudiante WHERE id = %s", (data.estudiante_id,)),
        "Estudiante no encontrado",
    )
    # FOR UPDATE: bloquea la actividad para evitar que dos inscripciones
    # simultáneas superen el cupo (condición de carrera).
    actividad = _o_404(
        fetch_one(
            conn,
            "SELECT id, cupo_maximo, estado FROM actividad WHERE id = %s FOR UPDATE",
            (data.actividad_id,),
        ),
        "Actividad no encontrada",
    )

    if actividad["estado"] != "abierta":
        raise HTTPException(
            409, f"La actividad está {actividad['estado']}: no acepta inscripciones"
        )

    confirmados = fetch_one(
        conn,
        """
        SELECT COUNT(*) AS n FROM inscripcion
        WHERE actividad_id = %s AND estado = 'confirmada'
        """,
        (data.actividad_id,),
    )["n"]
    estado = "confirmada" if confirmados < actividad["cupo_maximo"] else "lista_espera"

    try:
        _, nuevo_id = execute(
            conn,
            """
            INSERT INTO inscripcion (estudiante_id, actividad_id, estado)
            VALUES (%s, %s, %s)
            """,
            (data.estudiante_id, data.actividad_id, estado),
        )
    except pymysql.err.IntegrityError:
        raise HTTPException(409, "El estudiante ya está inscripto en esta actividad")

    return {"id": nuevo_id, "estado": estado}


@app.delete("/inscripciones/{inscripcion_id}")
def dar_de_baja(inscripcion_id: int, conn=Depends(get_conn)):
    """Baja de una inscripción. Si se libera un cupo confirmado en una
    actividad abierta, se promueve automáticamente al primero de la lista
    de espera (orden por fecha de inscripción)."""
    ins = _o_404(
        fetch_one(
            conn,
            "SELECT id, actividad_id, estado FROM inscripcion WHERE id = %s",
            (inscripcion_id,),
        ),
        "Inscripción no encontrada",
    )
    execute(conn, "DELETE FROM inscripcion WHERE id = %s", (inscripcion_id,))

    promovido = None
    if ins["estado"] == "confirmada":
        actividad = fetch_one(
            conn, "SELECT estado FROM actividad WHERE id = %s FOR UPDATE",
            (ins["actividad_id"],),
        )
        if actividad and actividad["estado"] == "abierta":
            siguiente = fetch_one(
                conn,
                """
                SELECT id FROM inscripcion
                WHERE actividad_id = %s AND estado = 'lista_espera'
                ORDER BY fecha_inscripcion
                LIMIT 1
                """,
                (ins["actividad_id"],),
            )
            if siguiente:
                execute(
                    conn,
                    "UPDATE inscripcion SET estado = 'confirmada' WHERE id = %s",
                    (siguiente["id"],),
                )
                promovido = siguiente["id"]

    return {"ok": True, "promovido_de_lista_espera": promovido}


# ===================== ASISTENCIAS =====================
@app.get("/actividades/{actividad_id}/asistencias")
def planilla_asistencia(actividad_id: int, fecha: str, conn=Depends(get_conn)):
    """Planilla de una fecha: estudiantes CONFIRMADOS con su asistencia
    (presente / ausente / sin marcar)."""
    _o_404(
        fetch_one(conn, "SELECT id FROM actividad WHERE id = %s", (actividad_id,)),
        "Actividad no encontrada",
    )
    return fetch_all(
        conn,
        """
        SELECT i.id AS inscripcion_id,
               CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
               e.documento,
               s.presente
        FROM inscripcion i
        JOIN estudiante e ON e.id = i.estudiante_id
        LEFT JOIN asistencia s ON s.inscripcion_id = i.id AND s.fecha = %s
        WHERE i.actividad_id = %s AND i.estado = 'confirmada'
        ORDER BY estudiante
        """,
        (fecha, actividad_id),
    )


@app.post("/asistencias", status_code=201)
def marcar_asistencia(data: schemas.AsistenciaIn, conn=Depends(get_conn)):
    """Regla de negocio 5: solo se registra asistencia de inscripciones
    CONFIRMADAS. Es un upsert por (inscripción, fecha)."""
    ins = _o_404(
        fetch_one(
            conn, "SELECT id, estado FROM inscripcion WHERE id = %s",
            (data.inscripcion_id,),
        ),
        "Inscripción no encontrada",
    )
    if ins["estado"] != "confirmada":
        raise HTTPException(
            409, "Solo se registra asistencia de estudiantes confirmados"
        )
    execute(
        conn,
        """
        INSERT INTO asistencia (inscripcion_id, fecha, presente)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE presente = VALUES(presente)
        """,
        (data.inscripcion_id, data.fecha, data.presente),
    )
    return {"ok": True}


# ===================== REPORTES (consultas requeridas) =====================
@app.get("/reportes/mas-inscriptos")
def rep_mas_inscriptos(conn=Depends(get_conn)):
    """1. Actividades con mayor cantidad de inscriptos confirmados."""
    return fetch_all(
        conn,
        """
        SELECT a.id, a.nombre, d.nombre AS disciplina,
               COUNT(i.id) AS inscriptos_confirmados
        FROM actividad a
        JOIN disciplina d ON d.id = a.disciplina_id
        LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
        GROUP BY a.id, a.nombre, d.nombre
        ORDER BY inscriptos_confirmados DESC, a.nombre
        """,
    )


@app.get("/reportes/cupos-disponibles")
def rep_cupos_disponibles(conn=Depends(get_conn)):
    """2. Actividades abiertas con cupos disponibles."""
    return fetch_all(
        conn,
        """
        SELECT a.id, a.nombre, a.cupo_maximo,
               COUNT(i.id) AS inscriptos_confirmados,
               a.cupo_maximo - COUNT(i.id) AS cupos_disponibles
        FROM actividad a
        LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
        WHERE a.estado = 'abierta'
        GROUP BY a.id, a.nombre, a.cupo_maximo
        HAVING cupos_disponibles > 0
        ORDER BY cupos_disponibles DESC
        """,
    )


@app.get("/reportes/inscriptos-por-disciplina")
def rep_por_disciplina(conn=Depends(get_conn)):
    """3. Cantidad de inscriptos por disciplina deportiva."""
    return fetch_all(
        conn,
        """
        SELECT d.nombre AS disciplina, COUNT(i.id) AS inscriptos
        FROM disciplina d
        LEFT JOIN actividad a ON a.disciplina_id = d.id
        LEFT JOIN inscripcion i ON i.actividad_id = a.id
        GROUP BY d.id, d.nombre
        ORDER BY inscriptos DESC, d.nombre
        """,
    )


@app.get("/reportes/inscriptos-por-carrera")
def rep_por_carrera(conn=Depends(get_conn)):
    """4a. Cantidad de inscriptos por carrera."""
    return fetch_all(
        conn,
        """
        SELECT c.nombre AS carrera, f.nombre AS facultad, COUNT(i.id) AS inscriptos
        FROM carrera c
        JOIN facultad f ON f.id = c.facultad_id
        LEFT JOIN estudiante e ON e.carrera_id = c.id
        LEFT JOIN inscripcion i ON i.estudiante_id = e.id
        GROUP BY c.id, c.nombre, f.nombre
        ORDER BY inscriptos DESC, carrera
        """,
    )


@app.get("/reportes/inscriptos-por-facultad")
def rep_por_facultad(conn=Depends(get_conn)):
    """4b. Cantidad de inscriptos por facultad."""
    return fetch_all(
        conn,
        """
        SELECT f.nombre AS facultad, COUNT(i.id) AS inscriptos
        FROM facultad f
        LEFT JOIN carrera c ON c.facultad_id = f.id
        LEFT JOIN estudiante e ON e.carrera_id = c.id
        LEFT JOIN inscripcion i ON i.estudiante_id = e.id
        GROUP BY f.id, f.nombre
        ORDER BY inscriptos DESC, facultad
        """,
    )


@app.get("/reportes/ocupacion")
def rep_ocupacion(conn=Depends(get_conn)):
    """5. Porcentaje de ocupación de cada actividad."""
    return fetch_all(
        conn,
        """
        SELECT a.id, a.nombre, a.cupo_maximo,
               COUNT(i.id) AS inscriptos_confirmados,
               ROUND(COUNT(i.id) * 100.0 / a.cupo_maximo, 1) AS porcentaje_ocupacion
        FROM actividad a
        LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
        GROUP BY a.id, a.nombre, a.cupo_maximo
        ORDER BY porcentaje_ocupacion DESC
        """,
    )


@app.get("/reportes/asistencia-por-actividad")
def rep_asistencia(conn=Depends(get_conn)):
    """6. Porcentaje de asistencia por actividad."""
    return fetch_all(
        conn,
        """
        SELECT a.id, a.nombre,
               COUNT(s.id) AS registros_asistencia,
               CAST(SUM(s.presente) AS SIGNED) AS presentes,
               ROUND(SUM(s.presente) * 100.0 / COUNT(s.id), 1) AS porcentaje_asistencia
        FROM actividad a
        JOIN inscripcion i ON i.actividad_id = a.id
        JOIN asistencia s ON s.inscripcion_id = i.id
        GROUP BY a.id, a.nombre
        ORDER BY porcentaje_asistencia DESC
        """,
    )


@app.get("/reportes/inasistencias")
def rep_inasistencias(minimo: int = 3, conn=Depends(get_conn)):
    """7. Estudiantes con tres (o `minimo`) o más inasistencias."""
    return fetch_all(
        conn,
        """
        SELECT e.id, e.documento,
               CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
               COUNT(s.id) AS inasistencias
        FROM estudiante e
        JOIN inscripcion i ON i.estudiante_id = e.id
        JOIN asistencia s ON s.inscripcion_id = i.id AND s.presente = FALSE
        GROUP BY e.id, e.documento, e.apellido, e.nombre
        HAVING inasistencias >= %s
        ORDER BY inasistencias DESC
        """,
        (minimo,),
    )


# --------- Consultas adicionales propuestas por el equipo ---------
@app.get("/reportes/lista-espera")
def rep_lista_espera(conn=Depends(get_conn)):
    """8a. Lista de espera por actividad en orden de prioridad."""
    return fetch_all(
        conn,
        """
        SELECT a.nombre AS actividad,
               CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
               i.fecha_inscripcion,
               ROW_NUMBER() OVER (
                   PARTITION BY a.id ORDER BY i.fecha_inscripcion
               ) AS posicion_en_espera
        FROM inscripcion i
        JOIN actividad a ON a.id = i.actividad_id
        JOIN estudiante e ON e.id = i.estudiante_id
        WHERE i.estado = 'lista_espera'
        ORDER BY a.nombre, posicion_en_espera
        """,
    )


@app.get("/reportes/estudiantes-sin-inscripcion")
def rep_sin_inscripcion(conn=Depends(get_conn)):
    """8b. Estudiantes que no se inscribieron a ninguna actividad."""
    return fetch_all(
        conn,
        """
        SELECT e.id, e.documento,
               CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
               c.nombre AS carrera, f.nombre AS facultad
        FROM estudiante e
        JOIN carrera c ON c.id = e.carrera_id
        JOIN facultad f ON f.id = c.facultad_id
        LEFT JOIN inscripcion i ON i.estudiante_id = e.id
        WHERE i.id IS NULL
        ORDER BY estudiante
        """,
    )


@app.get("/reportes/uso-espacios")
def rep_uso_espacios(conn=Depends(get_conn)):
    """8c. Actividades y horas semanales ocupadas por espacio deportivo."""
    return fetch_all(
        conn,
        """
        SELECT es.nombre AS espacio,
               COUNT(a.id) AS actividades,
               COALESCE(ROUND(
                   SUM(TIME_TO_SEC(TIMEDIFF(a.hora_fin, a.hora_inicio))) / 3600, 1
               ), 0) AS horas_semanales
        FROM espacio es
        LEFT JOIN actividad a ON a.espacio_id = es.id AND a.estado <> 'cancelada'
        GROUP BY es.id, es.nombre
        ORDER BY horas_semanales DESC
        """,
    )
