// src/components/landing/HeroSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden text-white">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover blur-sm opacity-70 z-0"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/fondo-hero.mp4" type="video/mp4" />
        Tu navegador no soporta el video.
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 z-0"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-xl">
          Visor DICOM Inteligente
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl drop-shadow-lg">
          Visualiza, segmenta y analiza imágenes médicas en tiempo real con precisión quirúrgica.
        </p>
        <Link to="/upload">
          <button className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition">
            Empezar ahora
          </button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;