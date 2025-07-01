// src/components/Navbar.jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition duration-300">
          Visor DICOM
        </Link>
        <div className="space-x-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 transition duration-300"
          >
            Inicio
          </Link>
          <Link
            to="/upload"
            className="text-gray-700 hover:text-blue-600 transition duration-300"
          >
            Subir DICOM
          </Link>
          <Link
            to="/login"
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition duration-300"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;