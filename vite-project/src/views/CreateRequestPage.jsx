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
      const employee = employees.find(
        (emp) => String(emp.id_empleado) === String(employeeId)
      );
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
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
        : 'el usuario';
      setError(
        `${userName} no tiene suficientes días de vacaciones. Disponibles: ${availableDays}, solicitados: ${requestedDays}`
      );
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
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
        : 'El usuario';
      setError(
        `${userName} no tiene días disponibles de ${type}. Disponibles: ${availableDays}`
      );
      return false;
    }
    return true;
  };

  const validateModuloDays = () => {
    const targetUser = getTargetUser();
    const availableDays = targetUser.modulo || 0;

    if (availableDays <= 0) {
      const userName = selectedEmployee
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
        : 'El usuario';
      setError(
        `${userName} no tiene días de módulo disponibles. Disponibles: ${availableDays}`
      );
      return false;
    }
    return true;
  };

  const validateSPHours = () => {
    const targetUser = getTargetUser();
    if (!horaIni || !horaFin) {
      setError(
        'Debe especificar hora de inicio y fin para salidas personales.'
      );
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
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
        : 'El usuario';
      setError(
        `${userName} no tiene suficientes horas de salidas personales. Disponibles: ${availableHours}, solicitadas: ${hoursDifference.toFixed(
          1
        )}`
      );
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
        const brigadeId = await fetchUserBrigadeForDate(
          currentDate.format('YYYY-MM-DD'),
          targetUserId
        );

        if (brigadeId) {
          try {
            const guardsResponse = await GuardsApiService.getGuards();
            const hasGuard = guardsResponse.data.some(
              (guard) =>
                guard.id_brigada === brigadeId &&
                dayjs(guard.fecha).isSame(currentDate, 'day')
            );

            if (hasGuard) {
              const userName = selectedEmployee
                ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
                : 'el usuario';
              setError(
                `${userName} tiene una guardia asignada el ${currentDate.format(
                  'DD/MM/YYYY'
                )}. No se puede solicitar vacaciones en esa fecha.`
              );
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
      tipo === 'salidas personales' ||
        tipo === 'horas sindicales' ||
        tipo === 'licencias por jornadas' ||
        tipo === 'modulo' ||
        tipo === 'vestuario'
        ? fechaIni
        : fechaFin
    );
    formData.append(
      'turno',
      tipo === 'asuntos propios' ||
        tipo === 'licencias por jornadas' ||
        tipo === 'compensacion grupos especiales' ||
        tipo === 'horas sindicales'
        ? turno
        : ''
    );
    formData.append(
      'horas',
      tipo === 'salidas personales' || tipo === 'horas sindicales' ? horas : ''
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
      await RequestApiService.createRequest(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const targetName = selectedEmployee
        ? `${selectedEmployee.nombre} ${selectedEmployee.apellido}`
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

  const pageWrapperClass = `min-h-[calc(100vh-6rem)] w-full px-4 py-10 transition-colors duration-300 ${
    darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
  }`;
  const cardContainerClass = `mx-auto max-w-5xl overflow-hidden rounded-3xl border shadow-xl backdrop-blur ${
    darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const inputBaseClass = `w-full rounded-2xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const labelBaseClass =
    'block text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200';

  // Validación de seguridad: Si no hay usuario, mostrar cargando
  if (!user) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  const targetUser = getTargetUser();
  const availabilityStats = [
    { label: 'Vacaciones', value: `${targetUser?.vacaciones || 0} días` },
    { label: 'Asuntos propios', value: `${targetUser?.AP || 0} días` },
    { label: 'Salidas personales', value: `${targetUser?.SP || 0} h` },
    { label: 'Horas sindicales', value: `${targetUser?.horas_sindicales || 0} h` },
    { label: 'Módulo', value: `${targetUser?.modulo || 0} días` },
  ];

  return (
    <div className={pageWrapperClass}>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-200 via-primary-300 to-primary-400'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Gestión de permisos
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Crear nueva solicitud</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/90">
            Completa la información necesaria para solicitar un permiso y realiza el seguimiento de la disponibilidad de la persona seleccionada.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                darkMode
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                darkMode
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {user?.type === 'jefe' && (
              <section
                className={`rounded-2xl border px-5 py-6 transition-colors ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900/60'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                      Crear solicitud para
                    </p>
                    <p className={`mt-1 text-xs ${subtleTextClass}`}>
                      Selecciona a la persona a la que deseas gestionar el permiso.
                    </p>
                  </div>
                  {isLoadingEmployees && (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                        darkMode
                          ? 'border-slate-700 bg-slate-900 text-slate-200'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Cargando empleados...
                    </span>
                  )}
                </div>
                <select
                  value={selectedEmployee?.id_empleado ?? ''}
                  onChange={handleEmployeeChange}
                  className={`${inputBaseClass} mt-4`}
                  disabled={isLoadingEmployees}
                >
                  <option value="">
                    Para mí ({`${user?.nombre || ''} ${user?.apellido || ''}`.trim()})
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {`${emp?.nombre || ''} ${emp?.apellido || ''}`.trim()} · DNI {emp?.dni || 'Sin DNI'}
                    </option>
                  ))}
                </select>
              </section>
            )}

            <section
              className={`rounded-2xl border px-5 py-6 transition-colors ${
                darkMode
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                    Solicitud para
                  </p>
                  <p className="text-base font-semibold">
                    {selectedEmployee
                      ? `${selectedEmployee?.nombre || ''} ${selectedEmployee?.apellido || ''}`.trim()
                      : `${user?.nombre || ''} ${user?.apellido || ''}`.trim()}
                  </p>
                </div>
                <div className={`text-xs font-medium ${subtleTextClass}`}>
                  DNI {targetUser?.dni || 'No disponible'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {availabilityStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                      darkMode
                        ? 'border-slate-800 bg-slate-950/40 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <p className={`text-xs font-medium uppercase tracking-wide ${subtleTextClass}`}>
                      {stat.label}
                    </p>
                    <p className="mt-1 text-base font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelBaseClass} htmlFor="tipo">
                    Tipo de solicitud
                  </label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className={inputBaseClass}
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

                <div className="space-y-2">
                  <label className={labelBaseClass} htmlFor="fechaIni">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="fechaIni"
                    value={fechaIni}
                    onChange={(e) => setFechaIni(e.target.value)}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>

              {!['asuntos propios', 'licencias por jornadas', 'horas sindicales', 'vestuario', 'salidas personales', 'modulo'].includes(tipo) && (
                <div className="space-y-2">
                  <label className={labelBaseClass} htmlFor="fechaFin">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    id="fechaFin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className={inputBaseClass}
                    required
                  />
                </div>
              )}

              {(tipo === 'salidas personales' || tipo === 'horas sindicales') && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelBaseClass} htmlFor="horaIni">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      id="horaIni"
                      value={horaIni}
                      onChange={(e) => setHoraIni(e.target.value)}
                      className={inputBaseClass}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelBaseClass} htmlFor="horaFin">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      id="horaFin"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className={inputBaseClass}
                      required
                    />
                  </div>
                </div>
              )}

              {['asuntos propios', 'licencias por jornadas', 'compensacion grupos especiales', 'horas sindicales'].includes(tipo) && (
                <div className="space-y-2">
                  <label className={labelBaseClass} htmlFor="turno">
                    Turno
                  </label>
                  <select
                    id="turno"
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className={inputBaseClass}
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

              <div className="space-y-2">
                <label className={labelBaseClass} htmlFor="motivo">
                  Observaciones
                </label>
                <textarea
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className={`${inputBaseClass} min-h-[140px] resize-none`}
                />
              </div>

              <div className="space-y-2">
                <label className={labelBaseClass} htmlFor="file">
                  Adjuntar archivo (opcional)
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className={`${inputBaseClass} cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-primary-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-primary-600`}
                />
              </div>
            </section>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full rounded-2xl px-5 py-3 text-base font-semibold shadow-lg transition-all duration-300 ${
                  isLoading
                    ? 'cursor-wait bg-primary-300 text-primary-950 dark:bg-primary-700/40 dark:text-primary-100'
                    : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white hover:shadow-xl'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
                disabled={isLoading}
              >
                {isLoading ? 'Realizando comprobaciones...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
