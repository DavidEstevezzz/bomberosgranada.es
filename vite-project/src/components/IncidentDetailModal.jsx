import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import dayjs from 'dayjs';

const IncidentDetailModal = ({ incident, isOpen, onClose }) => {
      const { user } = useStateContext();
      console.log(incident);
  const { darkMode } = useDarkMode();
  if (!isOpen) return null;
  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-6 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold">Detalle de la Incidencia</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5"/>
          </button>
        </div>
        <div className="space-y-3">
          <p><strong>Creado por:</strong> {incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : incident.id_empleado}</p>
          <p><strong>Tipo:</strong> {incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}</p>
          <p><strong>Fecha:</strong> {dayjs(incident.fecha).format('DD/MM/YYYY')}</p>
          <p><strong>Leído:</strong> {incident.leido ? 'Sí' : 'No'}</p>
          <p><strong>Parque:</strong> {incident.park ? incident.park.nombre : incident.id_parque}</p>
          {incident.tipo === 'vehiculo' && (
            <p><strong>Vehículo:</strong> {incident.vehicle.nombre}</p>
          )}
          {incident.tipo === 'personal' && (
            <p><strong>Empleado:</strong> {incident.employee2 ? `${incident.employee2.nombre} ${incident.employee2.apellido}` : ''}</p>
          )}
          <p>
            <strong>Resuelto por:</strong> {incident.resolver ? `${incident.resolver.nombre} ${incident.resolver.apellido}` : 'No resuelto'}
          </p>
          <p><strong>Descripción:</strong></p>
          <p>{incident.descripcion}</p>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailModal;
