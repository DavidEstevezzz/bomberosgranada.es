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
  
    if (!brigadeId || !salaryId || !type) {
      console.error('Error: Todos los campos son obligatorios.');
      alert('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }
  
    const dateUTC = new Date(Date.UTC(guardDate.getFullYear(), guardDate.getMonth(), guardDate.getDate()));
  
    const guard = {
      date: dateUTC.toISOString().slice(0, 10),
      id_brigada: brigadeId,
      id_salario: salaryId,
      tipo: type,
    };
  
    try {
      const response = await GuardsApiService.createGuard(guard);
      setGuards((prev) => [...prev, response.data]);
  
      const allBrigadesResponse = await BrigadesApiService.getBrigades(); // Nueva búsqueda de todas las brigadas
      const allBrigades = allBrigadesResponse.data;
  
      const selectedBrigade = brigades.find((brigade) => String(brigade.id_brigada) === String(brigadeId));
  
      if (!selectedBrigade) {
        console.warn('No se encontró la brigada seleccionada con ID:', brigadeId);
        return;
      }
  
      const brigadeForParque2 = allBrigades.find(
        (brigade) =>
          brigade.id_parque === 2 &&
          brigade.nombre.trim().toLowerCase() === selectedBrigade.nombre.trim().toLowerCase()
      );
  
      if (brigadeForParque2) {
        const secondGuard = {
          ...guard,
          id_brigada: brigadeForParque2.id_brigada,
        };
  
        const secondResponse = await GuardsApiService.createGuard(secondGuard);
        setGuards((prev) => [...prev, secondResponse.data]);
      } else {
        console.warn('No se encontró brigada en parque 2 para el nombre:', selectedBrigade.nombre);
      }
  
      onClose();
    } catch (error) {
      console.error('Error al intentar guardar las guardias:', error);
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
                  <option value="Festivo víspera">Festivo víspera</option>


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
