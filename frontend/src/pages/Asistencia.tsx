import { useEffect, useState } from "react";
import { api } from "../api";
import type { Actividad, AsistenciaFila } from "../types";

// Fecha de hoy en formato YYYY-MM-DD para el input date
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function Asistencia() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadId, setActividadId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [filas, setFilas] = useState<AsistenciaFila[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .actividades()
      .then(setActividades)
      .catch((e) => setError((e as Error).message));
  }, []);

  // Carga la planilla cuando hay actividad y fecha elegidas
  async function cargarPlanilla(actId: string, f: string) {
    if (!actId || !f) {
      setFilas([]);
      return;
    }
    try {
      setFilas(await api.asistencias(Number(actId), f));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    setError("");
    cargarPlanilla(actividadId, fecha);
  }, [actividadId, fecha]);

  async function marcar(fila: AsistenciaFila, presente: boolean) {
    setError("");
    try {
      await api.marcarAsistencia(fila.inscripcion_id, fecha, presente);
      await cargarPlanilla(actividadId, fecha);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>Asistencia</h2>
      {error && <div className="alert-error">{error}</div>}

      <div className="form-inline">
        <select value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
          <option value="">Elegí una actividad…</option>
          {actividades.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} — {a.dia} {a.hora_inicio}
            </option>
          ))}
        </select>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      {actividadId && (
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Documento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.inscripcion_id}>
                <td>{f.estudiante}</td>
                <td>{f.documento}</td>
                <td>
                  {f.presente === true && <span className="badge ok">Presente</span>}
                  {f.presente === false && <span className="badge no">Ausente</span>}
                  {f.presente === null && <span className="badge pend">Sin marcar</span>}
                </td>
                <td>
                  <button onClick={() => marcar(f, true)}>Presente</button>{" "}
                  <button className="ghost-danger" onClick={() => marcar(f, false)}>
                    Ausente
                  </button>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No hay inscriptos confirmados en esta actividad.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
