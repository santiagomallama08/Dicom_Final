// src/pages/Upload.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadCard from '../components/dicom/UploadCard';
import Swal from 'sweetalert2';
import { userHeaders } from '../utils/authHeaders';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      await Swal.fire({
        title: 'Selecciona un archivo',
        text: 'Debes elegir un ZIP con imágenes DICOM.',
        icon: 'info',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-dicom-series/', {
        method: 'POST',
        headers: {
          ...userHeaders(), 
        },
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || 'Error al procesar el ZIP en el servidor.');
      }

      const result = await response.json();

      const sessionId = result.session_id || result.image_series?.session_id;
      const images = result.image_series?.image_series || result.image_series;

      if (!sessionId) {
        throw new Error('No se recibió el session_id del servidor.');
      }

      navigate(`/visor/${sessionId}`, {
        replace: true,
        state: { images, source: 'upload' },
      });
    } catch (error) {
      console.error(error);
      await Swal.fire({
        title: 'Error al subir',
        text: error.message || 'Ocurrió un problema al subir el archivo.',
        icon: 'error',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <UploadCard
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        isLoading={isLoading}
      />
    </div>
  );
}
