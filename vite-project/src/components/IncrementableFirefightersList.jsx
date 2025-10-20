// vite-project/src/components/IncrementableFirefightersList.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const IncrementableFirefightersList = ({ title, fetchData, listType, orderColumn, orderColumn2 }) => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  // Mapeo de los incrementos introducidos para cada usuario (id_empleado)
  const [increments, setIncrements] = useState({});

  // DETERMINAR SI ES LA LISTA DE TRASLADOS
  const isTransfersList = orderColumn === 'traslado' || orderColumn === 'traslados';

  // Función para cargar la lista de bomberos
  const fetchFirefighters = async () => {
    setLoading(true);
    try {
      const response = await fetchData(selectedDate);
      const fetchedFirefighters = response.data.available_firefighters;
      // Ordenar de menor a mayor según orderColumn; en caso de empate, usar orderColumn2 si existe o por dni (descendente)
      const orderedFirefighters = fetchedFirefighters.sort((a, b) => {
        const diff = a[orderColumn] - b[orderColumn];
        if (diff === 0) {
          if (orderColumn2) {
            const diff2 = a[orderColumn2] - b[orderColumn2];
            if (diff2 !== 0) return diff2;
          }
          return Number(b.dni) - Number(a.dni);
        }
        return diff;
      });
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
  }, [selectedDate]);

  // Navegación de fechas
  const handlePreviousDay = () => {
    const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(nextDay);
  };

  // Filtro de la lista por puesto
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Cambiar el valor del input para un bombero
  const handleIncrementChange = (id, value) => {
    setIncrements((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Al presionar el botón "+" se llama a la API para incrementar la columna en ese valor
  const handleIncrementSubmit = async (id) => {
    const incValue = Number(increments[id]);
    if (isNaN(incValue)) {
      alert("Por favor ingresa un número válido.");
      return;
    }
    try {
      await AssignmentsApiService.incrementUserColumn(id, { 
        column: orderColumn, 
        increment: incValue,  
        orderColumn2: orderColumn2 
      });
      // Recargar la lista tras la actualización
      await fetchFirefighters();
      // Limpiar el input para ese usuario
      setIncrements((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error(`Failed to increment column for user ${id}:`, error);
    }
  };

  // Filtrar la lista en base al puesto
  const filteredFirefighters = firefighters.filter((firefighter) =>
    firefighter.puesto.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>

      {/* MENSAJE INFORMATIVO PARA TRASLADOS */}
      {isTransfersList && (
        <div className={`mb-4 rounded-lg border p-4 ${
          darkMode 
            ? 'border-blue-500/40 bg-blue-500/10 text-blue-200' 
            : 'border-blue-300 bg-blue-50 text-blue-700'
        }`}>
          <p className="text-sm font-medium">
            ℹ️ Las horas de traslado se incrementan automáticamente al crear una asignación de traslado desde la guardia.
          </p>
        </div>
      )}

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
          className={`px-4 py-2 rounded w-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
        />
      </div>

      <div className={`overflow-x-auto shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className="w-full text-sm text-left">
          <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            <tr>
              <th className="py-3 px-6">Nombre</th>
              <th className="py-3 px-6">Teléfono</th>
              <th className="py-3 px-6">Puesto</th>
              <th className="py-3 px-6">Horas</th>
              <th className="py-3 px-6">Última</th>
              {/* OCULTAR COLUMNA DE ACCIÓN SI ES LISTA DE TRASLADOS */}
              {user?.type === 'jefe' && !isTransfersList && <th className="py-3 px-6">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {filteredFirefighters.map((firefighter, index) => (
              <tr
                key={firefighter.id_empleado}
                className={`${darkMode ? 'bg-gray-700 border-gray-800 hover:bg-gray-600' : 'bg-white border-b hover:bg-gray-50'}`}
              >
                <td className="py-4 px-6">
                  {index + 1}. {firefighter.nombre} {firefighter.apellido}
                </td>
                <td className="py-4 px-6">{firefighter.telefono}</td>
                <td className="py-4 px-6">{firefighter.puesto}</td>
                <td className="py-4 px-6">{firefighter[orderColumn]}</td>
                <td className="py-4 px-6">
                  {firefighter[orderColumn2] 
                    ? dayjs(firefighter[orderColumn2]).format('DD/MM/YYYY HH:mm')
                    : '—'
                  }
                </td>
                {/* OCULTAR BOTONES DE INCREMENTO SI ES LISTA DE TRASLADOS */}
                {(user?.type === 'jefe' || user?.type === 'mando') && !isTransfersList && (
                  <td className="py-4 px-6 flex items-center space-x-2">
                    <input
                      type="number"
                      value={increments[firefighter.id_empleado] || ''}
                      onChange={(e) => handleIncrementChange(firefighter.id_empleado, e.target.value)}
                      className="w-16 p-1 border rounded bg-gray-800 text-gray-200"
                      placeholder="0"
                    />
                    <button
                      onClick={() => handleIncrementSubmit(firefighter.id_empleado)}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
                      title="Incrementar horas"
                    >
                      <FontAwesomeIcon icon={faPlus} />
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

export default IncrementableFirefightersList;