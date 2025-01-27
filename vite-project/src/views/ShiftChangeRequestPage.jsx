import React, { useState, useEffect } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

const ShiftChangeRequestPage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [fecha, setFecha] = useState('');
  const [fecha2, setFecha2] = useState(''); // Nueva fecha para cambios espejo
  const [turno, setTurno] = useState('Día Completo');
  const [motivo, setMotivo] = useState('');
  const [changeType, setChangeType] = useState('simple'); // Tipo de cambio: simple o espejo
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchAndFilterEmployees = async () => {
      if (!user?.puesto) return;

      try {
        const response = await UsuariosApiService.bomberosPorPuesto(user.puesto);
        const allEmployees = response.data;
        setEmployees(allEmployees);

        const filtered = allEmployees.filter((emp) =>
          `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
      } catch (error) {
        console.error('Error fetching employees by puesto:', error);
        setError('Error al obtener los empleados por puesto.');
      }
    };

    fetchAndFilterEmployees();
  }, [user, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        id_empleado1: user.id_empleado,
        id_empleado2: selectedEmployee,
        fecha,
        fecha2: changeType === 'espejo' ? fecha2 : null, // Incluye fecha2 solo si es cambio espejo
        turno: changeType === 'espejo' ? 'Día Completo' : turno, // Día Completo si espejo, turno seleccionado si no
        motivo,
        estado: 'en_tramite',
      };

      console.log('Datos enviados en la solicitud:', requestData);

      const response = await ShiftChangeRequestApiService.createRequest(requestData);

      console.log('Respuesta del servidor (éxito):', response);

      setSuccess('Solicitud de cambio de guardia enviada con éxito.');

      // Limpieza del formulario
      setSearchTerm('');
      setSelectedEmployee('');
      setFecha('');
      setFecha2('');
      setTurno('Mañana');
      setMotivo('');
      setChangeType('simple');
      setFilteredEmployees(employees);
    } catch (error) {
      console.error('Error al enviar la solicitud de cambio de guardia:', error);
      setError('Error al enviar la solicitud de cambio de guardia.');
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h1 className="text-xl font-bold mb-4">Solicitar Cambio de Guardia</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-500">{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Tipo de Cambio */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Tipo de Cambio</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="changeType"
                value="simple"
                checked={changeType === 'simple'}
                onChange={(e) => setChangeType(e.target.value)}
                className="mr-2"
              />
              Cambio Simple
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="changeType"
                value="espejo"
                checked={changeType === 'espejo'}
                onChange={(e) => setChangeType(e.target.value)}
                className="mr-2"
              />
              Cambio Espejo
            </label>
          </div>
        </div>

        {/* Buscar y Seleccionar Bombero */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="search">
            Buscar Bombero
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            placeholder="Escriba un nombre"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="employee">
            Seleccionar Bombero
          </label>
          <select
            id="employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            required
          >
            <option value="">Seleccione un bombero</option>
            {filteredEmployees.map((employee) => (
              <option key={employee.id_empleado} value={employee.id_empleado}>
                {employee.nombre} {employee.apellido}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="fecha">
            Fecha de Guardia
          </label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            required
          />
        </div>

        {/* Fecha 2 (Solo para cambio espejo) */}
        {changeType === 'espejo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="fecha2">
              Fecha de la Guardia de tu Compañero
            </label>
            <input
              type="date"
              id="fecha2"
              value={fecha2}
              onChange={(e) => setFecha2(e.target.value)}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
              required={changeType === 'espejo'}
            />
          </div>
        )}

        {/* Turno */}
        {changeType !== 'espejo' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="turno">
            Turno
          </label>
          <select
            id="turno"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            required
          >
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
            <option value="Mañana y tarde">Mañana y Tarde</option>
            <option value="Tarde y noche">Tarde y Noche</option>
            <option value="Dia Completo">Día Completo</option>
          </select>
        </div>)}

        {/* Motivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="motivo">
            Observaciones
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            rows="4"
          />
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
};

export default ShiftChangeRequestPage;
