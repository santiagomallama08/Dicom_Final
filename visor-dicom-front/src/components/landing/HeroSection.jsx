import React from 'react';

const HeroSection = () => (
  <section className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-blue-300 text-center px-4 pt-20">
    <h1 className="text-4xl md:text-6xl font-bold mb-4">Visor DICOM Inteligente</h1>
    <p className="text-lg md:text-xl mb-6 max-w-xl">Visualiza, segmenta y analiza imágenes médicas con precisión en tiempo real.</p>
    <a href="/upload" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
      Empezar ahora
    </a>
  </section>
);

export default HeroSection;