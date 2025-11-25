import React from 'react';
import { UploadCloud } from 'lucide-react';
import radiografiaImg from '/images/radiografia.jpg';

export default function UploadCard({ onFileChange, onUpload, isLoading }) {
  return (
    <div className="
      flex flex-col md:flex-row 
      bg-white rounded-3xl shadow-2xl 
      overflow-hidden 
      w-full 
      max-w-5xl 
      mx-auto 
      p-6 sm:p-8 md:p-10
      gap-8
    ">
      
      {/* Texto e input */}
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
          Subir ZIP DICOM
        </h2>

        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Selecciona un archivo ZIP que contenga una serie de imágenes DICOM para procesarlas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
          
          <input
            type="file"
            accept=".zip"
            onChange={onFileChange}
            className="
              w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-gradient-to-r file:from-purple-500 file:to-pink-500
              file:text-white hover:file:opacity-90
              cursor-pointer
            "
          />

          <button
            onClick={onUpload}
            disabled={isLoading}
            className="
              flex items-center gap-2 
              bg-gradient-to-r from-blue-600 to-purple-600 
              text-white px-6 py-2 rounded-full shadow 
              hover:opacity-90 transition 
              disabled:opacity-50 w-full sm:w-auto
            "
          >
            <UploadCloud className="w-5 h-5" />
            {isLoading ? 'Subiendo...' : 'Subir'}
          </button>

        </div>
      </div>

      {/* Imagen responsiva */}
      <div className="w-full md:w-1/2 flex justify-center md:justify-end">
        <img 
          src={radiografiaImg} 
          alt="Radiografía" 
          className="
            w-full 
            max-w-md 
            object-contain 
            rounded-xl 
            md:pl-10
          "
        />
      </div>

    </div>
  );
}
