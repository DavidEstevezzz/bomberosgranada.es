import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const SortableFirefightersList = ({ title, fetchData, listType, orderColumn }) => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext(); // Contexto del usuario

  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD')); // Fecha seleccionada

  // 🔄 Cargar la lista de bomberos
  const fetchFirefighters = async () => {
    setLoading(true);
    try {
      const response = await fetchData(selectedDate); // Incluir la fecha seleccionada
      const fetchedFirefighters = response.data.available_firefighters;

      // Ordenar por la columna especificada
      const orderedFirefighters = fetchedFirefighters.sort((a, b) => a[orderColumn] - b[orderColumn]);
      setFirefighters(orderedFirefighters);
      setError(null);
    } catch (error) {
      console.error(`Failed to fetch ${listType}:`, error);
      setError(`Failed to load ${listType}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirefighters();
  }, [selectedDate]); // Recargar lista al cambiar la fecha

  // 🔼 Mover Arriba
  const handleMoveToTop = async (id) => {
    if (user?.type !== 'jefe') return; // Verificar si user existe y es jefe
    try {
      await AssignmentsApiService.moveFirefighterToTop(id, orderColumn);
      await fetchFirefighters();
    } catch (error) {
      console.error(`Failed to move ${listType} to top:`, error);
    }
  };

  // 🔽 Mover Abajo
  const handleMoveToBottom = async (id) => {
    if (user?.type !== 'jefe') return; // Verificar si user existe y es jefe
    try {
      await AssignmentsApiService.moveFirefighterToBottom(id, orderColumn);
      await fetchFirefighters();
    } catch (error) {
      console.error(`Failed to move ${listType} to bottom:`, error);
    }
  };

  // 🔍 Filtrar lista
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Cambiar días
  const handlePreviousDay = () => {
    const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(nextDay);
  };

  const filteredFirefighters = firefighters.filter((firefighter) =>
    firefighter.puesto.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousDay}
          className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Anterior
        </button>
        <span className="text-lg font-bold">{dayjs(selectedDate).format('DD/MM/YYYY')}</span>
        <button
          onClick={handleNextDay}
          className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
        >
          Siguiente <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filtrar por puesto"
          className={`px-4 py-2 rounded w-full ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'
          }`}
        />
      </div>

      <div
        className={`overflow-x-auto shadow-md sm:rounded-lg border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <table className="w-full text-sm text-left">
          <thead
            className={`${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <tr>
              <th className="py-3 px-6">Nombre</th>
              <th className="py-3 px-6">Teléfono</th>
              <th className="py-3 px-6">Puesto</th>
              {user?.type === 'jefe' && <th className="py-3 px-6">Acción</th>}
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
                {user?.type === 'jefe' && (
                  <td className="py-4 px-6 flex space-x-2">
                    <button
                      onClick={() => handleMoveToTop(firefighter.id_empleado)}
                      className={`px-4 py-1 rounded flex items-center space-x-1 ${
                        darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'
                      }`}
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                      <span>Arriba</span>
                    </button>
                    <button
                      onClick={() => handleMoveToBottom(firefighter.id_empleado)}
                      className={`px-4 py-1 rounded flex items-center space-x-1 ${
                        darkMode ? 'bg-red-700 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
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
  );
};

export default SortableFirefightersList;
