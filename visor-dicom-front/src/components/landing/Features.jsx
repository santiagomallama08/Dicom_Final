import React from 'react';
import { HiOutlineChip, HiOutlineClipboardList, HiOutlineShieldCheck } from 'react-icons/hi';

const Features = () => (
  <section className="py-20 bg-white text-center" id="features">
    <h2
      className="text-3xl font-bold mb-12 text-gray-800"
      data-aos="fade-up"
    >
      Beneficios de usar esta herramienta
    </h2>
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-6">
      <div data-aos="fade-up" data-aos-delay="100" className="flex flex-col items-center">
        <HiOutlineChip className="text-blue-600 mb-4" size={50} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Precisión quirúrgica
        </h3>
        <p className="text-gray-600 text-sm">
          Procesamiento avanzado para resultados confiables.
        </p>
      </div>
      <div data-aos="fade-up" data-aos-delay="200" className="flex flex-col items-center">
        <HiOutlineClipboardList className="text-blue-600 mb-4" size={50} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Análisis inteligente
        </h3>
        <p className="text-gray-600 text-sm">
          Segmentación y mediciones automáticas en segundos.
        </p>
      </div>
      <div data-aos="fade-up" data-aos-delay="300" className="flex flex-col items-center">
        <HiOutlineShieldCheck className="text-blue-600 mb-4" size={50} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Soporte clínico
        </h3>
        <p className="text-gray-600 text-sm">
          Mejora el diagnóstico sin complicar tu flujo de trabajo.
        </p>
      </div>
    </div>
  </section>
);

export default Features