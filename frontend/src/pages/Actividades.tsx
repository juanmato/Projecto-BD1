import { useEffect, useState } from "react";
import { api } from "../api";
import type {
  Actividad,
  ActividadInput,
  Dia,
  Disciplina,
  Espacio,
  EstadoActividad,
} from "../types";

const DIAS: Dia[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const ESTADOS: EstadoActividad[] = ["abierta", "cerrada", "finalizada", "cancelada"];

// Clase de badge según el estado de la actividad
const BADGE_ESTADO: Record<EstadoActividad, string> = {
  abierta: "badge ok",
  cerrada: "badge pend",
  finalizada: "badge rol",
  cancelada: "badge no",
};

// Formulario vacío para el alta
const FORM_VACIO = {
  nombre: "",
  disciplina_id: "",
  espacio_id: "",
  cupo_maximo: "",
  dia: "lunes" as Dia,
  hora_inicio: "",
  hora_fin: "",
  estado: "abierta" as EstadoActividad,
};

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Carga inicial: actividades + catálogos para los selects
  async function cargar() {
    try {
      const [acts, dis, esp] = await Promise.all([
        api.actividades(),
        api.disciplinas(),
        api.espacios(),
      ]);
      setActividades(acts);
      setDisciplinas(dis);
      setEspacios(esp);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const data: ActividadInput = {
      nombre: form.nombre,
      disciplina_id: Number(form.disciplina_id),
      espacio_id: Number(form.espacio_id),
      cupo_maximo: Number(form.cupo_maximo),
      dia: form.dia,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      estado: form.estado,
    };
    try {
      if (editandoId === null) {
        await api.crearActividad(data);
      } else {
        await api.editarActividad(editandoId, data);
      }
      setForm(FORM_VACIO);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Pasa los datos de una actividad al formulario para editarla
  function editar(a: Actividad) {
    setEditandoId(a.id);
    setForm({
      nombre: a.nombre,
      disciplina_id: String(a.disciplina_id),
      espacio_id: String(a.espacio_id),
      cupo_maximo: String(a.cupo_maximo),
      dia: a.dia,
      hora_inicio: a.hora_inicio,
      hora_fin: a.hora_fin,
      estado: a.estado,
    });
  }

  async function borrar(a: Actividad) {
    if (!confirm(`¿Eliminar la actividad "${a.nombre}"?`)) return;
    setError("");
    try {
      await api.borrarActividad(a.id);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>Actividades deportivas</h2>
      {error && <div className="alert-error">{error}</div>}

      <form className="form-inline" onSubmit={guardar}>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <select
          value={form.disciplina_id}
          onChange={(e) => setForm({ ...form, disciplina_id: e.target.value })}
          required
        >
          <option value="">Disciplina…</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <select
          value={form.espacio_id}
          onChange={(e) => setForm({ ...form, espacio_id: e.target.value })}
          required
        >
          <option value="">Espacio…</option>
          {espacios.map((e2) => (
            <option key={e2.id} value={e2.id}>
              {e2.nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          placeholder="Cupo"
          style={{ width: 90 }}
          value={form.cupo_maximo}
          onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })}
          required
        />
        <select
          value={form.dia}
          onChange={(e) => setForm({ ...form, dia: e.target.value as Dia })}
        >
          {DIAS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={form.hora_inicio}
          onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
          required
        />
        <input
          type="time"
          value={form.hora_fin}
          onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
          required
        />
        <select
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoActividad })}
        >
          {ESTADOS.map((es) => (
            <option key={es} value={es}>
              {es}
            </option>
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
            <th>Nombre</th>
            <th>Disciplina</th>
            <th>Espacio</th>
            <th>Día y horario</th>
            <th>Cupo</th>
            <th>Confirmados</th>
            <th>En espera</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {actividades.map((a) => (
            <tr key={a.id}>
              <td>{a.nombre}</td>
              <td>{a.disciplina}</td>
              <td>{a.espacio}</td>
              <td>
                {a.dia} {a.hora_inicio}–{a.hora_fin}
              </td>
              <td>{a.cupo_maximo}</td>
              <td>{a.confirmados}</td>
              <td>{a.en_espera}</td>
              <td>
                <span className={BADGE_ESTADO[a.estado]}>{a.estado}</span>
              </td>
              <td>
                <button onClick={() => editar(a)}>Editar</button>{" "}
                <button className="ghost-danger" onClick={() => borrar(a)}>
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {actividades.length === 0 && (
            <tr>
              <td colSpan={9} className="muted">
                No hay actividades cargadas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
