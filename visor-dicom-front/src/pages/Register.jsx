// src/pages/Register.jsx
import React, { useState } from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import IntroVisual from '../components/auth/IntroVisual'; // 👈 misma animación que login

const Register = () => {
  const [showMain, setShowMain] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#0a0a0a] to-[#1c1c1e] text-white flex flex-col relative">
      {!showMain && <IntroVisual onFinish={() => setShowMain(true)} />}
      <Navbar />
      <ParticlesBackground />
      {showMain && (
        <main className="flex-grow px-4 py-12 flex items-center justify-center">
          <RegisterForm />
        </main>
      )}
      <Footer />
    </div>
  );
};

export default Register;