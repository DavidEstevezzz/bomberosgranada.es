import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import VehiclesApiService from '../services/VehiclesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditVehicleModal = ({ isOpen, onClose, vehicle, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    matricula: vehicle.matricula || '',
    id_parque: vehicle.id_parque || '',
    año: vehicle.año || '',
    tipo: vehicle.tipo || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        matricula: vehicle.matricula || '',
        id_parque: vehicle.id_parque || '',
        año: vehicle.año || '',
        tipo: vehicle.tipo || ''
      });
      setIsSubmitting(false);
    }
  }, [isOpen, vehicle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await VehiclesApiService.updateVehicle(vehicle.matricula, formValues);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`bg-white dark:bg-gray-800 p-4 w-full max-w-2xl rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actualizar Vehículo</h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-lg" disabled={isSubmitting}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="matricula" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Matrícula</label>
              <input
                type="text"
                name="matricula"
                id="matricula"
                value={formValues.matricula}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                disabled={isSubmitting}
                readOnly
              />
            </div>
            <div>
              <label htmlFor="id_parque" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ID Parque</label>
              <input
                type="text"
                name="id_parque"
                id="id_parque"
                value={formValues.id_parque}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="año" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Año</label>
              <input
                type="number"
                name="año"
                id="año"
                value={formValues.año}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="tipo" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
              <input
                type="text"
                name="tipo"
                id="tipo"
                value={formValues.tipo}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Actualizar Vehículo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-red-600 hover:text-white border border-red-600 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTrash} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVehicleModal;
