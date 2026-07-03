import { useEffect, useState } from "react";
import { api } from "../api";
import type { Actividad, Estudiante, InscripcionDeActividad } from "../types";

export default function Inscripciones() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [actividadId, setActividadId] = useState("");
  const [inscripciones, setInscripciones] = useState<InscripcionDeActividad[]>([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Carga actividades y estudiantes para los selects
  async function cargarBase() {
    try {
      const [acts, ests] = await Promise.all([api.actividades(), api.estudiantes()]);
      setActividades(acts);
      setEstudiantes(ests);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargarBase();
  }, []);

  // Al cambiar de actividad se recargan sus inscripciones
  useEffect(() => {
    if (!actividadId) {
      setInscripciones([]);
      return;
    }
    api
      .inscripcionesDeActividad(Number(actividadId))
      .then(setInscripciones)
      .catch((e) => setError((e as Error).message));
  }, [actividadId]);

  async function recargar() {
    await cargarBase();
    if (actividadId) {
      setInscripciones(await api.inscripcionesDeActividad(Number(actividadId)));
    }
  }

  async function inscribir(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setAviso("");
    try {
      const res = await api.inscribir(Number(estudianteId), Number(actividadId));
      // El backend decide si queda confirmada o en lista de espera
      if (res.estado === "lista_espera") {
        setAviso("El cupo está completo: la inscripción quedó en lista de espera.");
      } else {
        setAviso("Inscripción confirmada.");
      }
      setEstudianteId("");
      await recargar();
    } catch (e) {
      // 409: ya inscripto o actividad no abierta
      setError((e as Error).message);
    }
  }

  async function darDeBaja(ins: InscripcionDeActividad) {
    if (!confirm(`¿Dar de baja a ${ins.estudiante}?`)) return;
    setError("");
    setAviso("");
    try {
      const res = await api.bajaInscripcion(ins.id);
      if (res.promovido_de_lista_espera !== null) {
        setAviso(
          `Baja realizada. Se promovió de la lista de espera a: ${res.promovido_de_lista_espera}.`
        );
      } else {
        setAviso("Baja realizada.");
      }
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const actividad = actividades.find((a) => a.id === Number(actividadId));
  const confirmadas = inscripciones.filter((i) => i.estado === "confirmada");
  const enEspera = inscripciones.filter((i) => i.estado === "lista_espera");

  return (
    <section>
      <h2>Inscripciones</h2>
      {error && <div className="alert-error">{error}</div>}
      {aviso && <div className="aviso">{aviso}</div>}

      <div className="form-inline">
        <select value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
          <option value="">Elegí una actividad…</option>
          {actividades.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.estado}) — {a.confirmados}/{a.cupo_maximo} confirmados,{" "}
              {a.en_espera} en espera
            </option>
          ))}
        </select>
      </div>

      {actividad && (
        <>
          <form className="form-inline" onSubmit={inscribir}>
            <select
              value={estudianteId}
              onChange={(e) => setEstudianteId(e.target.value)}
              required
            >
              <option value="">Estudiante a inscribir…</option>
              {estudiantes.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.apellido}, {est.nombre} ({est.documento})
                </option>
              ))}
            </select>
            <button type="submit">Inscribir</button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Fecha de inscripción</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Primero los confirmados, después la lista de espera */}
              {[...confirmadas, ...enEspera].map((ins) => (
                <tr key={ins.id}>
                  <td>{ins.estudiante}</td>
                  <td>{ins.documento}</td>
                  <td>{ins.fecha_inscripcion}</td>
                  <td>
                    {ins.estado === "confirmada" ? (
                      <span className="badge ok">Confirmada</span>
                    ) : (
                      <span className="badge pend">Lista de espera</span>
                    )}
                  </td>
                  <td>
                    <button className="ghost-danger" onClick={() => darDeBaja(ins)}>
                      Dar de baja
                    </button>
                  </td>
                </tr>
              ))}
              {inscripciones.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Esta actividad no tiene inscriptos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
