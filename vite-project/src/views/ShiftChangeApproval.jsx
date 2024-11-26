import React, { useState, useEffect, useRef } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useStateContext } from '../contexts/ContextProvider'; // Para obtener el usuario logueado
import { useDarkMode } from '../contexts/DarkModeContext';

const ShiftChangeApprovalPage = () => {
  const { user } = useStateContext(); // Obtener usuario logueado
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();

  // Usamos un ref para evitar múltiples llamadas innecesarias
  const hasFetchedRequests = useRef(false);

  useEffect(() => {
    // Verifica si ya hemos hecho la llamada o si el user aún no está cargado
    if (!user || !user.id_empleado || hasFetchedRequests.current) {
      return;
    }

    fetchShiftChangeRequests();
    hasFetchedRequests.current = true; // Marcamos que ya hemos hecho la llamada
  }, [user]);

  // Obtener las solicitudes de cambio de turno del API
  const fetchShiftChangeRequests = async () => {
    setLoading(true);
    try {
      const response = await ShiftChangeRequestApiService.getRequests();

      if (response.data) {
        // Filtrar las solicitudes donde el usuario logueado es empleado 2 y el estado es 'en_tramite'
        const filteredRequests = response.data.filter(
          (request) => request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite'
        );
        setShiftChangeRequests(filteredRequests);
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

  // Actualizar el estado de la solicitud (aceptar o rechazar)
  const updateShiftChangeRequest = async (requestId, newState) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(requestId, { estado: newState });
      fetchShiftChangeRequests(); // Refrescar la lista de solicitudes
    } catch (error) {
      console.error('Failed to update shift change request:', error);
    }
  };

  // Renderizar mensajes de carga o error
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-4">Solicitudes de Cambio de Guardia Pendientes</h1>
      {shiftChangeRequests.length === 0 ? (
        <p>No hay solicitudes de cambio de guardia en trámite para aprobar.</p>
      ) : (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-2">Bombero 1</th>
                  <th className="py-2 px-2">Bombero 2</th>
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Turno</th>
                  <th className="py-2 px-2">Motivo</th>
                  <th className="py-2 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shiftChangeRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-2">{request.empleado1?.nombre} {request.empleado1?.apellido}</td>
                    <td className="py-2 px-2">{request.empleado2?.nombre} {request.empleado2?.apellido}</td>
                    <td className="py-2 px-2">{request.fecha}</td>
                    <td className="py-2 px-2">{request.turno}</td>
                    <td className="py-2 px-2">{request.motivo}</td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => updateShiftChangeRequest(request.id, 'aceptado_por_empleados')}
                        className="bg-green-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => updateShiftChangeRequest(request.id, 'rechazado')}
                        className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        <span>Rechazar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftChangeApprovalPage;
