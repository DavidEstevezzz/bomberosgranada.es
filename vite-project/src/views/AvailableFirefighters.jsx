import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import AssignmentsApiService from '../services/AssignmentsApiService';
import dayjs from 'dayjs';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const AvailableFirefighters = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext(); // Obtener el usuario del contexto

  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  // 🔄 Función para Cargar Bomberos
  const fetchAvailableFirefighters = async () => {
    setLoading(true);
    try {
      const response = await AssignmentsApiService.getAvailableFirefighters(currentDate);
      const fetchedFirefighters = response.data.available_firefighters;

      // Ordenar de forma ascendente por la columna 'orden'
      const orderedFirefighters = fetchedFirefighters.sort((a, b) => a.orden - b.orden);
      setFirefighters(orderedFirefighters);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch available firefighters:', error);
      setError('Failed to load available firefighters');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Cargar bomberos al cambiar la fecha
  useEffect(() => {
    fetchAvailableFirefighters();
  }, [currentDate]);

  // 🔼 Mover Bombero Arriba
  const handleMoveToTop = async (id) => {
    try {
      await AssignmentsApiService.moveFirefighterToTop(id);
      await fetchAvailableFirefighters(); // Vuelve a cargar los datos
    } catch (error) {
      console.error('Failed to move firefighter to top:', error);
    }
  };

  // 🔽 Mover Bombero Abajo
  const handleMoveToBottom = async (id) => {
    try {
      await AssignmentsApiService.moveFirefighterToBottom(id);
      await fetchAvailableFirefighters(); // Vuelve a cargar los datos
    } catch (error) {
      console.error('Failed to move firefighter to bottom:', error);
    }
  };

  // 🔄 Cambiar Fecha
  const handlePreviousDay = () => {
    setCurrentDate(dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const handleNextDay = () => {
    setCurrentDate(dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD'));
  };

  const handleDateChange = (event) => {
    setCurrentDate(event.target.value);
  };

  // 🔍 Filtrar Bomberos
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredFirefighters = firefighters.filter((firefighter) =>
    firefighter.puesto.toLowerCase().includes(filter.toLowerCase())
  );

  // 🔄 Estado de Carga
  if (!user) {
    return <div>Cargando usuario...</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // 🚀 Renderizar UI
  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Bomberos Disponibles 24 Horas</h1>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousDay}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            <span>Anterior</span>
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded w-1/2 text-center"
          />
          <button
            onClick={handleNextDay}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Siguiente</span>
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={filter}
            onChange={handleFilterChange}
            placeholder="Filtrar por puesto"
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full"
          />
        </div>
        <div
          className={`overflow-x-auto shadow-md sm:rounded-lg border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <table className="w-full text-sm text-left">
            <thead
              className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              <tr>
                <th className="py-3 px-6">Nombre</th>
                <th className="py-3 px-6">Teléfono</th>
                <th className="py-3 px-6">Puesto</th>
                {user.type !== 'bombero' && <th className="py-3 px-6">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filteredFirefighters.map((firefighter) => (
                <tr
                  key={firefighter.id_empleado}
                  className={`${
                    darkMode
                      ? 'bg-gray-700 border-gray-800 hover:bg-gray-600'
                      : 'bg-white border-b hover:bg-gray-50'
                  }`}
                >
                  <td className="py-4 px-6">{firefighter.nombre} {firefighter.apellido}</td>
                  <td className="py-4 px-6">{firefighter.telefono}</td>
                  <td className="py-4 px-6">{firefighter.puesto}</td>
                  {user.type !== 'bombero' && (
                    <td className="py-4 px-6 flex space-x-2">
                      <button onClick={() => handleMoveToTop(firefighter.id_empleado)} className="bg-green-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                        <FontAwesomeIcon icon={faArrowUp} />
                        <span>Arriba</span>
                      </button>
                      <button onClick={() => handleMoveToBottom(firefighter.id_empleado)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                        <FontAwesomeIcon icon={faArrowDown} />
                        <span>Abajo</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AvailableFirefighters;
