import { useEffect, useState } from "react";
import { api } from "../api";
import type { Rol, Usuario } from "../types";
import { InstitutionalHeader, InstitutionalFooter } from "../components/Layout";

const ROLES: { rol: Rol; label: string; desc: string }[] = [
  { rol: "estudiante", label: "Estudiante", desc: "Inscripción a actividades y consulta de asistencias" },
  { rol: "profesor", label: "Docente", desc: "Registro de asistencia de sus actividades" },
  { rol: "admin", label: "Administración", desc: "Gestión de usuarios y actividades" },
];

export default function Login({ onEntrar }: { onEntrar: (u: Usuario) => void }) {
  const [rol, setRol] = useState<Rol | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rol) return;
    setError("");
    api
      .usuarios(rol)
      .then(setUsuarios)
      .catch((e) => setError(e.message));
  }, [rol]);

  const rolInfo = ROLES.find((r) => r.rol === rol);

  return (
    <div className="page">
      <InstitutionalHeader />

      <div className="hero">
        <div className="hero-inner">
          <h2>Portal de Asistencia</h2>
          <p>Acceda con su perfil institucional para gestionar actividades y asistencias.</p>
        </div>
      </div>

      <main className="contenido login-wrap">
        <div className="login-card">
          <h3>Acceso al sistema</h3>

          {!rol && (
            <>
              <p className="muted">Seleccione su perfil:</p>
              <div className="roles">
                {ROLES.map((r) => (
                  <button key={r.rol} onClick={() => setRol(r.rol)} className="rol-card">
                    <span className="rol-title">{r.label}</span>
                    <span className="rol-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {rol && (
            <>
              <p className="muted">
                Perfil: <strong>{rolInfo?.label}</strong>{" "}
                <button className="link" onClick={() => setRol(null)}>
                  cambiar
                </button>
              </p>
              <p className="muted">Seleccione su usuario para ingresar:</p>
              {error && <p className="error">{error}</p>}
              <ul className="lista-usuarios">
                {usuarios.map((u) => (
                  <li key={u.id}>
                    <button onClick={() => onEntrar(u)}>{u.nombre}</button>
                  </li>
                ))}
                {usuarios.length === 0 && !error && (
                  <li className="muted">No hay usuarios con este perfil.</li>
                )}
              </ul>
            </>
          )}
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
