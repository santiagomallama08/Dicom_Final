import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import tkinter as tk
from tkinter import filedialog, ttk, messagebox
import pydicom
import numpy as np
from PIL import Image, ImageTk

from modules.processing.segmentacion import segmentar_craneo, segmentar_craneo_desde_gui
from modules.database.dao import get_or_create_archivo_dicom, insert_protesis_dimension

class DICOMViewer:
    def __init__(self, root):
        self.root = root
        self.root.title("Visor DICOM para Prótesis Craneales")
        self.dicom_path = None
        self.original_image = None
        self.zoom_level = 1.0
        self.rotation_angle = 0
        self.setup_ui()

    def setup_ui(self):
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True)

        left_menu = tk.Frame(main_frame, bg="#2c3e50", padx=15, pady=15)
        left_menu.pack(side=tk.LEFT, fill=tk.Y)

        tk.Label(left_menu, text="🛠️ Herramientas", font=("Arial", 14, "bold"),
                 bg="#2c3e50", fg="white").pack(pady=(0, 20))

        btn_style = {
            "font": ("Arial", 10),
            "bg": "#3498db",
            "fg": "white",
            "activebackground": "#2980b9",
            "activeforeground": "white",
            "relief": tk.FLAT,
            "bd": 0,
            "width": 25,
            "height": 2,
        }

        tk.Button(left_menu, text="📂 Abrir archivo DICOM", command=self.open_dicom, **btn_style).pack(pady=5)
        tk.Button(left_menu, text="🧠 Segmentar cráneo", command=self.segmentar_craneo, **btn_style).pack(pady=5)
        tk.Button(left_menu, text="🧩 Diseñar prótesis", command=self.disenar_protesis, **btn_style).pack(pady=5)
        tk.Button(left_menu, text="📐 Generar STL", command=self.exportar_stl, **btn_style).pack(pady=5)
        tk.Button(left_menu, text="📏 Obtener medidas", command=self.calcular_dimensiones, **btn_style).pack(pady=5)
        tk.Button(left_menu, text="💰 Mostrar presupuesto", command=self.mostrar_presupuesto, **btn_style).pack(pady=5)

        viewer_frame = tk.Frame(main_frame)
        viewer_frame.pack(side=tk.LEFT, expand=True, fill=tk.BOTH)

        self.canvas = tk.Canvas(viewer_frame, width=600, height=600, bg="black")
        self.canvas.pack(pady=(10, 0))

        controls_frame = tk.Frame(viewer_frame)
        controls_frame.pack(pady=10)

        tk.Label(controls_frame, text="Zoom").grid(row=0, column=0, padx=5)
        self.zoom_slider = ttk.Scale(controls_frame, from_=0.5, to=2.0, orient="horizontal",
                                     value=1.0, command=self.apply_transformations)
        self.zoom_slider.grid(row=0, column=1, padx=5)

        tk.Label(controls_frame, text="Rotación").grid(row=0, column=2, padx=5)
        self.rot_slider = ttk.Scale(controls_frame, from_=-180, to=180, orient="horizontal",
                                    value=0, command=self.apply_transformations)
        self.rot_slider.grid(row=0, column=3, padx=5)

    def open_dicom(self):
        path = filedialog.askopenfilename(filetypes=[("DICOM files", "*.dcm")])
        if not path:
            return
        self.dicom_path = path
        ds = pydicom.dcmread(path)
        arr = ds.pixel_array.astype(float)
        arr = (np.maximum(arr, 0) / arr.max() * 255).astype(np.uint8)
        img = Image.fromarray(arr).convert("L")
        self.original_image = img
        self.zoom_level = 1.0
        self.rotation_angle = 0
        self.zoom_slider.set(1.0)
        self.rot_slider.set(0)
        self.update_image()

    def apply_transformations(self, _=None):
        self.zoom_level = float(self.zoom_slider.get())
        self.rotation_angle = float(self.rot_slider.get())
        self.update_image()

    def update_image(self):
        if self.original_image is None:
            return
        w, h = self.original_image.size
        cx, cy = w // 2, h // 2
        rotated = self.original_image.rotate(self.rotation_angle, resample=Image.BICUBIC, center=(cx, cy))
        nw, nh = int(w * self.zoom_level), int(h * self.zoom_level)
        resized = rotated.resize((nw, nh), resample=Image.BICUBIC)
        self.tk_img = ImageTk.PhotoImage(resized)
        self.canvas.delete("all")
        cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
        if cw == 1 and ch == 1:
            self.canvas.update()
            cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
        x, y = (cw - nw) // 2, (ch - nh) // 2
        self.canvas.create_image(x, y, anchor=tk.NW, image=self.tk_img)

    def segmentar_craneo(self):
        if not self.dicom_path:
            print("No hay imagen DICOM cargada.")
            return

        resultado = segmentar_craneo(self.dicom_path)
        if "error" in resultado:
            messagebox.showerror("Error en segmentación", resultado["error"])
            return

        # Mostrar máscara binaria
        mask = Image.open(resultado["output"]).convert("L")
        mask = mask.resize(self.original_image.size, resample=Image.NEAREST)
        mask = mask.point(lambda p: 255 if p > 0 else 0)
        self.original_image = mask
        self.zoom_slider.set(1.0)
        self.rot_slider.set(0)
        self.update_image()

    def calcular_dimensiones(self):
        if not self.dicom_path:
            print("No hay imagen DICOM cargada.")
            return

        # 1) Obtener dimensiones y ruta
        resultado = segmentar_craneo(self.dicom_path)
        if "error" in resultado:
            messagebox.showerror("Error en segmentación", resultado["error"])
            return

        # 2) Mostrar popup
        segmentar_craneo_desde_gui(self.dicom_path)

        # 3) Guardar en BD
        nombre = os.path.basename(self.dicom_path)
        ruta = self.dicom_path
        sistema_id = 1  # Ajustar según tu entorno

        archivo_id = get_or_create_archivo_dicom(nombre, ruta, sistema_id)
        tipo_protesis = "Cráneo"
        ok = insert_protesis_dimension(archivo_id, tipo_protesis, resultado["dimensiones"])
        if ok:
            print("✅ Dimensiones guardadas en BD.")
        else:
            print("ℹ️ Registro ya existente en BD.")

    def disenar_protesis(self):
        print("Diseño de prótesis en proceso...")

    def exportar_stl(self):
        print("Exportación a STL para impresión 3D...")

    def mostrar_presupuesto(self):
        print("Mostrar presupuesto de materiales y tiempo...")
