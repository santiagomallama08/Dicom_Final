import tkinter as tk
from modules.gui.visor_dicom import DICOMViewer

if __name__ == "__main__":
    root = tk.Tk()
    app = DICOMViewer(root)
    root.mainloop()
