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
  const [allGuards, setAllGuards] = useState([]);
  const [especialGuards, setEspecialGuards] = useState([]); // Solo guardias con especiales no nulo
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);
  const [user, setUser] = useState(null);
  const idParque = 1;

  useEffect(() => {
    console.log("CalendarEspecialPage cargado");
    
    const fetchUserData = async () => {
      try {
        const response = await UsuariosApiService.getUserByToken();
        setUser(response.data);
        console.log("Usuario cargado:", response.data);
        
        const mandoEspecialResponse = await UsuariosApiService.checkMandoEspecial(response.data.id_empleado);
        console.log("Es mando especial:", mandoEspecialResponse.data.mando_especial);
        setIsMandoEspecial(mandoEspecialResponse.data.mando_especial);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchGuards = async () => {
      try {
        // Cargar todas las guardias
        const response = await GuardsApiService.getGuards();
        console.log("Todas las guardias cargadas:", response.data);
        setAllGuards(response.data);
        
        // Filtrar solo las que tienen especiales no nulo
        const filteredEspecialGuards = response.data.filter(guard => 
          guard.especiales !== null && 
          guard.especiales !== undefined && 
          guard.especiales !== ""
        );
        
        console.log("Guardias con especiales no nulo:", filteredEspecialGuards);
        setEspecialGuards(filteredEspecialGuards);
      } catch (error) {
        console.error('Error fetching guards:', error);
      }
    };

    const fetchBrigades = async () => {
      try {
        const response = await BrigadesApiService.getEspecialBrigades();
        console.log("Brigadas especiales cargadas:", response.data);
        setBrigades(response.data);
        
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
    console.log("handleDateClick ejecutado");
    
    if (!isMandoEspecial) {
      console.log("Usuario no es mando especial, ignorando clic");
      return;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Buscar guardias ESPECIALES en esta fecha (con especiales no nulo)
    const especialGuardsOnThisDay = especialGuards.filter(guard => 
      guard.date === dateString
    );
    
    console.log("===== DEPURACIÓN DE GUARDIAS ESPECIALES =====");
    console.log("Fecha seleccionada:", dateString);
    console.log("Guardias especiales en esta fecha:", especialGuardsOnThisDay);
    
    if (especialGuardsOnThisDay.length > 0) {
      // Si hay guardias especiales, abrir el modal de edición
      console.log("DECISIÓN: Abrir modal de EDICIÓN para guardia especial");
      setSelectedGuard(especialGuardsOnThisDay[0]);
      setEditModalOpen(true);
    } else {
      // Si no hay guardias especiales, abrir el modal de creación
      console.log("DECISIÓN: Abrir modal de CREACIÓN de guardia especial");
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
            console.log("onEditClick ejecutado", guard);
            if (!isMandoEspecial) return;
            
            // Verificar que la guardia sea especial antes de editarla
            if (guard.especiales) {
              setSelectedGuard(guard);
              setEditModalOpen(true);
            } else {
              // Si no es una guardia especial, ignorar el clic o mostrar mensaje
              console.log("Guardia no es especial, ignorando clic de edición");
            }
          }} 
          guards={especialGuards} // Solo mostrar guardias especiales en el calendario
          brigadeMap={brigadeMap} 
        />
      </div>
      
      {modalOpen && (
        <GuardEspecialModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          guardDate={selectedDate}
          setGuards={(newGuards) => {
            // Actualizar el estado de guardias
            if (Array.isArray(newGuards)) {
              setEspecialGuards(prev => [...prev, ...newGuards.filter(g => g.especiales)]);
            } else {
              // Si es una sola guardia
              if (newGuards.especiales) {
                setEspecialGuards(prev => [...prev, newGuards]);
              }
            }
          }}
          brigades={brigades}
        />
      )}
      
      {editModalOpen && (
        <EditGuardEspecialModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          guard={selectedGuard}
          setGuards={(updatedGuards) => {
            // Actualizar el estado de guardias especiales
            if (Array.isArray(updatedGuards)) {
              setEspecialGuards(updatedGuards.filter(g => g.especiales));
            } else {
              // Si es solo una guardia actualizada
              if (updatedGuards.especiales) {
                setEspecialGuards(prev => prev.map(g => 
                  g.id === selectedGuard.id ? updatedGuards : g
                ));
              } else {
                // Si la guardia ya no es especial, eliminarla del estado
                setEspecialGuards(prev => prev.filter(g => g.id !== selectedGuard.id));
              }
            }
          }}
          availableBrigades={brigades}
        />
      )}
    </div>
  );
};

export default CalendarEspecialPage;