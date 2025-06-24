import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTools, faUser, faTruck, faBuilding, faRadio } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import dayjs from 'dayjs';

// Función helper para detectar si es dispositivo móvil
const isMobileDevice = () => window.innerWidth <= 768;

const IncidentDetailModal = ({ incident, isOpen, onClose }) => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMobile(isMobileDevice());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clase condicional para forzar scroll vertical y altura completa en móvil
  const modalContentClass = isMobile ? 'overflow-y-auto h-screen' : '';

  const normalizeTypeName = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'vehiculo':
        return 'Vehículo';
      case 'personal':
        return 'Personal';
      case 'instalacion':
        return 'Instalación';
      case 'equipo':
        return 'Equipos Personales';
      case 'vestuario':
        return 'Vestuario';
      case 'equipos_comunes':
        return 'Equipos Comunes';
      default:
        return tipo?.charAt(0).toUpperCase() + tipo?.slice(1) || '';
    }
  };
  
  // Determinar el ícono y color basado en el nivel de incidencia
  const getLevelColorClass = () => {
    switch (incident.nivel?.toLowerCase()) {
      case 'alto':
        return 'bg-red-600';
      case 'medio':
        return 'bg-orange-500';
      case 'bajo':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-600';
    }
  };

  // Función para obtener el ícono según el tipo de incidencia
  const getTypeIcon = () => {
    switch (incident.tipo?.toLowerCase()) {
      case 'vehiculo':
        return faTruck;
      case 'personal':
        return faUser;
      case 'instalacion':
        return faBuilding;
      case 'equipo':
        return faRadio;
      case 'equipos_comunes':
        return faTools;
      default:
        return faTools;
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div
        className={`p-6 w-full max-w-2xl rounded-lg shadow-lg ${modalContentClass} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${getLevelColorClass()} mr-3`}>
              <FontAwesomeIcon icon={getTypeIcon()} className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">Detalle de la Incidencia</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-3 text-gray-500 dark:text-gray-400">Información General</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Creado por:</span>
                <span>{incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : incident.id_empleado}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{dayjs(incident.fecha).format('DD/MM/YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${incident.estado?.toLowerCase() === 'resuelta' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {incident.estado?.charAt(0).toUpperCase() + incident.estado?.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nivel:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${incident.nivel?.toLowerCase() === 'alto' ? 'bg-red-500 text-white' :
                  incident.nivel?.toLowerCase() === 'medio' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'}`}>
                  {incident.nivel?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-3 text-gray-500 dark:text-gray-400">Ubicación y Tipo</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Tipo:</span>
                <span>{normalizeTypeName(incident.tipo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Parque:</span>
                <span>{incident.park ? incident.park.nombre : incident.id_parque}</span>
              </div>
              {incident.tipo === 'vehiculo' && (
                <div className="flex justify-between">
                  <span className="font-medium">Vehículo:</span>
                  <span>{incident.vehicle?.nombre}</span>
                </div>
              )}
              {incident.tipo === 'personal' && (
                <div className="flex justify-between">
                  <span className="font-medium">Empleado:</span>
                  <span>{incident.employee2 ? `${incident.employee2.nombre} ${incident.employee2.apellido}` : ''}</span>
                </div>
              )}
              {incident.tipo === 'equipo' && (
                <div className="flex justify-between">
                  <span className="font-medium">Equipo:</span>
                  <span>{incident.equipment ? incident.equipment.nombre : ''}</span>
                </div>
              )}
              {incident.tipo === 'equipos_comunes' && (
                <div className="flex justify-between">
                  <span className="font-medium">Equipo Común:</span>
                  <span>{incident.nombre_equipo || ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className="text-sm uppercase tracking-wider font-semibold mb-3 text-gray-500 dark:text-gray-400">Descripción</h4>
          <p className="whitespace-pre-line">{incident.descripcion}</p>
        </div>

        {incident.resolviendo && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-3 text-gray-500 dark:text-gray-400">Resolviendo:</h4>
            <p className="whitespace-pre-line">{incident.resolviendo}</p>
          </div>
        )}

        {incident.resolver && (
          <div className={`p-4 mt-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-3 text-gray-500 dark:text-gray-400">Resolución</h4>
            <div className="space-y-4">
              {/* Información del resolvedor */}
              <div className="flex justify-between items-center">
                <span className="font-medium">Resuelto por:</span>
                <span className="text-right">{incident.resolver ? `${incident.resolver.nombre} ${incident.resolver.apellido}` : 'No resuelto'}</span>
              </div>

              {/* Descripción de la resolución */}
              {incident.resolucion && (
                <div>
                  <span className="font-medium block mb-2">Descripción de la resolución:</span>
                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <p className="whitespace-pre-line text-sm leading-relaxed">
                      {incident.resolucion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetailModal;