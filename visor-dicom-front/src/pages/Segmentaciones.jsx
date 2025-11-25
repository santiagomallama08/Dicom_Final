// src/pages/Segmentaciones.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { userHeaders } from "../utils/authHeaders";

const API = "http://localhost:8000";

export default function Segmentaciones() {
  const { session_id } = useParams();
  const navigate = useNavigate();

  const [items2D, setItems2D] = useState([]);
  const [items3D, setItems3D] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar2D = async () => {
    const res = await fetch(`${API}/historial/series/${session_id}/segmentaciones`, {
      headers: { ...userHeaders() },
    });
    if (!res.ok) throw new Error(await res.text());
    setItems2D(await res.json());
  };

  const cargar3D = async () => {
    const res = await fetch(`${API}/historial/series/${session_id}/segmentaciones-3d`, {
      headers: { ...userHeaders() },
    });
    if (!res.ok) throw new Error(await res.text());
    setItems3D(await res.json());
  };

  const cargarModelos = async () => {
    try {
      const res = await fetch(`${API}/series/${session_id}/modelos3d`, {
        headers: { ...userHeaders() },
      });
      if (!res.ok) {
        setModelos([]);
        return;
      }
      setModelos(await res.json());
    } catch {
      setModelos([]);
    }
  };

  const borrar2D = async (archivodicomid) => {
    const ok = await Swal.fire({
      title: "¿Eliminar esta segmentación 2D?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(
        `${API}/historial/series/${session_id}/segmentaciones/${archivodicomid}`,
        { method: "DELETE", headers: { ...userHeaders() } }
      );
      if (!res.ok) throw new Error(await res.text());
      setItems2D((prev) => prev.filter((x) => x.archivodicomid !== archivodicomid));
      Swal.fire({ 
        icon: "success", 
        title: "Segmentación eliminada", 
        timer: 1200, 
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar la segmentación.",
      });
    }
  };

  const borrarModelo = async (modeloId) => {
    const ok = await Swal.fire({
      title: "¿Eliminar este STL?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${API}/series/modelos3d/${modeloId}`, {
        method: "DELETE",
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      setModelos((prev) => prev.filter((m) => m.id !== modeloId));
      Swal.fire({ 
        icon: "success", 
        title: "STL eliminado", 
        timer: 1200, 
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar el STL.",
      });
    }
  };

  const borrar3D = async (seg3dId) => {
    const ok = await Swal.fire({
      title: "¿Eliminar esta segmentación 3D?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${API}/historial/segmentaciones-3d/${seg3dId}`, {
        method: "DELETE",
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      setItems3D((prev) => prev.filter((s) => s.id !== seg3dId));
      Swal.fire({ 
        icon: "success", 
        title: "Segmentación 3D eliminada", 
        timer: 1200, 
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar la segmentación 3D.",
      });
    }
  };

  useEffect(() => {
    (async () => {
      setCargando(true);
      setError("");
      try {
        await Promise.all([cargar2D(), cargar3D(), cargarModelos()]);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los datos de la serie.");
      } finally {
        setCargando(false);
      }
    })();
  }, [session_id]);

  return (
    <section className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón volver */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/historial")}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-md"
            title="Volver al historial"
          >
            <ArrowLeft size={18} />
            <span className="text-sm sm:text-base">Volver al historial</span>
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Segmentaciones de la serie
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Session ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs sm:text-sm text-gray-800">{session_id}</span>
          </p>
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando segmentaciones...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!cargando && (
          <>
            {/* Segmentaciones 2D */}
            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">
                📊 Segmentaciones 2D
              </h2>
              {items2D.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center shadow-md">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-sm sm:text-base text-gray-500">No hay segmentaciones 2D disponibles.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {items2D.map((it) => (
                    <div key={it.archivodicomid} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-lg hover:border-purple-300 transition-all">
                      <div className="bg-gray-100 flex items-center justify-center h-48 sm:h-56">
                        {it.mask_path ? (
                          <img 
                            src={`${API}${it.mask_path}`} 
                            alt="Máscara" 
                            className="max-h-48 sm:max-h-56 object-contain p-2" 
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">Sin máscara disponible</span>
                        )}
                      </div>
                      <div className="p-4 sm:p-5 text-sm sm:text-base">
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                          <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg">
                            <span className="text-purple-700 font-semibold">Altura:</span>
                            <div className="font-bold text-gray-900">{it.altura} mm</div>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
                            <span className="text-indigo-700 font-semibold">Longitud:</span>
                            <div className="font-bold text-gray-900">{it.longitud} mm</div>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                            <span className="text-blue-700 font-semibold">Ancho:</span>
                            <div className="font-bold text-gray-900">{it.ancho} mm</div>
                          </div>
                          <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                            <span className="text-green-700 font-semibold">Volumen:</span>
                            <div className="font-bold text-gray-900">{it.volumen} {it.unidad || "mm³"}</div>
                          </div>
                        </div>
                        <div className="mb-3 text-xs sm:text-sm">
                          <span className="text-gray-600 font-semibold">Tipo:</span> <span className="text-gray-800">{it.tipoprotesis}</span>
                        </div>
                        <button
                          onClick={() => borrar2D(it.archivodicomid)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Segmentaciones 3D */}
            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">
                🧊 Segmentaciones 3D
              </h2>
              {items3D.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center shadow-md">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="text-sm sm:text-base text-gray-500">No hay segmentaciones 3D disponibles.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {items3D.map((s3d) => (
                    <div key={s3d.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-md hover:border-purple-300 transition-all">
                      {/* Thumbnails */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50">
                        <div className="aspect-square bg-black border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_axial}`} alt="axial" className="w-full h-full object-contain" />
                        </div>
                        <div className="aspect-square bg-black border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_sagittal}`} alt="sagittal" className="w-full h-full object-contain" />
                        </div>
                        <div className="aspect-square bg-black border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_coronal}`} alt="coronal" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* Info y acciones */}
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs sm:text-sm">
                          <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg">
                            <span className="text-purple-700 font-semibold">Volumen:</span>
                            <div className="font-bold text-gray-900">{Math.round(s3d.volume_mm3)} mm³</div>
                          </div>
                          {s3d.surface_mm2 != null && (
                            <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
                              <span className="text-indigo-700 font-semibold">Superficie:</span>
                              <div className="font-bold text-gray-900">{Math.round(s3d.surface_mm2)} mm²</div>
                            </div>
                          )}
                          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg sm:col-span-2">
                            <span className="text-blue-700 font-semibold">Dimensiones (BBox):</span>
                            <div className="font-bold text-gray-900">
                              {`${(s3d.bbox_x_mm).toFixed(1)} × ${(s3d.bbox_y_mm).toFixed(1)} × ${(s3d.bbox_z_mm).toFixed(1)} mm`}
                            </div>
                          </div>
                          <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                            <span className="text-green-700 font-semibold">Slices:</span>
                            <div className="font-bold text-gray-900">{s3d.n_slices}</div>
                          </div>
                        </div>

                        {/* Solo botón de borrar - NO exportar */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => borrar3D(s3d.id)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
                          >
                            <Trash2 size={16} />
                            Borrar segmentación 3D
                          </button>
                        </div>

                        {/* Mensaje informativo */}
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs sm:text-sm text-blue-800">
                          💡 Para generar el modelo STL, ve al módulo <strong>"Exportación STL"</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Modelos STL (solo información y borrado) */}
            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">
                📦 Modelos STL generados
              </h2>
              {modelos.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center shadow-md">
                  <div className="text-5xl mb-3">🏗️</div>
                  <p className="text-sm sm:text-base text-gray-500 mb-4">No hay modelos STL generados para esta serie.</p>
                  <button
                    onClick={() => navigate("/exportacion-stl")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    🚀 Ir a Exportación STL
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {modelos.map((m) => (
                    <div key={m.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-white shadow-md hover:border-purple-300 transition-all">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs sm:text-sm">
                        <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg lg:col-span-2">
                          <span className="text-purple-700 font-semibold">Archivo:</span>
                          <div className="font-mono text-xs text-gray-700 break-all mt-1">{m.path_stl}</div>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
                          <span className="text-indigo-700 font-semibold">Vértices:</span>
                          <div className="font-bold text-gray-900">{m.num_vertices ?? "?"}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                          <span className="text-blue-700 font-semibold">Caras:</span>
                          <div className="font-bold text-gray-900">{m.num_caras ?? "?"}</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg sm:col-span-2 lg:col-span-1">
                          <span className="text-green-700 font-semibold">Tamaño:</span>
                          <div className="font-bold text-gray-900">
                            {m.file_size_bytes ? `${(m.file_size_bytes / 1024).toFixed(2)} KB` : "? bytes"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <a
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white transition-opacity text-sm font-medium shadow-lg"
                          href={`${API}${m.path_stl}`}
                          download
                        >
                          <Download size={16} />
                          Descargar
                        </a>

                        <button
                          onClick={() => borrarModelo(m.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} />
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Nota informativa */}
            {(items2D.length + items3D.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-center">
                <p className="text-xs sm:text-sm text-blue-800">
                  💡 Para eliminar la serie completa, primero borra todas las segmentaciones y modelos STL.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
