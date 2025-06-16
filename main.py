import tkinter as tk
from modules.login.auth_window import AuthWindow
from modules.gui.visor_dicom import DICOMViewer

def start_app(usuario_id):
    root = tk.Tk()
    app = DICOMViewer(root, usuario_id)
    root.mainloop()

if __name__ == "__main__":
    auth_root = tk.Tk()
    AuthWindow(auth_root, start_app)
    auth_root.mainloop()
