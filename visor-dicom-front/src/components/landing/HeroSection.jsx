// src/components/landing/HeroSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden text-white">
      {/* Video de fondo */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover blur-sm opacity-60"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/fondo-hero.mp4" type="video/mp4" />
        Tu navegador no soporta el video.
      </video>

      {/* Overlay oscuro adicional */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Tarjeta central */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div
          className="bg-black/60 backdrop-blur-md max-w-2xl w-full text-center p-8 rounded-2xl shadow-2xl
                     animate-fade-up"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Visor DICOM Inteligente
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6">
            Visualiza, segmenta y analiza imágenes médicas en tiempo real con precisión quirúrgica.
          </p>
          <Link to="/login">
            <button
              className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00]
             text-white font-semibold px-6 py-3 rounded-full 
             shadow-lg transition duration-300 hover:brightness-110"
            >
              Empezar ahora
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
