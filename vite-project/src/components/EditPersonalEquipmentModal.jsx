import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditPersonalEquipmentModal = ({ isOpen, onClose, equipment, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    id: equipment.id || '',
    nombre: equipment.nombre || '',
    categoria: equipment.categoria || '',
    parque: equipment?.parque || null

  });
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        id: equipment.id || '',
        nombre: equipment.nombre || '',
        categoria: equipment.categoria || ''
      });
      setIsSubmitting(false);
      fetchCategories();
    }
  }, [isOpen, equipment]);

  const fetchCategories = async () => {
    try {
      const response = await PersonalEquipmentApiService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await PersonalEquipmentApiService.updatePersonalEquipment(equipment.id, formValues);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update equipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Actualizar Equipo Personal</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            {/* ID (readOnly) */}
            <div>
              <label htmlFor="id" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>ID</label>
              <input
                type="text"
                name="id"
                id="id"
                value={formValues.id}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                disabled={true}
                readOnly
              />
            </div>
            {/* Nombre */}
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
                disabled={isSubmitting}
              />
            </div>
            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Categoría</label>
              <select
                name="categoria"
                id="categoria"
                value={formValues.categoria}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Parque
              </label>
              <select
                name="parque"
                value={formData.parque || ''}
                onChange={(e) => setFormData({ ...formData, parque: e.target.value ? Number(e.target.value) : null })}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No asignado</option>
                {parks.map((park) => (
                  <option key={park.id_parque} value={park.id_parque}>
                    {park.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-800' : 'bg-primary-700 hover:bg-primary-800 text-white focus:ring-primary-300'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Actualizar Equipo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}
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

export default EditPersonalEquipmentModal;