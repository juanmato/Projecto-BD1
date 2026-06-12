import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { Actividad, AsistenciaHistorial, Usuario } from "../types";

export default function Estudiante({ usuario }: { usuario: Usuario }) {
  const [disponibles, setDisponibles] = useState<Actividad[]>([]);
  const [historial, setHistorial] = useState<AsistenciaHistorial[]>([]);
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    const [disp, hist] = await Promise.all([
      api.actividadesDisponibles(usuario.id),
      api.historial(usuario.id),
    ]);
    setDisponibles(disp);
    setHistorial(hist);
  }, [usuario.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function anotarse(act: Actividad) {
    setMsg("");
    try {
      await api.inscribirse(usuario.id, act.id);
      setMsg(`Te anotaste en "${act.nombre}".`);
      await cargar();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div>
      {msg && <p className="aviso">{msg}</p>}

      <h2>Actividades disponibles</h2>
      <table>
        <thead>
          <tr>
            <th>Actividad</th>
            <th>Profesor</th>
            <th>Fecha</th>
            <th>Cupo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {disponibles.map((a) => (
            <tr key={a.id}>
              <td>{a.nombre}</td>
              <td>{a.profesor_nombre}</td>
              <td>{new Date(a.fecha).toLocaleString()}</td>
              <td>
                {a.inscriptos}/{a.cupo}
              </td>
              <td>
                <button className="primary" onClick={() => anotarse(a)}>
                  Anotarse
                </button>
              </td>
            </tr>
          ))}
          {disponibles.length === 0 && (
            <tr>
              <td colSpan={5}>No hay actividades disponibles.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Mis asistencias</h2>
      <table>
        <thead>
          <tr>
            <th>Actividad</th>
            <th>Fecha</th>
            <th>Asistencia</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => (
            <tr key={h.actividad_id}>
              <td>{h.actividad_nombre}</td>
              <td>{new Date(h.fecha).toLocaleString()}</td>
              <td>
                {h.presente === null ? (
                  <span className="badge pend">sin marcar</span>
                ) : h.presente ? (
                  <span className="badge ok">Presente</span>
                ) : (
                  <span className="badge no">Ausente</span>
                )}
              </td>
            </tr>
          ))}
          {historial.length === 0 && (
            <tr>
              <td colSpan={3}>No estás inscripto en ninguna actividad.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
