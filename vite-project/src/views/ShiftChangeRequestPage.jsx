import React, { useState, useEffect, useMemo } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const changeTypeOptions = [
  {
    value: 'simple',
    title: 'Cambio simple',
    description:
      'Solicita intercambiar una guardia concreta con otro compañero manteniendo el resto del cuadrante.',
  },
  {
    value: 'espejo',
    title: 'Cambio espejo',
    description:
      'Propone un intercambio doble donde cada uno cubre la guardia del otro en distintas fechas. Las guardias a cambiar deben de ser seguidas no pueden ser de distintas semanas.',
  },
];

const ShiftChangeRequestPage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployeeId2, setSelectedEmployeeId2] = useState('');
  const [fecha, setFecha] = useState('');
  const [fecha2, setFecha2] = useState('');
  const [turno, setTurno] = useState('Dia Completo');
  const [motivo, setMotivo] = useState('');
  const [changeType, setChangeType] = useState('simple');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isJefe = user?.type === 'jefe';

  useEffect(() => {
    const fetchAndFilterEmployees = async () => {
      if (!user?.puesto) return;
      try {
        const response = await UsuariosApiService.bomberosPorPuesto(user.puesto);
        const allEmployees = response.data || [];
        setEmployees(allEmployees);
      } catch (err) {
        console.error('Error fetching employees by puesto:', err);
        setError('Error al obtener los empleados por puesto.');
      }
    };

    fetchAndFilterEmployees();
  }, [user]);

  useEffect(() => {
    if (changeType === 'espejo') {
      setTurno('Dia Completo');
    }
  }, [changeType]);

  // Si no es jefe, establecer automáticamente el primer empleado como el usuario actual
  useEffect(() => {
    if (!isJefe && user?.id_empleado && !selectedEmployeeId) {
      setSelectedEmployeeId(String(user.id_empleado));
    }
  }, [isJefe, user, selectedEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const normalizedTerm = removeDiacritics(searchTerm.toLowerCase());

    return employees.filter((emp) => {
      const fullName = `${emp.nombre ?? ''} ${emp.apellido ?? ''}`.trim().toLowerCase();
      const dni = (emp.dni ?? '').toLowerCase();
      const normalizedName = removeDiacritics(fullName);
      return (
        normalizedName.includes(normalizedTerm) ||
        removeDiacritics(dni).includes(normalizedTerm)
      );
    });
  }, [employees, searchTerm]);

  const filteredEmployees2 = useMemo(() => {
    const normalizedTerm = removeDiacritics(searchTerm2.toLowerCase());

    return employees.filter((emp) => {
      // Excluir el primer empleado seleccionado
      if (String(emp.id_empleado) === String(selectedEmployeeId)) {
        return false;
      }
      
      const fullName = `${emp.nombre ?? ''} ${emp.apellido ?? ''}`.trim().toLowerCase();
      const dni = (emp.dni ?? '').toLowerCase();
      const normalizedName = removeDiacritics(fullName);
      return (
        normalizedName.includes(normalizedTerm) ||
        removeDiacritics(dni).includes(normalizedTerm)
      );
    });
  }, [employees, searchTerm2, selectedEmployeeId]);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (emp) => String(emp.id_empleado) === String(selectedEmployeeId)
      ) || null,
    [employees, selectedEmployeeId]
  );

  const selectedEmployee2 = useMemo(
    () =>
      employees.find(
        (emp) => String(emp.id_empleado) === String(selectedEmployeeId2)
      ) || null,
    [employees, selectedEmployeeId2]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedEmployeeId) {
      setError(isJefe ? 'Selecciona el primer bombero para completar la solicitud.' : 'Selecciona un compañero para completar la solicitud.');
      return;
    }

    if (!selectedEmployeeId2) {
      setError(isJefe ? 'Selecciona el segundo bombero para completar la solicitud.' : 'Selecciona un compañero para completar la solicitud.');
      return;
    }

    if (selectedEmployeeId === selectedEmployeeId2) {
      setError('Los dos bomberos seleccionados deben ser diferentes.');
      return;
    }

    try {
      const requestData = {
        id_empleado1: selectedEmployeeId,
        id_empleado2: selectedEmployeeId2,
        fecha,
        fecha2: changeType === 'espejo' ? fecha2 : null,
        turno: changeType === 'espejo' ? 'Dia Completo' : turno,
        motivo: isJefe ? `[Solicitado por jefe] ${motivo}` : motivo,
        estado: 'en_tramite',
      };

      await ShiftChangeRequestApiService.createRequest(requestData);

      setSuccess('Solicitud de cambio de guardia enviada con éxito.');
      setSearchTerm('');
      setSearchTerm2('');
      if (isJefe) {
        setSelectedEmployeeId('');
      }
      setSelectedEmployeeId2('');
      setFecha('');
      setFecha2('');
      setTurno('Dia Completo');
      setMotivo('');
      setChangeType('simple');
    } catch (err) {
      console.error('Error al enviar la solicitud de cambio de guardia:', err);
      setError('Error al enviar la solicitud de cambio de guardia.');
    }
  };

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
  darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
}`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const inputBaseClass = `w-full rounded-2xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const dateInputClass = `${inputBaseClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;
  const sectionBaseClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;

  if (!user) {
    return (
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">Cargando usuario...</p>
        </div>
    );
  }

  return (
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-400 via-primary-500 to-primary-600'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Gestión de guardias {isJefe && '· Modo Jefe'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Solicitar cambio de guardia</h1>
          {isJefe && (
            <p className="mt-2 text-sm text-white/90">
              Como jefe, puedes solicitar cambios de guardia entre dos bomberos
            </p>
          )}
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
            <section className={sectionBaseClass}>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                Tipo de cambio
              </p>
              <p className={`mt-1 text-xs ${subtleTextClass}`}>
                Elige el tipo de intercambio según el acuerdo al que hayas llegado con tu compañero.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {changeTypeOptions.map((option) => {
                  const isActive = changeType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChangeType(option.value)}
                      className={`flex h-full flex-col items-start rounded-2xl border px-4 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                        isActive
                          ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:border-primary-300 dark:bg-primary-500/20 dark:text-primary-100'
                          : darkMode
                          ? 'border-slate-700 bg-slate-900/50 text-slate-100 hover:border-primary-400/60 hover:text-primary-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-primary-400/60 hover:text-primary-600'
                      }`}
                    >
                      <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                        {option.title}
                      </span>
                      <span className={`mt-2 text-xs leading-relaxed ${subtleTextClass}`}>
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={sectionBaseClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                    {isJefe ? 'Seleccionar bomberos para el cambio' : 'Buscar y seleccionar compañero'}
                  </p>
                  <p className={`mt-1 text-xs ${subtleTextClass}`}>
                    {isJefe 
                      ? 'Selecciona los dos bomberos que realizarán el intercambio de guardias.'
                      : 'Escribe su nombre o NF para localizarlo rápidamente y confirmar con quién realizas el cambio.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  {isJefe && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="search">
                          Buscar primer bombero
                        </label>
                        <input
                          id="search"
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={inputBaseClass}
                          placeholder="Escribe un nombre o NF"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="employee">
                          Primer bombero
                        </label>
                        <select
                          id="employee"
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className={inputBaseClass}
                          required
                        >
                          <option value="">Selecciona un bombero</option>
                          {filteredEmployees.map((employee) => (
                            <option key={employee.id_empleado} value={employee.id_empleado}>
                              {`${employee.nombre ?? ''} ${employee.apellido ?? ''}`.trim()} · DNI {employee.dni || 'Sin DNI'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="search2">
                      {isJefe ? 'Buscar segundo bombero' : 'Buscar bombero'}
                    </label>
                    <input
                      id="search2"
                      type="text"
                      value={searchTerm2}
                      onChange={(e) => setSearchTerm2(e.target.value)}
                      className={inputBaseClass}
                      placeholder="Escribe un nombre o NF"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="employee2">
                      {isJefe ? 'Segundo bombero' : 'Selecciona un compañero'}
                    </label>
                    <select
                      id="employee2"
                      value={selectedEmployeeId2}
                      onChange={(e) => setSelectedEmployeeId2(e.target.value)}
                      className={inputBaseClass}
                      required
                    >
                      <option value="">Selecciona un bombero</option>
                      {filteredEmployees2.map((employee) => (
                        <option key={employee.id_empleado} value={employee.id_empleado}>
                          {`${employee.nombre ?? ''} ${employee.apellido ?? ''}`.trim()} · DNI {employee.dni || 'Sin DNI'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  className={`flex h-full flex-col justify-between rounded-2xl border px-4 py-4 text-sm font-semibold ${
                    darkMode
                      ? 'border-slate-800 bg-slate-950/40 text-slate-100'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-[0.25em] ${subtleTextClass}`}>
                      {isJefe ? 'Primer bombero' : 'Tu guardia'}
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {selectedEmployee
                        ? `${selectedEmployee.nombre || ''} ${selectedEmployee.apellido || ''}`.trim()
                        : isJefe 
                          ? 'Pendiente de selección'
                          : `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Tu usuario'}
                    </p>
                    {selectedEmployee && (
                      <p className={`text-xs font-medium ${subtleTextClass}`}>
                        DNI {selectedEmployee?.dni || '—'}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 border-t border-dashed border-slate-400/50 pt-4">
                    <p className={`text-xs font-medium uppercase tracking-[0.25em] ${subtleTextClass}`}>
                      {isJefe ? 'Segundo bombero' : 'Compañero seleccionado'}
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {selectedEmployee2
                        ? `${selectedEmployee2.nombre || ''} ${selectedEmployee2.apellido || ''}`.trim()
                        : 'Pendiente de selección'}
                    </p>
                    <p className={`text-xs font-medium ${subtleTextClass}`}>
                      DNI {selectedEmployee2?.dni || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={sectionBaseClass}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="fecha">
                    {isJefe ? 'Fecha de guardia del primer bombero' : 'Fecha de tu guardia'}
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={dateInputClass}
                    required
                  />
                </div>
                {changeType === 'espejo' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="fecha2">
                      {isJefe ? 'Fecha de guardia del segundo bombero' : 'Fecha de la guardia del compañero'}
                    </label>
                    <input
                      type="date"
                      id="fecha2"
                      value={fecha2}
                      onChange={(e) => setFecha2(e.target.value)}
                      className={dateInputClass}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="turno">
                      Turno a cubrir
                    </label>
                    <select
                      id="turno"
                      value={turno}
                      onChange={(e) => setTurno(e.target.value)}
                      className={inputBaseClass}
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
                )}
              </div>

              <div className="mt-6 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200" htmlFor="motivo">
                  Observaciones
                </label>
                <textarea
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className={`${inputBaseClass} min-h-[140px] resize-none`}
                  placeholder="Añade detalles relevantes para agilizar la gestión del cambio"
                />
              </div>
            </section>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-5 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Enviar solicitud
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default ShiftChangeRequestPage;