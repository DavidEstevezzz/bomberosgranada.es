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
  const [file, setFile] = useState(null); // Estado para almacenar el archivo

const handleFileChange = (e) => {
  setFile(e.target.files[0]);
};

  useEffect(() => {
    if (tipo === 'asuntos propios') {
      setFechaFin(fechaIni); // Sincroniza fecha de inicio y fin
    }
  }, [tipo, fechaIni]);

  const fetchUserBrigadeForDate = async (date) => {
    try {
      const assignments = await AssignmentsApiService.getAssignments();
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const userAssignments = assignments.data.filter(
        (assign) =>
          assign.id_empleado === user.id_empleado &&
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

  const validatePersonalLeaveDays = async () => {
    const availableAPDays = user.AP || 0;
    const requestedDays = 1;
    console.log('Días de asuntos propios disponibles:', availableAPDays);

    if (requestedDays > availableAPDays) {
      setError('No te quedan suficientes turnos de asuntos propios.');
      return false;
    }
    return true;
  };

  const validateSPHours = () => {
    const [horaInicio, minutoInicio] = horaIni.split(':').map(Number);
    const [horaFinal, minutoFinal] = horaFin.split(':').map(Number);

    const inicio = dayjs().hour(horaInicio).minute(minutoInicio);
    const fin = dayjs().hour(horaFinal).minute(minutoFinal);

    const diff = fin.diff(inicio, 'hour', true);
    if (diff <= 0) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return null;
    }
    if (user.SP < diff) {
      setError('No quedan suficientes horas de Salidas Personales.');
      return null;
    }
    return diff;
  };

  const validateDates = async () => {
    try {
      const startBrigade = await fetchUserBrigadeForDate(fechaIni);
      const endBrigade = await fetchUserBrigadeForDate(
        dayjs(fechaFin).add(1, 'day').format('YYYY-MM-DD')
      );

      const startDateGuards = await GuardsApiService.getGuardsByDate(fechaIni);
      const endDateGuards = await GuardsApiService.getGuardsByDate(
        dayjs(fechaFin).add(1, 'day').format('YYYY-MM-DD')
      );

      const isStartDateValid = startDateGuards.data.some(
        (guard) => guard.id_brigada === startBrigade
      );
      const isEndDateValid = endDateGuards.data.some(
        (guard) => guard.id_brigada === endBrigade
      );

      if (!isStartDateValid || !isEndDateValid) {
        console.error('Restricciones de fechas no cumplidas');
        setError(
          'No se cumplen las condiciones para solicitar vacaciones en estas fechas.'
        );
        return false;
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
  
    let horas = null;
  
    if (tipo === 'asuntos propios') {
      const hasEnoughAPDays = await validatePersonalLeaveDays();
      if (!hasEnoughAPDays) {
        setIsLoading(false);
        return;
      }
    }
  
    if (tipo === 'vacaciones') {
      const areDatesValid = await validateDates();
      if (!areDatesValid) {
        setIsLoading(false);
        return;
      }
    }
  
    if (tipo === 'salidas personales') {
      horas = validateSPHours();
      if (!horas) {
        setIsLoading(false);
        return;
      }
    }
  
    const formData = new FormData();
    formData.append('id_empleado', user.id_empleado);
    formData.append('tipo', tipo);
    formData.append('motivo', motivo);
    formData.append('fecha_ini', fechaIni);
    formData.append(
      'fecha_fin',
      tipo === 'salidas personales' || tipo === 'licencias por jornadas' ? fechaIni : fechaFin
    );
    formData.append('turno', tipo === 'asuntos propios' || tipo === 'licencias por jornadas' ? turno : '');
    formData.append('horas', tipo === 'salidas personales' ? horas : '');
    formData.append('estado', 'Pendiente');
  
    if (file) {
      formData.append('file', file); // Adjuntar archivo si existe
    }
  
    try {
      const response = await RequestApiService.createRequest(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Solicitud enviada con éxito.');
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      setError('Error al enviar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div
      className={`max-w-4xl mx-auto p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <h1 className="text-xl font-bold mb-4">Solicitar Permiso</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-500">{success}</div>}
      <form onSubmit={handleSubmit}>
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
</select>
        </div>

        <div className="mb-4">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="fechaIni"
          >
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

        {(tipo === 'vacaciones' || tipo === 'licencias por dias') && (
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="fechaFin"
            >
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

        {tipo === 'salidas personales' && (
          <>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                htmlFor="horaIni"
              >
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
              <label
                className="block text-sm font-medium mb-2"
                htmlFor="horaFin"
              >
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

        {(tipo === 'asuntos propios' || tipo === 'licencias por jornadas' )&& (
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
          type="submit"
          className={`w-full p-2 rounded ${
            isLoading ? 'bg-blue-300' : 'bg-blue-500'
          } text-white hover:bg-blue-600`}
          disabled={isLoading}
        >
          {isLoading ? 'Realizando comprobaciones...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  );
};

export default CreateRequestPage;
