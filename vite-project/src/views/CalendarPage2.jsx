import React, { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import GuardModal2 from '../components/GuardModal2';
import EditGuardModal from '../components/EditGuardModal';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { format } from 'date-fns';

const CalendarPageParque2 = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [guards, setGuards] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const [userType, setUserType] = useState(null);
  const idParque = 1; // Añadido el id del parque directamente

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const response = await UsuariosApiService.getUserByToken();
        setUserType(response.data.type); // Asume que `type` es el campo que indica el tipo de usuario
      } catch (error) {
        console.error('Error fetching user type:', error);
      }
    };

    const fetchGuards = async () => {
      try {
        const response = await GuardsApiService.getGuards();
        setGuards(response.data); 
        console.log("Guardias finales para el calendario 2:", guards);
      } catch (error) {
        console.error('Error fetching guards:', error);
      }
    };

    const fetchBrigades = async () => {
      const response = await BrigadesApiService.getBrigades();
      const filteredBrigades = response.data.filter(brigade => brigade.id_parque === idParque);
      setBrigades(filteredBrigades);
      const map = filteredBrigades.reduce((acc, brigade) => {
        acc[brigade.id_brigada] = brigade.nombre;
        return acc;
      }, {});
      setBrigadeMap(map);
      console.log("Mapa de brigadas para el parque 2:", brigadeMap);
    };

    fetchUserType();
    fetchGuards();
    fetchBrigades();
  }, []);

  const handleDateClick = (date) => {
    if (userType === 'bombero') return; // Desactiva la acción para usuarios de tipo "bombero"
    const dateString = format(date, 'yyyy-MM-dd');
    const existingGuard = guards.find(guard => guard.date === dateString);
    if (existingGuard) {
      setSelectedGuard(existingGuard);
      setEditModalOpen(true);
    } else {
      setSelectedDate(date);
      setModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start min-h-screen bg-gray-600 mt-3">
      <div className="w-full p-4 bg-white rounded-lg shadow-lg">
        <Calendar 
          onDateClick={handleDateClick} 
          onEditClick={(guard) => {
            if (userType === 'bombero') return; // Desactiva la acción para editar guardias
            setSelectedGuard(guard);
            setEditModalOpen(true);
          }} 
          guards={guards} 
          brigadeMap={brigadeMap} 
        />
      </div>
      {modalOpen && (
        <GuardModal2
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          guardDate={selectedDate}
          setGuards={setGuards}
          brigades={brigades}
          idParque={idParque} // Pasa idParque al modal
        />
      )}
      {editModalOpen && (
        <EditGuardModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          guard={selectedGuard}
          setGuards={setGuards}
          availableBrigades={brigades}
          idParque={idParque} // Pasa idParque al modal
        />
      )}
    </div>
  );
};

export default CalendarPageParque2;
