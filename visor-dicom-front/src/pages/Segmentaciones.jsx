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

  // 2D
  const [items2D, setItems2D] = useState([]);
  // 3D
  const [items3D, setItems3D] = useState([]);
  // Modelos STL
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
      const res = await fetch(`${API}/modelos/series/${session_id}`, {
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
      Swal.fire({ icon: "success", title: "Segmentación eliminada", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar la segmentación." });
    }
  };

  // NUEVO: eliminar segmentación 3D
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
      Swal.fire({ icon: "success", title: "Segmentación 3D eliminada", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar la segmentación 3D." });
    }
  };

  const exportarStl = async (seg3dId) => {
    try {
      const res = await fetch(`${API}/modelos/exportar-stl`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeaders() },
        body: JSON.stringify({ seg3d_id: seg3dId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "No se pudo exportar STL");
      await cargarModelos();
      Swal.fire({ icon: "success", title: "STL generado", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message || "No se pudo exportar STL" });
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
      const res = await fetch(`${API}/modelos/${modeloId}`, {
        method: "DELETE",
        headers: { ...userHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      setModelos((prev) => prev.filter((m) => m.id !== modeloId));
      Swal.fire({ icon: "success", title: "STL eliminado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el STL." });
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

      {cargando && <p>Cargando…</p>}
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

      {/* 2D */}
      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-3">Segmentaciones 2D</h2>
        {items2D.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            No hay segmentaciones 2D.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items2D.map((it) => (
              <div key={it.archivodicomid} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-100 flex items-center justify-center h-48">
                  {it.mask_path ? (
                    <img src={`${API}${it.mask_path}`} alt="Máscara" className="max-h-48 object-contain" />
                  ) : (
                    <span className="text-gray-500 text-sm">Sin máscara disponible</span>
                  )}
                </div>
                <div className="p-4 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
                    <span><strong>Altura:</strong> {it.altura} mm</span>
                    <span><strong>Longitud:</strong> {it.longitud} mm</span>
                    <span><strong>Ancho:</strong> {it.ancho} mm</span>
                  </div>
                  <div className="mb-3"><strong>Volumen:</strong> {it.volumen} {it.unidad || "mm³"}</div>
                  <div className="text-gray-600 mb-2"><strong>Tipo:</strong> {it.tipoprotesis}</div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => borrar2D(it.archivodicomid)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3D */}
      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-3">Segmentaciones 3D</h2>

        {items3D.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            No hay segmentaciones 3D.
          </div>
        ) : (
          items3D.map((s3d) => (
            <div key={s3d.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50">
                <div className="h-28 bg-white border flex items-center justify-center">
                  <img src={`${API}${s3d.thumb_axial}`} alt="axial" className="max-h-28 object-contain" />
                </div>
                <div className="h-28 bg-white border flex items-center justify-center">
                  <img src={`${API}${s3d.thumb_sagittal}`} alt="sagittal" className="max-h-28 object-contain" />
                </div>
                <div className="h-28 bg-white border flex items-center justify-center">
                  <img src={`${API}${s3d.thumb_coronal}`} alt="coronal" className="max-h-28 object-contain" />
                </div>
              </div>

              <div className="p-4 text-sm">
                <div className="mb-1"><strong>Volumen:</strong> {Math.round(s3d.volume_mm3)} mm³</div>
                {s3d.surface_mm2 != null && (
                  <div className="mb-1"><strong>Superficie:</strong> {Math.round(s3d.surface_mm2)} mm²</div>
                )}
                <div className="mb-2">
                  <strong>Dimensiones (BBox):</strong>{" "}
                  {`${(s3d.bbox_x_mm).toFixed(1)} x ${(s3d.bbox_y_mm).toFixed(1)} x ${(s3d.bbox_z_mm).toFixed(1)} mm`}
                </div>
                <div className="mb-4"><strong>Slices:</strong> {s3d.n_slices}</div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportarStl(s3d.id)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Download size={16} />
                    Exportar STL
                  </button>

                  {/* NUEVO botón borrar 3D */}
                  <button
                    onClick={() => borrar3D(s3d.id)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 size={16} />
                    Borrar 3D
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modelos STL */}
      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-3">Modelos STL de esta serie</h2>

        {modelos.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            No hay modelos STL generados aún.
          </div>
        ) : (
          modelos.map((m) => (
            <div key={m.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm mb-4">
              <div className="text-sm mb-2">
                <div className="mb-1"><strong>STL:</strong> {m.path_stl}</div>
                <div className="mb-1"><strong>Vértices:</strong> {m.num_vertices ?? "?"}</div>
                <div className="mb-1"><strong>Caras:</strong> {m.num_caras ?? "?"}</div>
                <div className="mb-1"><strong>Tamaño:</strong> {m.file_size_bytes ? `${m.file_size_bytes} bytes` : "? bytes"}</div>
                <div className="mb-1"><strong>Fecha:</strong> {m.created_at ?? ""}</div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                  href={`${API}${m.path_stl}`}
                  download
                >
                  <Download size={16} />
                  Descargar
                </a>

                <button
                  onClick={() => borrarModelo(m.id)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 size={16} />
                  Borrar
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {items2D.length + items3D.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Para eliminar la serie completa, primero borra todas las segmentaciones y modelos STL.
        </div>
      )}
    </section>
  );
}
