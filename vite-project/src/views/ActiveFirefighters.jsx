import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import dayjs from 'dayjs';
import { useDarkMode } from '../contexts/DarkModeContext';

const ActiveFirefighters = () => {
  const { darkMode } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [turno, setTurno] = useState('Mañana'); // Turno predeterminado
  const [brigada, setBrigada] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentDate, turno]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(`Fetching guards for date: ${currentDate}`);
      
      const guardsResponse = await GuardsApiService.getGuardsByDate(currentDate);
      console.log('Guards response:', guardsResponse); 
    
      const filteredGuards = guardsResponse.data.filter(guard => guard.date === currentDate);
      console.log(`Filtered guards for date ${currentDate}:`, filteredGuards);
    
      const selectedBrigada = filteredGuards.length > 0 ? filteredGuards[0].id_brigada : null;
      setBrigada(selectedBrigada);
    
      if (selectedBrigada) {
        console.log(`Fetching available firefighters for brigada ${selectedBrigada} on ${currentDate} during ${turno}`);
        
        console.log('Turno before API call:', turno);
        
        const response = await AssignmentsApiService.getAvailableFirefighters(currentDate, turno, selectedBrigada);
    
        console.log('Available firefighters response:', response);
        setFirefighters(response.data); // Accede a los datos directamente
      } else {
        console.log('No brigade found for the selected date.');
        setFirefighters([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handlePreviousDay = () => {
    const newDate = dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
    setCurrentDate(newDate);
    console.log('Changed date to previous day:', newDate);
  };

  const handleNextDay = () => {
    const newDate = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');
    setCurrentDate(newDate);
    console.log('Changed date to next day:', newDate);
  };

  const handleTurnoChange = (newTurno) => {
    setTurno(newTurno);
    console.log('Changed turno to:', newTurno);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Bomberos Activos</h1>

        {/* Navigation for previous and next day */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousDay}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            <span>Anterior</span>
          </button>
          <h2 className="text-xl">{currentDate}</h2>
          <button
            onClick={handleNextDay}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Siguiente</span>
          </button>
        </div>

        {/* Selector for the turno */}
        <div className="mb-4 flex justify-center space-x-4">
          <button
            onClick={() => handleTurnoChange('Mañana')}
            className={`px-4 py-2 rounded ${turno === 'Mañana' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            Mañana
          </button>
          <button
            onClick={() => handleTurnoChange('Tarde')}
            className={`px-4 py-2 rounded ${turno === 'Tarde' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            Tarde
          </button>
          <button
            onClick={() => handleTurnoChange('Noche')}
            className={`px-4 py-2 rounded ${turno === 'Noche' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            Noche
          </button>
        </div>

        <h3 className="text-xl mb-4 text-center">{`Brigada: ${brigada || 'N/A'}`}</h3>

        {/* Firefighters List */}
        <div className={`overflow-x-auto shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="w-full text-sm text-left">
            <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              <tr>
                <th className="py-3 px-6">Nombre</th>
                <th className="py-3 px-6">Teléfono</th>
                <th className="py-3 px-6">Puesto</th>
              </tr>
            </thead>
            <tbody>
              {firefighters.length > 0 ? (
                firefighters.map(firefighter => (
                  <tr key={firefighter.id_empleado} className={`${darkMode ? 'bg-gray-700 border-gray-800 hover:bg-gray-600' : 'bg-white border-b hover:bg-gray-50'}`}>
                    <td className="py-4 px-6">{firefighter.nombre}</td>
                    <td className="py-4 px-6">{firefighter.telefono}</td>
                    <td className="py-4 px-6">{firefighter.puesto}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-4 px-6 text-center">No hay bomberos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveFirefighters;
