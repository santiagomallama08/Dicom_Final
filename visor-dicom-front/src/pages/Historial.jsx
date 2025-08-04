// src/pages/Historial.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Historial() {
  const [archivos, setArchivos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch("http://localhost:8000/historial/archivos");
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

  // Filtro por múltiples campos
  const archivosFiltrados = archivos.filter((archivo) => {
    const texto = filtro.toLowerCase();
    return (
      archivo.nombrearchivo.toLowerCase().includes(texto) ||
      archivo.rutaarchivo.toLowerCase().includes(texto) ||
      (archivo.fechacarga && archivo.fechacarga.toLowerCase().includes(texto))
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
        state: { images: imagePaths },
      });

    } catch (error) {
      console.error("Error cargando mapping desde archivo:", error);
    }
  };

  const eliminarSerie = async (session_id) => {
    if (!window.confirm("¿Seguro que quieres eliminar toda la serie y sus archivos?")) return;
    try {
      const res = await fetch(
        `http://localhost:8000/historial/series/${session_id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      // refrescar lista
      setArchivos((prev) => prev.filter(a => a.session_id !== session_id));
    } catch (err) {
      console.error("Error borrando serie:", err);
      alert("No se pudo eliminar la serie.");
    }
  };

  return (
    <section className="min-h-screen bg-white text-black p-10">
      <h1 className="text-3xl font-bold mb-6">Historial de series DICOM</h1>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        className="mb-6 px-4 py-2 border border-gray-300 rounded w-full max-w-md"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {loading ? (
        <p>Cargando archivos...</p>
      ) : archivosFiltrados.length === 0 ? (
        <p>No hay archivos disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded overflow-hidden">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Ruta</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200">
              {archivosFiltrados.map((archivo) => (
                <tr key={archivo.archivodicomid}>
                  <td className="px-4 py-2">{archivo.nombrearchivo}</td>
                  <td className="px-4 py-2 truncate max-w-[300px]">{archivo.rutaarchivo}</td>
                  <td className="px-4 py-2">{archivo.fechacarga}</td>
                  <td className="px-4 py-2">
                    <button

                      className="text-sm bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white px-3 py-1 rounded hover:opacity-90"
                      onClick={() => verSerie(archivo)}
                      disabled={!archivo.session_id}
                      title={
                        archivo.session_id
                          ? "Ver serie"
                          : "Session ID no disponible"
                      }
                    >
                      Ver
                    </button>
                    <button
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => eliminarSerie(archivo.session_id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
