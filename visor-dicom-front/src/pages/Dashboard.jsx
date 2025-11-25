// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import {
  HeartPulse,
  Stethoscope,
  FileHeart,
} from 'lucide-react';
import medicalAnimation from '../Assets/lotties/medical-welcome.json';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
      {/* HERO */}
      <div className="w-full max-w-5xl flex flex-col items-center text-center space-y-6 mb-12 sm:mb-20">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-transparent bg-clip-text">
          Plataforma Inteligente<br />para el Diagnóstico Médico
        </h1>

        <p className="text-gray-600 text-base sm:text-lg max-w-2xl px-4">
          Nuestro sistema está enfocado en ayudarte a descubrir un diagnóstico más preciso y eficiente a partir de imágenes DICOM.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
          <button
            onClick={() => navigate('/upload')}
            className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold shadow-lg 
              bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white hover:opacity-90 transition-opacity"
          >
            Empezar ahora
          </button>

          <a
            href="/#features"
            className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold border-2 border-purple-500
              text-purple-600 hover:bg-purple-50 transition-all"
          >
            Saber más
          </a>
        </div>

        <div className="w-full max-w-sm sm:max-w-md mt-6">
          <Lottie animationData={medicalAnimation} loop autoplay />
        </div>
      </div>

      {/* TARJETAS */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 px-4">
        <div
          onClick={() => navigate('/upload')}
          className="bg-white border border-gray-200 p-8 sm:p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all group"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Exploración DICOM</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Carga, visualiza y navega imágenes médicas en formato DICOM de forma eficiente.
          </p>
        </div>

        <div
          onClick={() => navigate('/historial')}
          className="bg-white border border-gray-200 p-8 sm:p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all group"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Segmentación Avanzada</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Aplica algoritmos inteligentes para delimitar regiones anatómicas de interés.
          </p>
        </div>

        <div
          onClick={() => navigate('/modelado3d')}
          className="bg-white border border-gray-200 p-8 sm:p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all group"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <FileHeart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Precisión Diagnóstica</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Obtén métricas clínicas exactas como área, volumen y dimensiones físicas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
