import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import { format } from 'date-fns';

const Dashboard = () => {
  const [guards, setGuards] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuardsAndBrigades = async () => {
      try {
        // Fetch guards
        const guardsResponse = await GuardsApiService.getGuards();
        setGuards(guardsResponse.data);
  
        // Fetch brigades
        const brigadesResponse = await BrigadesApiService.getBrigades();
        setBrigades(brigadesResponse.data);
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

  const handleDateClick = (date, parkId) => {
    const formattedDate = format(date, 'yyyy-MM-dd'); // Formatea la fecha correctamente
    const guard = guards.find((guard) => guard.date === formattedDate);
  
    if (guard) {
      // Encuentra la brigada en el parque correspondiente
      const brigade = brigades.find(
        (brigade) => brigade.nombre === brigadeMap[guard.id_brigada] && brigade.id_parque === parkId
      );

      if (brigade) {
        navigate(`/brigades/${brigade.id_brigada}?date=${formattedDate}`);
      } else {
        alert(`No hay brigada asignada para esta fecha en el parque ${parkId}.`);
      }
    } else {
      alert('No hay guardia asignada para esta fecha.');
    }
  };

  return (
    <div className="flex flex-col items-start justify-start min-h-screen p-4">
      {/* Calendario del Parque Norte */}
      <div className="w-full p-4 bg-gray-50 rounded-lg shadow-lg mb-6">
        <h1 className="text-2xl text-center font-bold mb-4">Calendario de Brigadas - Parque Norte</h1>
        <Calendar 
          onDateClick={(date) => handleDateClick(date, 1)} // Parque Norte
          guards={guards}
          brigadeMap={brigadeMap}
        />
      </div>

      {/* Calendario del Parque Sur */}
      <div className="w-full p-4 bg-gray-50 rounded-lg shadow-lg">
        <h1 className="text-2xl text-center font-bold mb-4">Calendario de Brigadas - Parque Sur</h1>
        <Calendar 
          onDateClick={(date) => handleDateClick(date, 2)} // Parque Sur
          guards={guards}
          brigadeMap={brigadeMap}
        />
      </div>
    </div>
  );
};

export default Dashboard;
