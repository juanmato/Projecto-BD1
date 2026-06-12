import { useEffect, useState } from "react";
import { api } from "../api";
import type { Actividad, AlumnoLista, Usuario } from "../types";

export default function Profesor({ usuario }: { usuario: Usuario }) {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [sel, setSel] = useState<Actividad | null>(null);
  const [lista, setLista] = useState<AlumnoLista[]>([]);

  useEffect(() => {
    api.actividades(usuario.id).then(setActividades);
  }, [usuario.id]);

  async function abrir(act: Actividad) {
    setSel(act);
    setLista(await api.lista(act.id));
  }

  async function marcar(inscripcion_id: number, presente: boolean) {
    await api.marcar(inscripcion_id, presente);
    setLista((prev) =>
      prev.map((a) =>
        a.inscripcion_id === inscripcion_id ? { ...a, presente } : a
      )
    );
  }

  return (
    <div>
      <h2>Mis actividades</h2>
      <div className="grid">
        <ul className="cards">
          {actividades.map((a) => (
            <li
              key={a.id}
              className={sel?.id === a.id ? "card activa" : "card"}
              onClick={() => abrir(a)}
            >
              <strong>{a.nombre}</strong>
              <div>{new Date(a.fecha).toLocaleString()}</div>
              <div>
                {a.inscriptos}/{a.cupo} inscriptos
              </div>
            </li>
          ))}
          {actividades.length === 0 && <li>No tenés actividades asignadas.</li>}
        </ul>

        <div>
          {sel ? (
            <>
              <h3>Pasar lista — {sel.nombre}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => (
                    <tr key={a.inscripcion_id}>
                      <td>{a.estudiante_nombre}</td>
                      <td>
                        {a.presente === null ? (
                          <span className="badge pend">sin marcar</span>
                        ) : a.presente ? (
                          <span className="badge ok">Presente</span>
                        ) : (
                          <span className="badge no">Ausente</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="primary"
                          onClick={() => marcar(a.inscripcion_id, true)}
                        >
                          Presente
                        </button>{" "}
                        <button onClick={() => marcar(a.inscripcion_id, false)}>
                          Ausente
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={3}>No hay inscriptos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <p>Elegí una actividad para pasar lista.</p>
          )}
        </div>
      </div>
    </div>
  );
}
