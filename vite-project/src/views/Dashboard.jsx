import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import { format } from 'date-fns';


const Dashboard = () => {
  const [guards, setGuards] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuardsAndBrigades = async () => {
      try {
        // Fetch guards
        const guardsResponse = await GuardsApiService.getGuards();
        setGuards(guardsResponse.data);
  
        // Fetch brigades and create a map
        const brigadesResponse = await BrigadesApiService.getBrigades();
        const map = brigadesResponse.data.reduce((acc, brigade) => {
          acc[brigade.id_brigada] = brigade.nombre;
          return acc;
        }, {});
        setBrigadeMap(map);
      } catch (error) {
        console.error("Error fetching guards or brigades:", error);
      }
    };
  
    fetchGuardsAndBrigades();
  }, []);
  

  const handleDateClick = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd'); // Formatea la fecha correctamente
    const guard = guards.find((guard) => guard.date === formattedDate);
  
    if (guard && guard.id_brigada) {
      navigate(`/brigades/${guard.id_brigada}?date=${formattedDate}`);
    } else {
      alert('No hay brigada asignada para esta fecha.');
    }
  };
  

  return (
    <div className="flex flex-col items-start justify-start min-h-screen p-4">
            <div className="w-full p-4 bg-gray-50 rounded-lg shadow-lg">

      <h1 className="text-2xl text-center font-bold mb-4">Calendario de Brigadas</h1>
      <Calendar 
        onDateClick={handleDateClick} 
        guards={guards} 
        brigadeMap={brigadeMap} 
      />
      </div>
    </div>
  );
};

export default Dashboard;
