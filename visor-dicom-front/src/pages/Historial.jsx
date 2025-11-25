// src/pages/Historial.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { userHeaders } from "../utils/authHeaders";

export default function Historial() {
  const [archivos, setArchivos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch("http://localhost:8000/historial/archivos", {
          headers: {
            ...userHeaders(),
          },
        });
        const data = await response.json();
        setArchivos(data);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, []);

  const archivosFiltrados = archivos.filter((archivo) => {
    const texto = filtro.toLowerCase();
    return (
      (archivo.nombrearchivo || "").toLowerCase().includes(texto) ||
      String(archivo.fechacarga || "").toLowerCase().includes(texto)
    );
  });

  const verSerie = async (archivo) => {
    if (!archivo.session_id) return;

    const mappingUrl = `http://localhost:8000/static/series/${archivo.session_id}/mapping.json`;

    try {
      const res = await fetch(mappingUrl);
      if (!res.ok) {
        console.error("No se encontró el mapping.json");
        return;
      }

      const mapping = await res.json();
      const imagePaths = Object.keys(mapping).map(
        (nombre) => `/static/series/${archivo.session_id}/${nombre}`
      );

      navigate(`/visor/${archivo.session_id}`, {
        state: { images: imagePaths, source: 'historial' },
      });

    } catch (error) {
      console.error("Error cargando mapping desde archivo:", error);
    }
  };

  const eliminarSerie = async (session_id, hasSegmentations) => {
    if (hasSegmentations) {
      const go = await Swal.fire({
        title: "Serie con segmentaciones",
        text: "Esta serie tiene segmentaciones asociadas. Debes borrarlas primero.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Ir a segmentaciones",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4f46e5",
        background: '#1f2937',
        color: '#fff',
      });
      if (go.isConfirmed) {
        navigate(`/segmentaciones/${session_id}`);
      }
      return;
    }

    const result = await Swal.fire({
      title: "¿Eliminar serie?",
      text: "Se eliminarán los archivos de la serie (si no tiene segmentaciones).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      background: '#1f2937',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8000/historial/series/${session_id}`,
        {
          method: "DELETE",
          headers: {
            ...userHeaders(),
          },
        }
      );

      if (res.status === 409) {
        const go = await Swal.fire({
          title: "No se puede eliminar",
          text: "La serie tiene segmentaciones. Debes borrarlas primero.",
          icon: "error",
          showCancelButton: true,
          confirmButtonText: "Ir a segmentaciones",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#4f46e5",
          background: '#1f2937',
          color: '#fff',
        });
        if (go.isConfirmed) navigate(`/segmentaciones/${session_id}`);
        return;
      }

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al eliminar la serie.");
      }

      setArchivos((prev) => prev.filter(a => a.session_id !== session_id));
      Swal.fire({
        icon: "success",
        title: "Serie eliminada",
        showConfirmButton: false,
        timer: 1200,
        background: '#1f2937',
        color: '#fff',
      });
    } catch (err) {
      console.error("Error borrando serie:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la serie.",
        background: '#1f2937',
        color: '#fff',
      });
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Historial de series DICOM
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Gestiona y visualiza tus series de imágenes médicas
          </p>
        </div>

        {/* Buscador */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o fecha..."
            className="w-full max-w-md px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all outline-none text-sm sm:text-base placeholder-gray-400"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando archivos...</p>
            </div>
          </div>
        ) : archivosFiltrados.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              No hay archivos disponibles
            </p>
            <p className="text-sm text-gray-500">
              {filtro ? "Intenta con otro término de búsqueda" : "Sube tu primera serie DICOM para comenzar"}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
            {/* Vista de tabla en desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Segmentaciones</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {archivosFiltrados.map((archivo) => (
                    <tr key={archivo.archivodicomid} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {archivo.nombrearchivo}
                      </td>

                      <td className="px-6 py-4">
                        {archivo.has_segmentations ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/50 border border-green-500/50 text-green-400 text-sm font-medium">
                            <span className="text-green-400">✓</span>
                            {archivo.seg_count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 border border-gray-600 text-gray-400 text-sm font-medium">
                            <span>✗</span>
                            0
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-300">
                        {archivo.fechacarga}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            onClick={() => verSerie(archivo)}
                            disabled={!archivo.session_id}
                            title={archivo.session_id ? "Ver serie" : "Session ID no disponible"}
                          >
                            Ver
                          </button>

                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => navigate(`/segmentaciones/${archivo.session_id}`)}
                            disabled={!archivo.session_id}
                            title="Ver segmentaciones"
                          >
                            Segs
                          </button>

                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => eliminarSerie(archivo.session_id, archivo.has_segmentations)}
                            title="Eliminar serie"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de tarjetas en móvil/tablet */}
            <div className="lg:hidden divide-y divide-gray-700">
              {archivosFiltrados.map((archivo) => (
                <div key={archivo.archivodicomid} className="p-4 sm:p-6 hover:bg-gray-700/50 transition-colors">
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base break-all">
                      {archivo.nombrearchivo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        📅 {archivo.fechacarga}
                      </span>
                      <span>
                        {archivo.has_segmentations ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/50 border border-green-500/50 text-green-400 font-medium">
                            ✓ {archivo.seg_count} seg(s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700 border border-gray-600 text-gray-400 font-medium">
                            ✗ Sin segmentaciones
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 min-w-[80px] bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                      onClick={() => verSerie(archivo)}
                      disabled={!archivo.session_id}
                    >
                      Ver
                    </button>

                    <button
                      className="flex-1 min-w-[80px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={() => navigate(`/segmentaciones/${archivo.session_id}`)}
                      disabled={!archivo.session_id}
                    >
                      Segs
                    </button>

                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => eliminarSerie(archivo.session_id, archivo.has_segmentations)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer informativo */}
        {!loading && archivosFiltrados.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Mostrando {archivosFiltrados.length} de {archivos.length} serie(s)
            </p>
          </div>
        )}
      </div>
    </section>
  );
}