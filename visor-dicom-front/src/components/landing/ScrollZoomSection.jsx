import React, { useEffect, useRef } from "react";

const ScrollZoomSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const element = imageRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = 1 - rect.top / windowHeight;
        const scale = 1 + scrollProgress * 0.25;
        element.style.transform = `scale(${scale})`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative w-full bg-[#1D1D1F] text-white py-24 overflow-hidden">
      {/* Imagen con efecto */}
      <div className="relative z-0 max-w-9xl mx-auto h-[900px] overflow-hidden rounded-xl shadow-2xl ring-1 ring-gray-700">
        <img
          ref={imageRef}
          src="/images/zoom-medical.jpg"
          alt="hospital"
          className="w-full h-full object-cover opacity-25 transition-transform duration-300 ease-out"
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>

      {/* Texto */}
      <div className="relative z-10 text-center mt-16 px-6">
  
        <p

           className="text-base font-semibold tracking-wide bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] bg-clip-text text-transparent mb-4">
            Diseñado para inteligencia médica.
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold mb-4"
          data-aos="fade-up"
        >
          Inteligencia artificial en cada estudio.
        </h2>
        <p
          className="text-base font-semibold tracking-wide bg-gradient-to-r from-[#1DA1F2] via-[#B400EF] to-[#FF6A3D] bg-clip-text text-transparent mb-4"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Visualiza, analiza y mide en tiempo real con la precisión de un sistema clínico inteligente.
        </p>
      </div>
    </section>
  );
};

export default ScrollZoomSection;
