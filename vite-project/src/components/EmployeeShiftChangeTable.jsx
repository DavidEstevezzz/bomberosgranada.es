import React, { useState, useEffect } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const formatEstado = (estado) => {
  switch (estado) {
    case 'en_tramite':
      return 'En Trámite';
    case 'aceptado_por_empleados':
      return 'Aceptado por Empleados';
    case 'aceptado':
      return 'Aceptado';
    case 'rechazado':
      return 'Rechazado';
    default:
      return estado;
  }
};

const EmployeeShiftChangeTable = ({ user }) => {
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchShiftChangeRequests();
  }, [user]);

  useEffect(() => {
    filterRequestsByMonth();
  }, [shiftChangeRequests, selectedMonth]);

  const fetchShiftChangeRequests = async () => {
    setLoading(true);
    try {
      const response = await ShiftChangeRequestApiService.getRequests();
      if (response.data) {
        const userRequests = response.data.filter(
          (request) => request.id_empleado1 === user.id_empleado || request.id_empleado2 === user.id_empleado
        );
        setShiftChangeRequests(userRequests);
        setError(null);
      } else {
        throw new Error('No shift change requests data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch shift change requests:', error);
      setError('Failed to load shift change requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequestsByMonth = () => {
    const filtered = shiftChangeRequests.filter((request) =>
      dayjs(request.fecha).isSame(selectedMonth, 'month')
    );
    setFilteredRequests(filtered);
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(requestId, { estado: newStatus });
      fetchShiftChangeRequests(); // Refresh the table after updating
    } catch (error) {
      console.error('Failed to update shift change request:', error);
    }
  };

  const handlePreviousMonth = () => {
    const newMonth = dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM');
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = dayjs(selectedMonth).add(1, 'month').format('YYYY-MM');
    setSelectedMonth(newMonth);
  };

  const showActionsColumn = filteredRequests.some(
    (request) => request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite'
  );

  dayjs.locale('es');

  const cardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white/80 text-slate-900'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const pillButtonClass = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
    darkMode
      ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-primary-400 hover:text-primary-200'
      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600'
  }`;
  const tableWrapperClass = `overflow-hidden rounded-2xl border transition-colors ${
    darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-white'
  }`;
  const tableHeadClass = darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-600';
  const tableBodyClass = darkMode
    ? 'divide-y divide-slate-800/60 text-slate-100'
    : 'divide-y divide-slate-200 text-slate-700';
  const tableRowHoverClass = `transition-colors ${
    darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/80'
  }`;
  const acceptButtonClass = `inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
    darkMode ? 'bg-emerald-500/90 text-slate-950 hover:bg-emerald-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'
  }`;
  const rejectButtonClass = `inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${
    darkMode ? 'bg-red-500/90 text-slate-950 hover:bg-red-400' : 'bg-red-500 text-white hover:bg-red-600'
  }`;

  const monthLabel = dayjs(selectedMonth).format('MMMM YYYY');
  const formattedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const pendingReviewCount = filteredRequests.filter(
    (request) => request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite'
  ).length;
  const acceptedCount = filteredRequests.filter((request) =>
    ['aceptado_por_empleados', 'aceptado'].includes(request.estado)
  ).length;

  const summaryStats = [
    { label: 'Solicitudes del mes', value: filteredRequests.length },
    { label: 'Pendientes por revisar', value: pendingReviewCount },
    { label: 'Aceptadas', value: acceptedCount },
  ];

  if (loading) {
    return (
      <section className={cardClass}>
        <p className={`text-sm font-medium ${subtleTextClass}`}>Cargando cambios de guardia...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cardClass}>
        <p className="text-sm font-semibold text-red-500">{error}</p>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
            Cambios de guardia
          </p>
          <h3 className="mt-2 text-xl font-semibold">Historial y acciones pendientes</h3>
          <p className={`mt-1 text-xs ${subtleTextClass}`}>
            Visualiza las solicitudes de intercambio confirmadas y gestiona aquellas que requieren tu revisión.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
              darkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {formattedMonthLabel}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={handlePreviousMonth} className={pillButtonClass}>
              Mes anterior
            </button>
            <button type="button" onClick={handleNextMonth} className={pillButtonClass}>
              Mes siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 transition-colors ${
              darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
              {stat.label}
            </p>
            <p className="mt-2 text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {filteredRequests.length > 0 ? (
          <div className={tableWrapperClass}>
            <table className="w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-3 text-left">Bombero 1</th>
                  <th className="px-4 py-3 text-left">Bombero 2</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Turno</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  {showActionsColumn && <th className="px-4 py-3 text-left">Acciones</th>}
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className={tableRowHoverClass}>
                    <td className="px-4 py-3">
                      {request.empleado1?.nombre} {request.empleado1?.apellido}
                    </td>
                    <td className="px-4 py-3">
                      {request.empleado2?.nombre} {request.empleado2?.apellido}
                    </td>
                    <td className="px-4 py-3">{dayjs(request.fecha).format('DD MMM YYYY')}</td>
                    <td className="px-4 py-3">{request.turno}</td>
                    <td className="px-4 py-3">{formatEstado(request.estado)}</td>
                    {showActionsColumn && (
                      <td className="px-4 py-3">
                        {request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite' ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(request.id, 'aceptado_por_empleados')}
                              className={acceptButtonClass}
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(request.id, 'rechazado')}
                              className={rejectButtonClass}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className={`text-xs font-medium ${subtleTextClass}`}>
                            Sin acciones pendientes
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed px-4 py-5 text-sm ${
              darkMode
                ? 'border-slate-700/70 bg-slate-900/40 text-slate-300'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            No se han registrado solicitudes de cambio de guardia en este mes.
          </div>
        )}
      </div>
    </section>
  );
};

export default EmployeeShiftChangeTable;
