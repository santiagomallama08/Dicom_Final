// src/pages/Segmentaciones.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Loader2 } from "lucide-react";
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
  const [exportandoId, setExportandoId] = useState(null);
  const [progressExport, setProgressExport] = useState(0);

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

  const simulateExportProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          clearInterval(interval);
          setProgressExport(90);
          resolve();
        } else {
          setProgressExport(progress);
        }
      }, 250);
    });
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
      background: '#1f2937',
      color: '#fff',
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
        background: '#1f2937',
        color: '#fff',
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar la segmentación.",
        background: '#1f2937',
        color: '#fff',
      });
    }
  };

  const exportarStl = async (seg3dId) => {
    setExportandoId(seg3dId);
    setProgressExport(0);

    try {
      const form = new FormData();
      form.append("seg3d_id", String(seg3dId));

      const headers = { ...userHeaders() };
      delete headers["Content-Type"];
      delete headers["content-type"];

      const progressPromise = simulateExportProgress();

      const res = await fetch(`${API}/series/${session_id}/export-stl`, {
        method: "POST",
        headers,
        body: form,
      });

      await progressPromise;

      let data;
      try {
        data = await res.json();
      } catch {
        const txt = await res.text();
        throw new Error(txt || "Respuesta inválida del servidor");
      }
      
      setProgressExport(100);

      if (!res.ok) throw new Error(data?.detail || data?.error || "No se pudo exportar STL");

      const nuevo = { ...data, id: data.id ?? data.modelo_id };
      setModelos((prev) => [nuevo, ...prev]);

      await Swal.fire({
        icon: "success",
        title: "STL generado",
        html: `
          <div class="text-sm text-left space-y-2">
            <div><b>Archivo:</b> ${nuevo.path_stl}</div>
            <div><b>Tamaño:</b> ${nuevo.file_size_bytes ?? "?"} bytes</div>
            <div><b>Vértices:</b> ${nuevo.num_vertices ?? "?"}</div>
            <div><b>Caras:</b> ${nuevo.num_caras ?? "?"}</div>
          </div>
        `,
        confirmButtonText: "OK",
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
      });
    } catch (e) {
      setProgressExport(0);
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: e.message || "No se pudo exportar STL",
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setExportandoId(null);
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
      background: '#1f2937',
      color: '#fff',
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
        background: '#1f2937',
        color: '#fff',
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar el STL.",
        background: '#1f2937',
        color: '#fff',
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
      background: '#1f2937',
      color: '#fff',
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
        background: '#1f2937',
        color: '#fff',
      });
    } catch {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "No se pudo eliminar la segmentación 3D.",
        background: '#1f2937',
        color: '#fff',
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
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón volver */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/historial")}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-md"
            title="Volver al historial"
          >
            <ArrowLeft size={18} />
            <span className="text-sm sm:text-base">Volver</span>
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Segmentaciones de la serie
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Session ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-xs sm:text-sm">{session_id}</span>
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
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">
                📊 Segmentaciones 2D
              </h2>
              {items2D.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 sm:p-8 text-center shadow-lg">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-sm sm:text-base text-gray-400">No hay segmentaciones 2D disponibles.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {items2D.map((it) => (
                    <div key={it.archivodicomid} className="border border-gray-700 rounded-2xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all">
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center h-48 sm:h-56">
                        {it.mask_path ? (
                          <img 
                            src={`${API}${it.mask_path}`} 
                            alt="Máscara" 
                            className="max-h-48 sm:max-h-56 object-contain p-2" 
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">Sin máscara disponible</span>
                        )}
                      </div>
                      <div className="p-4 sm:p-5 text-sm sm:text-base">
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                          <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-2 rounded-lg">
                            <span className="text-purple-400 font-semibold">Altura:</span>
                            <div className="font-bold text-white">{it.altura} mm</div>
                          </div>
                          <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-lg">
                            <span className="text-indigo-400 font-semibold">Longitud:</span>
                            <div className="font-bold text-white">{it.longitud} mm</div>
                          </div>
                          <div className="bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg">
                            <span className="text-blue-400 font-semibold">Ancho:</span>
                            <div className="font-bold text-white">{it.ancho} mm</div>
                          </div>
                          <div className="bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg">
                            <span className="text-green-400 font-semibold">Volumen:</span>
                            <div className="font-bold text-white">{it.volumen} {it.unidad || "mm³"}</div>
                          </div>
                        </div>
                        <div className="mb-3 text-xs sm:text-sm">
                          <span className="text-gray-400 font-semibold">Tipo:</span> <span className="text-gray-200">{it.tipoprotesis}</span>
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
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">
                🧊 Segmentaciones 3D
              </h2>
              {items3D.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 sm:p-8 text-center shadow-lg">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="text-sm sm:text-base text-gray-400">No hay segmentaciones 3D disponibles.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {items3D.map((s3d) => (
                    <div key={s3d.id} className="border border-gray-700 rounded-2xl overflow-hidden bg-gray-800 shadow-lg hover:border-purple-500/50 transition-all">
                      {/* Thumbnails */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="aspect-square bg-black border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_axial}`} alt="axial" className="w-full h-full object-contain" />
                        </div>
                        <div className="aspect-square bg-black border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_sagittal}`} alt="sagittal" className="w-full h-full object-contain" />
                        </div>
                        <div className="aspect-square bg-black border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={`${API}${s3d.thumb_coronal}`} alt="coronal" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* Info y acciones */}
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs sm:text-sm">
                          <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-2 rounded-lg">
                            <span className="text-purple-400 font-semibold">Volumen:</span>
                            <div className="font-bold text-white">{Math.round(s3d.volume_mm3)} mm³</div>
                          </div>
                          {s3d.surface_mm2 != null && (
                            <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-lg">
                              <span className="text-indigo-400 font-semibold">Superficie:</span>
                              <div className="font-bold text-white">{Math.round(s3d.surface_mm2)} mm²</div>
                            </div>
                          )}
                          <div className="bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg sm:col-span-2">
                            <span className="text-blue-400 font-semibold">Dimensiones (BBox):</span>
                            <div className="font-bold text-white">
                              {`${(s3d.bbox_x_mm).toFixed(1)} × ${(s3d.bbox_y_mm).toFixed(1)} × ${(s3d.bbox_z_mm).toFixed(1)} mm`}
                            </div>
                          </div>
                          <div className="bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg">
                            <span className="text-green-400 font-semibold">Slices:</span>
                            <div className="font-bold text-white">{s3d.n_slices}</div>
                          </div>
                        </div>

                        {/* Barra de progreso para exportación */}
                        {exportandoId === s3d.id && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-medium text-gray-300">
                                Exportando STL...
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-purple-400">
                                {Math.round(progressExport)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] h-2.5 rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${progressExport}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => exportarStl(s3d.id)}
                            disabled={exportandoId === s3d.id}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg text-white text-sm font-medium transition-all ${
                              exportandoId === s3d.id
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90'
                            }`}
                          >
                            {exportandoId === s3d.id ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Exportando...
                              </>
                            ) : (
                              <>
                                <Download size={16} />
                                Exportar STL
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => borrar3D(s3d.id)}
                            disabled={exportandoId === s3d.id}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Borrar 3D
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Modelos STL */}
            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">
                📦 Modelos STL
              </h2>
              {modelos.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 sm:p-8 text-center shadow-lg">
                  <div className="text-5xl mb-3">🏗️</div>
                  <p className="text-sm sm:text-base text-gray-400">No hay modelos STL generados aún.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {modelos.map((m) => (
                    <div key={m.id} className="border border-gray-700 rounded-2xl p-4 sm:p-5 bg-gray-800 shadow-lg hover:border-purple-500/50 transition-all">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs sm:text-sm">
                        <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-2 rounded-lg lg:col-span-2">
                          <span className="text-purple-400 font-semibold">Archivo:</span>
                          <div className="font-mono text-xs text-gray-300 break-all mt-1">{m.path_stl}</div>
                        </div>
                        <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-lg">
                          <span className="text-indigo-400 font-semibold">Vértices:</span>
                          <div className="font-bold text-white">{m.num_vertices ?? "?"}</div>
                        </div>
                        <div className="bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg">
                          <span className="text-blue-400 font-semibold">Caras:</span>
                          <div className="font-bold text-white">{m.num_caras ?? "?"}</div>
                        </div>
                        <div className="bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg sm:col-span-2 lg:col-span-1">
                          <span className="text-green-400 font-semibold">Tamaño:</span>
                          <div className="font-bold text-white">
                            {m.file_size_bytes ? `${(m.file_size_bytes / 1024).toFixed(2)} KB` : "? bytes"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <a
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white transition-opacity text-sm font-medium shadow-lg"
                          href={`${API}${m.path_stl}`}
                          download
                        >
                          <Download size={16} />
                          Descargar
                        </a>

                        <button
                          onClick={() => borrarModelo(m.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
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
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 sm:p-6 text-center">
                <p className="text-xs sm:text-sm text-blue-300">
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