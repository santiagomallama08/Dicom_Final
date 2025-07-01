import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaFolderOpen, FaMicroscope, FaRulerCombined } from 'react-icons/fa';

const AboutDicom = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <section className="bg-white text-gray-800 py-20 px-6 md:px-16">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6" data-aos="fade-up">
          ¿Qué es un archivo DICOM?
        </h2>
        <p className="text-lg mb-12 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          DICOM es el formato estándar para almacenar y transmitir imágenes médicas. Este visor te permite cargarlas,
          recorrerlas como si fueran un video, segmentarlas automáticamente y obtener medidas anatómicas clave.
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          <div data-aos="fade-up" data-aos-delay="200">
            <FaFolderOpen className="text-blue-600 text-5xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Carga de estudios</h3>
            <p>Carga carpetas DICOM completas para navegar cada imagen fácilmente.</p>
          </div>

          <div data-aos="fade-up" data-aos-delay="300">
            <FaMicroscope className="text-blue-600 text-5xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Segmentación inteligente</h3>
            <p>Aplica algoritmos de segmentación para resaltar estructuras anatómicas en segundos.</p>
          </div>

          <div data-aos="fade-up" data-aos-delay="400">
            <FaRulerCombined className="text-blue-600 text-5xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Medidas precisas</h3>
            <p>Obtén medidas como volumen, altura o longitud a partir de la segmentación.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutDicom;