import { useEffect, useState } from "react";
import { api } from "../api";
import type { Carrera, Estudiante } from "../types";

const FORM_VACIO = {
  documento: "",
  nombre: "",
  apellido: "",
  correo: "",
  carrera_id: "",
};

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      const [est, car] = await Promise.all([api.estudiantes(), api.carreras()]);
      setEstudiantes(est);
      setCarreras(car);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Agrupa las carreras por facultad para armar los <optgroup>
  const facultades = Array.from(new Set(carreras.map((c) => c.facultad)));

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const data = {
      documento: form.documento,
      nombre: form.nombre,
      apellido: form.apellido,
      correo: form.correo,
      carrera_id: Number(form.carrera_id),
    };
    try {
      if (editandoId === null) {
        await api.crearEstudiante(data);
      } else {
        await api.editarEstudiante(editandoId, data);
      }
      setForm(FORM_VACIO);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function editar(est: Estudiante) {
    setEditandoId(est.id);
    setForm({
      documento: est.documento,
      nombre: est.nombre,
      apellido: est.apellido,
      correo: est.correo,
      carrera_id: String(est.carrera_id),
    });
  }

  async function borrar(est: Estudiante) {
    if (!confirm(`¿Eliminar a ${est.apellido}, ${est.nombre}?`)) return;
    setError("");
    try {
      await api.borrarEstudiante(est.id);
      await cargar();
    } catch (e) {
      // El backend devuelve 409 si el estudiante tiene inscripciones
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>Estudiantes</h2>
      {error && <div className="alert-error">{error}</div>}

      <form className="form-inline" onSubmit={guardar}>
        <input
          placeholder="Documento"
          value={form.documento}
          onChange={(e) => setForm({ ...form, documento: e.target.value })}
          required
        />
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          placeholder="Apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
        />
        <select
          value={form.carrera_id}
          onChange={(e) => setForm({ ...form, carrera_id: e.target.value })}
          required
        >
          <option value="">Carrera…</option>
          {facultades.map((f) => (
            <optgroup key={f} label={f}>
              {carreras
                .filter((c) => c.facultad === f)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <button type="submit">{editandoId === null ? "Crear" : "Guardar cambios"}</button>
        {editandoId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setForm(FORM_VACIO);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Apellido y nombre</th>
            <th>Correo</th>
            <th>Carrera</th>
            <th>Facultad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((est) => (
            <tr key={est.id}>
              <td>{est.documento}</td>
              <td>
                {est.apellido}, {est.nombre}
              </td>
              <td>{est.correo}</td>
              <td>{est.carrera}</td>
              <td>{est.facultad}</td>
              <td>
                <button onClick={() => editar(est)}>Editar</button>{" "}
                <button className="ghost-danger" onClick={() => borrar(est)}>
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {estudiantes.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No hay estudiantes cargados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
