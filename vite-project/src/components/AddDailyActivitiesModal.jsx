import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import GuardsApiService from '../services/GuardsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddDailyActivitiesModal = ({ isOpen, onClose, onUpdate, id_brigada, selectedDate }) => {
  if (!isOpen) return null;

  const [formValues, setFormValues] = useState({
    limpieza_vehiculos: '',
    limpieza_dependencias: '',
    callejero: '',
    ejercicios: '',
    repostaje: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();
  const [guardId, setGuardId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchGuardActivities = async () => {
        try {
          const response = await GuardsApiService.getGuard(id_brigada, selectedDate);
          const guard = response.data?.guard;
          if (guard) {
            setFormValues({
              limpieza_vehiculos: guard.limpieza_vehiculos || '',
              limpieza_dependencias: guard.limpieza_dependencias || '',
              callejero: guard.callejero || '',
              ejercicios: guard.ejercicios || '',
              repostaje: guard.repostaje || '',
            });
            setGuardId(guard.id);
          }
        } catch (error) {
          console.error('Error al cargar las actividades diarias:', error);
        }
      };
      fetchGuardActivities();
    }
  }, [isOpen, id_brigada, selectedDate]);

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const fieldLabels = {
    limpieza_vehiculos: 'Limpieza Vehículos',
    limpieza_dependencias: 'Limpieza Dependencias',
    callejero: 'Callejero',
    ejercicios: 'Maniobras',
    repostaje: 'Repostaje',
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log('Datos enviados:', {
        id_brigada,
        date: selectedDate,
        ...formValues,
      });
      // Se asume que existe un método en el servicio para actualizar las actividades diarias
      const response = await GuardsApiService.updateDailyActivities(guardId, formValues);
      onUpdate(response.data); // Actualiza en la vista padre
      onClose(); // Cierra el modal tras el envío
    } catch (error) {
      console.error('Error actualizando las actividades diarias:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className={`p-8 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Actividades Diarias
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-4 sm:grid-cols-2">
            {['limpieza_vehiculos', 'limpieza_dependencias', 'callejero', 'ejercicios', 'repostaje'].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <textarea
                  name={field}
                  value={formValues[field]}
                  onChange={handleChange}
                  rows={4}
                  placeholder={`Escribe ${field.replace(/_/g, ' ')}...`}
                  className={`resize-y bg-gray-50 border text-sm rounded-lg block w-full p-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'
                    }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`text-sm px-5 py-2.5 rounded-lg font-medium focus:outline-none ${darkMode ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-gray-400 text-black hover:bg-gray-500'
                }`}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`text-sm px-5 py-2.5 rounded-lg font-medium ${darkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Actividades'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDailyActivitiesModal;
