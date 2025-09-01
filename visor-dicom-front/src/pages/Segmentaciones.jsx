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

    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargar = async () => {
        setCargando(true);
        setError("");
        try {
            const res = await fetch(`${API}/historial/series/${session_id}/segmentaciones`, {
                headers: {
                    ...userHeaders(), 
                },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setItems(data || []);
        } catch (e) {
            console.error(e);
            setError("No se pudieron cargar las segmentaciones.");
        } finally {
            setCargando(false);
        }
    };

    const borrar = async (archivodicomid) => {
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
                    headers: {
                        ...userHeaders(), // 👈 X-User-Id
                    },
                }
            );
            if (!res.ok) throw new Error(await res.text());

            // refrescar lista local
            setItems((prev) => prev.filter((x) => x.archivodicomid !== archivodicomid));

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

    useEffect(() => {
        cargar();
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

            {cargando && <p>Cargando segmentaciones...</p>}
            {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

            {/* Cuando no haya segmentaciones */}
            {!cargando && items.length === 0 && (
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

            {/* Grid de tarjetas */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => (
                    <div
                        key={it.archivodicomid}
                        className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                    >
                        {/* preview */}
                        <div className="bg-gray-100 flex items-center justify-center h-48">
                            {it.mask_path ? (
                                <img src={`${API}${it.mask_path}`} alt="Máscara" className="max-h-48 object-contain" />
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
                                    onClick={() => borrar(it.archivodicomid)}
                                    className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA cuando aún quedan segmentaciones */}
            {items.length > 0 && (
                <div className="mt-8 text-center text-sm text-gray-600">
                    Para eliminar la serie completa, primero borra todas las segmentaciones.
                </div>
            )}
        </section>
    );
}
