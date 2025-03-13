import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import SuggestionApiService from '../services/SuggestionApiService';
import { useStateContext } from '../contexts/ContextProvider';


const AddSuggestionModal = ({ isOpen, onClose, onAdd }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState({ titulo: '', descripcion: '' });
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useStateContext();


  useEffect(() => {
    if (isOpen) {
      setFormValues({ titulo: '', descripcion: '' });
      setErrorMessages({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Agregar el id del usuario autenticado a los datos enviados
    const dataToSend = {
      ...formValues,
      usuario_id: user.id_empleado, // Asegúrate de que user.id_empleado esté definido
    };
  
    console.log("Datos enviados:", dataToSend);
  
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessages({});
  
    try {
      const response = await SuggestionApiService.createSuggestion(dataToSend);
      console.log("Respuesta de la API:", response.data);
      onAdd(); // para refrescar la lista
      onClose();
    } catch (error) {
      console.error("Error al crear sugerencia:", error);
      if (error.response && error.response.data) {
        console.error("Datos del error:", error.response.data);
      }
      setErrorMessages({ general: 'Error al crear la sugerencia.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className={`p-4 w-full max-w-lg rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Crear Sugerencia</h3>
          <button onClick={onClose} disabled={isSubmitting} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="titulo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Título</label>
            <input
              type="text"
              name="titulo"
              id="titulo"
              value={formValues.titulo}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              required
            />
            {errorMessages.titulo && <span className="text-red-500 text-sm">{errorMessages.titulo}</span>}
          </div>
          <div className="mb-4">
            <label htmlFor="descripcion" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Descripción</label>
            <textarea
              name="descripcion"
              id="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              required
            />
            {errorMessages.descripcion && <span className="text-red-500 text-sm">{errorMessages.descripcion}</span>}
          </div>
          {errorMessages.general && <div className="text-red-500 mb-4">{errorMessages.general}</div>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded border">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white">
              {isSubmitting ? 'Enviando...' : 'Crear Sugerencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSuggestionModal;
