import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaSortUp, FaSortDown } from 'react-icons/fa';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import RequestApiService from '../services/RequestApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

dayjs.locale('es');

const RequestListPage = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [pagination, setPagination] = useState({
    Pendiente: 1,
    Confirmada: 1,
    Cancelada: 1,
    Denegada: 1,
  });
  // Añadir estados para el ordenamiento
  const [sortField, setSortField] = useState('fecha_ini');
  const [sortDirection, setSortDirection] = useState('asc');

  const itemsPerPage = 10;
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const getAPDaysRemaining = (userId) => {
    const user = users.find((user) => user.id_empleado === userId);
    return user ? user.AP : 0;
  };

  const getCompensacionDaysRemaining = (userId) => {
    const user = users.find((user) => user.id_empleado === userId);
    return user ? user.compensacion_grupos : 0;
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await RequestApiService.getRequests();
      if (response.data) {
        setRequests(response.data);
        setError(null);
      } else {
        throw new Error('No requests data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await UsuariosApiService.getUsuarios();
      if (response.data) {
        setUsers(response.data);
      } else {
        throw new Error('No users data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const findUserById = (id_empleado) => {
    const user = users.find((user) => user.id_empleado === id_empleado);
    return user ? `${user.nombre} ${user.apellido}` : 'N/A';
  };

  const handleUpdateRequestStatus = async (id, newStatus, tipo, idEmpleado, turno = 'Mañana') => {
    try {
      const request = requests.find((req) => req.id === id);
      const currentStatus = request?.estado;

      // Validación inicial para tipos específicos
      if (tipo === 'asuntos propios') {
        let jornadasSolicitadas = calcularJornadasPorTurno(turno);
        const remainingAPDays = getAPDaysRemaining(idEmpleado);

        if (newStatus === 'Confirmada' && currentStatus !== 'Confirmada') {
          if (jornadasSolicitadas > remainingAPDays) {
            alert('No te quedan suficientes jornadas de asuntos propios (AP) para aceptar esta solicitud.');
            return;
          }
        }
      } else if (tipo === 'compensacion grupos especiales') {
        let jornadasSolicitadas = calcularJornadasPorTurno(turno);
        const remainingCompensacionDays = getCompensacionDaysRemaining(idEmpleado);

        if (newStatus === 'Confirmada' && currentStatus !== 'Confirmada') {
          if (jornadasSolicitadas > remainingCompensacionDays) {
            alert('No te quedan suficientes jornadas de compensación de grupos especiales para aceptar esta solicitud.');
            return;
          }
        }
      }

      const payload = { estado: newStatus };
      if (tipo === 'asuntos propios' || tipo === 'compensacion grupos especiales') {
        payload.turno = turno;
      }

      // Enviar al backend para procesar - el backend manejará todo lo demás
      await RequestApiService.updateRequest(id, payload);

      // Actualizar la lista de solicitudes después de la actualización
      fetchRequests();
      // Actualizar la lista de usuarios para reflejar los cambios en días disponibles
      fetchUsers();
    } catch (error) {
      console.error('Error al actualizar el estado de la solicitud:', error);
    }
  };

  const calcularJornadasPorTurno = (turno) => {
    if (turno === 'Día Completo') {
      return 3;
    } else if (turno === 'Mañana y tarde' || turno === 'Tarde y noche') {
      return 2;
    } else {
      return 1;
    }
  };

  // Función para manejar el ordenamiento
  const handleSort = (field) => {
    if (field === sortField) {
      // Si es el mismo campo, cambiamos la dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un campo diferente, establecemos el nuevo campo y dirección ascendente por defecto
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para ordenar los datos
  const sortData = (data) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      if (sortField === 'fecha_ini') {
        const dateA = dayjs(a.fecha_ini);
        const dateB = dayjs(b.fecha_ini);

        if (sortDirection === 'asc') {
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
        } else {
          return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
        }
      }
      return 0;
    });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  const filterRequestsByMonth = () => {
    const baseFilter = requests.filter((request) =>
      dayjs(request.fecha_ini).isSame(currentMonth, 'month')
    );

    // Si no es jefe, filtrar solo solicitudes pendientes del día actual
    if (user?.type !== 'jefe') {
      const today = dayjs().format('YYYY-MM-DD');
      return baseFilter.filter((request) =>
        request.estado === 'Pendiente' &&
        dayjs(request.fecha_ini).format('YYYY-MM-DD') === today
      );
    }

    return baseFilter;
  };

  const canActOnRequest = (request) => {
    // Los jefes pueden actuar sobre cualquier solicitud
    if (user?.type === 'jefe') {
      return true;
    }

    // Los mandos solo pueden actuar sobre solicitudes del día actual
    const today = dayjs().format('YYYY-MM-DD');
    return dayjs(request.fecha_ini).format('YYYY-MM-DD') === today;
  };

  const statusesToShow = user?.type === 'jefe'
    ? ['Pendiente', 'Confirmada', 'Cancelada', 'Denegada']
    : ['Pendiente'];

  const paginate = (data, status, pageOverride) => {
    const currentPage = pageOverride ?? pagination[status];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage);

  const updatePage = (status, newPage) => {
    setPagination((prev) => ({
      ...prev,
      [status]: newPage,
    }));
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
  const actionButtonBase =
    'rounded-xl border px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:shadow-md';

  const getStatusBadgeClass = (status) => {
    const baseClass =
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide border';
    const variants = {
      Pendiente:
        'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100 border-primary-400/40',
      Confirmada:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-400/40',
      Cancelada:
        'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200 border-slate-400/40',
      Denegada:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 border-rose-400/40',
    };

    return `${baseClass} ${
      variants[status] ||
      'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-200 border-slate-400/40'
    }`;
  };

  const statusDescriptions = {
    Pendiente: 'Solicitudes que están a la espera de una revisión por parte del mando o jefe.',
    Confirmada: 'Permisos aprobados y asignados en el calendario oficial.',
    Cancelada: 'Solicitudes canceladas por los empleados o administradores.',
    Denegada: 'Peticiones rechazadas por no cumplir con los criterios establecidos.',
  };

  if (loading) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-sm font-medium">Cargando solicitudes...</p>
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

  const filteredRequests = filterRequestsByMonth();
  const currentMonthLabel = currentMonth.format('MMMM YYYY');

  const stats = statusesToShow.map((status) => ({
    status,
    label: status,
    value: filteredRequests.filter((request) => request.estado === status).length,
  }));

  return (
    <div className={cardContainerClass}>
      <div
        className={`bg-gradient-to-r px-8 py-10 transition-colors duration-300 ${
          darkMode
            ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80 text-white'
            : 'from-primary-200 via-primary-300 to-primary-400 text-slate-900'
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.3em] ${
            darkMode ? 'text-white/80' : 'text-slate-800/90'
          }`}
        >
          Seguimiento mensual
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Gestión de solicitudes</h1>
            <p
              className={`mt-2 text-sm ${
                darkMode ? 'text-white/80' : 'text-slate-700/90'
              }`}
            >
              Controla las solicitudes de permisos correspondientes a {currentMonthLabel}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePreviousMonth} className={navigationButtonClass}>
              Mes anterior
            </button>
            <div
              className={`rounded-2xl border px-4 py-2 text-center text-sm font-semibold ${
                darkMode
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/70 bg-white/80 text-slate-900'
              }`}
            >
              {currentMonthLabel}
            </div>
            <button onClick={handleNextMonth} className={navigationButtonClass}>
              Mes siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-10">
        

        {statusesToShow.map((status) => {
          const filteredByStatus = filteredRequests.filter((request) => request.estado === status);
          const sortedRequests = sortData(filteredByStatus);
          const totalPages = Math.max(getTotalPages(filteredByStatus), 1);
          const currentPage = Math.min(pagination[status], totalPages);
          const paginatedRequests = paginate(sortedRequests, status, currentPage);

          return (
            <section key={status} className={contentSectionClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
                    Estado
                  </p>
                  <h2 className="text-xl font-semibold">{status}</h2>
                  <p className={`mt-1 text-xs ${subtleTextClass}`}>
                    {statusDescriptions[status] || 'Detalle de solicitudes registradas.'}
                  </p>
                </div>
              </div>

              {paginatedRequests.length > 0 ? (
                <div className="mt-6 space-y-4">
                  <div className={tableWrapperClass}>
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Empleado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">Motivo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            <button
                              type="button"
                              onClick={() => handleSort('fecha_ini')}
                              className="flex items-center gap-2"
                            >
                              Fecha inicio
                              {sortField === 'fecha_ini' && (
                                <span>
                                  {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Fecha fin
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Turno
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Creación
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Archivo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          darkMode ? 'divide-slate-800 bg-slate-950/40' : 'divide-slate-100 bg-white/70'
                        }`}
                      >
                        {paginatedRequests.map((request) => (
                          <tr
                            key={request.id}
                            className="transition-colors hover:bg-primary-100/20 dark:hover:bg-primary-500/10"
                          >
                            <td className="px-4 py-4 text-sm font-medium">
                              {findUserById(request.id_empleado)}
                            </td>
                            <td className="px-4 py-4 text-sm capitalize">{request.tipo}</td>
                            <td className="px-4 py-4 text-sm">{request.motivo || '—'}</td>
                            <td className="px-4 py-4 text-sm">{request.fecha_ini}</td>
                            <td className="px-4 py-4 text-sm">{request.fecha_fin}</td>
                            <td className="px-4 py-4 text-sm">{request.turno || '—'}</td>
                            <td className="px-4 py-4 text-sm">{request.creacion}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className={getStatusBadgeClass(request.estado)}>{request.estado}</span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {request.file ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await RequestApiService.downloadFile(request.id);
                                      const url = window.URL.createObjectURL(new Blob([response.data]));
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.setAttribute('download', `Solicitud_${request.id}.pdf`);
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                    } catch (error) {
                                      console.error('Error descargando el archivo:', error);
                                    }
                                  }}
                                  className="text-rose-500 transition hover:text-rose-600"
                                  title="Descargar archivo PDF"
                                >
                                  <FaFilePdf size={20} />
                                </button>
                              ) : (
                                <span className={subtleTextClass}>—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {canActOnRequest(request) ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateRequestStatus(
                                        request.id,
                                        'Confirmada',
                                        request.tipo,
                                        request.id_empleado,
                                        request.turno
                                      )
                                    }
                                    className={`${actionButtonBase} border-emerald-400/60 bg-emerald-500/90 hover:bg-emerald-500`}
                                  >
                                    Aceptar
                                  </button>
                                  {request.estado !== 'Cancelada' && request.estado !== 'Denegada' && (
                                    <button
                                      onClick={() =>
                                        handleUpdateRequestStatus(
                                          request.id,
                                          'Denegada',
                                          request.tipo,
                                          request.id_empleado,
                                          request.turno
                                        )
                                      }
                                      className={`${actionButtonBase} border-rose-400/60 bg-rose-500/90 hover:bg-rose-500`}
                                    >
                                      Rechazar
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className={`${subtleTextClass} text-sm`}>Sin permisos</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                      onClick={() => updatePage(status, Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                        currentPage === 1
                          ? 'cursor-not-allowed border-slate-400/40 text-slate-400'
                          : darkMode
                              ? 'border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Anterior
                    </button>
                    <span className={`text-sm font-semibold ${subtleTextClass}`}>
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => updatePage(status, Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                        currentPage === totalPages
                          ? 'cursor-not-allowed border-slate-400/40 text-slate-400'
                          : darkMode
                              ? 'border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                    darkMode
                      ? 'border-slate-800 bg-slate-900/60 text-slate-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  No hay solicitudes para este estado este mes.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default RequestListPage;
