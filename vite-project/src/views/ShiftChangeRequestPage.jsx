import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import UsuariosApiService from '../services/UsuariosApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

const ShiftChangeRequestPage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await UsuariosApiService.getUsuarios();
        const otherEmployees = response.data.filter(emp => emp.id_empleado !== user.id_empleado);
        setEmployees(otherEmployees);
      } catch (error) {
      }
    };

    fetchEmployees();
  }, [user]);

  const fetchBrigadesForDate = async (fecha, id_empleado) => {
    try {
      const response = await AssignmentsApiService.getAssignments();
      console.log('Datos de respuesta de assignments:', response.data); // Log del response completo
      const formattedDate = dayjs(fecha).format('YYYY-MM-DD');
  
      const assignmentsForEmployee = response.data.filter(assign => {
        const assignDate = dayjs(assign.fecha_ini).format('YYYY-MM-DD');
        const isEmployeeMatch = parseInt(assign.id_empleado) === parseInt(id_empleado);
        const isDateMatch = dayjs(assignDate).isSameOrBefore(formattedDate);
        return isEmployeeMatch && isDateMatch;
      });
      
      console.log(`Asignaciones filtradas para empleado ${id_empleado}:`, assignmentsForEmployee); // Log después de filtrar asignaciones

      const turnoPriority = (turno) => {
        if (turno === 'Mañana') return 1;
        if (turno === 'Tarde') return 2;
        if (turno === 'Noche') return 3;
        return 4;
      };
  
      const sortedAssignments = assignmentsForEmployee.sort((a, b) => {
        const dateDiff = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
        if (dateDiff === 0) {
          return turnoPriority(b.turno) - turnoPriority(a.turno);
        }
        return dateDiff;
      });
  
      const lastAssignment = sortedAssignments[0];
  
      if (lastAssignment) {
        console.log(`Brigada para el empleado ${id_empleado} en la fecha ${formattedDate}: ${lastAssignment.id_brigada_destino}, turno: ${lastAssignment.turno}`);
        return lastAssignment.id_brigada_destino;
      } else {
        console.error(`No se encontró una asignación para el empleado con id ${id_empleado} en la fecha ${formattedDate}.`);
        setError(`No se encontró una asignación para el empleado con id ${id_empleado} en la fecha ${formattedDate}.`);
        return null;
      }
    } catch (error) {
      console.error('Error al obtener las asignaciones:', error);
      setError('Error al obtener las asignaciones.');
      return null;
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const brigada1 = await fetchBrigadesForDate(fecha, user.id_empleado);
    const brigada2 = await fetchBrigadesForDate(fecha, selectedEmployee);

    if (!brigada1 || !brigada2) {
      setError('No se pudieron determinar las brigadas para las fechas seleccionadas.');
      return;
    }

    console.log(`Brigada del usuario actual: ${brigada1}`);
    console.log(`Brigada del bombero seleccionado: ${brigada2}`);

    const requestData = {
      id_empleado1: user.id_empleado,
      id_empleado2: selectedEmployee,
      brigada1,
      brigada2,
      fecha,
      turno,
      motivo,
      estado: 'en_tramite'
    };
    
    console.log('Datos de request antes de enviar:', requestData); // Log del requestData antes de enviar

    try {
      const response = await ShiftChangeRequestApiService.createRequest(requestData);
      console.log('Respuesta del servidor para la creación de solicitud:', response.data); // Log de la respuesta
      setSuccess('Solicitud de cambio de guardia enviada con éxito.');
    } catch (error) {
      console.error('Error al enviar la solicitud de cambio de guardia:', error); // Log de cualquier error al hacer POST
      setError('Error al enviar la solicitud de cambio de guardia.');
    }
  };


  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h1 className="text-xl font-bold mb-4">Solicitar Cambio de Guardia</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-500">{success}</div>}
      <form onSubmit={handleSubmit}>
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
            <option value="" className="text-black">Seleccione un bombero</option>
            {employees.map((employee) => (
              <option key={employee.id_empleado} value={employee.id_empleado} className="text-black">
                {employee.nombre} {employee.apellido}
              </option>
            ))}
          </select>
        </div>

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
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="motivo">
            Motivo del Cambio
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            rows="4"
            required
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
