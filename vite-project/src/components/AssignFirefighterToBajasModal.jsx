import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const AssignFirefighterToBajasModal = ({ isOpen, onClose, firefighters, guardDate, currentBrigade }) => {
  const { darkMode } = useDarkMode();
  const [selectedFirefighterId, setSelectedFirefighterId] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [destinationBrigade, setDestinationBrigade] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnoOptions = [
    "Mañana",
    "Tarde",
    "Noche",
    "Día Completo",
    "Mañana y tarde",
    "Tarde y noche"
  ];

  // Calcula los turnos de ida y vuelta según el turno seleccionado
  const computeAssignment = (turnoSeleccionado) => {
    let ida = '';
    let vuelta = '';
    switch (turnoSeleccionado) {
      case 'Mañana':
        ida = 'Mañana';
        vuelta = 'Tarde';
        break;
      case 'Tarde':
        ida = 'Tarde';
        vuelta = 'Noche';
        break;
      case 'Noche':
        ida = 'Noche';
        vuelta = 'Mañana';
        break;
      case 'Mañana y tarde':
        ida = 'Mañana';
        vuelta = 'Noche';
        break;
      case 'Tarde y noche':
        ida = 'Tarde';
        vuelta = 'Mañana';
        break;
      case 'Día Completo':
        ida = 'Mañana';
        vuelta = 'Mañana';
        break;
      default:
        break;
    }
    return { ida, vuelta };
  };

  // Al abrir el modal se reinician los estados y se carga la brigada destino "Bajas"
  useEffect(() => {
    if (isOpen) {
      setSelectedFirefighterId('');
      setTurno('Mañana');
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);
      setAssignmentDetails(computeAssignment('Mañana'));
      fetchDestinationBrigade();
    }
  }, [isOpen, guardDate]);

  // Actualiza la asignación calculada al cambiar el turno
  useEffect(() => {
    setAssignmentDetails(computeAssignment(turno));
  }, [turno]);

  // Busca la brigada cuyo nombre sea "Bajas"
  const fetchDestinationBrigade = async () => {
    try {
      const response = await BrigadesApiService.getBrigades();
      const bajasBrigade = response.data.find(b => b.nombre === 'Bajas');
      if (bajasBrigade) {
        setDestinationBrigade(bajasBrigade.id_brigada);
      } else {
        setError('No se encontró la brigada "Bajas"');
      }
    } catch (err) {
      console.error('Error al obtener brigadas:', err);
      setError('No se pudo cargar la brigada destino');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setSuccess(null);
    if (!selectedFirefighterId) {
      setError('Seleccione un bombero');
      return;
    }
    if (!destinationBrigade) {
      setError('No se encontró la brigada destino "Bajas"');
      return;
    }
    setIsSubmitting(true);

    // La fecha de ida es la fecha de la guardia y, para ciertos turnos, la asignación de vuelta se hace al día siguiente
    const fecha_ida = guardDate;
    let fecha_vuelta = guardDate;
    if (turno === "Noche" || turno === "Tarde y noche" || turno === "Día Completo") {
      fecha_vuelta = dayjs(guardDate).add(1, 'day').format('YYYY-MM-DD');
    }

    // Payload para asignación de ida: de la brigada actual a la brigada "Bajas"
    const payloadIda = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: currentBrigade.id_brigada,
      id_brigada_destino: destinationBrigade,
      fecha_ini: fecha_ida,
      turno: assignmentDetails.ida,
    };

    // Payload para asignación de vuelta: de la brigada "Bajas" de vuelta a la brigada actual
    const payloadVuelta = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: destinationBrigade,
      id_brigada_destino: currentBrigade.id_brigada,
      fecha_ini: fecha_vuelta,
      turno: assignmentDetails.vuelta,
    };

    try {
      await AssignmentsApiService.createAssignment(payloadIda);
      await AssignmentsApiService.createAssignment(payloadVuelta);
      setSuccess('Asignación creada con éxito');
      // Reiniciamos campos
      setSelectedFirefighterId('');
      setTurno('Mañana');
      setAssignmentDetails(computeAssignment('Mañana'));
    } catch (err) {
      console.error(err);
      setError('Error creando la asignación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Encabezado */}
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Asignar Bombero a Brigada "Bajas"
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            {/* Mostrar la fecha de guardia (solo texto) */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Fecha de Guardia
              </label>
              <div className={`p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                {guardDate}
              </div>
            </div>
            {/* Mostrar la brigada destino fija ("Bajas") */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Brigada Destino
              </label>
              <div className={`p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                Bajas
              </div>
            </div>
            {/* Seleccionar turno */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Turno
              </label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              >
                {turnoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {/* Seleccionar bombero */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Seleccione Bombero
              </label>
              <select
                value={selectedFirefighterId}
                onChange={(e) => setSelectedFirefighterId(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">-- Seleccione --</option>
                {firefighters.map(firefighter => (
                  <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                    {firefighter.nombre} {firefighter.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Mensajes de error o éxito */}
          {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
          {success && <div className="text-green-500 mb-4 text-sm">{success}</div>}
          {/* Botones */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className={`text-sm px-5 py-2.5 font-medium rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`text-sm px-5 py-2.5 font-medium rounded-lg ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600'}`}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignFirefighterToBajasModal;
