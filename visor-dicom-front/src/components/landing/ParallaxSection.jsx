import { FaMicroscope, FaBrain, FaStethoscope } from "react-icons/fa";

const ParallaxSection = () => {
  return (
    <section className="relative bg-fixed bg-center bg-cover bg-no-repeat bg-[url('/images/medical-blur.jpg')] min-h-screen text-white">
      <div className="bg-black bg-opacity-60 px-6 py-24 flex flex-col justify-center items-center text-center min-h-screen">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-up">
          Tecnología al servicio de la salud
        </h2>
        <p className="text-lg md:text-xl max-w-3xl animate-fade-up delay-200">
          Combinamos visión artificial y procesamiento de imágenes médicas para facilitar diagnósticos y tratamientos con precisión.
        </p>

        {/* ✅ NUEVO BLOQUE DE CONTENIDO */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-lg md:text-xl italic text-gray-200">Una herramienta médica moderna para mejorar tu práctica clínica.</p>
          <div className="flex justify-center gap-6 flex-wrap text-sm md:text-base text-gray-300">
            <div className="flex items-center gap-2">
              <span>✔</span> Precisión quirúrgica
            </div>
            <div className="flex items-center gap-2">
              <span>✔</span> Diagnóstico acelerado
            </div>
            <div className="flex items-center gap-2">
              <span>✔</span> Resultados interpretables
            </div>
          </div>
        </div>

        {/* Íconos */}
        <div className="mt-16 flex gap-10 flex-wrap justify-center">
          <div className="flex flex-col items-center animate-fade-up delay-300">
            <FaMicroscope size={40} />
            <span className="mt-2">Detección precisa</span>
          </div>
          <div className="flex flex-col items-center animate-fade-up delay-400">
            <FaBrain size={40} />
            <span className="mt-2">Análisis inteligente</span>
          </div>
          <div className="flex flex-col items-center animate-fade-up delay-500">
            <FaStethoscope size={40} />
            <span className="mt-2">Soporte clínico</span>
          </div>
        </div>
      </div>

      {/* ✅ DEGRADADO SUAVIZADO ABAJO */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black to-transparent z-10"></div>
    </section>
  );
};

export default ParallaxSection;