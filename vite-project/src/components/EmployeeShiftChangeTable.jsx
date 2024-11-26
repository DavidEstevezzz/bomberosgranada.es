import React, { useState, useEffect } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchShiftChangeRequests();
  }, [user]);

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

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await ShiftChangeRequestApiService.updateRequest(requestId, { estado: newStatus });
      fetchShiftChangeRequests(); // Refresh the table after updating
    } catch (error) {
      console.error('Failed to update shift change request:', error);
    }
  };

  // Verifica si hay alguna solicitud que cumpla con la condición para mostrar las acciones
  const showActionsColumn = shiftChangeRequests.some(
    (request) => request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite'
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div
      className={`max-w-4xl mx-auto mt-4 p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4 text-center">Tus Cambios de Guardia</h3>
      <div className={`overflow-x-auto shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className="w-full text-sm text-center">
          <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            <tr>
              <th className="py-3 px-6">Bombero 1</th>
              <th className="py-3 px-6">Bombero 2</th>
              <th className="py-3 px-6">Fecha</th>
              <th className="py-3 px-6">Estado</th>
              {showActionsColumn && <th className="py-3 px-6">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {shiftChangeRequests.map((request) => (
              <tr
                key={request.id}
                className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-b hover:bg-gray-50'}`}
              >
                <td className="py-4 px-6">
                  {request.empleado1?.nombre} {request.empleado1?.apellido}
                </td>
                <td className="py-4 px-6">
                  {request.empleado2?.nombre} {request.empleado2?.apellido}
                </td>
                <td className="py-4 px-6">{request.fecha}</td>
                <td className="py-2 px-2">{formatEstado(request.estado)}</td>
                {showActionsColumn && (
                  <td className="py-4 px-6 flex justify-center space-x-2">
                    {request.id_empleado2 === user.id_empleado && request.estado === 'en_tramite' && (
                      <>
                        <button
                          onClick={() => handleUpdateRequestStatus(request.id, 'aceptado_por_empleados')}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(request.id, 'rechazado')}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeShiftChangeTable;
