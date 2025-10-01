import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import RequestApiService from '../services/RequestApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');

const RequestAndShiftChangePage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [simpleShiftChanges, setSimpleShiftChanges] = useState([]);
  const [mirrorShiftChanges, setMirrorShiftChanges] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeState = (state) => {
    const stateMap = {
      en_tramite: 'En trámite',
      rechazado: 'Rechazado',
      aceptado_por_empleados: 'Aceptado por empleados',
      aceptado: 'Aceptado',
      Cancelada: 'Cancelada',
      Denegada: 'Denegada',
      Confirmada: 'Confirmada',
      Pendiente: 'Pendiente',
    };
    return stateMap[state] || state;
  };

  const getStatusBadgeClass = (status) => {
    const normalized = normalizeState(status);
    const baseClass =
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide';

    const variants = {
      'En trámite':
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-400/40',
      Rechazado:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-400/40',
      'Aceptado por empleados':
        'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200 border border-sky-400/40',
      Aceptado:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-400/40',
      Cancelada:
        'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200 border border-slate-400/40',
      Denegada:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-400/40',
      Confirmada:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-400/40',
      Pendiente:
        'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100 border border-primary-400/40',
    };

    return `${baseClass} ${variants[normalized] || 'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-200 border border-slate-400/40'}`;
  };

  const renderRequestActions = (request) => {
    if (request.estado !== 'Pendiente') {
      return null;
    }
    return (
      <button
        onClick={() => handleRequestStatusChange(request.id, 'Cancelada')}
        className="rounded-xl border border-rose-400/50 bg-rose-500/90 px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
      >
        Cancelar
      </button>
    );
  };

  useEffect(() => {
    if (!user || !user.id_empleado) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [requestsResponse, shiftChangeResponse] = await Promise.all([
          RequestApiService.getRequests(),
          ShiftChangeRequestApiService.getRequests(),
        ]);

        const filteredRequests = requestsResponse.data.filter(
          (req) =>
            req.id_empleado === user.id_empleado &&
            dayjs(req.fecha_ini).isSame(currentMonth, 'month')
        );

        const filteredShiftChanges = shiftChangeResponse.data.filter((req) => {
          if (!req.fecha) return false;
          const sameMonth = dayjs(req.fecha).isSame(currentMonth, 'month');
          const involvesUser =
            req.id_empleado1 === user.id_empleado || req.id_empleado2 === user.id_empleado;
          return sameMonth && involvesUser;
        });

        const simpleChanges = filteredShiftChanges.filter((req) => !req.fecha2);
        const mirrorChanges = filteredShiftChanges.filter((req) => req.fecha2);

        setRequests(filteredRequests);
        setSimpleShiftChanges(simpleChanges);
        setMirrorShiftChanges(mirrorChanges);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  const handleRequestStatusChange = async (id, newStatus) => {
    try {
      await RequestApiService.updateRequest(id, { estado: newStatus });
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
    } catch (error) {
      console.error('Error al actualizar el estado de la solicitud:', error);
    }
  };

  const handleShiftChangeStatusChange = async (id, newStatus) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(id, { estado: newStatus });

      setSimpleShiftChanges((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
      setMirrorShiftChanges((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
    } catch (error) {
      console.error('Error al actualizar el estado del cambio de guardia:', error);
    }
  };

  const renderShiftChangeActions = (request) => {
    if (request.estado === 'rechazado') return null;

    if (request.id_empleado1 === user.id_empleado) {
      return (
        <button
          onClick={() => handleShiftChangeStatusChange(request.id, 'rechazado')}
          className="rounded-xl border border-rose-400/50 bg-rose-500/90 px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
        >
          Rechazar
        </button>
      );
    }

    if (request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShiftChangeStatusChange(request.id, 'aceptado_por_empleados')}
            className="rounded-xl border border-emerald-400/60 bg-emerald-500/90 px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            Aceptar
          </button>
          <button
            onClick={() => handleShiftChangeStatusChange(request.id, 'rechazado')}
            className="rounded-xl border border-rose-400/50 bg-rose-500/90 px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            Rechazar
          </button>
        </div>
      );
    }

    return null;
  };

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
  darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
}`;
  const contentSectionClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const tableWrapperClass = `overflow-x-auto rounded-2xl border transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white/90'
  }`;
  const tableHeaderClass = darkMode
    ? 'bg-slate-900/80 text-slate-100'
    : 'bg-slate-100 text-slate-600';
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const navigationButtonClass = `rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  }`;

  if (loading) {
    return (
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">Cargando datos...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium text-rose-500">Error: {error}</p>
        </div>
    );
  }

  const stats = [
    {
      label: 'Solicitudes de permiso',
      value: requests.length,
    },
    {
      label: 'Cambios simples',
      value: simpleShiftChanges.length,
    },
    {
      label: 'Cambios espejo',
      value: mirrorShiftChanges.length,
    },
  ];

  return (
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80 text-white'
              : 'from-primary-200 via-primary-300 to-primary-400 text-slate-900'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${
            darkMode ? 'text-white/80' : 'text-slate-800/90'
          }`}>
            Seguimiento mensual
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                Solicitudes y Cambios de Guardia
              </h1>
              <p className={`mt-2 text-sm ${
                darkMode ? 'text-white/80' : 'text-slate-700/90'
              }`}>
                Consulta y gestiona tus solicitudes y cambios de guardia en el mes de{' '}
                {currentMonth.format('MMMM YYYY')}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handlePreviousMonth} className={navigationButtonClass}>
                Mes anterior
              </button>
              <button onClick={handleNextMonth} className={navigationButtonClass}>
                Mes siguiente
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className={contentSectionClass}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
              Resumen
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-4 transition-colors ${
                    darkMode
                      ? 'border-slate-800 bg-slate-950/40'
                      : 'border-slate-200 bg-white/80'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${subtleTextClass}`}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className={contentSectionClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Solicitudes de permiso</h2>
                  <p className={`mt-1 text-xs ${subtleTextClass}`}>
                    Historial de permisos registrados en el mes seleccionado.
                  </p>
                </div>
              </div>

              {requests.length > 0 ? (
                <div className="mt-6">
                  <div className={tableWrapperClass}>
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha inicio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha fin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Turno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          darkMode ? 'divide-slate-800 bg-slate-950/40' : 'divide-slate-100 bg-white/70'
                        }`}
                      >
                        {requests.map((request) => (
                          <tr key={request.id} className="transition-colors hover:bg-primary-100/20 dark:hover:bg-primary-500/10">
                            <td className="px-6 py-4 text-sm font-medium">{request.tipo}</td>
                            <td className="px-6 py-4 text-sm">{request.fecha_ini}</td>
                            <td className="px-6 py-4 text-sm">{request.fecha_fin}</td>
                            <td className="px-6 py-4 text-sm">{request.turno || '—'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={getStatusBadgeClass(request.estado)}>
                                {normalizeState(request.estado)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{renderRequestActions(request)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>No hay solicitudes este mes.</p>
              )}
            </section>

            <section className={contentSectionClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Cambios de guardia simples</h2>
                  <p className={`mt-1 text-xs ${subtleTextClass}`}>
                    Cambios de guardia que implican una única fecha de intercambio.
                  </p>
                </div>
              </div>

              {simpleShiftChanges.length > 0 ? (
                <div className="mt-6">
                  <div className={tableWrapperClass}>
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Bombero 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Bombero 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Turno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          darkMode ? 'divide-slate-800 bg-slate-950/40' : 'divide-slate-100 bg-white/70'
                        }`}
                      >
                        {simpleShiftChanges.map((request) => (
                          <tr key={request.id} className="transition-colors hover:bg-primary-100/20 dark:hover:bg-primary-500/10">
                            <td className="px-6 py-4 text-sm font-medium">
                              {request.empleado1?.nombre} {request.empleado1?.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {request.empleado2?.nombre} {request.empleado2?.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm">{request.fecha}</td>
                            <td className="px-6 py-4 text-sm">{request.turno}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={getStatusBadgeClass(request.estado)}>
                                {normalizeState(request.estado)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{renderShiftChangeActions(request)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>No hay cambios de guardia simples este mes.</p>
              )}
            </section>

            <section className={contentSectionClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Cambios de guardia espejo</h2>
                  <p className={`mt-1 text-xs ${subtleTextClass}`}>
                    Cambios que implican intercambiar guardias entre dos fechas distintas.
                  </p>
                </div>
              </div>

              {mirrorShiftChanges.length > 0 ? (
                <div className="mt-6">
                  <div className={tableWrapperClass}>
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Bombero 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Bombero 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Turno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          darkMode ? 'divide-slate-800 bg-slate-950/40' : 'divide-slate-100 bg-white/70'
                        }`}
                      >
                        {mirrorShiftChanges.map((request) => (
                          <tr key={request.id} className="transition-colors hover:bg-primary-100/20 dark:hover:bg-primary-500/10">
                            <td className="px-6 py-4 text-sm font-medium">
                              {request.empleado1?.nombre} {request.empleado1?.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {request.empleado2?.nombre} {request.empleado2?.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm">{request.fecha}</td>
                            <td className="px-6 py-4 text-sm">{request.fecha2}</td>
                            <td className="px-6 py-4 text-sm">{request.turno}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={getStatusBadgeClass(request.estado)}>
                                {normalizeState(request.estado)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{renderShiftChangeActions(request)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>No hay cambios de guardia espejo este mes.</p>
              )}
            </section>
          </div>
        </div>
      </div>
  );
};

export default RequestAndShiftChangePage;