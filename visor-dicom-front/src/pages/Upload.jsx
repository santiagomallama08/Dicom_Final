// src/pages/Upload.jsx
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import React, { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return setError('Selecciona un ZIP primero.');
    setError('');
    const form = new FormData();
    form.append('file', file);

    try {
      const { data } = await axios.post(
        'http://localhost:8000/upload-dicom-series/',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // 🚨 Si tu backend anida image_series, sacamos el session_id de ahí:
      const sessionId = data.session_id || data.image_series?.session_id;
      if (!sessionId) {
        throw new Error('No se recibió session_id del servidor');
      }

      navigate(`/visor/${sessionId}`, { replace: true, state: { images: data.image_series.image_series || data.image_series } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Error al subir ZIP.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl space-y-6 w-full max-w-md shadow-xl">
          <h2 className="text-2xl font-bold text-center">Subir ZIP DICOM</h2>
          <input
            type="file"
            accept=".zip"
            onChange={e => setFile(e.target.files[0])}
            className="w-full text-gray-200"
          />
          {error && <p className="text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] py-2 rounded-full text-white font-semibold"
          >
            Subir
          </button>
        </form>
      </main>
    </div>
  );
}