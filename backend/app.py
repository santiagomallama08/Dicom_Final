import tkinter as tk
from tkinter import filedialog, ttk
import pydicom
import numpy as np
from PIL import Image, ImageTk
from segmentacion import segmentar_craneo as segmentar_craneo_func

class DICOMViewer:
    def __init__(self, root):
        self.root = root
        self.root.title("Visor DICOM para Prótesis Craneales")
        self.dicom_path = None
        self.dicom_image = None
        self.original_image = None
        self.zoom_level = 1.0
        self.rotation_angle = 0

        self.setup_ui()

    def setup_ui(self):
        # Frame principal horizontal
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Menú lateral izquierdo
        left_menu = tk.Frame(main_frame, bg="#e0e0e0", padx=10, pady=10)
        left_menu.pack(side=tk.LEFT, fill=tk.Y)

        tk.Label(left_menu, text="Herramientas", font=("Arial", 12, "bold")).pack(pady=(0,10))

        tk.Button(left_menu, text="Abrir archivo DICOM", command=self.open_dicom, width=25).pack(pady=5)
        tk.Button(left_menu, text="Segmentación de cráneo", command=self.segmentar_craneo, width=25).pack(pady=5)
        tk.Button(left_menu, text="Diseñar prótesis", command=self.disenar_protesis, width=25).pack(pady=5)
        tk.Button(left_menu, text="Exportar", command=self.exportar_stl, width=25).pack(pady=5)
        tk.Button(left_menu, text="Calcular dimensiones", command=self.calcular_dimensiones, width=25).pack(pady=5)
        tk.Button(left_menu, text="Mostrar presupuesto", command=self.mostrar_presupuesto, width=25).pack(pady=5)

        # Frame del visor y controles
        # ... [resto del código intacto]

    def setup_ui(self):
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 🔧 Menú lateral con diseño bonito
        left_menu = tk.Frame(main_frame, bg="#2c3e50", padx=15, pady=15)
        left_menu.pack(side=tk.LEFT, fill=tk.Y)

        tk.Label(left_menu, text="🛠️ Herramientas", font=("Arial", 14, "bold"),
                 bg="#2c3e50", fg="white").pack(pady=(0, 20))

        button_style = {
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

        tk.Button(left_menu, text="📂 Abrir archivo DICOM", command=self.open_dicom, **button_style).pack(pady=5)
        tk.Button(left_menu, text="🧠 Segmentar cráneo", command=self.segmentar_craneo, **button_style).pack(pady=5)
        tk.Button(left_menu, text="🧩 Diseñar prótesis", command=self.disenar_protesis, **button_style).pack(pady=5)
        tk.Button(left_menu, text="📐 Generar STL", command=self.exportar_stl, **button_style).pack(pady=5)
        tk.Button(left_menu, text="📏 Calcular dimensiones", command=self.calcular_dimensiones, **button_style).pack(pady=5)
        tk.Button(left_menu, text="💰 Mostrar presupuesto", command=self.mostrar_presupuesto, **button_style).pack(pady=5)

        # [resto del visor y controles sigue igual...]

        viewer_frame = tk.Frame(main_frame)
        viewer_frame.pack(side=tk.LEFT, expand=True, fill=tk.BOTH)

        # Canvas para imagen
        self.canvas = tk.Canvas(viewer_frame, width=600, height=600, bg="black")
        self.canvas.pack(pady=(10, 0))

        # Controles de zoom y rotación en el centro, abajo de la imagen
        controls_frame = tk.Frame(viewer_frame)
        controls_frame.pack(pady=10)

        tk.Label(controls_frame, text="Zoom").grid(row=0, column=0, padx=5)
        self.zoom_slider = ttk.Scale(controls_frame, from_=0.5, to=2.0, orient="horizontal", value=1.0, command=self.apply_transformations)
        self.zoom_slider.grid(row=0, column=1, padx=5)

        tk.Label(controls_frame, text="Rotación").grid(row=0, column=2, padx=5)
        self.rotation_slider = ttk.Scale(controls_frame, from_=-180, to=180, orient="horizontal", value=0, command=self.apply_transformations)
        self.rotation_slider.grid(row=0, column=3, padx=5)

    def open_dicom(self):
        file_path = filedialog.askopenfilename(filetypes=[("DICOM files", "*.dcm")])
        if file_path:
            self.dicom_path=file_path
            dicom_data = pydicom.dcmread(file_path)
            pixel_array = dicom_data.pixel_array.astype(float)
            pixel_array = (np.maximum(pixel_array, 0) / pixel_array.max()) * 255.0
            pixel_array = np.uint8(pixel_array)

            self.original_image = Image.fromarray(pixel_array).convert("L")
            self.zoom_level = 1.0
            self.rotation_angle = 0
            self.zoom_slider.set(1.0)
            self.rotation_slider.set(0)
            self.update_image()

    def apply_transformations(self, _=None):
        self.zoom_level = float(self.zoom_slider.get())
        self.rotation_angle = float(self.rotation_slider.get())
        self.update_image()

    def update_image(self):
        if self.original_image is not None:
            rotated = self.original_image.rotate(self.rotation_angle, resample=Image.BICUBIC, expand=True)

            new_width = int(rotated.width * self.zoom_level)
            new_height = int(rotated.height * self.zoom_level)
            zoomed = rotated.resize((new_width, new_height), Image.LANCZOS)

            self.tk_image = ImageTk.PhotoImage(zoomed)
            self.canvas.delete("all")
            canvas_width = self.canvas.winfo_width()
            canvas_height = self.canvas.winfo_height()
            x = (canvas_width - new_width) // 2
            y = (canvas_height - new_height) // 2
            self.canvas.create_image(x, y, anchor="nw", image=self.tk_image)


    def disenar_protesis(self):
        print("Diseño de prótesis en proceso...")
    
    def segmentar_craneo(self):
        print("Botón de segmentar cráneo presionado.")

        if self.dicom_path:  # Asegúrate de haber guardado el path cuando cargas el DICOM
            resultado = segmentar_craneo_func(self.dicom_path)

            if "error" in resultado:
                print("Error durante segmentación:", resultado["error"])
            else:
                print("Segmentación completada. Imagen guardada en:", resultado["output"])
        else:
            print("No hay imagen DICOM cargada.")




    


    def update_image(self):
        if self.original_image is not None:
            # Aplicar rotación y escalado sin mover el centro
            w, h = self.original_image.size
            center = (w // 2, h // 2)
            # Rotar alrededor del centro sin expandir el canvas
            rotated = self.original_image.rotate(self.rotation_angle, resample=Image.BICUBIC, center=center)
            # Escalar la imagen
            new_size = (int(w * self.zoom_level), int(h * self.zoom_level))
            resized = rotated.resize(new_size, resample=Image.BICUBIC)
            # Centrar la imagen en el canvas
            self.dicom_image = ImageTk.PhotoImage(resized)
            self.canvas.delete("all")
            canvas_width = self.canvas.winfo_width()
            canvas_height = self.canvas.winfo_height()
            # Asegurar que el canvas está completamente inicializado
            if canvas_width == 1 and canvas_height == 1:
                self.canvas.update()
                canvas_width = self.canvas.winfo_width()
                canvas_height = self.canvas.winfo_height()
            x = (canvas_width - resized.width) // 2
            y = (canvas_height - resized.height) // 2
            self.canvas.create_image(x, y, anchor=tk.NW, image=self.dicom_image)


    def exportar_stl(self):
        print("Exportación a STL para impresión 3D...")

    def calcular_dimensiones(self):
        print("Cálculo de dimensiones anatómicas...")

    def mostrar_presupuesto(self):
        print("Presupuesto estimado de materiales y tiempo...")

# Ejecutar visor
if __name__ == "__main__":
    root = tk.Tk()
    app = DICOMViewer(root)
    root.mainloop()
