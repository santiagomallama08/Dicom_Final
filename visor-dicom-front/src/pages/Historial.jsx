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
            ...userHeaders(), // 👈 X-User-Id
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

  // Filtro por múltiples campos
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
    // Si ya sabemos que tiene segmentaciones, no llamamos al backend todavía
    if (hasSegmentations) {
      const go = await Swal.fire({
        title: "Serie con segmentaciones",
        text: "Esta serie tiene segmentaciones asociadas. Debes borrarlas primero.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Ir a segmentaciones",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4f46e5", // indigo-600
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
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8000/historial/series/${session_id}`,
        {
          method: "DELETE",
          headers: {
            ...userHeaders(), // 👈 X-User-Id
          },
        }
      );

      // Backend bloquea con 409 si detecta segmentaciones
      if (res.status === 409) {
        const go = await Swal.fire({
          title: "No se puede eliminar",
          text: "La serie tiene segmentaciones. Debes borrarlas primero.",
          icon: "error",
          showCancelButton: true,
          confirmButtonText: "Ir a segmentaciones",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#4f46e5",
        });
        if (go.isConfirmed) navigate(`/segmentaciones/${session_id}`);
        return;
      }

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al eliminar la serie.");
      }

      // Éxito
      setArchivos((prev) => prev.filter(a => a.session_id !== session_id));
      Swal.fire({
        icon: "success",
        title: "Serie eliminada",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err) {
      console.error("Error borrando serie:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la serie.",
      });
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
                <th className="px-4 py-2">¿Segmentaciones?</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200">
              {archivosFiltrados.map((archivo) => (
                <tr key={archivo.archivodicomid}>
                  <td className="px-4 py-2">{archivo.nombrearchivo}</td>

                  {/* Indicador de segmentaciones */}
                  <td className="px-4 py-2">
                    {archivo.has_segmentations ? (
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-700">
                        ✓ {archivo.seg_count}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                        ✗
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2">{archivo.fechacarga}</td>

                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="text-sm bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white px-3 py-1 rounded hover:opacity-90"
                      onClick={() => verSerie(archivo)}
                      disabled={!archivo.session_id}
                      title={archivo.session_id ? "Ver serie" : "Session ID no disponible"}
                    >
                      Ver
                    </button>

                    {/* Botón Ver segmentaciones */}
                    <button
                      className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded"
                      onClick={() => navigate(`/segmentaciones/${archivo.session_id}`)}
                      disabled={!archivo.session_id}
                      title="Ver segmentaciones"
                    >
                      Segs
                    </button>

                    <button
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => eliminarSerie(archivo.session_id, archivo.has_segmentations)}
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
