// src/pages/Pacientes.jsx
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, FileText, Eye, FolderOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import { userHeaders } from '../utils/authHeaders';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

export default function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [modalEstudios, setModalEstudios] = useState(false);
  const [pacienteEstudios, setPacienteEstudios] = useState(null);
  const [estudios, setEstudios] = useState([]);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    documento: '',
    tipo_documento: 'CC',
    fecha_nacimiento: '',
    edad: '',
    sexo: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    notas: ''
  });

  const cargarPacientes = async () => {
    try {
      const res = await fetch(`${API}/pacientes/`, {
        headers: { ...userHeaders() }
      });
      if (!res.ok) throw new Error('Error al cargar pacientes');
      const data = await res.json();
      setPacientes(data);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los pacientes'
      });
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (paciente = null) => {
    if (paciente) {
      setPacienteEditando(paciente);
      setFormData({
        nombre_completo: paciente.nombre_completo || '',
        documento: paciente.documento || '',
        tipo_documento: paciente.tipo_documento || 'CC',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        edad: paciente.edad || '',
        sexo: paciente.sexo || '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        direccion: paciente.direccion || '',
        ciudad: paciente.ciudad || '',
        notas: paciente.notas || ''
      });
    } else {
      setPacienteEditando(null);
      setFormData({
        nombre_completo: '',
        documento: '',
        tipo_documento: 'CC',
        fecha_nacimiento: '',
        edad: '',
        sexo: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        notas: ''
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPacienteEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = pacienteEditando
        ? `${API}/pacientes/${pacienteEditando.id}`
        : `${API}/pacientes/`;

      const method = pacienteEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...userHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Error al guardar paciente');

      Swal.fire({
        icon: 'success',
        title: pacienteEditando ? 'Paciente actualizado' : 'Paciente creado',
        timer: 1500,
        showConfirmButton: false
      });

      cerrarModal();
      cargarPacientes();
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message
      });
    }
  };

  const eliminarPaciente = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar paciente?',
      text: 'También se eliminarán todos los estudios vinculados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API}/pacientes/${id}`, {
        method: 'DELETE',
        headers: { ...userHeaders() }
      });

      if (!res.ok) throw new Error('Error al eliminar');

      Swal.fire({
        icon: 'success',
        title: 'Paciente eliminado',
        timer: 1200,
        showConfirmButton: false
      });

      cargarPacientes();
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message
      });
    }
  };

  const verEstudios = async (paciente) => {
    setPacienteEstudios(paciente);
    try {
      const res = await fetch(`${API}/pacientes/${paciente.id}/estudios`, {
        headers: { ...userHeaders() }
      });
      if (!res.ok) throw new Error('Error al cargar estudios');
      const data = await res.json();
      setEstudios(data);
      setModalEstudios(true);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los estudios'
      });
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver estudio en visor (agregar justo después)
  const verEstudioEnVisor = async (estudio) => {
    try {
      // Cargar mapping.json
      const mappingRes = await fetch(
        `${API}/static/series/${estudio.session_id}/mapping.json`
      );

      if (!mappingRes.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el mapping de la serie'
        });
        return;
      }

      const mapping = await mappingRes.json();
      const imagePaths = Object.keys(mapping).map(
        (nombre) => `/static/series/${estudio.session_id}/${nombre}`
      );

      // Cerrar modal de estudios
      setModalEstudios(false);

      // Navegar al visor con las imágenes
      navigate(`/visor/${estudio.session_id}`, {
        state: { images: imagePaths, source: 'pacientes' }
      });
    } catch (error) {
      console.error('Error cargando serie:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la serie del estudio'
      });
    }
  };

  const desvincularEstudio = async (estudioId) => {
    const result = await Swal.fire({
      title: '¿Desvincular estudio?',
      text: 'El estudio no se eliminará, solo se desvinculará del paciente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desvincular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API}/pacientes/estudios/${estudioId}`, {
        method: 'DELETE',
        headers: { ...userHeaders() }
      });

      if (!res.ok) throw new Error('Error al desvincular');

      Swal.fire({
        icon: 'success',
        title: 'Estudio desvinculado',
        timer: 1200,
        showConfirmButton: false
      });

      // Recargar estudios
      verEstudios(pacienteEstudios);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message
      });
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter((p) => {
    const texto = filtro.toLowerCase();
    return (
      p.nombre_completo.toLowerCase().includes(texto) ||
      p.documento.toLowerCase().includes(texto) ||
      (p.ciudad || '').toLowerCase().includes(texto)
    );
  });

  return (
    <section className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Gestión de Pacientes
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Administra la información de tus pacientes y sus estudios médicos
          </p>
        </div>

        {/* Barra de acciones */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o ciudad..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 bg-white text-gray-900 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 transition-all outline-none"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => abrirModal()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            <UserPlus size={20} />
            Nuevo Paciente
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando pacientes...</p>
            </div>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg sm:text-xl text-gray-800 mb-2">
              {filtro ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {filtro ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer paciente para comenzar'}
            </p>
            {!filtro && (
              <button
                onClick={() => abrirModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md"
              >
                <UserPlus size={20} />
                Crear primer paciente
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tabla Desktop */}
            <div className="hidden lg:block bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Documento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Edad</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Teléfono</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Ciudad</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pacientesFiltrados.map((paciente) => (
                    <tr key={paciente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {paciente.nombre_completo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {paciente.tipo_documento} {paciente.documento}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {paciente.edad || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {paciente.telefono || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {paciente.ciudad || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => verEstudios(paciente)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="Ver estudios"
                          >
                            <FolderOpen size={16} />
                          </button>
                          <button
                            onClick={() => abrirModal(paciente)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => eliminarPaciente(paciente.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards Mobile */}
            <div className="lg:hidden space-y-4">
              {pacientesFiltrados.map((paciente) => (
                <div key={paciente.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {paciente.nombre_completo}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {paciente.tipo_documento} {paciente.documento}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                    <div>
                      <span className="text-gray-500">Edad:</span> {paciente.edad || '-'}
                    </div>
                    <div>
                      <span className="text-gray-500">Teléfono:</span> {paciente.telefono || '-'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Ciudad:</span> {paciente.ciudad || '-'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verEstudios(paciente)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FolderOpen size={16} />
                      Estudios
                    </button>
                    <button
                      onClick={() => abrirModal(paciente)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarPaciente(paciente.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Mostrando {pacientesFiltrados.length} de {pacientes.length} paciente(s)
              </p>
            </div>
          </>
        )}

        {/* Modal Crear/Editar Paciente */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  {pacienteEditando ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Nombre completo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  />
                </div>

                {/* Documento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                    >
                      <option value="CC">CC</option>
                      <option value="TI">TI</option>
                      <option value="CE">CE</option>
                      <option value="PA">PA</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Documento *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    />
                  </div>
                </div>

                {/* Fecha nacimiento y edad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Edad</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sexo</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dirección y Ciudad */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ciudad</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  ></textarea>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-lg font-semibold transition-opacity"
                  >
                    {pacienteEditando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Estudios */}
        {modalEstudios && pacienteEstudios && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold mb-1">Estudios del Paciente</h2>
                <p className="text-sm opacity-90">{pacienteEstudios.nombre_completo}</p>
              </div>

              <div className="p-6">
                {estudios.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-gray-600 mb-4">
                      No hay estudios vinculados a este paciente
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Los estudios se vinculan automáticamente al generar reportes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {estudios.map((estudio) => (
                      <div
                        key={estudio.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={18} className="text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                {estudio.tipo_estudio || 'Estudio DICOM'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>
                                <span className="text-gray-500">Session ID:</span>{' '}
                                <span className="font-mono text-xs">{estudio.session_id}</span>
                              </p>
                              <p>
                                <span className="text-gray-500">Fecha:</span>{' '}
                                {estudio.fecha_estudio || '-'}
                              </p>
                              {estudio.diagnostico && (
                                <p>
                                  <span className="text-gray-500">Diagnóstico:</span>{' '}
                                  {estudio.diagnostico}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => verEstudioEnVisor(estudio)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              title="Ver estudio"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => desvincularEstudio(estudio.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Desvincular"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => setModalEstudios(false)}
                    className="w-full px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
