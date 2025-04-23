import numpy as np
import pydicom
from skimage import measure, morphology, io
from scipy import ndimage
import os

def segmentar_craneo(dicom_path, output_path="segmentacion_output.png"):
    try:
        # Cargar archivo DICOM
        ds = pydicom.dcmread(dicom_path)
        imagen = ds.pixel_array.astype(np.int16)

        # Normalizar y aplicar umbral para el hueso
        umbral_inferior = 400  # Umbral para hueso en Hounsfield
        mascara = imagen > umbral_inferior

        # Remover pequeños objetos
        mascara_limpia = morphology.remove_small_objects(mascara, min_size=500)

        # Etiquetar componentes conectadas
        etiquetas = measure.label(mascara_limpia)
        propiedades = measure.regionprops(etiquetas)

        # Mantener la región más grande (supuestamente el cráneo)
        if propiedades:
            area_mayor = max(propiedades, key=lambda x: x.area).label
            segmento_craneo = etiquetas == area_mayor
        else:
            segmento_craneo = np.zeros_like(imagen)

        # Convertir a imagen binaria
        imagen_binaria = segmento_craneo.astype(np.uint8) * 255

        # Guardar como PNG (opcional)
        io.imsave(output_path, imagen_binaria.astype(np.uint8))

        return {"mensaje": "Segmentación exitosa", "output": output_path}

    except Exception as e:
        return {"error": str(e)}
