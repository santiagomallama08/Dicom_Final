import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { HashLink as Link } from 'react-router-hash-link';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { LogOut, ChevronDown } from 'lucide-react';
import UserChip from './UserChip';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false); // 👈 dropdown
  const dropdownRef = useRef(null);

  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  const displayName = user?.nombre_completo || "Usuario"; // 👈 no mostramos correo

  useEffect(() => {
    const hasSession = !!localStorage.getItem("session_token");
    setLoggedIn(hasSession);
  }, [pathname]);

  // cerrar dropdown al hacer click fuera
  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'Cerrar sesión',
      text: '¿Seguro que deseas cerrar tu sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!res.isConfirmed) return;

    logout();
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
        {/* Logo con degradado */}
        <Link
          to="/"
          className="text-2xl font-semibold bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-transparent bg-clip-text"
        >
          Visor DICOM
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

        {/* Derecha: usuario + dropdown de logout */}
        <div className="flex items-center space-x-4">
          {loggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {/* Solo nombre (sin email) */}
                <UserChip name={displayName} showEmail={false} />
                <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg bg-[#1c1c1e] border border-gray-700 shadow-lg overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-700 text-white"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
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
