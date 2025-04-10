import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import BrigadeUsersApiService from '../services/BrigadeUserApiService';

const BrigadePracticesPage = () => {
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brigadeData, setBrigadeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtener todos los usuarios de brigadas con una sola llamada a la API
      const response = await BrigadeUsersApiService.getBrigadeUsers();
      const allBrigadeUsers = response.data;
      
      // Agrupar por brigada
      const groupedByBrigade = {};
      
      allBrigadeUsers.forEach(brigadeUser => {
        if (!brigadeUser.id_brigada) return;
        
        // Si la brigada no existe en nuestro objeto, la creamos
        if (!groupedByBrigade[brigadeUser.id_brigada]) {
          groupedByBrigade[brigadeUser.id_brigada] = {
            id: brigadeUser.id_brigada,
            name: brigadeUser.brigade?.nombre || `Brigada ${brigadeUser.id_brigada}`,
            users: []
          };
        }
        
        // Agregar el usuario a la brigada
        if (brigadeUser.user) {
          groupedByBrigade[brigadeUser.id_brigada].users.push({
            id: brigadeUser.id_usuario,
            name: brigadeUser.user.nombre || 'Usuario desconocido',
            lastname: brigadeUser.user.apellido || '',
            practices: brigadeUser.practicas || 0,
            brigadeUserId: brigadeUser.id // Guardar ID para operaciones
          });
        }
      });
      
      // Convertir el objeto a array para facilitar la renderización
      const brigadesArray = Object.values(groupedByBrigade);
      setBrigadeData(brigadesArray);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar los datos:', err);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleIncrementPractice = async (brigadeId, userId) => {
    try {
      setUpdating(true);
      await BrigadeUsersApiService.incrementPracticas({
        id_brigada: brigadeId,
        id_usuario: userId,
        increment: 1
      });
      
      // Recargar datos después de actualizar
      await fetchData();
      setUpdating(false);
    } catch (err) {
      console.error('Error al incrementar prácticas:', err);
      setError('Error al actualizar prácticas. Inténtalo de nuevo más tarde.');
      setUpdating(false);
    }
  };

  const filterBrigadeData = () => {
    if (!searchTerm) return brigadeData;

    const searchTermLower = searchTerm.toLowerCase();
    
    return brigadeData.map(brigade => {
      // Filtrar usuarios de la brigada que coincidan con el término de búsqueda
      const filteredUsers = brigade.users.filter(user => 
        user.name.toLowerCase().includes(searchTermLower) || 
        user.lastname.toLowerCase().includes(searchTermLower)
      );
      
      // Solo devolver las brigadas que tengan usuarios que coincidan
      if (filteredUsers.length > 0) {
        return {
          ...brigade,
          users: filteredUsers
        };
      }
      return null;
    }).filter(Boolean); // Eliminar null
  };

  const processedBrigadeData = filterBrigadeData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className={`bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md w-full max-w-lg`}>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Registro de Prácticas por Brigada</h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Visualiza las prácticas realizadas por cada bombero en las diferentes brigadas.
            </p>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar bombero..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500' 
                    : 'bg-white text-gray-900 border-gray-300 focus:border-blue-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                value={searchTerm}
                onChange={handleSearch}
              />
              <svg 
                className={`absolute right-3 top-2.5 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>
        </header>
        
        {/* Overlay de carga durante actualización */}
        {updating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 flex flex-col items-center`}>
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600 mb-3"></div>
              <p>Actualizando prácticas...</p>
            </div>
          </div>
        )}
        
        {/* Tablas por brigada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {processedBrigadeData.map(brigade => (
            <div 
              key={brigade.id} 
              className={`p-6 rounded-xl shadow-md transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white hover:shadow-lg'
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {brigade.name}
              </h2>
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Bombero</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Prácticas</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {brigade.users.length > 0 ? (
                      brigade.users
                        .sort((a, b) => b.practices - a.practices) // Ordenar por prácticas descendente
                        .map(user => (
                          <tr key={user.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-3 whitespace-nowrap">{user.name} {user.lastname}</td>
                            <td className="px-6 py-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {user.practices}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right whitespace-nowrap">
                              <button 
                                onClick={() => handleIncrementPractice(brigade.id, user.id)}
                                className={`inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm ${
                                  darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                                } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                title="Añadir práctica"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="3" className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No hay bomberos asignados a esta brigada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {processedBrigadeData.length === 0 && (
          <div className={`p-8 text-center rounded-xl shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium mb-2">No se encontraron registros</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm 
                ? `No se encontraron bomberos que coincidan con "${searchTerm}"`
                : "No hay registros de prácticas disponibles en este momento."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrigadePracticesPage;