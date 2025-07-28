import React, { useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SegmentResult from '../components/dicom/SegmentResult';
export default function Viewer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [segmentacion, setSegmentacion] = useState(null);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const { session_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const images = location.state?.images || [];

  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [windowWidth, setWindowWidth] = useState(1500); // Brillo
  const [windowLevel, setWindowLevel] = useState(-500); // Contraste
  const [rotation, setRotation] = useState(0); // Grados
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const imageUrl = `http://localhost:8000${images[current]}`;

  const segmentarImagen = async () => {
    if (!session_id || !images[current]) {
      console.error("Faltan session_id o imagen");
      return;
    }

    setLoadingSegment(true);
    try {
      // Construimos un FormData en vez de JSON
      const form = new FormData();
      form.append("session_id", session_id);
      // extraemos solo el nombre del archivo PNG
      const imageName = images[current].split("/").pop();
      form.append("image_name", imageName);

      const response = await fetch("http://localhost:8000/segmentar-desde-mapping/", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Error del backend:", text);
        return;
      }

      const data = await response.json();
      // data debe tener { mensaje, mask_path, dimensiones }
      setSegmentacion(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al segmentar:", error);
    } finally {
      setLoadingSegment(false);
    }
  };


  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    // Movimiento vertical → Brillo
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setWindowWidth((prev) => Math.max(100, prev + deltaY * 2));
    }
    // Movimiento horizontal → Contraste
    else {
      setWindowLevel((prev) => prev + deltaX * 2);
    }

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!session_id || !images.length) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">No se encontraron imágenes para esta sesión.</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Volver a subir ZIP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative px-6 py-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Botón regresar */}
      <button
        onClick={() => navigate('/upload')}
        className="absolute top-4 left-4 p-2 text-white bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90 rounded-full shadow-md transition duration-200"
        title="Volver"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Caja del visor (más grande) */}
      <div
        className="overflow-hidden rounded-lg shadow-2xl mb-6 border border-gray-700 bg-black"
        style={{
          width: '80vw',
          height: '70vh',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt={`DICOM frame ${current}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: `brightness(${windowWidth / 1000}) contrast(${(windowLevel + 1000) / 1000})`,
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Barra de navegación de imágenes */}
      <div className="w-full max-w-2xl flex flex-col items-center mb-6">
        <input
          type="range"
          min="0"
          max={images.length - 1}
          value={current}
          onChange={(e) => setCurrent(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="mt-2 text-sm text-gray-300">{`Imagen ${current + 1} / ${images.length}`}</div>
      </div>

      {/* Controles de zoom y rotación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 items-center text-center w-full max-w-4xl">
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400 mb-1">🔆 Brillo (W)</label>
          <input
            type="range"
            min="500"
            max="2500"
            step="10"
            value={windowWidth}
            onChange={(e) => setWindowWidth(Number(e.target.value))}
            className="w-40 accent-yellow-500"
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400 mb-1">🌑 Contraste (L)</label>
          <input
            type="range"
            min="-1000"
            max="1000"
            step="10"
            value={windowLevel}
            onChange={(e) => setWindowLevel(Number(e.target.value))}
            className="w-40 accent-gray-400"
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400 mb-1">🔍 Zoom</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-40 accent-purple-500"
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400 mb-1">↻ Rotar</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-40 accent-blue-500"
          />
        </div>
      </div>

      {/* Valores actuales (opcional mostrar) */}
      <div className="text-sm text-gray-400 flex gap-4 flex-wrap justify-center mb-4">
        <span>Brillo: {windowWidth}</span>
        <span>Contraste: {windowLevel}</span>
        <span>Zoom: {zoom.toFixed(1)}x</span>
        <span>Rotación: {rotation}°</span>
      </div>

      {/* Botón de segmentar */}
      <button
        onClick={segmentarImagen}
        className="px-6 py-2 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90 text-white font-semibold rounded shadow transition duration-200"
      >
        {loadingSegment ? 'Segmentando...' : 'Segmentar esta imagen'}
      </button>

      <SegmentResult
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        segmentacion={segmentacion}
      />

    </div>
  );
}
