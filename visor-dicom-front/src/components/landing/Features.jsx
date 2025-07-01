import React from 'react';

const Features = () => (
  <section className="py-20 bg-white text-center">
    <h2 className="text-3xl font-bold mb-8">¿Qué puedes hacer aquí?</h2>
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
      <div>
        <h3 className="text-xl font-semibold">Carga de estudios</h3>
        <p>Sube carpetas DICOM como si fueran videos y recórrelas frame a frame.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold">Segmentación automática</h3>
        <p>Aplica segmentación en tiempo real y obtén máscaras precisas.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold">Medidas anatómicas</h3>
        <p>Calcula dimensiones físicas (volumen, longitud, etc.) de manera precisa.</p>
      </div>
    </div>
  </section>
);

export default Features;