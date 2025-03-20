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

  if (loading) return <div className="flex justify-center items-center h-screen">Cargando usuarios...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className={`p-4 w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">Total horas ofrecidas año 2025</h2>

      <div className="mb-4 relative">
        <div className="flex items-center w-full">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o apellido"
              className={`pl-10 pr-4 py-2 rounded w-full ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <div className={`overflow-x-auto w-full shadow-md sm:rounded-lg border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <table className="w-full text-sm text-left">
          <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            <tr className={`grid ${isJefe ? 'grid-cols-12' : 'grid-cols-10'} w-full`}>
              <th className="py-3 px-2 col-span-1 text-center">#</th>
              <th className="py-3 px-2 col-span-4">Nombre</th>
              <th className="py-3 px-2 col-span-3">Puesto</th>
              <th className="py-3 px-2 col-span-2 text-center">Horas Ofrecidas</th>
              {isJefe && <th className="py-3 px-2 col-span-2 text-center">Horas Aceptadas</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.map((usuario, index) => (
              <tr
                key={usuario.id_empleado || index}
                className={`grid ${isJefe ? 'grid-cols-12' : 'grid-cols-10'} w-full ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-800 hover:bg-gray-600' 
                    : index % 2 === 0 
                      ? 'bg-white border-b hover:bg-gray-50' 
                      : 'bg-gray-50 border-b hover:bg-gray-100'
                }`}
              >
                <td className="py-4 px-2 col-span-1 text-center">{index + 1}</td>
                <td className="py-4 px-2 col-span-4 truncate">
                  {usuario.nombre} {usuario.apellido}
                </td>
                <td className="py-4 px-2 col-span-3 truncate">{usuario.puesto}</td>
                <td className="py-4 px-2 col-span-2 text-center">{usuario.horas_ofrecidas || 0}</td>
                {isJefe && <td className="py-4 px-2 col-span-2 text-center">{usuario.horas_aceptadas || 0}</td>}
              </tr>
            ))}
            {filteredUsuarios.length === 0 && (
              <tr className={`grid ${isJefe ? 'grid-cols-12' : 'grid-cols-10'} w-full ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
              }`}>
                <td className={`py-4 px-2 col-span-${isJefe ? '12' : '10'} text-center`}>
                  No se encontraron usuarios con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-right text-sm">
        <p>Total de usuarios: {filteredUsuarios.length}</p>
      </div>
    </div>
  );
};

export default HoursCountTable;