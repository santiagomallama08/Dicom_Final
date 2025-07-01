// src/components/Navbar.jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="backdrop-blur-sm bg-black/60 text-white fixed w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-blue-400 transition duration-300">
          Visor DICOM
        </Link>
        <div className="space-x-6">
          <Link
            to="/"
            className="text-white hover:text-blue-400 transition duration-300"
          >
            Inicio
          </Link>
          <Link
            to="/upload"
            className="text-white hover:text-blue-400 transition duration-300"
          >
            Subir DICOM
          </Link>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-300"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;