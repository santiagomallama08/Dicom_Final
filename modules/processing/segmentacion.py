import os
import numpy as np
import pydicom
from skimage import measure, morphology, io
from skimage.measure import regionprops

def segmentar_craneo(dicom_path, output_dir=None):
    try:
        # 1. Preparar carpeta de salida
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        outputs = output_dir or os.path.join(project_root, 'outputs')
        os.makedirs(outputs, exist_ok=True)

        # Generar nombre basado en el DICOM
        base = os.path.splitext(os.path.basename(dicom_path))[0]
        output_path = os.path.join(outputs, f"{base}_segmentacion.png")

        # 2. Leer DICOM y construir máscara
        ds = pydicom.dcmread(dicom_path)
        imagen = ds.pixel_array.astype(np.int16)
        umbral = 400  # Hounsfield Units para hueso
        mascara = imagen > umbral
        mascara = morphology.remove_small_objects(mascara, min_size=500)
        etiquetas = measure.label(mascara)
        props = regionprops(etiquetas)

        # 3. Extraer la región más grande (cráneo)
        if props:
            lbl = max(props, key=lambda r: r.area).label
            segmento = etiquetas == lbl
        else:
            segmento = np.zeros_like(imagen)

        # 4. Guardar la máscara binaria
        binaria = (segmento.astype(np.uint8) * 255)
        io.imsave(output_path, binaria)

        # 5. Leer metadatos para conversión a mm
        px_y, px_x = ds.PixelSpacing               # mm/píxel
        slice_thk   = getattr(ds, "SliceThickness", 1.0)  # mm

        # 6. Calcular propiedades en píxeles
        dimensiones = {}
        if props:
            r = max(props, key=lambda r: r.area)
            minr, minc, maxr, maxc = r.bbox
            largo_px   = maxr - minr
            ancho_px   = maxc - minc
            area_px2   = r.area
            perim_px   = r.perimeter

            # 7. Convertir a unidades físicas
            dimensiones = {
                "Longitud (mm)": round(largo_px * px_y, 2),
                "Ancho (mm)":    round(ancho_px * px_x, 2),
                "Altura (mm)":   round(slice_thk, 2),
                "Área (mm²)":    round(area_px2 * px_x * px_y, 2),
                "Perímetro (px)": round(perim_px, 2),
                "Volumen (mm³)": round(area_px2 * px_x * px_y * slice_thk, 2)
            }
        else:
            dimensiones = {"error": "No se detectó cráneo válido."}

        return {"mensaje": "Segmentación exitosa", "output": output_path, "dimensiones": dimensiones}

    except Exception as e:
        return {"error": str(e)}


# Función para la GUI
from tkinter import messagebox, Tk

def segmentar_craneo_desde_gui(dicom_path):
    resultado = segmentar_craneo(dicom_path)

    root = Tk(); root.withdraw()
    if "dimensiones" in resultado and "error" not in resultado["dimensiones"]:
        d = resultado["dimensiones"]
        texto = "\n".join(f"{k}: {v}" for k,v in d.items())
        messagebox.showinfo("Dimensiones del cráneo", texto)
    else:
        messagebox.showerror("Error en segmentación", resultado.get("error", "Desconocido"))
