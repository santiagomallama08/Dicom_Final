import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionCard from '../components/dashboard/ActionCard';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [lastSession, setLastSession] = useState(null);

  // Opcional: si guardas lastSessionId en localStorage,
  // lo recuperas para habilitar el card "Ir al visor"
  useEffect(() => {
    setLastSession(localStorage.getItem('lastSessionId'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#0a0a0a] to-[#1c1c1e] text-white pt-24 px-6">
      <h1 className="text-4xl font-bold text-center mb-12">Centro DICOM</h1>
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