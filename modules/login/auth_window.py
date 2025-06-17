import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import os

# Obtener ruta del proyecto (subiendo desde el archivo actual)
base_dir = os.path.abspath(os.path.dirname(__file__))
project_dir = os.path.abspath(
    os.path.join(base_dir, "..", "..")
)  # ← ajusta según tu estructura
logo_path = os.path.join(project_dir, "imagenes", "ucclogo.jpg")


from modules.login.auth_controller import (
    verificar_credenciales,
    registrar_usuario,
    obtener_id_usuario,
)


class AuthWindow:
    def __init__(self, root, on_success):
        self.root = root
        self.on_success = on_success
        self.root.title("Sitema de arhcivos Dicom ")
        self.root.geometry("800x600")
        self.root.configure(bg="#f0f0f0")  # Color de fondo claro

        self.frame = tk.Frame(self.root, bg="white", padx=20, pady=20)
        self.frame.pack(expand=True)

        # Cargar imagen desde ruta relativa
        img = Image.open(logo_path)
        img = img.resize((100, 100), Image.Resampling.LANCZOS)
        img_tk = ImageTk.PhotoImage(img)

        # Canvas para mostrar la imagen
        canvas = tk.Canvas(
            self.frame, width=120, height=120, bg="white", highlightthickness=0
        )
        canvas.grid(row=0, column=0, columnspan=2, pady=(10, 20))
        canvas.create_image(60, 60, image=img_tk)
        canvas.image = img_tk  # Referencia persistente para evitar borrado

        # Botones de pestaña
        self.tabs = tk.Frame(self.frame, bg="white")
        self.tabs.grid(
            row=1, column=0, columnspan=2, pady=10
        )  # Usamos grid() para una alineación más controlada
        self.btn_login_tab = tk.Button(
            self.tabs,
            text="INICIAR SESIÓN",
            command=self.show_login,
            width=15,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12, "bold"),
        )
        self.btn_login_tab.grid(row=0, column=0, padx=10)

        self.btn_registro_tab = tk.Button(
            self.tabs,
            text="REGISTRARSE",
            command=self.show_register,
            width=15,
            bg="#2196F3",
            fg="white",
            font=("Arial", 12, "bold"),
        )
        self.btn_registro_tab.grid(row=0, column=1, padx=10)

        self.content = tk.Frame(self.frame, bg="white")
        self.content.grid(row=2, column=0, columnspan=2, pady=20)

        self.show_login()

    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()

    def show_login(self):
        self.clear_content()

        # Icono usuario
        tk.Label(self.content, text="Correo  👤", font=("Arial", 12), bg="white").grid(
            row=0, column=0, padx=5, pady=10, sticky="w"
        )
        email = tk.Entry(self.content, width=30)
        email.grid(row=0, column=1, padx=5, pady=10)

        # Contraseña
        tk.Label(
            self.content, text="Contraseña  🛡️", font=("Arial", 11), bg="white"
        ).grid(row=1, column=0, padx=5, pady=10, sticky="w")
        pwd = tk.Entry(self.content, show="*", width=30)
        pwd.grid(row=1, column=1, padx=5, pady=10)

        # Asegurar que las columnas tengan el mismo ancho
        self.content.grid_columnconfigure(0, weight=1)
        self.content.grid_columnconfigure(1, weight=1)

        def do_login():
            e = email.get().strip()
            p = pwd.get().strip()
            if not (e and p):
                messagebox.showerror("Error", "Debe completar ambos campos")
                return
            if verificar_credenciales(e, p):
                uid = obtener_id_usuario(e)
                self.root.destroy()
                self.on_success(uid)
            else:
                messagebox.showerror("Error", "Credenciales incorrectas")

        btn_frame = tk.Frame(self.content, bg="white")
        btn_frame.grid(row=2, column=0, columnspan=2, pady=20)
        tk.Button(
            btn_frame,
            text="INICIAR SESIÓN",
            width=15,
            command=do_login,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12, "bold"),
        ).pack()

    def show_register(self):
        self.clear_content()

        fields = [
            ("👤 Nombre completo", "Nombre completo"),
            ("📧 Correo electronico", "Correo electrónico"),
            ("🔒 Contraseña", "Contraseña"),
            ("🛠️ Rol", "Rol"),
        ]

        entries = []

        for idx, (icon, label) in enumerate(fields):
            tk.Label(self.content, text=icon, font=("Arial", 12), bg="white").grid(
                row=idx, column=0, padx=5, pady=10, sticky="w"
            )
            ent = tk.Entry(
                self.content, width=30, show="*" if "Contraseña" in label else None
            )
            ent.grid(row=idx, column=1, padx=5, pady=10)
            entries.append(ent)

        def do_register():
            n = entries[0].get().strip()
            e = entries[1].get().strip()
            p = entries[2].get().strip()
            r = entries[3].get().strip() or "usuario"
            if not (n and e and p and r):
                messagebox.showerror("Error", "Llene todos los campos")
                return
            ok, msg = registrar_usuario(n, e, p, r)
            if ok:
                messagebox.showinfo("Éxito", msg)
                self.show_login()
            else:
                messagebox.showerror("Error", msg)

        btn_frame = tk.Frame(self.content, bg="white")
        btn_frame.grid(row=4, column=0, columnspan=2, pady=20)
        tk.Button(
            btn_frame,
            text="REGISTRARSE",
            width=15,
            command=do_register,
            bg="#2196F3",
            fg="white",
            font=("Arial", 12, "bold"),
        ).pack()
