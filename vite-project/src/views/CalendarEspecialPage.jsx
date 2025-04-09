import React, { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import GuardEspecialModal from '../components/GuardEspecialModal';
import EditGuardEspecialModal from '../components/EditGuardEspecialModal';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { format } from 'date-fns';

const CalendarEspecialPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [guards, setGuards] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);
  const [user, setUser] = useState(null);
  const idParque = 1; // Id del parque es siempre 1

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await UsuariosApiService.getUserByToken();
        setUser(response.data);
        
        // Verificar si el usuario es mando especial
        const mandoEspecialResponse = await UsuariosApiService.checkMandoEspecial(response.data.id_empleado);
        setIsMandoEspecial(mandoEspecialResponse.data.mando_especial);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchGuards = async () => {
        try {
          // Usar el nuevo endpoint específico en lugar de filtrar en el frontend
          const response = await GuardsApiService.getEspecialGuards();
          setGuards(response.data);
        } catch (error) {
          console.error('Error fetching special guards:', error);
        }
      };

      const fetchBrigades = async () => {
        try {
          // Usar el nuevo endpoint específico en lugar de verificar cada brigada
          const response = await BrigadesApiService.getEspecialBrigades();
          setBrigades(response.data);
          
          // Crear mapa de ID de brigada a nombre para mostrar en el calendario
          const map = response.data.reduce((acc, brigade) => {
            acc[brigade.id_brigada] = brigade.nombre;
            return acc;
          }, {});
          setBrigadeMap(map);
        } catch (error) {
          console.error('Error fetching special brigades:', error);
        }
      };

    fetchUserData();
    fetchGuards();
    fetchBrigades();
  }, []);

  const handleDateClick = (date) => {
    if (!isMandoEspecial) return; // Solo usuarios con mando_especial pueden interactuar
    
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
        <h1 className="text-2xl font-bold mb-4">Calendario de Guardias Especiales</h1>
        {!isMandoEspecial && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p>Solo los mandos especiales pueden crear o editar estas guardias.</p>
          </div>
        )}
        <Calendar 
          onDateClick={handleDateClick} 
          onEditClick={(guard) => {
            if (!isMandoEspecial) return; // Solo mandos especiales pueden editar
            setSelectedGuard(guard);
            setEditModalOpen(true);
          }} 
          guards={guards} 
          brigadeMap={brigadeMap} 
        />
      </div>
      
      {modalOpen && (
        <GuardEspecialModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          guardDate={selectedDate}
          setGuards={setGuards}
          brigades={brigades} // Brigadas con especial=true
        />
      )}
      
      {editModalOpen && (
        <EditGuardEspecialModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          guard={selectedGuard}
          setGuards={setGuards}
          availableBrigades={brigades} // Brigadas con especial=true
        />
      )}
    </div>
  );
};

export default CalendarEspecialPage;