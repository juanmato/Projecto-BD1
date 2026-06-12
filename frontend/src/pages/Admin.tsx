import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { Actividad, Rol, Usuario } from "../types";

export default function Admin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [msg, setMsg] = useState("");

  // form usuario
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("estudiante");

  // form actividad
  const [actNombre, setActNombre] = useState("");
  const [actFecha, setActFecha] = useState("");
  const [actCupo, setActCupo] = useState(30);
  const [actProf, setActProf] = useState<number | "">("");

  const cargar = useCallback(async () => {
    const [us, acts] = await Promise.all([api.usuarios(), api.actividades()]);
    setUsuarios(us);
    setActividades(acts);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const profesores = usuarios.filter((u) => u.rol === "profesor");

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.crearUsuario(nombre, rol);
      setNombre("");
      await cargar();
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  async function borrarUsuario(id: number) {
    if (!confirm("¿Borrar usuario?")) return;
    await api.borrarUsuario(id);
    await cargar();
  }

  async function crearActividad(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (actProf === "") {
      setMsg("Elegí un profesor.");
      return;
    }
    try {
      await api.crearActividad({
        nombre: actNombre,
        fecha: new Date(actFecha).toISOString(),
        cupo: actCupo,
        profesor_id: actProf,
      });
      setActNombre("");
      setActFecha("");
      await cargar();
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  async function borrarActividad(id: number) {
    if (!confirm("¿Borrar actividad?")) return;
    await api.borrarActividad(id);
    await cargar();
  }

  return (
    <div>
      <h2>Administración</h2>
      {msg && <p className="aviso">{msg}</p>}

      <div className="grid">
        <section>
          <h3>Usuarios</h3>
          <form onSubmit={crearUsuario} className="form-inline">
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Agregar</button>
          </form>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>
                    <span className="badge rol">{u.rol}</span>
                  </td>
                  <td>
                    <button
                      className="ghost-danger"
                      onClick={() => borrarUsuario(u.id)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Actividades</h3>
          <form onSubmit={crearActividad} className="form-inline">
            <input
              placeholder="Nombre"
              value={actNombre}
              onChange={(e) => setActNombre(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              value={actFecha}
              onChange={(e) => setActFecha(e.target.value)}
              required
            />
            <input
              type="number"
              min={1}
              value={actCupo}
              onChange={(e) => setActCupo(Number(e.target.value))}
              style={{ width: 70 }}
            />
            <select
              value={actProf}
              onChange={(e) => setActProf(Number(e.target.value))}
              required
            >
              <option value="">Profesor...</option>
              {profesores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button type="submit">Agregar</button>
          </form>
          <table>
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Profesor</th>
                <th>Cupo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.profesor_nombre}</td>
                  <td>
                    {a.inscriptos}/{a.cupo}
                  </td>
                  <td>
                    <button
                      className="ghost-danger"
                      onClick={() => borrarActividad(a.id)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
