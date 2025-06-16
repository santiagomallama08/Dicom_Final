import tkinter as tk
from tkinter import messagebox
from modules.login.auth_controller import verificar_credenciales, registrar_usuario, obtener_id_usuario
def mostrar_login(root, callback):
    root.title("Inicio de sesión")
    frame = tk.Frame(root, padx=20, pady=20)
    frame.pack()

    tk.Label(frame, text="Correo electrónico").grid(row=0, column=0, sticky='e')
    email_entry = tk.Entry(frame)
    email_entry.grid(row=0, column=1)

    tk.Label(frame, text="Contraseña").grid(row=1, column=0, sticky='e')
    password_entry = tk.Entry(frame, show="*")
    password_entry.grid(row=1, column=1)

    def login():
        email = email_entry.get()
        password = password_entry.get()
        if verificar_credenciales(email, password):
            usuario_id = obtener_id_usuario(email)
            root.destroy()
            callback(usuario_id)
        else:
            messagebox.showerror("Error", "Credenciales incorrectas.")

    tk.Button(frame, text="Iniciar sesión", command=login).grid(row=2, column=0, columnspan=2, pady=10)
