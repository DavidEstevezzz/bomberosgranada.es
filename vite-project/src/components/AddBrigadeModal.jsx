import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddBrigadeModal = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const [formValues, setFormValues] = useState({
    id_parque: '',
    nombre: ''
  });

  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    console.log('Modal is open:', isOpen);
  }, [isOpen]);

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submit event triggered');
    setErrorMessages({});
    if (isSubmitting) {
      console.log('Submission prevented due to ongoing submission');
      return;
    }

    console.log('Starting submission');
    setIsSubmitting(true);

    try {
      const response = await BrigadesApiService.createBrigade(formValues);
      console.log('Brigade added successfully:', response.data);
      onAdd(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to add brigade:', error);
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: 'An error occurred' });
      }
    } finally {
      console.log('Submission finished');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50`}>
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Brigada</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nombre</label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                required
              />
              {errorMessages.nombre && <span className="text-red-500 text-sm">{errorMessages.nombre}</span>}
            </div>
            <div>
              <label htmlFor="id_parque" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parque</label>
              <select
                name="id_parque"
                id="id_parque"
                value={formValues.id_parque}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                required
              >
                <option value="">Selecciona un parque</option>
                <option value="1">Parque Norte</option>
                <option value="2">Parque Sur</option>
              </select>
              {errorMessages.id_parque && <span className="text-red-500 text-sm">{errorMessages.id_parque}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-800' : 'bg-primary-700 hover:bg-primary-800 text-white focus:ring-primary-300'}`} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Añadir Brigada'}
            </button>
            <button type="button" onClick={() => {
              console.log('Closing modal');
              onClose();
            }} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBrigadeModal;
