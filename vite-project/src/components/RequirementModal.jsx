import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService'; 

const RequirementModal = ({ isOpen, onClose, employee }) => {
  const { darkMode } = useDarkMode();

  // Estado para los campos del formulario
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [brigade, setBrigade] = useState('');
  
  // Estado para lista de brigadas
  const [brigades, setBrigades] = useState([]);

  // Mensajes de error / éxito
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al abrir el modal, limpiamos estados y cargamos brigadas
  useEffect(() => {
    if (isOpen) {
      setFecha('');
      setTurno('Mañana');
      setBrigade('');
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);

      // Cargar brigadas
      fetchBrigades();
    }
  }, [isOpen]);

  // Función para obtener la lista de brigadas
  const fetchBrigades = async () => {
    try {
      const response = await BrigadesApiService.getBrigades(); 
      // Ordenar las brigadas alfabéticamente (considerando mayúsculas/minúsculas y acentos)
      const sortedBrigades = response.data.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      setBrigades(sortedBrigades);
    } catch (err) {
      console.error('Error fetching brigades:', err);
      setError('No se pudo cargar la lista de brigadas');
    }
  };
  

  if (!isOpen) return null;

  // Manejo del Submit: se incluye requerimiento:true para la asignación de ida
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    setError(null);
    setSuccess(null);
  
    if (!employee) {
      setError('Falta el ID de empleado');
      setIsSubmitting(false);
      return;
    }
    if (!brigade) {
      setError('Falta seleccionar la brigada');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const payload = {
        id_empleado: employee.id_empleado,
        id_brigada_destino: brigade,
        fecha,
        turno,
        // Marcamos requerimiento como true para la asignación de ida
        requerimiento: true
      };
  
      await AssignmentsApiService.requireFirefighter(payload);
      setSuccess('Requerimiento creado con éxito');
  
      // Vaciar los campos tras envío exitoso
      setFecha('');
      setTurno('Mañana');
      setBrigade('');
  
    } catch (err) {
      console.error(err);
      setError('Error creando el requerimiento');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div
        className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* Encabezado */}
        <div
          className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Requerir Bombero
          </h3>
          <button
            onClick={handleClose}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            {/* Fecha */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                required
              />
            </div>

            {/* Turno */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Turno
              </label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
              >
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
                <option value="Día Completo">Día Completo</option>
                <option value="Mañana y tarde">Mañana y tarde</option>
                <option value="Tarde y noche">Tarde y noche</option>
              </select>
            </div>

            {/* Brigada Destino */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Brigada Destino
              </label>
              <select
                value={brigade}
                onChange={(e) => setBrigade(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                required
              >
                <option value="">-- Selecciona una brigada --</option>
                {brigades.map((b) => (
                  <option key={b.id_brigada} value={b.id_brigada}>
                    {b.nombre} ({b.id_parque})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mensajes de error / éxito */}
          {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
          {success && <div className="text-green-500 mb-4 text-sm">{success}</div>}

          {/* Botones de acción */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}
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

export default RequirementModal;