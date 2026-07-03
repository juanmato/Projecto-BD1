import Escudo from "./Escudo";

export function InstitutionalHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header>
      <div className="utility-bar">
        <div className="utility-inner">
          <span>Campus Virtual</span>
          <span>Sistema de Gestión Académica</span>
        </div>
      </div>
      <div className="brand-bar">
        <div className="brand-inner">
          <div className="brand">
            <Escudo size={52} />
            <div className="brand-text">
              <h1>Universidad Nacional de Ingeniería</h1>
              <p>Facultad de Ingeniería — Deporte Universitario</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </header>
  );
}

export function InstitutionalFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong>Universidad Nacional de Ingeniería</strong>
          <p>Facultad de Ingeniería · Deporte Universitario</p>
        </div>
        <nav className="footer-links">
          <a href="#">Inicio</a>
          <a href="#">Bedelía</a>
          <a href="#">Biblioteca</a>
          <a href="#">Contacto</a>
        </nav>
      </div>
      <div className="footer-copy">
        © 2026 Universidad Nacional de Ingeniería — Proyecto académico Base de Datos I
      </div>
    </footer>
  );
}
