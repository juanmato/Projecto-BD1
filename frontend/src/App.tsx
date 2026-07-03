import { useState } from "react";
import { InstitutionalHeader, InstitutionalFooter } from "./components/Layout";
import Actividades from "./pages/Actividades";
import Estudiantes from "./pages/Estudiantes";
import Catalogos from "./pages/Catalogos";
import Inscripciones from "./pages/Inscripciones";
import Asistencia from "./pages/Asistencia";
import Reportes from "./pages/Reportes";

// Pestañas de navegación (sin login ni roles)
const TABS = [
  "Actividades",
  "Estudiantes",
  "Catálogos",
  "Inscripciones",
  "Asistencia",
  "Reportes",
] as const;

type Tab = (typeof TABS)[number];

export default function App() {
  const [tab, setTab] = useState<Tab>("Actividades");

  return (
    <div className="page">
      <InstitutionalHeader />

      <nav className="tab-bar">
        <div className="tab-bar-inner">
          {TABS.map((t) => (
            <button
              key={t}
              className={t === tab ? "activa" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="contenido">
        {tab === "Actividades" && <Actividades />}
        {tab === "Estudiantes" && <Estudiantes />}
        {tab === "Catálogos" && <Catalogos />}
        {tab === "Inscripciones" && <Inscripciones />}
        {tab === "Asistencia" && <Asistencia />}
        {tab === "Reportes" && <Reportes />}
      </main>

      <InstitutionalFooter />
    </div>
  );
}
