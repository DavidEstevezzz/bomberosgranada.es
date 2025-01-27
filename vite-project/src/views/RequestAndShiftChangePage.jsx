import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Para nombres de meses en español
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import RequestApiService from '../services/RequestApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');

const RequestAndShiftChangePage = () => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
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
      Confirmada: 'Confirmada',
    };
    return stateMap[state] || state;
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

        // Filtrar solicitudes solo para el usuario logueado
        const filteredRequests = requestsResponse.data.filter(
          (req) =>
            req.id_empleado === user.id_empleado &&
            dayjs(req.fecha_ini).isSame(currentMonth, 'month')
        );

        // Filtrar cambios de guardia donde el usuario esté involucrado
        const filteredShiftChanges = shiftChangeResponse.data.filter(
          (req) =>
            dayjs(req.fecha).isSame(currentMonth, 'month') &&
            (req.id_empleado1 === user.id_empleado || req.id_empleado2 === user.id_empleado)
        );

        setRequests(filteredRequests);
        setShiftChangeRequests(filteredShiftChanges);
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

  const handleRequestStatusChange = async (id, newStatus) => {
    try {
      await RequestApiService.updateRequest(id, { estado: newStatus });
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const handleShiftChangeStatusChange = async (id, newStatus) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(id, { estado: newStatus });
      setShiftChangeRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
    } catch (error) {
      console.error('Failed to update shift change request status:', error);
    }
  };

  const renderRequestActions = (request) => {
    if (request.estado === 'Cancelada') return null;
    return (
      <button
        onClick={() => handleRequestStatusChange(request.id, 'Cancelada')}
        className="bg-red-600 text-white px-4 py-1 rounded"
      >
        Rechazar
      </button>
    );
  };

  const renderShiftChangeActions = (request) => {
    if (request.estado === 'rechazado') return null;
    if (request.id_empleado1 === user.id_empleado) {
      return (
        <button
          onClick={() => handleShiftChangeStatusChange(request.id, 'rechazado')}
          className="bg-red-600 text-white px-4 py-1 rounded"
        >
          Rechazar
        </button>
      );
    }
    if (request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite') {
      return (
        <>
          <button
            onClick={() => handleShiftChangeStatusChange(request.id, 'aceptado_por_empleados')}
            className="bg-green-600 text-white px-4 py-1 rounded"
          >
            Aceptar
          </button>
          <button
            onClick={() => handleShiftChangeStatusChange(request.id, 'rechazado')}
            className="bg-red-600 text-white px-4 py-1 rounded"
          >
            Rechazar
          </button>
        </>
      );
    }
    return null;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-300 text-black'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Solicitudes y Cambios de Guardia - {currentMonth.format('MMMM YYYY')}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mes Anterior
          </button>
          <button
            onClick={handleNextMonth}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mes Siguiente
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
        <h2 className="text-xl font-bold mb-4">Solicitudes de Permiso</h2>
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-4">Tipo</th>
                  <th className="py-2 px-4">Fecha Inicio</th>
                  <th className="py-2 px-4">Fecha Fin</th>
                  <th className="py-2 px-4">Turno</th>
                  <th className="py-2 px-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">
                      {request.tipo.charAt(0).toUpperCase() + request.tipo.slice(1)}
                    </td>
                    <td className="py-2 px-4">{request.fecha_ini}</td>
                    <td className="py-2 px-4">{request.fecha_fin}</td>
                    <td className="py-2 px-4">{request.turno}</td>
                    <td className="py-2 px-4">{normalizeState(request.estado)}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay solicitudes este mes</p>
        )}

        <h2 className="text-xl font-bold mt-8 mb-4">Solicitudes de Cambio de Guardia</h2>
        {shiftChangeRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-4">Bombero 1</th>
                  <th className="py-2 px-4">Bombero 2</th>
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Turno</th>
                  <th className="py-2 px-4">Estado</th>
                  <th className="py-2 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shiftChangeRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">{request.empleado1?.nombre} {request.empleado1?.apellido}</td>
                    <td className="py-2 px-4">{request.empleado2?.nombre} {request.empleado2?.apellido}</td>
                    <td className="py-2 px-4">{request.fecha}</td>
                    <td className="py-2 px-4">{request.turno}</td>
                    <td className="py-2 px-4">{normalizeState(request.estado)}</td>
                    <td className="py-2 px-4 flex space-x-2">
                      {renderShiftChangeActions(request)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay cambios de guardia este mes</p>
        )}
      </div>
    </div>
  );
};

export default RequestAndShiftChangePage;
