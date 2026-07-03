import { useEffect, useState } from "react";
import { api } from "../api";
import type { Disciplina, Espacio } from "../types";

// ABM simple de disciplinas y espacios, en dos paneles lado a lado.
export default function Catalogos() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [error, setError] = useState("");

  // Formulario de disciplinas
  const [nombreDis, setNombreDis] = useState("");
  const [editDisId, setEditDisId] = useState<number | null>(null);

  // Formulario de espacios
  const [nombreEsp, setNombreEsp] = useState("");
  const [ubicacionEsp, setUbicacionEsp] = useState("");
  const [editEspId, setEditEspId] = useState<number | null>(null);

  async function cargar() {
    try {
      const [dis, esp] = await Promise.all([api.disciplinas(), api.espacios()]);
      setDisciplinas(dis);
      setEspacios(esp);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardarDisciplina(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    try {
      if (editDisId === null) {
        await api.crearDisciplina(nombreDis);
      } else {
        await api.editarDisciplina(editDisId, nombreDis);
      }
      setNombreDis("");
      setEditDisId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function borrarDisciplina(d: Disciplina) {
    if (!confirm(`¿Eliminar la disciplina "${d.nombre}"?`)) return;
    setError("");
    try {
      await api.borrarDisciplina(d.id);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function guardarEspacio(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    try {
      if (editEspId === null) {
        await api.crearEspacio(nombreEsp, ubicacionEsp);
      } else {
        await api.editarEspacio(editEspId, nombreEsp, ubicacionEsp);
      }
      setNombreEsp("");
      setUbicacionEsp("");
      setEditEspId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function borrarEspacio(esp: Espacio) {
    if (!confirm(`¿Eliminar el espacio "${esp.nombre}"?`)) return;
    setError("");
    try {
      await api.borrarEspacio(esp.id);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>Catálogos</h2>
      {error && <div className="alert-error">{error}</div>}

      <div className="grid">
        {/* Panel de disciplinas */}
        <section>
          <h3>Disciplinas</h3>
          <form className="form-inline" onSubmit={guardarDisciplina}>
            <input
              placeholder="Nombre de la disciplina"
              value={nombreDis}
              onChange={(e) => setNombreDis(e.target.value)}
              required
            />
            <button type="submit">{editDisId === null ? "Agregar" : "Guardar"}</button>
            {editDisId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditDisId(null);
                  setNombreDis("");
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d) => (
                <tr key={d.id}>
                  <td>{d.nombre}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditDisId(d.id);
                        setNombreDis(d.nombre);
                      }}
                    >
                      Editar
                    </button>{" "}
                    <button className="ghost-danger" onClick={() => borrarDisciplina(d)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {disciplinas.length === 0 && (
                <tr>
                  <td colSpan={2} className="muted">
                    Sin disciplinas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Panel de espacios deportivos */}
        <section>
          <h3>Espacios deportivos</h3>
          <form className="form-inline" onSubmit={guardarEspacio}>
            <input
              placeholder="Nombre del espacio"
              value={nombreEsp}
              onChange={(e) => setNombreEsp(e.target.value)}
              required
            />
            <input
              placeholder="Ubicación"
              value={ubicacionEsp}
              onChange={(e) => setUbicacionEsp(e.target.value)}
              required
            />
            <button type="submit">{editEspId === null ? "Agregar" : "Guardar"}</button>
            {editEspId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditEspId(null);
                  setNombreEsp("");
                  setUbicacionEsp("");
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
                <th>Ubicación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {espacios.map((esp) => (
                <tr key={esp.id}>
                  <td>{esp.nombre}</td>
                  <td>{esp.ubicacion}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditEspId(esp.id);
                        setNombreEsp(esp.nombre);
                        setUbicacionEsp(esp.ubicacion);
                      }}
                    >
                      Editar
                    </button>{" "}
                    <button className="ghost-danger" onClick={() => borrarEspacio(esp)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {espacios.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    Sin espacios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
