import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import RequestApiService from '../services/RequestApiService';
import GuardsApiService from '../services/GuardsApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

const CreateRequestPage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  
  // Estados existentes
  const [tipo, setTipo] = useState('vacaciones');
  const [motivo, setMotivo] = useState('');
  const [fechaIni, setFechaIni] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaIni, setHoraIni] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [turno, setTurno] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);

  // NUEVOS ESTADOS para la funcionalidad de jefe
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Cargar empleados si es jefe
  useEffect(() => {
    const loadEmployees = async () => {
      if (user?.type === 'jefe') {
        setIsLoadingEmployees(true);
        try {
          const response = await RequestApiService.getEmployees();
          setEmployees(response.data);
        } catch (error) {
          console.error('Error cargando empleados:', error);
          setError('Error al cargar la lista de empleados');
        } finally {
          setIsLoadingEmployees(false);
        }
      }
    };

    loadEmployees();
  }, [user]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    if (employeeId === '') {
      setSelectedEmployee(null);
    } else {
      const employee = employees.find(emp => emp.id_empleado === employeeId);
      setSelectedEmployee(employee);
    }
  };

  // Obtener el usuario objetivo (empleado seleccionado o usuario actual)
  const getTargetUser = () => {
    if (selectedEmployee) {
      return selectedEmployee;
    }
    return user || {};
  };

  // Sincronizar fechaFin con fechaIni para ciertos tipos de solicitud
  useEffect(() => {
    if (
      tipo === 'asuntos propios' ||
      tipo === 'licencias por jornadas' ||
      tipo === 'horas sindicales' ||
      tipo === 'vestuario'
    ) {
      setFechaFin(fechaIni);
    }
  }, [tipo, fechaIni]);

  const fetchUserBrigadeForDate = async (date, targetUserId = null) => {
    try {
      const assignments = await AssignmentsApiService.getAssignments();
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const userId = targetUserId || user?.id_empleado;
      
      if (!userId) {
        console.error('No se pudo obtener el ID del usuario');
        return null;
      }
      
      const userAssignments = assignments.data.filter(
        (assign) =>
          assign.id_empleado === userId &&
          dayjs(assign.fecha_ini).isSameOrBefore(formattedDate)
      );

      const sortedAssignments = userAssignments.sort((a, b) => {
        const dateDiff = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
        return dateDiff !== 0 ? dateDiff : b.turno.localeCompare(a.turno);
      });

      const lastAssignment = sortedAssignments[0];
      if (lastAssignment) {
        return lastAssignment.id_brigada_destino;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener la brigada del usuario:', error);
      setError('Error al obtener la brigada del usuario.');
      return null;
    }
  };

  const validateVacationDays = () => {
    const targetUser = getTargetUser();
    const startDate = dayjs(fechaIni);
    const endDate = dayjs(fechaFin);
    
    if (startDate.isAfter(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return false;
    }

    const requestedDays = endDate.diff(startDate, 'day') + 1;
    const availableDays = targetUser.vacaciones || 0;

    if (requestedDays > availableDays) {
      const userName = selectedEmployee 
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
        : 'el usuario';
      setError(`${userName} no tiene suficientes días de vacaciones. Disponibles: ${availableDays}, solicitados: ${requestedDays}`);
      return false;
    }
    return true;
  };

  const validateDaysAvailable = (type) => {
    const targetUser = getTargetUser();
    const field = type === 'asuntos propios' ? 'AP' : 'otros';
    const availableDays = targetUser[field] || 0;

    if (availableDays <= 0) {
      const userName = selectedEmployee 
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
        : 'El usuario';
      setError(`${userName} no tiene días disponibles de ${type}. Disponibles: ${availableDays}`);
      return false;
    }
    return true;
  };

  const validateModuloDays = () => {
    const targetUser = getTargetUser();
    const availableDays = targetUser.modulo || 0;

    if (availableDays <= 0) {
      const userName = selectedEmployee 
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
        : 'El usuario';
      setError(`${userName} no tiene días de módulo disponibles. Disponibles: ${availableDays}`);
      return false;
    }
    return true;
  };

  const validateSPHours = () => {
    const targetUser = getTargetUser();
    if (!horaIni || !horaFin) {
      setError('Debe especificar hora de inicio y fin para salidas personales.');
      return null;
    }

    const startTime = dayjs(`2000-01-01 ${horaIni}`);
    const endTime = dayjs(`2000-01-01 ${horaFin}`);
    const hoursDifference = endTime.diff(startTime, 'hour', true);

    if (hoursDifference <= 0) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return null;
    }

    const availableHours = targetUser.SP || 0;
    if (hoursDifference > availableHours) {
      const userName = selectedEmployee 
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
        : 'El usuario';
      setError(`${userName} no tiene suficientes horas de salidas personales. Disponibles: ${availableHours}, solicitadas: ${hoursDifference.toFixed(1)}`);
      return null;
    }

    return hoursDifference;
  };

  const validateDates = async () => {
    try {
      const targetUserId = selectedEmployee?.id_empleado || user.id_empleado;
      const startDate = dayjs(fechaIni);
      const endDate = dayjs(fechaFin);
      const currentDate = startDate.clone();

      while (currentDate.isSameOrBefore(endDate)) {
        const brigadeId = await fetchUserBrigadeForDate(currentDate.format('YYYY-MM-DD'), targetUserId);
        
        if (brigadeId) {
          try {
            const guardsResponse = await GuardsApiService.getGuards();
            const hasGuard = guardsResponse.data.some(guard =>
              guard.id_brigada === brigadeId &&
              dayjs(guard.fecha).isSame(currentDate, 'day')
            );

            if (hasGuard) {
              const userName = selectedEmployee 
                ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
                : 'el usuario';
              setError(`${userName} tiene una guardia asignada el ${currentDate.format('DD/MM/YYYY')}. No se puede solicitar vacaciones en esa fecha.`);
              return false;
            }
          } catch (guardError) {
            console.error('Error al validar guardias:', guardError);
          }
        }
        
        currentDate.add(1, 'day');
      }
      return true;
    } catch (error) {
      console.error('Error validando fechas de guardia:', error);
      setError('Error al validar fechas de guardia.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const targetUser = getTargetUser();
    let horas = null;

    // Validaciones según el tipo
    if (tipo === 'asuntos propios' || tipo === 'compensacion grupos especiales') {
      const hasEnoughDays = validateDaysAvailable(tipo);
      if (!hasEnoughDays) {
        setIsLoading(false);
        return;
      }
    }

    if (tipo === 'modulo') {
      const hasEnoughModuloDays = validateModuloDays();
      if (!hasEnoughModuloDays) {
        setIsLoading(false);
        return;
      }
    }

    if (tipo === 'vacaciones') {
      const hasEnoughVacationDays = validateVacationDays();
      if (!hasEnoughVacationDays) {
        setIsLoading(false);
        return;
      }
      const areDatesValid = await validateDates();
      if (!areDatesValid) {
        setIsLoading(false);
        return;
      }
    }

    // Para "salidas personales" y "horas sindicales" se calcula el número de horas
    if (tipo === 'salidas personales' || tipo === 'horas sindicales') {
      horas = validateSPHours();
      if (!horas) {
        setIsLoading(false);
        return;
      }
    }

    const formData = new FormData();
    // CAMBIO PRINCIPAL: Usar el ID del empleado seleccionado o del usuario actual
    const targetId = targetUser?.id_empleado || user?.id_empleado;
    
    if (!targetId) {
      setError('Error: No se pudo identificar el usuario para la solicitud');
      setIsLoading(false);
      return;
    }

    formData.append('id_empleado', targetId);
    formData.append('tipo', tipo);
    formData.append('motivo', motivo);
    formData.append('fecha_ini', fechaIni);
    formData.append(
      'fecha_fin',
      (tipo === 'salidas personales' ||
        tipo === 'horas sindicales' ||
        tipo === 'licencias por jornadas' ||
        tipo === 'modulo' ||
        tipo === 'vestuario')
        ? fechaIni
        : fechaFin
    );
    formData.append(
      'turno',
      (tipo === 'asuntos propios' ||
        tipo === 'licencias por jornadas' ||
        tipo === 'compensacion grupos especiales' ||
        tipo === 'horas sindicales')
        ? turno
        : ''
    );
    formData.append(
      'horas',
      (tipo === 'salidas personales' || tipo === 'horas sindicales') ? horas : ''
    );
    formData.append('estado', 'Pendiente');

    if (file) {
      formData.append('file', file);
    }

    console.log('Enviando FormData al backend:');
    for (let [key, value] of formData.entries()) {
      console.log(key + ':', value);
    }

    try {
      const response = await RequestApiService.createRequest(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const targetName = selectedEmployee 
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellidos}` 
        : 'ti';
      setSuccess(`Solicitud enviada con éxito para ${targetName}.`);

      // Reiniciar todos los campos
      setTipo('vacaciones');
      setMotivo('');
      setFechaIni('');
      setFechaFin('');
      setHoraIni('');
      setHoraFin('');
      setTurno('');
      setFile(null);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      setError('Error al enviar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validación de seguridad: Si no hay usuario, mostrar cargando
  if (!user) {
    return (
      <div className={`max-w-4xl mx-auto p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}>
        <div className="text-center">Cargando usuario...</div>
      </div>
    );
  }

  const targetUser = getTargetUser();

  return (
    <div
      className={`max-w-4xl mx-auto p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <h1 className="text-xl font-bold mb-4">Solicitar Permiso</h1>
      
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-500">{success}</div>}
      
      <div onSubmit={handleSubmit} style={{display: 'contents'}}>
        {/* NUEVO: Selector de empleado - Solo para jefes */}
        {user?.type === 'jefe' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <label className="block text-sm font-medium mb-2">
              Crear solicitud para:
            </label>
            <select
              value={selectedEmployee?.id_empleado || ''}
              onChange={handleEmployeeChange}
              className={`w-full p-2 border rounded ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'
              }`}
              disabled={isLoadingEmployees}
            >
              <option value="">Para mí mismo</option>
              {employees.map(emp => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp?.nombre || ''} {emp?.apellidos || ''} - {emp.id_empleado} ({emp?.type || ''})
                </option>
              ))}
            </select>
            {isLoadingEmployees && (
              <p className="text-sm text-gray-500 mt-1">Cargando empleados...</p>
            )}
          </div>
        )}

        {/* NUEVO: Información del usuario objetivo */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-medium text-sm mb-2">
            Solicitud para: {selectedEmployee 
              ? `${selectedEmployee?.nombre || ''} ${selectedEmployee?.apellidos || ''}` 
              : `${user?.nombre || ''} ${user?.apellidos || ''}`}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <span>Vacaciones: {targetUser?.vacaciones || 0}</span>
            <span>AP: {targetUser?.AP || 0}</span>
            <span>SP: {targetUser?.SP || 0}h</span>
            <span>H. Sindicales: {targetUser?.horas_sindicales || 0}h</span>
            <span>Módulo: {targetUser?.modulo || 0}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="tipo">
            Tipo de Solicitud
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={`w-full p-2 border rounded ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
            }`}
            required
          >
            <option value="vacaciones">Vacaciones</option>
            <option value="asuntos propios">Asuntos Propios</option>
            <option value="salidas personales">Salidas Personales</option>
            <option value="licencias por jornadas">Licencias por Jornadas</option>
            <option value="licencias por dias">Licencias por Días</option>
            <option value="modulo">Módulo</option>
            <option value="compensacion grupos especiales">Compensación Grupos Especiales</option>
            <option value="horas sindicales">Horas Sindicales</option>
            <option value="vestuario">Vestuario</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="fechaIni">
            Fecha de Inicio
          </label>
          <input
            type="date"
            id="fechaIni"
            value={fechaIni}
            onChange={(e) => setFechaIni(e.target.value)}
            className={`w-full p-2 border rounded ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
            }`}
            required
          />
        </div>

        {!['asuntos propios', 'licencias por jornadas', 'horas sindicales', 'vestuario', 'salidas personales', 'modulo'].includes(tipo) && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="fechaFin">
              Fecha de Fin
            </label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full p-2 border rounded ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
              }`}
              required
            />
          </div>
        )}

        {(tipo === 'salidas personales' || tipo === 'horas sindicales') && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="horaIni">
                Hora de Inicio
              </label>
              <input
                type="time"
                id="horaIni"
                value={horaIni}
                onChange={(e) => setHoraIni(e.target.value)}
                className={`w-full p-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                }`}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="horaFin">
                Hora de Fin
              </label>
              <input
                type="time"
                id="horaFin"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className={`w-full p-2 border rounded ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                }`}
                required
              />
            </div>
          </>
        )}

        {['asuntos propios', 'licencias por jornadas', 'compensacion grupos especiales', 'horas sindicales'].includes(tipo) && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="turno">
              Turno
            </label>
            <select
              id="turno"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className={`w-full p-2 border rounded ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
              }`}
              required
            >
              <option value="">Selecciona un turno</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
              <option value="Mañana y tarde">Mañana y Tarde</option>
              <option value="Tarde y noche">Tarde y Noche</option>
              <option value="Día Completo">Día Completo</option>
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="motivo">
            Observaciones
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={`w-full p-2 border rounded ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
            }`}
            rows="4"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="file">
            Adjuntar Archivo (opcional)
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className={`w-full p-3 border rounded ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full p-2 rounded ${
            isLoading ? 'bg-blue-300' : 'bg-blue-500'
          } text-white hover:bg-blue-600`}
          disabled={isLoading}
        >
          {isLoading ? 'Realizando comprobaciones...' : 'Enviar Solicitud'}
        </button>
      </div>
    </div>
  );
};

export default CreateRequestPage;