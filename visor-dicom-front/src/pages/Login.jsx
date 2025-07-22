// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import IntroVisual from '../components/auth/IntroVisual';
import { motion } from 'framer-motion';

const Login = () => {
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem('session_token');
    if (session) {
      navigate('/upload');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#0a0a0a] to-[#1c1c1e] text-white flex flex-col relative">
      <Navbar />
      <ParticlesBackground />
      {!showContent && <IntroVisual onFinish={() => setShowContent(true)} />}

      {showContent && (
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-grow px-4 py-12 flex items-center justify-center"
        >
          <div className="w-full flex justify-center">
            <LoginForm />
          </div>
        </motion.main>
      )}

      {showContent && <Footer />}
    </div>
  );
};

export default Login;