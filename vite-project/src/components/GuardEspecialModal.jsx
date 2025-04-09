import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import SalariesApiService from '../services/SalariesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardEspecialModal = ({ isOpen, onClose, guardDate, setGuards, brigades }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [type, setType] = useState('Laborable'); // Tipo de día (predeterminado: Laborable)
  const [especialType, setEspecialType] = useState('Guardia localizada'); // Tipo de guardia especial
  const [loading, setLoading] = useState(false);
  const { darkMode } = useDarkMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    if (!brigadeId || !type || !especialType) {
      console.error('Error: Todos los campos son obligatorios.');
      alert('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }
  
    const dateUTC = new Date(Date.UTC(guardDate.getFullYear(), guardDate.getMonth(), guardDate.getDate()));
  
    const guard = {
      date: dateUTC.toISOString().slice(0, 10),
      id_brigada: brigadeId,
      id_salario: '16', // ID de salario por defecto
      tipo: type, // Tipo de día: Laborable, Festivo, etc.
      especiales: especialType, // Tipo de guardia especial: Guardia localizada o Prácticas
    };
  
    try {
      const response = await GuardsApiService.createGuard(guard);
      setGuards((prev) => [...prev, response.data]);
      onClose();
    } catch (error) {
      console.error('Error al intentar guardar la guardia especial:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mt-3 text-center">
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Guardia Especial</h3>
            <div className="mt-4">
              <form onSubmit={handleSubmit}>
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="brigadeId">Brigada</label>
                <select
                  id="brigadeId"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={brigadeId}
                  onChange={e => setBrigadeId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una brigada</option>
                  {brigades.map(brigade => (
                    <option key={brigade.id_brigada} value={brigade.id_brigada}>
                      {brigade.nombre}
                    </option>
                  ))}
                </select>
                
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="especialType">Tipo de guardia especial</label>
                <select
                  id="especialType"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={especialType}
                  onChange={e => setEspecialType(e.target.value)}
                  required
                >
                  <option value="Guardia localizada">Guardia localizada</option>
                  <option value="Prácticas">Prácticas</option>
                </select>
                
                <button
                  type="submit"
                  className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-400 w-full"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            </div>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="bg-red-500 text-white active:bg-red-600 w-full px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default GuardEspecialModal;