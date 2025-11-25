// src/pages/ExportacionSTL.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, Trash2, FileDown, CheckCircle2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { userHeaders } from '../utils/authHeaders';

const API = 'http://localhost:8000';

export default function ExportacionSTL() {
  const navigate = useNavigate();

  const [series, setSeries] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportandoId, setExportandoId] = useState(null);
  const [progressExport, setProgressExport] = useState(0);

  const cargarSeries = async () => {
    try {
      // Obtener todas las series del usuario
      const res = await fetch(`${API}/historial/archivos`, {
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error('Error al cargar series');
      const data = await res.json();

      // Para cada serie, verificar si tiene segmentaciones 3D y modelos STL
      const seriesConInfo = await Promise.all(
        data.map(async (serie) => {
          try {
            // Obtener segmentaciones 3D
            const res3D = await fetch(
              `${API}/historial/series/${serie.session_id}/segmentaciones-3d`,
              { headers: { ...userHeaders() } }
            );
            const seg3D = res3D.ok ? await res3D.json() : [];

            // Obtener modelos STL
            const resModelos = await fetch(
              `${API}/series/${serie.session_id}/modelos3d`,
              { headers: { ...userHeaders() } }
            );
            const modelos = resModelos.ok ? await resModelos.json() : [];

            return {
              ...serie,
              segmentaciones3D: seg3D,
              modelos: modelos,
              tieneSegmentaciones3D: seg3D.length > 0,
              tieneModelos: modelos.length > 0,
            };
          } catch {
            return {
              ...serie,
              segmentaciones3D: [],
              modelos: [],
              tieneSegmentaciones3D: false,
              tieneModelos: false,
            };
          }
        })
      );

      setSeries(seriesConInfo);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las series.',
      });
    } finally {
      setCargando(false);
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

  const exportarStl = async (serie, seg3dId) => {
    setExportandoId(seg3dId);
    setProgressExport(0);

    try {
      const form = new FormData();
      form.append('seg3d_id', String(seg3dId));

      const headers = { ...userHeaders() };
      delete headers['Content-Type'];

      const progressPromise = simulateExportProgress();

      const res = await fetch(`${API}/series/${serie.session_id}/export-stl`, {
        method: 'POST',
        headers,
        body: form,
      });

      await progressPromise;

      let data;
      try {
        data = await res.json();
      } catch {
        const txt = await res.text();
        throw new Error(txt || 'Respuesta inválida del servidor');
      }

      setProgressExport(100);

      if (!res.ok) throw new Error(data?.detail || data?.error || 'No se pudo exportar STL');

      const nuevo = { ...data, id: data.id ?? data.modelo_id };

      // Actualizar estado local
      setSeries((prev) =>
        prev.map((s) =>
          s.session_id === serie.session_id
            ? { ...s, modelos: [nuevo, ...s.modelos], tieneModelos: true }
            : s
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'STL generado exitosamente',
        html: `
          <div class="text-sm text-left space-y-2">
            <div><b>Archivo:</b> ${nuevo.path_stl}</div>
            <div><b>Tamaño:</b> ${nuevo.file_size_bytes ?? '?'} bytes</div>
            <div><b>Vértices:</b> ${nuevo.num_vertices ?? '?'}</div>
            <div><b>Caras:</b> ${nuevo.num_caras ?? '?'}</div>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6',
      });
    } catch (e) {
      setProgressExport(0);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo exportar STL',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setExportandoId(null);
    }
  };

  const borrarModelo = async (serie, modeloId) => {
    const ok = await Swal.fire({
      title: '¿Eliminar este STL?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${API}/series/modelos3d/${modeloId}`, {
        method: 'DELETE',
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());

      setSeries((prev) =>
        prev.map((s) =>
          s.session_id === serie.session_id
            ? {
              ...s,
              modelos: s.modelos.filter((m) => m.id !== modeloId),
              tieneModelos: s.modelos.filter((m) => m.id !== modeloId).length > 0,
            }
            : s
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'STL eliminado',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el STL.',
      });
    }
  };

  useEffect(() => {
    cargarSeries();
  }, []);

  return (
    <section className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Exportación STL
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Genera modelos STL desde segmentaciones 3D y gestiona tus exportaciones
          </p>
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando series...</p>
            </div>
          </div>
        )}

        {!cargando && series.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center shadow-md">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg sm:text-xl text-gray-800 mb-2">No hay series disponibles</p>
            <p className="text-sm text-gray-500 mb-6">
              Sube tu primera serie DICOM para comenzar
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity shadow-lg"
            >
              Subir ZIP DICOM
            </button>
          </div>
        )}

        {!cargando && series.length > 0 && (
          <div className="space-y-6">
            {series.map((serie) => (
              <div
                key={serie.session_id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                {/* Header de la serie */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-1">
                        Serie: {serie.nombrearchivo}
                      </h3>
                      <p className="text-xs sm:text-sm opacity-90">
                        Fecha: {serie.fechacarga} | Session ID: {serie.session_id}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {serie.tieneSegmentaciones3D ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-400 text-green-100 text-xs font-medium">
                          <CheckCircle2 size={14} />
                          {serie.segmentaciones3D.length} seg 3D
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border border-red-400 text-red-100 text-xs font-medium">
                          <XCircle size={14} />
                          Sin seg 3D
                        </span>
                      )}
                      {serie.tieneModelos && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400 text-blue-100 text-xs font-medium">
                          <FileDown size={14} />
                          {serie.modelos.length} STL
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Segmentaciones 3D disponibles */}
                  {serie.tieneSegmentaciones3D ? (
                    <>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                        🧊 Segmentaciones 3D disponibles para exportar
                      </h4>
                      <div className="space-y-3 mb-6">
                        {serie.segmentaciones3D.map((seg) => (
                          <div
                            key={seg.id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600 font-semibold">Volumen:</span>
                                  <div className="font-bold text-gray-900">
                                    {Math.round(seg.volume_mm3)} mm³
                                  </div>
                                </div>
                                {seg.surface_mm2 && (
                                  <div>
                                    <span className="text-gray-600 font-semibold">Superficie:</span>
                                    <div className="font-bold text-gray-900">
                                      {Math.round(seg.surface_mm2)} mm²
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-600 font-semibold">Slices:</span>
                                  <div className="font-bold text-gray-900">{seg.n_slices}</div>
                                </div>
                              </div>

                              {/* Botón exportar */}
                              <button
                                onClick={() => exportarStl(serie, seg.id)}
                                disabled={exportandoId === seg.id}
                                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${exportandoId === seg.id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90 shadow-md'
                                  }`}
                              >
                                {exportandoId === seg.id ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Exportando...
                                  </>
                                ) : (
                                  <>
                                    <FileDown size={16} />
                                    Exportar STL
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Barra de progreso */}
                            {exportandoId === seg.id && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    Generando modelo STL...
                                  </span>
                                  <span className="text-xs font-semibold text-purple-600">
                                    {Math.round(progressExport)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressExport}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Esta serie no tiene segmentaciones 3D. Realiza una segmentación 3D primero.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            // Cargar mapping.json
                            const mappingRes = await fetch(
                              `http://localhost:8000/static/series/${serie.session_id}/mapping.json`
                            );
                            if (!mappingRes.ok) {
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo cargar el mapping de la serie'
                              });
                              return;
                            }

                            const mapping = await mappingRes.json();
                            const imagePaths = Object.keys(mapping).map(
                              (nombre) => `/static/series/${serie.session_id}/${nombre}`
                            );

                            // Navegar al visor con las imágenes
                            navigate(`/visor/${serie.session_id}`, {
                              state: { images: imagePaths, source: 'exportacion-stl' }
                            });
                          } catch (error) {
                            console.error('Error cargando mapping:', error);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: 'No se pudo cargar la serie'
                            });
                          }
                        }}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Ir al visor
                      </button>
                    </div>
                  )}

                  {/* Modelos STL generados */}
                  {serie.tieneModelos && (
                    <>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                        📦 Modelos STL generados
                      </h4>
                      <div className="space-y-3">
                        {serie.modelos.map((modelo) => (
                          <div
                            key={modelo.id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:border-purple-300 transition-all"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 text-xs sm:text-sm">
                              <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg lg:col-span-2">
                                <span className="text-purple-700 font-semibold">Archivo:</span>
                                <div className="font-mono text-xs text-gray-700 break-all mt-1">
                                  {modelo.path_stl}
                                </div>
                              </div>
                              <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
                                <span className="text-indigo-700 font-semibold">Vértices:</span>
                                <div className="font-bold text-gray-900">
                                  {modelo.num_vertices ?? '?'}
                                </div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                                <span className="text-blue-700 font-semibold">Tamaño:</span>
                                <div className="font-bold text-gray-900">
                                  {modelo.file_size_bytes
                                    ? `${(modelo.file_size_bytes / 1024).toFixed(2)} KB`
                                    : '?'}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <a
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white transition-opacity text-sm font-medium shadow-md"
                                href={`${API}${modelo.path_stl}`}
                                download
                              >
                                <Download size={16} />
                                Descargar
                              </a>

                              <button
                                onClick={() => borrarModelo(serie, modelo.id)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
                              >
                                <Trash2 size={16} />
                                Borrar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
