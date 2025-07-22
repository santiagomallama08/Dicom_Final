// src/components/shared/DashboardLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  History,
  Box,
  FileDown,
  FileText,
  UserCircle,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

const sidebarItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/upload', icon: UploadCloud, label: 'Subir DICOM' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/modelado3d', icon: Box, label: 'Modelado 3D' },
  { to: '/exportacion-stl', icon: FileDown, label: 'Exportación STL' },
  { to: '/reportes', icon: FileText, label: 'Reportes' },
  { to: '/pacientes', icon: UserCircle, label: 'Pacientes' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
];

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
       ${isActive
         ? 'bg-gradient-to-r from-purple-500 to-red-500 text-white'
         : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#0f0f10] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1c1c1e] border-r border-gray-800 p-6 flex flex-col">
        {/* Logo + título */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center mb-8"
        >
          <LayoutDashboard className="w-8 h-8 text-purple-500 mr-2" />
          <h2 className="text-xl font-bold">DICOM Studio</h2>
        </motion.div>

        {/* Navegación */}
        <nav className="flex-1 flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Pie de sidebar */}
        <div className="text-xs text-gray-500 mt-6">
          v1.0 · Innovación Médica
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#121212] p-8">
        <Outlet />
      </main>
    </div>
  );
}