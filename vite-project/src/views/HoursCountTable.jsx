import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const HoursCountTable = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isJefe = user?.type === 'jefe';

  // Función para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Función para cargar usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await UsuariosApiService.getUsuarios();
      // Filter out users without a specified position
      const usuariosConPuesto = response.data.filter(usuario =>
        usuario.puesto && usuario.puesto.trim() !== ''
      );
      setUsuarios(usuariosConPuesto);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Manejador para el campo de búsqueda
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filtrar usuarios según el término de búsqueda
  const filteredUsuarios = usuarios.filter((usuario) => {
    if (searchTerm === '') return true;

    const normalizedSearch = normalizeText(searchTerm);
    const normalizedNombre = normalizeText(usuario.nombre || '');
    const normalizedApellido = normalizeText(usuario.apellido || '');
    const nombreCompleto = `${normalizedNombre} ${normalizedApellido}`;

    return nombreCompleto.includes(normalizedSearch);
  });

  const pageWrapperClass = 'px-3 py-6 sm:px-8';
  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-6xl overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode
      ? 'border-slate-800 bg-slate-950/80 text-slate-100'
      : 'border-slate-200 bg-white/95 text-slate-900'
  }`;
  const headerGradientClass = `bg-gradient-to-r px-6 py-8 sm:px-10 text-white transition-colors duration-300 ${
    darkMode
      ? 'from-primary-950 via-primary-800 to-primary-600'
      : 'from-primary-400 via-primary-500 to-primary-600'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const sectionBaseClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const surfaceCardClass = `rounded-2xl border px-5 py-5 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
  }`;
  const inputBaseClass = `w-full rounded-2xl border px-5 py-3 text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const badgeClass = `inline-flex min-w-[3rem] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${
    darkMode ? 'bg-primary-500/15 text-primary-300' : 'bg-primary-500/10 text-primary-700'
  }`;

  if (loading) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-20`}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-base font-medium">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} space-y-6`}>
          <div className={headerGradientClass}>
            <h1 className="text-3xl font-semibold">Total horas ofrecidas</h1>
            <p className="mt-2 max-w-2xl text-base text-white/90">
              No se ha podido obtener la información solicitada en este momento. Inténtalo de nuevo más tarde.
            </p>
          </div>
          <div
            className={`mx-6 mb-10 rounded-2xl border px-5 py-5 text-base font-medium ${
              darkMode
                ? 'border-red-500/40 bg-red-500/10 text-red-100'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrapperClass}>
      <div className={`${cardContainerClass} space-y-8`}>
        <div className={headerGradientClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                Gestión de horas
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Total horas ofrecidas 2025</h1>
              <p className="mt-3 max-w-2xl text-base text-white/90">
                Consulta y filtra las horas ofrecidas por cada profesional para hacer seguimiento del estado de sus aportaciones.
              </p>
            </div>
            <span className={badgeClass}>Usuarios: {filteredUsuarios.length}</span>
          </div>
        </div>

        <div className="space-y-8 px-6 pb-10 sm:px-10">
          <section className={sectionBaseClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Listado general</h2>
                <p className={`mt-1 text-base ${subtleTextClass}`}>
                  Utiliza el buscador para localizar rápidamente a cualquier miembro por su nombre o apellido.
                </p>
              </div>
            </div>
            <div className={`${surfaceCardClass} mt-6 space-y-6`}>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o apellido"
                  className={`${inputBaseClass} pl-12`}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-transparent">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className={darkMode ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-100 text-slate-700'}>
                      <tr>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">#</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.18em]">Nombre</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.18em]">Puesto</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">
                          Horas ofrecidas
                        </th>
                        {isJefe && (
                          <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">
                            Horas aceptadas
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className={darkMode ? 'divide-y divide-slate-800 bg-slate-950/40' : 'divide-y divide-slate-200 bg-white'}>
                      {filteredUsuarios.map((usuario, index) => (
                        <tr
                          key={usuario.id_empleado || index}
                          className={
                            darkMode
                              ? 'transition-colors hover:bg-slate-900/60'
                              : index % 2 === 0
                              ? 'transition-colors hover:bg-slate-50'
                              : 'bg-slate-50 transition-colors hover:bg-slate-100'
                          }
                        >
                          <td className="px-6 py-4 text-center text-base font-semibold">{index + 1}</td>
                          <td className="px-6 py-4 text-base font-semibold">
                            {usuario.nombre} {usuario.apellido}
                          </td>
                          <td className={`px-6 py-4 text-base ${subtleTextClass}`}>{usuario.puesto}</td>
                          <td className="px-6 py-4 text-center text-base font-semibold">
                            {usuario.horas_ofrecidas || 0}
                          </td>
                          {isJefe && (
                            <td className="px-6 py-4 text-center text-base font-semibold">
                              {usuario.horas_aceptadas || 0}
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredUsuarios.length === 0 && (
                        <tr>
                          <td
                            className="px-6 py-6 text-center text-base"
                            colSpan={isJefe ? 5 : 4}
                          >
                            No se encontraron usuarios con ese criterio de búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HoursCountTable;
