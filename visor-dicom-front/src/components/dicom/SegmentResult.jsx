// src/components/SegmentResult.jsx
export default function SegmentResult({ isOpen, onClose, segmentacion }) {
  if (!isOpen || !segmentacion) return null;

  const { mask_path, dimensiones } = segmentacion;

  // ✅ Verificación robusta: evita error si dimensiones es null o undefined
  const tieneDimensiones =
    dimensiones && typeof dimensiones === "object" && Object.keys(dimensiones).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#1D1D1F] text-white p-6 rounded-lg shadow-xl w-[90vw] max-w-6xl flex gap-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Imagen segmentada */}
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-3">Imagen Segmentada</h2>
          {mask_path ? (
            <img
              src={`http://localhost:8000${mask_path}`}
              alt="Segmentación"
              className="rounded-lg border border-gray-700 max-h-[70vh] object-contain"
            />
          ) : (
            <div className="text-gray-400 text-sm italic">
              ⚠️ No se encontró la imagen segmentada.
            </div>
          )}
        </div>

        {/* Panel lateral con medidas */}
        <div className="w-1/3 bg-[#2C2C2E] rounded-lg p-4 shadow-inner overflow-y-auto">
          <h2 className="text-lg font-bold mb-3">Medidas</h2>

          {tieneDimensiones ? (
            <ul className="space-y-2 text-sm">
              {Object.entries(dimensiones).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize text-gray-300">{k}:</span>
                  <span className="text-[#4ADE80] font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm italic">
              ⚠️ No se detectaron dimensiones válidas o los datos son nulos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
