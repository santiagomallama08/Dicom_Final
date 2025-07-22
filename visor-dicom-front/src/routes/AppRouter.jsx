// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../Pages/Login';
import Register from '../pages/Register';
import Upload from '../pages/Upload';
import Viewer from '../pages/Viewer';
import WelcomeTransition from '../components/auth/WelcomeTransition';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/shared/DashboardLayout';

// Nuevas vistas del sistema
import Dashboard from '../pages/Dashboard';
import Historial from '../pages/Historial';
import Modelado3D from '../pages/Modelado3D';
import ExportacionSTL from '../pages/ExportacionSTL';
import Reportes from '../pages/Reportes';
import Pacientes from '../pages/Pacientes';
import Configuracion from '../pages/Configuracion';

const AppRouter = () => (
  <Routes>
  {/* 🟢 Rutas públicas */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* 🔒 Ruta de transición bienvenida */}
  <Route path="/welcome" element={
    <ProtectedRoute>
      <WelcomeTransition />
    </ProtectedRoute>
  } />

  {/* 🔒 Rutas protegidas dentro del layout */}
  <Route element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/visor/:session_id" element={<Viewer />} />
    <Route path="/historial" element={<Historial />} />
    <Route path="/modelado3d" element={<Modelado3D />} />
    <Route path="/exportacion-stl" element={<ExportacionSTL />} />
    <Route path="/reportes" element={<Reportes />} />
    <Route path="/pacientes" element={<Pacientes />} />
    <Route path="/configuracion" element={<Configuracion />} />
  </Route>
</Routes>
);

export default AppRouter;