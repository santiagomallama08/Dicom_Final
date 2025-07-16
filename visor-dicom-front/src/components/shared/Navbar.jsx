// src/components/shared/Navbar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HashLink as Link } from 'react-router-hash-link';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("usuario"));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login", { replace: true });
  };

  const linkClasses = "relative px-2 py-1 text-sm font-medium transition";
  const hoverUnderline = `
    before:absolute before:content-[''] before:-bottom-1 before:left-0
    before:w-0 before:h-0.5 before:bg-blue-400 before:transition-all
    hover:before:w-full
  `;

  return (
    <nav className="fixed top-0 w-full bg-black/70 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo con degradado tipo Apple */}
        <Link
          to="/"
          className="text-2xl font-semibold bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-transparent bg-clip-text"
        >
          Visor DICOM
        </Link>

        {/* Menú de navegación en desktop */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link smooth to="/#hero" className={`${linkClasses} ${hoverUnderline}`}>Inicio</Link>
          <Link smooth to="/#about" className={`${linkClasses} ${hoverUnderline}`}>¿Qué es DICOM?</Link>
          <Link smooth to="/#features" className={`${linkClasses} ${hoverUnderline}`}>Funciones</Link>
          <Link smooth to="/#explore" className={`${linkClasses} ${hoverUnderline}`}>Explorar</Link>
          {loggedIn && (
            <Link
              to="/upload"
              className={`${linkClasses} ${hoverUnderline} text-white hover:text-blue-400`}
            >
              Subir DICOM
            </Link>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-4">
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-1 rounded-lg bg-gradient-to-r from-[#FF4D00] via-[#C633FF] to-[#007AFF] text-white transition hover:opacity-90"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-1 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-lg text-white transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}