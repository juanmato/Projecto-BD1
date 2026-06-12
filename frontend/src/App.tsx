import { useEffect, useState } from "react";
import type { Usuario } from "./types";
import { InstitutionalHeader, InstitutionalFooter } from "./components/Layout";
import Login from "./pages/Login";
import Profesor from "./pages/Profesor";
import Estudiante from "./pages/Estudiante";
import Admin from "./pages/Admin";

const STORAGE_KEY = "usuario_actual";

const ROL_LABEL: Record<string, string> = {
  estudiante: "Estudiante",
  profesor: "Docente",
  admin: "Administración",
};

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setUsuario(JSON.parse(raw));
  }, []);

  function entrar(u: Usuario) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUsuario(u);
  }

  function salir() {
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  }

  if (!usuario) return <Login onEntrar={entrar} />;

  return (
    <div className="page">
      <InstitutionalHeader>
        <div className="user-box">
          <div className="user-meta">
            <strong>{usuario.nombre}</strong>
            <span className="badge rol">{ROL_LABEL[usuario.rol] ?? usuario.rol}</span>
          </div>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      </InstitutionalHeader>

      <main className="contenido">
        {usuario.rol === "profesor" && <Profesor usuario={usuario} />}
        {usuario.rol === "estudiante" && <Estudiante usuario={usuario} />}
        {usuario.rol === "admin" && <Admin />}
      </main>

      <InstitutionalFooter />
    </div>
  );
}
