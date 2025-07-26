// src/pages/UploadPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadCard from '../components/dicom/UploadCard';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('Selecciona un archivo');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-dicom-series/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      const sessionId = result.session_id || result.image_series?.session_id;
      const images = result.image_series?.image_series || result.image_series;

      if (!sessionId) throw new Error('No se recibió session_id del servidor');

      // ✅ Redirección con estado
      navigate(`/visor/${sessionId}`, {
        replace: true,
        state: { images },
      });

    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo');
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
