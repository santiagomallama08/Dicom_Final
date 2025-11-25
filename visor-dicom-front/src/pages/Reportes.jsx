// src/pages/Reportes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Loader2, Eye, Trash2, Calendar, Layers, FileCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { userHeaders } from '../utils/authHeaders';

const API = 'http://localhost:8000';

export default function Reportes() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(null);
  const [progress, setProgress] = useState(0);
  const [filtro, setFiltro] = useState('todas'); // todas, con-seg, sin-seg

  const cargarSeries = async () => {
    try {
      const res = await fetch(`${API}/historial/archivos`, {
        headers: { ...userHeaders() }
      });
      if (!res.ok) throw new Error('Error al cargar series');
      const data = await res.json();

      const seriesConInfo = await Promise.all(
        data.map(async (serie) => {
          try {
            const res2D = await fetch(
              `${API}/historial/series/${serie.session_id}/segmentaciones`,
              { headers: { ...userHeaders() } }
            );
            const seg2D = res2D.ok ? await res2D.json() : [];

            const res3D = await fetch(
              `${API}/historial/series/${serie.session_id}/segmentaciones-3d`,
              { headers: { ...userHeaders() } }
            );
            const seg3D = res3D.ok ? await res3D.json() : [];

            return {
              ...serie,
              segmentaciones2D: seg2D.length,
              segmentaciones3D: seg3D.length,
              tieneSegmentaciones: seg2D.length > 0 || seg3D.length > 0
            };
          } catch {
            return {
              ...serie,
              segmentaciones2D: 0,
              segmentaciones3D: 0,
              tieneSegmentaciones: false
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
        text: 'No se pudieron cargar las series'
      });
    } finally {
      setCargando(false);
    }
  };

  const simulateProgress = () => {
    return new Promise((resolve) => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 15;
        if (prog >= 90) {
          clearInterval(interval);
          setProgress(90);
          resolve();
        } else {
          setProgress(prog);
        }
      }, 200);
    });
  };

  const generarReporte = async (serie) => {
    if (!serie.tieneSegmentaciones) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin segmentaciones',
        text: 'Esta serie no tiene segmentaciones. Debes segmentar primero.'
      });
      return;
    }

    setGenerando(serie.session_id);
    setProgress(0);

    try {
      const progressPromise = simulateProgress();

      const res = await fetch(`${API}/reportes/generar/${serie.session_id}`, {
        method: 'POST',
        headers: { ...userHeaders() }
      });

      await progressPromise;

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Error al generar reporte');
      }

      const data = await res.json();
      setProgress(100);

      await Swal.fire({
        icon: 'success',
        title: 'Reporte generado',
        html: `
          <div class="text-left space-y-2 mt-4">
            <p class="text-sm text-gray-700">✅ Reporte médico completo generado exitosamente</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <p class="text-xs text-blue-800"><strong>Incluye:</strong></p>
              <ul class="text-xs text-blue-700 list-disc list-inside mt-1">
                <li>Datos del paciente</li>
                <li>Segmentaciones 2D y 3D</li>
                <li>Mediciones detalladas</li>
                <li>Modelos STL generados</li>
              </ul>
            </div>
          </div>
        `,
        confirmButtonText: 'Descargar PDF',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#3b82f6'
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(`${API}${data.pdf_url}`, '_blank');
        }
      });

    } catch (e) {
      setProgress(0);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo generar el reporte'
      });
    } finally {
      setGenerando(null);
    }
  };

  // ✅ AGREGAR ESTA FUNCIÓN NUEVA
  const verSerie = async (serie) => {
    try {
      // Cargar mapping.json
      const mappingRes = await fetch(
        `${API}/static/series/${serie.session_id}/mapping.json`
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
        state: { images: imagePaths, source: 'reportes' }
      });
    } catch (error) {
      console.error('Error cargando serie:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la serie'
      });
    }
  };

  useEffect(() => {
    cargarSeries();
  }, []);

  const seriesFiltradas = series.filter((serie) => {
    if (filtro === 'con-seg') return serie.tieneSegmentaciones;
    if (filtro === 'sin-seg') return !serie.tieneSegmentaciones;
    return true;
  });

  return (
    <section className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header con estadísticas */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Reportes Médicos
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Genera reportes profesionales en PDF con análisis completo de estudios DICOM
          </p>

          {/* Estadísticas */}
          {!cargando && series.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total series</p>
                    <p className="text-2xl font-bold text-gray-900">{series.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileCheck className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Con segmentaciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {series.filter(s => s.tieneSegmentaciones).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Layers className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reportes disponibles</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {series.filter(s => s.tieneSegmentaciones).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          {!cargando && series.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltro('todas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'todas'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                Todas ({series.length})
              </button>
              <button
                onClick={() => setFiltro('con-seg')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'con-seg'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                Con segmentaciones ({series.filter(s => s.tieneSegmentaciones).length})
              </button>
              <button
                onClick={() => setFiltro('sin-seg')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'sin-seg'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                Sin segmentaciones ({series.filter(s => !s.tieneSegmentaciones).length})
              </button>
            </div>
          )}
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
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg sm:text-xl text-gray-800 mb-2">No hay series disponibles</p>
            <p className="text-sm text-gray-500 mb-6">
              Sube tu primera serie DICOM para generar reportes
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity shadow-lg"
            >
              Subir ZIP DICOM
            </button>
          </div>
        )}

        {!cargando && seriesFiltradas.length === 0 && series.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-md">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600">No hay series con este filtro</p>
          </div>
        )}

        {/* Grid de series */}
        {!cargando && seriesFiltradas.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {seriesFiltradas.map((serie) => (
              <div
                key={serie.session_id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                {/* Header compacto */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">
                    {serie.nombrearchivo}
                  </h3>
                  <div className="flex items-center gap-2 text-xs opacity-90">
                    <Calendar size={14} />
                    <span>{serie.fechacarga}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Badges de segmentaciones */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {serie.segmentaciones2D > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 border border-green-300 text-green-700 text-xs font-medium">
                        ✓ {serie.segmentaciones2D} Seg 2D
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-600 text-xs font-medium">
                        ✗ Sin seg 2D
                      </span>
                    )}

                    {serie.segmentaciones3D > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-700 text-xs font-medium">
                        ✓ {serie.segmentaciones3D} Seg 3D
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-600 text-xs font-medium">
                        ✗ Sin seg 3D
                      </span>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  {generando === serie.session_id && (
                    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-800">
                          Generando reporte PDF...
                        </span>
                        <span className="text-xs font-semibold text-purple-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  {serie.tieneSegmentaciones ? (
                    <button
                      onClick={() => generarReporte(serie)}
                      disabled={generando === serie.session_id}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-semibold transition-all shadow-md mb-3 ${generando === serie.session_id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90'
                        }`}
                    >
                      {generando === serie.session_id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText size={18} />
                          Generar Reporte PDF
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-center">
                      <p className="text-xs text-yellow-800 mb-2">
                        ⚠️ Sin segmentaciones disponibles
                      </p>
                      <button
                        onClick={() => navigate(`/visor/${serie.session_id}`)}
                        className="text-xs text-yellow-700 font-semibold hover:text-yellow-900"
                      >
                        Ir al visor →
                      </button>
                    </div>
                  )}

                  {/* Botones secundarios */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/segmentaciones/${serie.session_id}`)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-medium transition-colors"
                    >
                      <Layers size={14} />
                      Segmentaciones
                    </button>

                    <button
                      o onClick={() => verSerie(serie)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium transition-colors"
                    >
                      <Eye size={14} />
                      Ver Serie
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info footer */}
        {!cargando && series.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  📋 Contenido del reporte médico
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Datos completos del paciente (si está vinculado)</li>
                  <li>✓ Información técnica del estudio DICOM</li>
                  <li>✓ Mediciones detalladas de segmentaciones 2D y 3D</li>
                  <li>✓ Listado de modelos STL generados</li>
                  <li>✓ Formato profesional listo para impresión</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
