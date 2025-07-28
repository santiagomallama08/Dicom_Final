export default function SegmentResult({ isOpen, onClose, segmentacion }) {
  if (!isOpen || !segmentacion) return null;
  const { mask_path, dimensiones } = segmentacion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#1D1D1F] text-white p-6 rounded-lg shadow-xl w-[90vw] max-w-6xl flex gap-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-3">Imagen Segmentada</h2>
          <img
            src={`http://localhost:8000${mask_path}`}   // Asegúrate de anteponer tu host si es necesario
            alt="Segmentación"
            className="rounded-lg border border-gray-700 max-h-[70vh] object-contain"
          />
        </div>
        <div className="w-1/3 bg-[#2C2C2E] rounded-lg p-4 shadow-inner overflow-y-auto">
          <h2 className="text-lg font-bold mb-3">Medidas</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(dimensiones).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize text-gray-300">{k}:</span>
                <span className="text-[#4ADE80] font-semibold">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
