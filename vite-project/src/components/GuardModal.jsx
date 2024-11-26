import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import SalariesApiService from '../services/SalariesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardModal = ({ isOpen, onClose, guardDate, setGuards }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [salaryId, setSalaryId] = useState('');
  const [type, setType] = useState('Laborable'); // Valor predeterminado
  const [brigades, setBrigades] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {

    const fetchBrigades = async () => {
      const response = await BrigadesApiService.getBrigades();
      // Filtrar brigadas cuyo id_parque es igual a 1
      const filteredBrigades = response.data.filter(brigade => brigade.id_parque === 1);
      setBrigades(filteredBrigades);
    };

    const fetchSalaries = async () => {
      const response = await SalariesApiService.getSalaries();
      setSalaries(response.data);
    };

    if (isOpen) {
      fetchBrigades();
      fetchSalaries();
    }
  }, [isOpen, guardDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validación adicional para asegurarse de que todos los campos estén completos
    if (!brigadeId || !salaryId || !type) {
      alert('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Verifica la fecha antes de convertirla a ISOString
    console.log('Guard date before formatting:', guardDate);

    // Ajustar la fecha a UTC
    const dateUTC = new Date(Date.UTC(guardDate.getFullYear(), guardDate.getMonth(), guardDate.getDate()));

    const guard = {
      date: dateUTC.toISOString().slice(0, 10),
      id_brigada: brigadeId,
      id_salario: salaryId,
      tipo: type
    };

    console.log('Guard to be sent:', guard); // Añade este console.log para verificar los datos enviados

    try {
      const response = await GuardsApiService.createGuard(guard);
      console.log('Response from server:', response.data); // Verifica la respuesta del servidor
      setGuards(prev => [...prev, response.data]);
      onClose();
    } catch (error) {
      console.error('Failed to save the guard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mt-3 text-center">
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Guardia</h3>
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
                
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="salaryId">Tipo de salario</label>
                <select
                  id="salaryId"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={salaryId}
                  onChange={e => setSalaryId(e.target.value)}
                  required
                >
                  <option value="">Selecciona el salario</option>
                  {salaries.length > 0 ? (
                    salaries.map(salary => (
                      <option key={salary.id_salario} value={salary.id_salario}>
                        {salary.tipo}
                      </option>
                    ))
                  ) : (
                    <option value="">No hay salarios disponibles</option>
                  )}
                </select>
                
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="type">Tipo de día</label>
                <select
                  id="type"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  required
                >
                  <option value="Laborable">Laborable</option>
                  <option value="Festivo">Festivo</option>
                  <option value="Prefestivo">Prefestivo</option>
                  <option value="Prefestivo">Festivo víspera</option>


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

export default GuardModal;
