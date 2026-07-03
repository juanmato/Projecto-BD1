-- ============================================================================
-- Sistema de Gestión de Actividades Deportivas Universitarias
-- Obligatorio Base de Datos I - 2026
--
-- Script completo de creación de base de datos y datos maestros.
-- Motor: MySQL 8 (InnoDB, utf8mb4)
-- ============================================================================

-- El archivo está guardado en UTF-8; esto asegura que el cliente que lo
-- ejecute (incluido el init de Docker) lo interprete correctamente.
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS deportes_ucu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE deportes_ucu;

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------

-- Facultades de la universidad.
CREATE TABLE facultad (
    id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    CONSTRAINT uq_facultad_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Carreras; cada carrera pertenece a una facultad.
CREATE TABLE carrera (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    facultad_id INT UNSIGNED NOT NULL,
    CONSTRAINT fk_carrera_facultad FOREIGN KEY (facultad_id) REFERENCES facultad (id),
    CONSTRAINT uq_carrera_nombre_facultad UNIQUE (nombre, facultad_id)
) ENGINE = InnoDB;

-- Estudiantes: únicos usuarios del sistema.
CREATE TABLE estudiante (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    documento  VARCHAR(20)  NOT NULL,
    nombre     VARCHAR(80)  NOT NULL,
    apellido   VARCHAR(80)  NOT NULL,
    correo     VARCHAR(160) NOT NULL,
    carrera_id INT UNSIGNED NOT NULL,
    CONSTRAINT uq_estudiante_documento UNIQUE (documento),
    CONSTRAINT uq_estudiante_correo UNIQUE (correo),
    CONSTRAINT fk_estudiante_carrera FOREIGN KEY (carrera_id) REFERENCES carrera (id),
    CONSTRAINT ck_estudiante_correo CHECK (correo LIKE '%_@%_.%_')
) ENGINE = InnoDB;

-- Disciplinas deportivas ofrecidas (fútbol, yoga, etc.).
CREATE TABLE disciplina (
    id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    CONSTRAINT uq_disciplina_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Espacios físicos donde se realizan las actividades.
CREATE TABLE espacio (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(200) NULL,
    CONSTRAINT uq_espacio_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Actividades concretas creadas a partir de una disciplina.
CREATE TABLE actividad (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(160) NOT NULL,
    disciplina_id INT UNSIGNED NOT NULL,
    espacio_id    INT UNSIGNED NOT NULL,
    cupo_maximo   INT UNSIGNED NOT NULL,
    dia           ENUM ('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
    hora_inicio   TIME NOT NULL,
    hora_fin      TIME NOT NULL,
    estado        ENUM ('abierta','cerrada','finalizada','cancelada') NOT NULL DEFAULT 'abierta',
    CONSTRAINT fk_actividad_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina (id),
    CONSTRAINT fk_actividad_espacio FOREIGN KEY (espacio_id) REFERENCES espacio (id),
    CONSTRAINT ck_actividad_cupo CHECK (cupo_maximo > 0),
    CONSTRAINT ck_actividad_horario CHECK (hora_fin > hora_inicio)
) ENGINE = InnoDB;

-- Inscripciones de estudiantes a actividades.
-- estado: 'confirmada' si había cupo al inscribirse, 'lista_espera' si no.
-- La UNIQUE (estudiante_id, actividad_id) garantiza a nivel de BD que un
-- estudiante no pueda inscribirse dos veces a la misma actividad.
CREATE TABLE inscripcion (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    estudiante_id     INT UNSIGNED NOT NULL,
    actividad_id      INT UNSIGNED NOT NULL,
    estado            ENUM ('confirmada','lista_espera') NOT NULL,
    fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inscripcion_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante (id),
    CONSTRAINT fk_inscripcion_actividad FOREIGN KEY (actividad_id) REFERENCES actividad (id),
    CONSTRAINT uq_inscripcion_estudiante_actividad UNIQUE (estudiante_id, actividad_id)
) ENGINE = InnoDB;

-- Asistencias: una por inscripción y fecha.
-- Solo se registran asistencias de inscripciones confirmadas (regla validada
-- en el backend; la BD garantiza unicidad por fecha).
CREATE TABLE asistencia (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT UNSIGNED NOT NULL,
    fecha          DATE NOT NULL,
    presente       BOOLEAN NOT NULL,
    CONSTRAINT fk_asistencia_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripcion (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_asistencia_inscripcion_fecha UNIQUE (inscripcion_id, fecha)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Datos maestros
-- ----------------------------------------------------------------------------

INSERT INTO facultad (nombre) VALUES
    ('Facultad de Ingeniería'),
    ('Facultad de Ciencias Económicas'),
    ('Facultad de Derecho'),
    ('Facultad de Medicina');

INSERT INTO carrera (nombre, facultad_id) VALUES
    ('Ingeniería en Computación',  (SELECT id FROM facultad WHERE nombre = 'Facultad de Ingeniería')),
    ('Ingeniería Civil',           (SELECT id FROM facultad WHERE nombre = 'Facultad de Ingeniería')),
    ('Contador Público',           (SELECT id FROM facultad WHERE nombre = 'Facultad de Ciencias Económicas')),
    ('Economía',                   (SELECT id FROM facultad WHERE nombre = 'Facultad de Ciencias Económicas')),
    ('Abogacía',                   (SELECT id FROM facultad WHERE nombre = 'Facultad de Derecho')),
    ('Doctor en Medicina',         (SELECT id FROM facultad WHERE nombre = 'Facultad de Medicina'));

INSERT INTO disciplina (nombre) VALUES
    ('Fútbol'),
    ('Básquetbol'),
    ('Atletismo'),
    ('Vóleibol'),
    ('Yoga'),
    ('Funcional'),
    ('Gimnasio');

INSERT INTO espacio (nombre, ubicacion) VALUES
    ('Cancha 1',            'Campus central - exterior'),
    ('Cancha 2',            'Campus central - exterior'),
    ('Gimnasio Central',    'Edificio polideportivo - planta baja'),
    ('Sala Multiuso',       'Edificio polideportivo - piso 1'),
    ('Pista de Atletismo',  'Campus central - exterior');

-- Actividades de ejemplo (datos de prueba para desarrollo y demo).
INSERT INTO actividad (nombre, disciplina_id, espacio_id, cupo_maximo, dia, hora_inicio, hora_fin, estado) VALUES
    ('Fútbol recreativo mixto',
     (SELECT id FROM disciplina WHERE nombre = 'Fútbol'),
     (SELECT id FROM espacio WHERE nombre = 'Cancha 1'),
     22, 'lunes', '18:00', '20:00', 'abierta'),
    ('Atletismo inicial',
     (SELECT id FROM disciplina WHERE nombre = 'Atletismo'),
     (SELECT id FROM espacio WHERE nombre = 'Pista de Atletismo'),
     15, 'martes', '07:30', '09:00', 'abierta'),
    ('Funcional turno mañana',
     (SELECT id FROM disciplina WHERE nombre = 'Funcional'),
     (SELECT id FROM espacio WHERE nombre = 'Sala Multiuso'),
     3, 'miercoles', '08:00', '09:00', 'abierta'),
    ('Yoga mediodía',
     (SELECT id FROM disciplina WHERE nombre = 'Yoga'),
     (SELECT id FROM espacio WHERE nombre = 'Sala Multiuso'),
     12, 'jueves', '12:00', '13:00', 'abierta'),
    ('Básquetbol intermedio',
     (SELECT id FROM disciplina WHERE nombre = 'Básquetbol'),
     (SELECT id FROM espacio WHERE nombre = 'Gimnasio Central'),
     10, 'viernes', '19:00', '21:00', 'cerrada'),
    ('Vóleibol verano',
     (SELECT id FROM disciplina WHERE nombre = 'Vóleibol'),
     (SELECT id FROM espacio WHERE nombre = 'Gimnasio Central'),
     12, 'sabado', '10:00', '12:00', 'finalizada');

-- Estudiantes de ejemplo.
INSERT INTO estudiante (documento, nombre, apellido, correo, carrera_id) VALUES
    ('51234567', 'Ana',    'López',     'ana.lopez@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Ingeniería en Computación')),
    ('52345678', 'Bruno',  'Díaz',      'bruno.diaz@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Ingeniería en Computación')),
    ('53456789', 'Carla',  'Ruiz',      'carla.ruiz@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Contador Público')),
    ('54567890', 'Diego',  'Fernández', 'diego.fernandez@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Abogacía')),
    ('55678901', 'Elena',  'Martínez',  'elena.martinez@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Doctor en Medicina')),
    ('56789012', 'Franco', 'Silva',     'franco.silva@estudiantes.edu.uy',
        (SELECT id FROM carrera WHERE nombre = 'Economía'));

-- Inscripciones de ejemplo.
-- "Funcional turno mañana" tiene cupo 3: Ana, Bruno y Carla quedan confirmados
-- y Diego queda en lista de espera.
INSERT INTO inscripcion (estudiante_id, actividad_id, estado, fecha_inscripcion) VALUES
    ((SELECT id FROM estudiante WHERE documento = '51234567'),
     (SELECT id FROM actividad WHERE nombre = 'Funcional turno mañana'), 'confirmada',   '2026-03-02 09:00:00'),
    ((SELECT id FROM estudiante WHERE documento = '52345678'),
     (SELECT id FROM actividad WHERE nombre = 'Funcional turno mañana'), 'confirmada',   '2026-03-02 09:05:00'),
    ((SELECT id FROM estudiante WHERE documento = '53456789'),
     (SELECT id FROM actividad WHERE nombre = 'Funcional turno mañana'), 'confirmada',   '2026-03-02 09:10:00'),
    ((SELECT id FROM estudiante WHERE documento = '54567890'),
     (SELECT id FROM actividad WHERE nombre = 'Funcional turno mañana'), 'lista_espera', '2026-03-02 09:15:00'),
    ((SELECT id FROM estudiante WHERE documento = '51234567'),
     (SELECT id FROM actividad WHERE nombre = 'Fútbol recreativo mixto'), 'confirmada',  '2026-03-03 10:00:00'),
    ((SELECT id FROM estudiante WHERE documento = '55678901'),
     (SELECT id FROM actividad WHERE nombre = 'Fútbol recreativo mixto'), 'confirmada',  '2026-03-03 10:30:00'),
    ((SELECT id FROM estudiante WHERE documento = '56789012'),
     (SELECT id FROM actividad WHERE nombre = 'Atletismo inicial'),       'confirmada',  '2026-03-04 11:00:00');

-- Asistencias de ejemplo (solo de inscripciones confirmadas).
INSERT INTO asistencia (inscripcion_id, fecha, presente) VALUES
    -- Funcional turno mañana, miércoles 2026-03-04
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '51234567' AND a.nombre = 'Funcional turno mañana'), '2026-03-04', TRUE),
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '52345678' AND a.nombre = 'Funcional turno mañana'), '2026-03-04', FALSE),
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '53456789' AND a.nombre = 'Funcional turno mañana'), '2026-03-04', TRUE),
    -- Funcional turno mañana, miércoles 2026-03-11
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '51234567' AND a.nombre = 'Funcional turno mañana'), '2026-03-11', TRUE),
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '52345678' AND a.nombre = 'Funcional turno mañana'), '2026-03-11', FALSE),
    -- Funcional turno mañana, miércoles 2026-03-18
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '52345678' AND a.nombre = 'Funcional turno mañana'), '2026-03-18', FALSE),
    -- Fútbol recreativo mixto, lunes 2026-03-09
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '51234567' AND a.nombre = 'Fútbol recreativo mixto'), '2026-03-09', TRUE),
    ((SELECT i.id FROM inscripcion i
       JOIN estudiante e ON e.id = i.estudiante_id
       JOIN actividad a ON a.id = i.actividad_id
      WHERE e.documento = '55678901' AND a.nombre = 'Fútbol recreativo mixto'), '2026-03-09', FALSE);
