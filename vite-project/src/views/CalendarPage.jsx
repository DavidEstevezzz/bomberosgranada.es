import React, { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import GuardModal from '../components/GuardModal';
import EditGuardModal from '../components/EditGuardModal';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { format } from 'date-fns';

const CalendarPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [guards, setGuards] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const [userType, setUserType] = useState(null);
  const idParque = 1; // Definir el id del parque

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const response = await UsuariosApiService.getUserByToken();
        setUserType(response.data.type); 
      } catch (error) {
        console.error('Error fetching user type:', error);
      }
    };

    const fetchGuards = async () => {
      try {
        const response = await GuardsApiService.getGuards();
        setGuards(response.data); 
      } catch (error) {
        console.error('Error fetching guards:', error);
      }
    };

    const fetchBrigades = async () => {
      try {
        const response = await BrigadesApiService.getBrigades();
        const filteredBrigades = response.data.filter(brigade => brigade.id_parque === idParque);
        setBrigades(filteredBrigades);
        const map = filteredBrigades.reduce((acc, brigade) => {
          acc[brigade.id_brigada] = brigade.nombre;
          return acc;
        }, {});
        setBrigadeMap(map);
      } catch (error) {
        console.error('Error fetching brigades:', error);
      }
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
    <div className="flex flex-col items-start justify-start min-h-screen mt-3">
      <div className="w-full p-4 bg-gray-50 rounded-lg shadow-lg">
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
        <GuardModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          guardDate={selectedDate}
          setGuards={setGuards}
          brigades={brigades} // Pasar las brigades filtradas por id_parque
        />
      )}
      {editModalOpen && (
        <EditGuardModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          guard={selectedGuard}
          setGuards={setGuards}
          availableBrigades={brigades} // Pasar las brigades filtradas por id_parque
        />
      )}
    </div>
  );
};

export default CalendarPage;
