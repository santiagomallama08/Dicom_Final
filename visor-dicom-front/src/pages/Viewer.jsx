// src/pages/Viewer.jsx
import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ViewerControls from '../components/dashboard/ViewerControls';

export default function Viewer() {
  const { session_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const images = location.state?.images || [];

  const [current, setCurrent] = useState(0);

  // Si ni session_id ni images vienen, volvemos a /upload
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

  const imageUrl = `http://localhost:8000${images[current]}`;

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <img
        src={imageUrl}
        alt={`DICOM frame ${current}`}
        className="max-w-[600px] max-h-[600px] mb-4 rounded-lg shadow-lg"
      />

      <ViewerControls
        current={current}
        total={images.length}
        onPrev={() => setCurrent(i => Math.max(i - 1, 0))}
        onNext={() => setCurrent(i => Math.min(i + 1, images.length - 1))}
      />

      {/* Botón para segmentar */}
      <button
        onClick={() =>
          navigate(`/segmentar-desde-mapping/`, {
            state: { session_id, image_name: images[current].split('/').pop() }
          })
        }
        className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
      >
        Segmentar esta imagen
      </button>
    </div>
  );
}