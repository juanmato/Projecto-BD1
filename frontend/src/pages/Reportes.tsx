import { useEffect, useState } from "react";
import { api } from "../api";
import type { ReporteFila } from "../types";

// Los 11 reportes del backend
const REPORTES = [
  { clave: "mas-inscriptos", titulo: "Actividades con más inscriptos" },
  { clave: "cupos-disponibles", titulo: "Cupos disponibles por actividad" },
  { clave: "inscriptos-por-disciplina", titulo: "Inscriptos por disciplina" },
  { clave: "inscriptos-por-carrera", titulo: "Inscriptos por carrera" },
  { clave: "inscriptos-por-facultad", titulo: "Inscriptos por facultad" },
  { clave: "ocupacion", titulo: "Porcentaje de ocupación" },
  { clave: "asistencia-por-actividad", titulo: "Asistencia por actividad" },
  { clave: "inasistencias", titulo: "Estudiantes con inasistencias" },
  { clave: "lista-espera", titulo: "Lista de espera" },
  { clave: "estudiantes-sin-inscripcion", titulo: "Estudiantes sin inscripción" },
  { clave: "uso-espacios", titulo: "Uso de espacios deportivos" },
];

// Convierte una clave tipo "porcentaje_ocupacion" en "Porcentaje ocupacion"
function cabecera(clave: string) {
  const texto = clave.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function Reportes() {
  const [clave, setClave] = useState("");
  const [minimo, setMinimo] = useState("3");
  const [filas, setFilas] = useState<ReporteFila[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clave) {
      setFilas([]);
      return;
    }
    setError("");
    // El reporte de inasistencias lleva un parámetro mínimo
    const path =
      clave === "inasistencias"
        ? `/reportes/inasistencias?minimo=${minimo || "3"}`
        : `/reportes/${clave}`;
    api
      .reporte(path)
      .then(setFilas)
      .catch((e) => setError((e as Error).message));
  }, [clave, minimo]);

  const columnas = filas.length > 0 ? Object.keys(filas[0]) : [];
  const titulo = REPORTES.find((r) => r.clave === clave)?.titulo;

  return (
    <section>
      <h2>Reportes</h2>
      {error && <div className="alert-error">{error}</div>}

      <div className="form-inline">
        <select value={clave} onChange={(e) => setClave(e.target.value)}>
          <option value="">Elegí un reporte…</option>
          {REPORTES.map((r) => (
            <option key={r.clave} value={r.clave}>
              {r.titulo}
            </option>
          ))}
        </select>
        {clave === "inasistencias" && (
          <input
            type="number"
            min={1}
            style={{ width: 120 }}
            title="Cantidad mínima de inasistencias"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
          />
        )}
      </div>

      {clave && (
        <>
          <h3>{titulo}</h3>
          {filas.length === 0 ? (
            <p className="muted">El reporte no devolvió resultados.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {columnas.map((c) => (
                    <th key={c}>{cabecera(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i}>
                    {columnas.map((c) => (
                      <td key={c}>{fila[c] === null ? "—" : String(fila[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
