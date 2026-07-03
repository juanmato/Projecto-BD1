-- ============================================================================
-- Consultas requeridas — Obligatorio Base de Datos I - 2026
-- Sistema de Gestión de Actividades Deportivas Universitarias
--
-- Todas las consultas están también expuestas como endpoints REST en el
-- backend (/reportes/...), implementadas con este mismo SQL.
-- ============================================================================

USE deportes_ucu;

-- ----------------------------------------------------------------------------
-- 1. Actividades con mayor cantidad de inscriptos confirmados.
-- ----------------------------------------------------------------------------
SELECT a.id,
       a.nombre,
       d.nombre AS disciplina,
       COUNT(i.id) AS inscriptos_confirmados
FROM actividad a
JOIN disciplina d ON d.id = a.disciplina_id
LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
GROUP BY a.id, a.nombre, d.nombre
ORDER BY inscriptos_confirmados DESC, a.nombre;

-- ----------------------------------------------------------------------------
-- 2. Actividades con cupos disponibles (solo tiene sentido para abiertas).
-- ----------------------------------------------------------------------------
SELECT a.id,
       a.nombre,
       a.cupo_maximo,
       COUNT(i.id) AS inscriptos_confirmados,
       a.cupo_maximo - COUNT(i.id) AS cupos_disponibles
FROM actividad a
LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
WHERE a.estado = 'abierta'
GROUP BY a.id, a.nombre, a.cupo_maximo
HAVING cupos_disponibles > 0
ORDER BY cupos_disponibles DESC;

-- ----------------------------------------------------------------------------
-- 3. Cantidad de inscriptos por disciplina deportiva.
-- ----------------------------------------------------------------------------
SELECT d.nombre AS disciplina,
       COUNT(i.id) AS inscriptos
FROM disciplina d
LEFT JOIN actividad a ON a.disciplina_id = d.id
LEFT JOIN inscripcion i ON i.actividad_id = a.id
GROUP BY d.id, d.nombre
ORDER BY inscriptos DESC, d.nombre;

-- ----------------------------------------------------------------------------
-- 4. Cantidad de inscriptos por carrera y por facultad.
-- ----------------------------------------------------------------------------
-- 4a. Por carrera:
SELECT c.nombre AS carrera,
       f.nombre AS facultad,
       COUNT(i.id) AS inscriptos
FROM carrera c
JOIN facultad f ON f.id = c.facultad_id
LEFT JOIN estudiante e ON e.carrera_id = c.id
LEFT JOIN inscripcion i ON i.estudiante_id = e.id
GROUP BY c.id, c.nombre, f.nombre
ORDER BY inscriptos DESC, carrera;

-- 4b. Por facultad:
SELECT f.nombre AS facultad,
       COUNT(i.id) AS inscriptos
FROM facultad f
LEFT JOIN carrera c ON c.facultad_id = f.id
LEFT JOIN estudiante e ON e.carrera_id = c.id
LEFT JOIN inscripcion i ON i.estudiante_id = e.id
GROUP BY f.id, f.nombre
ORDER BY inscriptos DESC, facultad;

-- ----------------------------------------------------------------------------
-- 5. Porcentaje de ocupación de cada actividad
--    (confirmados / cupo_maximo * 100).
-- ----------------------------------------------------------------------------
SELECT a.id,
       a.nombre,
       a.cupo_maximo,
       COUNT(i.id) AS inscriptos_confirmados,
       ROUND(COUNT(i.id) * 100.0 / a.cupo_maximo, 1) AS porcentaje_ocupacion
FROM actividad a
LEFT JOIN inscripcion i ON i.actividad_id = a.id AND i.estado = 'confirmada'
GROUP BY a.id, a.nombre, a.cupo_maximo
ORDER BY porcentaje_ocupacion DESC;

-- ----------------------------------------------------------------------------
-- 6. Porcentaje de asistencia por actividad
--    (presentes / asistencias registradas * 100).
-- ----------------------------------------------------------------------------
SELECT a.id,
       a.nombre,
       COUNT(s.id) AS registros_asistencia,
       SUM(s.presente) AS presentes,
       ROUND(SUM(s.presente) * 100.0 / COUNT(s.id), 1) AS porcentaje_asistencia
FROM actividad a
JOIN inscripcion i ON i.actividad_id = a.id
JOIN asistencia s ON s.inscripcion_id = i.id
GROUP BY a.id, a.nombre
ORDER BY porcentaje_asistencia DESC;

-- ----------------------------------------------------------------------------
-- 7. Estudiantes con tres o más inasistencias registradas.
-- ----------------------------------------------------------------------------
SELECT e.id,
       e.documento,
       CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
       COUNT(s.id) AS inasistencias
FROM estudiante e
JOIN inscripcion i ON i.estudiante_id = e.id
JOIN asistencia s ON s.inscripcion_id = i.id AND s.presente = FALSE
GROUP BY e.id, e.documento, e.apellido, e.nombre
HAVING inasistencias >= 3
ORDER BY inasistencias DESC;

-- ============================================================================
-- 8. Tres consultas adicionales propuestas por el equipo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8a. Lista de espera por actividad, en orden de prioridad
--     (quién entra primero si se libera un cupo: el orden de las filas
--     dentro de cada actividad es la posición en la espera).
-- ----------------------------------------------------------------------------
SELECT a.nombre AS actividad,
       CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
       i.fecha_inscripcion
FROM inscripcion i
JOIN actividad a ON a.id = i.actividad_id
JOIN estudiante e ON e.id = i.estudiante_id
WHERE i.estado = 'lista_espera'
ORDER BY a.nombre, i.fecha_inscripcion;

-- ----------------------------------------------------------------------------
-- 8b. Estudiantes sin ninguna inscripción (población a captar
--     en campañas de difusión de deportes).
-- ----------------------------------------------------------------------------
SELECT e.id,
       e.documento,
       CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
       c.nombre AS carrera,
       f.nombre AS facultad
FROM estudiante e
JOIN carrera c ON c.id = e.carrera_id
JOIN facultad f ON f.id = c.facultad_id
LEFT JOIN inscripcion i ON i.estudiante_id = e.id
WHERE i.id IS NULL
ORDER BY estudiante;

-- ----------------------------------------------------------------------------
-- 8c. Uso de los espacios deportivos: cantidad de actividades no canceladas
--     y horas semanales ocupadas por espacio (planificación de infraestructura).
-- ----------------------------------------------------------------------------
SELECT es.nombre AS espacio,
       COUNT(a.id) AS actividades,
       COALESCE(ROUND(SUM(TIME_TO_SEC(TIMEDIFF(a.hora_fin, a.hora_inicio))) / 3600, 1), 0)
           AS horas_semanales
FROM espacio es
LEFT JOIN actividad a ON a.espacio_id = es.id AND a.estado <> 'cancelada'
GROUP BY es.id, es.nombre
ORDER BY horas_semanales DESC;
