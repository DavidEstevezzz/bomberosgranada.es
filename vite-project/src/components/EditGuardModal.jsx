import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import SalariesApiService from '../services/SalariesApiService';
import { useDarkMode } from '../contexts/DarkModeContext'; // Importa el contexto de modo oscuro si está disponible

const EditGuardModal = ({ isOpen, onClose, guard, setGuards, availableBrigades }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [salaryId, setSalaryId] = useState('');
  const [type, setType] = useState('');
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useDarkMode(); // Usar el modo oscuro si está disponible

  useEffect(() => {
    if (guard) {
      setBrigadeId(guard.id_brigada);
      setSalaryId(guard.id_salario);
      setType(guard.tipo);
    }
  }, [guard]);

  useEffect(() => {
    const fetchSalaries = async () => {
      const response = await SalariesApiService.getSalaries();
      setSalaries(response.data);
    };

    fetchSalaries();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatedGuard = {
      date: guard.date,
      id_brigada: brigadeId,
      id_salario: salaryId,
      tipo: type
    };

    console.log('Updated guard to be sent:', updatedGuard);

    try {
      const response = await GuardsApiService.updateGuard(guard.id, updatedGuard); // Usa el ID de la guardia
      console.log('Response from server:', response.data);
      setGuards(prev => prev.map(g => g.id === guard.id ? response.data : g));
      onClose();
    } catch (error) {
      console.error('Failed to update the guard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await GuardsApiService.deleteGuard(guard.id); // Usa el ID de la guardia
      console.log(`Guard with id ${guard.id} deleted`);
      setGuards(prev => prev.filter(g => g.id !== guard.id));
      onClose();
    } catch (error) {
      console.error('Failed to delete the guard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mt-3 text-center">
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Guard</h3>
            <div className="mt-2">
              <form onSubmit={handleSubmit}>
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="brigadeId">Brigada</label>
                <select
                  id="brigadeId"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={brigadeId}
                  onChange={e => setBrigadeId(e.target.value)}
                  required
                >
                  <option value="">Select Brigade</option>
                  {availableBrigades.map(brigade => (
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
                  <option value="">Select Salary</option>
                  {salaries.length > 0 ? (
                    salaries.map(salary => (
                      <option key={salary.id_salario} value={salary.id_salario}>
                        {salary.tipo}
                      </option>
                    ))
                  ) : (
                    <option value="">No salaries available</option>
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
              <button
                type="button"
                onClick={handleDelete}
                className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-400 w-full"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Guard'}
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="bg-red-500 text-white active:bg-red-600 w-full px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditGuardModal;
