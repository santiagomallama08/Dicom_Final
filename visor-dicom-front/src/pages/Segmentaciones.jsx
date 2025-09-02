// src/pages/Segmentaciones.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { userHeaders } from "../utils/authHeaders";

const API = "http://localhost:8000";

export default function Segmentaciones() {
  const { session_id } = useParams();
  const navigate = useNavigate();

  const [items2d, setItems2d] = useState([]);
  const [items3d, setItems3d] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const [r2d, r3d] = await Promise.all([
        fetch(`${API}/historial/series/${session_id}/segmentaciones`, {
          headers: { ...userHeaders() },
        }),
        fetch(`${API}/historial/series/${session_id}/segmentaciones-3d`, {
          headers: { ...userHeaders() },
        }),
      ]);

      if (!r2d.ok) throw new Error(await r2d.text());
      if (!r3d.ok) throw new Error(await r3d.text());

      const d2d = await r2d.json();
      const d3d = await r3d.json();

      setItems2d(d2d || []);
      setItems3d(d3d || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las segmentaciones.");
    } finally {
      setCargando(false);
    }
  };

  const borrar2d = async (archivodicomid) => {
    const ok = await Swal.fire({
      title: "¿Eliminar esta segmentación?",
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
        {
          method: "DELETE",
          headers: { ...userHeaders() },
        }
      );
      if (!res.ok) throw new Error(await res.text());

      setItems2d((prev) => prev.filter((x) => x.archivodicomid !== archivodicomid));

      Swal.fire({
        icon: "success",
        title: "Segmentación eliminada",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la segmentación.",
      });
    }
  };

  const borrar3d = async (seg3d_id) => {
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
      const res = await fetch(`${API}/historial/segmentaciones-3d/${seg3d_id}`, {
        method: "DELETE",
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());

      setItems3d((prev) => prev.filter((x) => x.id !== seg3d_id));

      Swal.fire({
        icon: "success",
        title: "Segmentación 3D eliminada",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la segmentación 3D.",
      });
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id]);

  const noHayNada = !cargando && items2d.length === 0 && items3d.length === 0;

  return (
    <section className="min-h-screen bg-white text-black p-8">
      {/* Volver */}
      <button
        onClick={() => navigate("/historial")}
        className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-900 text-white hover:opacity-90"
        title="Volver al historial"
      >
        <ArrowLeft size={18} />
        Volver
      </button>

      <header className="mb-6">
        <h1 className="text-3xl font-bold">Segmentaciones de la serie</h1>
        <p className="text-sm text-gray-600">Session ID: {session_id}</p>
      </header>

      {cargando && <p>Cargando segmentaciones...</p>}
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

      {/* Cuando no haya segmentaciones (ni 2D ni 3D) */}
      {noHayNada && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-3">Esta serie no tiene segmentaciones almacenadas.</p>
          <button
            onClick={() => navigate("/historial")}
            className="px-5 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            Volver al historial
          </button>
        </div>
      )}

      {/* SEGMENTACIONES 2D */}
      {items2d.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">Segmentaciones 2D</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {items2d.map((it) => (
              <div
                key={it.archivodicomid}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                {/* preview */}
                <div className="bg-gray-100 flex items-center justify-center h-48">
                  {it.mask_path ? (
                    <img
                      src={`${API}${it.mask_path}`}
                      alt="Máscara"
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">Sin máscara disponible</span>
                  )}
                </div>

                {/* métricas */}
                <div className="p-4 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
                    <span>
                      <strong>Altura:</strong> {it.altura} mm
                    </span>
                    <span>
                      <strong>Longitud:</strong> {it.longitud} mm
                    </span>
                    <span>
                      <strong>Ancho:</strong> {it.ancho} mm
                    </span>
                  </div>
                  <div className="mb-3">
                    <strong>Volumen:</strong> {it.volumen} {it.unidad || "mm³"}
                  </div>
                  <div className="text-gray-600 mb-2">
                    <strong>Tipo:</strong> {it.tipoprotesis}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => borrar2d(it.archivodicomid)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SEGMENTACIONES 3D */}
      {items3d.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">Segmentaciones 3D</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items3d.map((s3d) => (
              <div
                key={s3d.id}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                {/* previews (axial / sagital / coronal) */}
                <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 h-48">
                  <div className="flex items-center justify-center bg-white rounded">
                    {s3d.thumb_axial ? (
                      <img
                        src={`${API}${s3d.thumb_axial}`}
                        alt="Axial"
                        className="max-h-44 object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">Axial</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center bg-white rounded">
                    {s3d.thumb_sagittal ? (
                      <img
                        src={`${API}${s3d.thumb_sagittal}`}
                        alt="Sagital"
                        className="max-h-44 object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">Sagital</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center bg-white rounded">
                    {s3d.thumb_coronal ? (
                      <img
                        src={`${API}${s3d.thumb_coronal}`}
                        alt="Coronal"
                        className="max-h-44 object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">Coronal</span>
                    )}
                  </div>
                </div>

                {/* métricas */}
                <div className="p-4 text-sm">
                  <div className="mb-2">
                    <strong>Volumen:</strong>{" "}
                    {typeof s3d.volume_mm3 === "number" ? s3d.volume_mm3.toFixed(0) : s3d.volume_mm3} mm³
                  </div>
                  <div className="mb-2">
                    <strong>Superficie:</strong>{" "}
                    {s3d.surface_mm2 != null
                      ? `${Number(s3d.surface_mm2).toFixed(0)} mm²`
                      : "—"}
                  </div>
                  <div className="mb-2">
                    <strong>Dimensiones (BBox):</strong>{" "}
                    {`${Number(s3d.bbox_x_mm).toFixed(1)} × ${Number(s3d.bbox_y_mm).toFixed(1)} × ${Number(s3d.bbox_z_mm).toFixed(1)} mm`}
                  </div>
                  <div className="mb-2 text-gray-600">
                    <strong>Slices:</strong> {s3d.n_slices}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => borrar3d(s3d.id)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                    >
                      Borrar 3D
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTA cuando aún quedan segmentaciones */}
      {(items2d.length > 0 || items3d.length > 0) && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Para eliminar la serie completa, primero borra todas las segmentaciones.
        </div>
      )}
    </section>
  );
}
