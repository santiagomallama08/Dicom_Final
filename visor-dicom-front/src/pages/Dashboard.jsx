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
    <section className="min-h-screen bg-white text-[#0f0f10] flex flex-col items-center justify-center px-6 py-20">
      {/* HERO */}
      <div className="w-full max-w-5xl flex flex-col items-center text-center space-y-6 mb-20">
        <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-transparent bg-clip-text">
          Plataforma Inteligente<br />para el Diagnóstico Médico
        </h1>

        <p className="text-[#4b5563] text-lg max-w-2xl">
          Nuestro sistema está enfocado en ayudarte a descubrir un diagnóstico más preciso y eficiente a partir de imágenes DICOM.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold shadow-md 
              bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] text-white hover:opacity-90 transition"
          >
            Empezar ahora
          </button>

          <a
            href="/#features"
            className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold border border-[#0f0f10]
              text-[#0f0f10] hover:border-[#FF4D00] hover:text-[#FF4D00] transition"
          >
            Saber más
          </a>
        </div>

        <div className="w-full max-w-md">
          <Lottie animationData={medicalAnimation} loop autoplay />
        </div>
      </div>

      {/* TARJETAS */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div
          onClick={() => navigate('/upload')}
          className="bg-[#f9f9f9] p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:shadow-lg transition"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full p-[3px] flex items-center justify-center">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#0f0f10]">Exploración DICOM</h3>
          <p className="text-[#4b5563]">
            Carga, visualiza y navega imágenes médicas en formato DICOM de forma eficiente.
          </p>
        </div>

        <div
          onClick={() => navigate('/historial')}
          className="bg-[#f9f9f9] p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:shadow-lg transition"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full p-[3px] flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#0f0f10]">Segmentación Avanzada</h3>
          <p className="text-[#4b5563]">
            Aplica algoritmos inteligentes para delimitar regiones anatómicas de interés.
          </p>
        </div>

        <div
          onClick={() => navigate('/modelado3d')}
          className="bg-[#f9f9f9] p-10 rounded-2xl shadow-md cursor-pointer
                     flex flex-col items-center text-center hover:shadow-lg transition"
        >
          <div className="w-14 h-14 mb-4 bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full p-[3px] flex items-center justify-center">
            <FileHeart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#0f0f10]">Precisión Diagnóstica</h3>
          <p className="text-[#4b5563]">
            Obtén métricas clínicas exactas como área, volumen y dimensiones físicas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;