import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Para nombres de meses en español
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
      Confirmada: 'Confirmada',
    };
    return stateMap[state] || state;
  };

  // Función para cancelar solicitudes:
  // Solo mostrar botón si la solicitud está en estado "Pendiente"
  const renderRequestActions = (request) => {
    if (request.estado !== 'Pendiente') {
      return null; 
    }
    return (
      <button
        onClick={() => handleRequestStatusChange(request.id, 'Cancelada')}
        className="bg-red-600 text-white px-4 py-1 rounded"
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

        // Filtrar solicitudes de permisos para el usuario conectado y el mes actual
        const filteredRequests = requestsResponse.data.filter(
          (req) =>
            req.id_empleado === user.id_empleado &&
            dayjs(req.fecha_ini).isSame(currentMonth, 'month')
        );

        // Filtrar los cambios de guardia que involucren al usuario y el mes actual
        const filteredShiftChanges = shiftChangeResponse.data.filter((req) => {
          if (!req.fecha) return false;
          const sameMonth = dayjs(req.fecha).isSame(currentMonth, 'month');
          const involvesUser =
            req.id_empleado1 === user.id_empleado || req.id_empleado2 === user.id_empleado;
          return sameMonth && involvesUser;
        });

        // Dividir cambios de guardia en simples (sin fecha2) y espejo (con fecha2)
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

  // Para cambiar de estado una solicitud (permiso)
  const handleRequestStatusChange = async (id, newStatus) => {
    try {
      await RequestApiService.updateRequest(id, { estado: newStatus });
      // Actualizamos el estado local
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, estado: newStatus } : req))
      );
    } catch (error) {
      console.error('Error al actualizar el estado de la solicitud:', error);
    }
  };

  // Para cambiar de estado un cambio de guardia
  const handleShiftChangeStatusChange = async (id, newStatus) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(id, { estado: newStatus });

      // Actualizamos los arrays de cambios de guardia
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

    // Acciones específicas según el usuario involucrado y el estado
    if (request.id_empleado1 === user.id_empleado) {
      // El empleado 1 puede rechazar
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
      // El empleado 2 puede aceptar o rechazar
      return (
        <>
          <button
            onClick={() => handleShiftChangeStatusChange(request.id, 'aceptado_por_empleados')}
            className="bg-green-600 text-white px-4 py-1 rounded mr-2"
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
        {/* --- SOLICITUDES DE PERMISO --- */}
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
                  <th className="py-2 px-4">Acciones</th> {/* Nueva columna */}
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">{request.tipo}</td>
                    <td className="py-2 px-4">{request.fecha_ini}</td>
                    <td className="py-2 px-4">{request.fecha_fin}</td>
                    <td className="py-2 px-4">{request.turno}</td>
                    <td className="py-2 px-4">{normalizeState(request.estado)}</td>
                    {/* Usamos la función para cancelar (solo si está en Pendiente) */}
                    <td className="py-2 px-4">{renderRequestActions(request)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay solicitudes este mes</p>
        )}

        {/* --- CAMBIOS DE GUARDIA SIMPLES --- */}
        <h2 className="text-xl font-bold mt-8 mb-4">Cambios de Guardia Simples</h2>
        {simpleShiftChanges.length > 0 ? (
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
                {simpleShiftChanges.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">
                      {request.empleado1?.nombre} {request.empleado1?.apellido}
                    </td>
                    <td className="py-2 px-4">
                      {request.empleado2?.nombre} {request.empleado2?.apellido}
                    </td>
                    <td className="py-2 px-4">{request.fecha}</td>
                    <td className="py-2 px-4">{request.turno}</td>
                    <td className="py-2 px-4">{normalizeState(request.estado)}</td>
                    <td className="py-2 px-4">{renderShiftChangeActions(request)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay cambios de guardia simples este mes</p>
        )}

        {/* --- CAMBIOS DE GUARDIA ESPEJO --- */}
        <h2 className="text-xl font-bold mt-8 mb-4">Cambios de Guardia Espejo</h2>
        {mirrorShiftChanges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-4">Bombero 1</th>
                  <th className="py-2 px-4">Bombero 2</th>
                  <th className="py-2 px-4">Fecha 1</th>
                  <th className="py-2 px-4">Fecha 2</th>
                  <th className="py-2 px-4">Turno</th>
                  <th className="py-2 px-4">Estado</th>
                  <th className="py-2 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mirrorShiftChanges.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">
                      {request.empleado1?.nombre} {request.empleado1?.apellido}
                    </td>
                    <td className="py-2 px-4">
                      {request.empleado2?.nombre} {request.empleado2?.apellido}
                    </td>
                    <td className="py-2 px-4">{request.fecha}</td>
                    <td className="py-2 px-4">{request.fecha2}</td>
                    <td className="py-2 px-4">{request.turno}</td>
                    <td className="py-2 px-4">{normalizeState(request.estado)}</td>
                    <td className="py-2 px-4">{renderShiftChangeActions(request)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay cambios de guardia espejo este mes</p>
        )}
      </div>
    </div>
  );
};

export default RequestAndShiftChangePage;
