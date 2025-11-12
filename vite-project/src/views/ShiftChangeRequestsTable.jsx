import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faClock,
  faUserCheck,
  faTimesCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FaSortUp, FaSortDown } from 'react-icons/fa';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import EditShiftChangeModal from '../components/EditShiftChangeModal';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');

const statusConfig = {
  en_tramite: {
    label: 'En trámite',
    description: 'Solicitudes pendientes de aprobación final.',
    lightGradient: 'from-amber-400 via-amber-500 to-amber-600',
    darkGradient: 'from-amber-600/90 via-amber-500/80 to-amber-400/70',
    accent: {
      light: 'text-amber-600',
      dark: 'text-amber-300',
    },
    icon: faClock,
  },
  aceptado_por_empleados: {
    label: 'Aceptado por empleados',
    description: 'Cambios validados por los empleados involucrados.',
    lightGradient: 'from-sky-400 via-sky-500 to-sky-600',
    darkGradient: 'from-sky-700/90 via-sky-600/80 to-sky-500/70',
    accent: {
      light: 'text-sky-600',
      dark: 'text-sky-300',
    },
    icon: faUserCheck,
  },
  rechazado: {
    label: 'Rechazado',
    description: 'Solicitudes que no han sido aprobadas.',
    lightGradient: 'from-rose-400 via-rose-500 to-rose-600',
    darkGradient: 'from-rose-700/90 via-rose-600/80 to-rose-500/70',
    accent: {
      light: 'text-rose-600',
      dark: 'text-rose-300',
    },
    icon: faTimesCircle,
  },
  aceptado: {
    label: 'Aceptado',
    description: 'Cambios confirmados y en vigor.',
    lightGradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
    darkGradient: 'from-emerald-700/90 via-emerald-600/80 to-emerald-500/70',
    accent: {
      light: 'text-emerald-600',
      dark: 'text-emerald-300',
    },
    icon: faCheckCircle,
  },
};

const statuses = Object.keys(statusConfig);

const ShiftChangeRequestsTable = () => {
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState({
    en_tramite: 1,
    aceptado_por_empleados: 1,
    rechazado: 1,
    aceptado: 1,
  });
  const [currentMonth, setCurrentMonth] = useState({
    en_tramite: dayjs(),
    aceptado_por_empleados: dayjs(),
    rechazado: dayjs(),
    aceptado: dayjs(),
  });
  const [sortField, setSortField] = useState('fecha');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShiftChangeRequest, setSelectedShiftChangeRequest] = useState(null);

  const itemsPerPage = 10;
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchShiftChangeRequests();
  }, []);

  const fetchShiftChangeRequests = async () => {
    setLoading(true);
    try {
      const response = await ShiftChangeRequestApiService.getRequests();
      if (response.data) {
        setShiftChangeRequests(response.data);
        setError(null);
      } else {
        throw new Error('No shift change requests data returned from the API');
      }
    } catch (fetchError) {
      console.error('Failed to fetch shift change requests:', fetchError);
      setError('No se pudieron cargar las solicitudes de cambio de guardia.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (shiftChangeRequest) => {
    setSelectedShiftChangeRequest(shiftChangeRequest);
    setIsEditModalOpen(true);
  };

  const handleUpdateShiftChangeRequest = async (updatedShiftChangeRequest) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(
        updatedShiftChangeRequest.id,
        updatedShiftChangeRequest
      );
      fetchShiftChangeRequests();
    } catch (updateError) {
      console.error('Failed to update shift change request:', updateError);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortData = (data) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      if (sortField === 'fecha') {
        const dateA = dayjs(a.fecha);
        const dateB = dayjs(b.fecha);

        if (sortDirection === 'asc') {
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
        }

        return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
      }
      return 0;
    });
  };

  const normalizeStatus = (status) => statusConfig[status]?.label ?? status;

  const handlePreviousMonth = (status) => {
    setCurrentMonth((prev) => ({
      ...prev,
      [status]: prev[status].subtract(1, 'month'),
    }));
    setCurrentPage((prev) => ({
      ...prev,
      [status]: 1,
    }));
  };

  const handleNextMonth = (status) => {
    setCurrentMonth((prev) => ({
      ...prev,
      [status]: prev[status].add(1, 'month'),
    }));
    setCurrentPage((prev) => ({
      ...prev,
      [status]: 1,
    }));
  };

  const filterRequestsByMonth = (requests, status) =>
    requests.filter((request) => {
      if (!request.fecha) return false;
      const requestDate = dayjs(request.fecha);
      return requestDate.isSame(currentMonth[status], 'month');
    });

  const paginate = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (status, direction, totalPages) => {
    setCurrentPage((prev) => ({
      ...prev,
      [status]: Math.max(1, Math.min(prev[status] + direction, totalPages)),
    }));
  };

  const formatMonthLabel = (dateInstance) => {
    const formatted = dateInstance.format('MMMM YYYY');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const requestsByStatusForMonth = statuses.reduce((acc, status) => {
    const requestsForStatus = shiftChangeRequests.filter((req) => req.estado === status);
    acc[status] = filterRequestsByMonth(requestsForStatus, status);
    return acc;
  }, {});

  const totalRequests = statuses.reduce(
    (total, status) => total + requestsByStatusForMonth[status].length,
    0
  );

  const summaryData = statuses.map((status) => ({
    key: status,
    label: statusConfig[status].label,
    count: requestsByStatusForMonth[status].length,
  }));

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
  }`;

  const sectionCardClass = `rounded-2xl border px-6 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;

  const summaryCardBaseClass = `rounded-2xl border px-5 py-4 shadow-sm transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
  }`;

  const actionButtonBaseClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
  }`;

  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';

  if (loading) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-lg font-medium">Cargando solicitudes de cambio de guardia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-lg font-semibold text-rose-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-400 via-primary-500 to-primary-600'
          }`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Gestión de cambios de guardia
              </p>
              <h1 className="text-3xl font-semibold">Solicitudes de cambio</h1>
              <p className="max-w-2xl text-base text-white/90">
                Visualiza el estado de cada solicitud de cambio de guardia, navega por los meses y mantén el control con una
                vista actualizada y consistente con el resto de la plataforma.
              </p>
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium uppercase tracking-wide backdrop-blur-sm">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-white/90" />
                <span>Total de solicitudes: {totalRequests}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryData.map(({ key, label, count }) => {
              const theme = statusConfig[key];
              const accentClass = darkMode ? theme.accent.dark : theme.accent.light;
              return (
                <div key={key} className={summaryCardBaseClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}>{label}</p>
                      <p className="mt-2 text-2xl font-semibold">{count}</p>
                    </div>
                    <FontAwesomeIcon icon={theme.icon} className={`text-2xl ${accentClass}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {statuses.map((status) => {
            const filteredRequests = requestsByStatusForMonth[status];
            const sortedRequests = sortData(filteredRequests);
            const totalPages = Math.ceil(sortedRequests.length / itemsPerPage) || 1;
            const currentRequests = paginate(sortedRequests, currentPage[status]);
            const theme = statusConfig[status];
            const gradientClass = darkMode ? theme.darkGradient : theme.lightGradient;
            const accentClass = darkMode ? theme.accent.dark : theme.accent.light;

            return (
              <div key={status} className={sectionCardClass}>
                <div
                  className={`flex flex-col gap-4 rounded-2xl bg-gradient-to-r px-6 py-6 text-white shadow-lg ${gradientClass}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                        <FontAwesomeIcon icon={theme.icon} className="text-2xl text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">{normalizeStatus(status)}</h2>
                        <p className="text-sm text-white/80">{theme.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handlePreviousMonth(status)}
                        className={`${actionButtonBaseClass} ${
                          darkMode
                            ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60 focus:ring-primary-500'
                            : 'bg-white/20 text-white hover:bg-white/30 focus:ring-white/60'
                        }`}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <span>Mes anterior</span>
                      </button>
                      <div className="rounded-2xl bg-white/20 px-5 py-2 text-center text-sm font-semibold uppercase tracking-wide backdrop-blur-sm">
                        {formatMonthLabel(currentMonth[status])}
                      </div>
                      <button
                        onClick={() => handleNextMonth(status)}
                        className={`${actionButtonBaseClass} ${
                          darkMode
                            ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60 focus:ring-primary-500'
                            : 'bg-white/20 text-white hover:bg-white/30 focus:ring-white/60'
                        }`}
                      >
                        <span>Mes siguiente</span>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {sortedRequests.length === 0 ? (
                    <div
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-6 py-6 text-sm font-medium ${
                        darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={theme.icon} className={`text-xl ${accentClass}`} />
                        <span>No hay solicitudes en este estado para el mes seleccionado.</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                        darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y text-sm sm:text-base">
                          <thead className={darkMode ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-100 text-slate-700'}>
                            <tr>
                              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Bombero 1</th>
                              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Bombero 2</th>
                              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2"
                                  onClick={() => handleSort('fecha')}
                                >
                                  <span>Fecha</span>
                                  {sortField === 'fecha' && (
                                    sortDirection === 'asc' ? (
                                      <FaSortUp className={darkMode ? 'text-slate-200' : 'text-slate-600'} />
                                    ) : (
                                      <FaSortDown className={darkMode ? 'text-slate-200' : 'text-slate-600'} />
                                    )
                                  )}
                                </button>
                              </th>
                              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Turno</th>
                              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className={darkMode ? 'divide-y divide-slate-800' : 'divide-y divide-slate-200'}>
                            {currentRequests.map((request) => (
                              <tr
                                key={request.id}
                                className={
                                  darkMode
                                    ? 'hover:bg-slate-900/40 transition-colors'
                                    : 'hover:bg-slate-50 transition-colors'
                                }
                              >
                                <td className="px-6 py-4">
                                  {request.empleado1?.nombre} {request.empleado1?.apellido}
                                </td>
                                <td className="px-6 py-4">
                                  {request.empleado2?.nombre} {request.empleado2?.apellido}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span>{request.fecha}</span>
                                    {request.fecha2 && <span className={`text-xs ${subtleTextClass}`}>{request.fecha2}</span>}
                                  </div>
                                </td>
                                <td className="px-6 py-4">{request.turno}</td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleEditClick(request)}
                                    className={`${actionButtonBaseClass} ${
                                      darkMode
                                        ? 'bg-primary-500/90 text-white hover:bg-primary-400 focus:ring-primary-400'
                                        : 'bg-primary-500 text-white hover:bg-primary-400 focus:ring-primary-300'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Editar</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div
                        className={`flex flex-col gap-4 border-t px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${
                          darkMode ? 'border-slate-800 bg-slate-900/40 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => handlePageChange(status, -1, totalPages)}
                          disabled={currentPage[status] === 1}
                          className={`${actionButtonBaseClass} ${
                            darkMode
                              ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60 disabled:bg-slate-800/50'
                              : 'bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-100'
                          }`}
                        >
                          Anterior
                        </button>
                        <span className="text-center font-medium">
                          {sortedRequests.length === 0 ? '0 de 0' : `Página ${currentPage[status]} de ${totalPages}`}
                        </span>
                        <button
                          onClick={() => handlePageChange(status, 1, totalPages)}
                          disabled={currentPage[status] === totalPages || sortedRequests.length === 0}
                          className={`${actionButtonBaseClass} ${
                            darkMode
                              ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60 disabled:bg-slate-800/50'
                              : 'bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-100'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedShiftChangeRequest && (
        <EditShiftChangeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          shiftChangeRequest={selectedShiftChangeRequest}
          onUpdate={handleUpdateShiftChangeRequest}
        />
      )}
    </>
  );
};

export default ShiftChangeRequestsTable;
