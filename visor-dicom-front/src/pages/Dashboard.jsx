import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionCard from '../components/shared/ActionCard';
import axios from 'axios';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import medicalAnimation from '../Assets/lotties/medical-welcome.json'; // debes tener un archivo Lottie aquí
const Dashboard = () => {
  const navigate = useNavigate();
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    setLastSession(localStorage.getItem('lastSessionId'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#0a0a0a] to-[#1c1c1e] text-white pt-24 px-6">
      {/* Encabezado de bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center mb-12"
      >
        <div className="w-40 h-40">
          <Lottie animationData={medicalAnimation} loop autoplay />
        </div>
        <h1 className="text-4xl font-bold mt-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Bienvenido a tu Centro DICOM
        </h1>
        <p className="mt-2 text-gray-300 text-lg text-center max-w-xl">
          Explora, segmenta y gestiona tus estudios médicos con tecnología de última generación.
        </p>
      </motion.div>

      {/* Tarjetas de acción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <ActionCard
          title="📤 Subir nuevo estudio"
          description="Carga un ZIP con tus DICOM y comienza un análisis."
          onClick={() => navigate('/upload')}
          color="from-blue-500 to-blue-700"
        />
        <ActionCard
          title="📂 Ver estudios anteriores"
          description="Explora y reanuda análisis de sesiones previas."
          onClick={() => navigate('/studies')}
          color="from-green-500 to-green-700"
        />
        <ActionCard
          title="🧭 Ir al visor"
          description="Continúa con tu último estudio."
          onClick={() => navigate(`/viewer/${lastSession}`)}
          color="from-purple-500 to-purple-700"
          disabled={!lastSession}
        />
      </div>
    </div>
  );
};

export default Dashboard;
