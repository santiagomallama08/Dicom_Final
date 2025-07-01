import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración estándar para SPA con React Router
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true, // 👈 esta línea permite rutas como /upload o /result
  }
})