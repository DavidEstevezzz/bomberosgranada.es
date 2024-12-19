import React, { useState, useEffect } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div
      className={`max-w-4xl mx-auto mt-4 p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4 text-center">Tus Cambios de Guardia</h3>

      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePreviousMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
          Mes Anterior
        </button>
        <span className="text-lg font-semibold">{dayjs(selectedMonth).format('MMMM YYYY').charAt(0).toUpperCase() + dayjs(selectedMonth).format('MMMM YYYY').slice(1)}</span>
        <button onClick={handleNextMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
          Mes Siguiente
        </button>
      </div>

      <div
        className={`overflow-x-auto shadow-md sm:rounded-lg border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <table className="w-full text-sm text-center">
          <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            <tr>
              <th className="py-3 px-6">Bombero 1</th>
              <th className="py-3 px-6">Bombero 2</th>
              <th className="py-3 px-6">Fecha</th>
              <th className="py-3 px-6">Turno</th>
              <th className="py-3 px-6">Estado</th>
              {showActionsColumn && <th className="py-3 px-6">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr
                key={request.id}
                className={`${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                    : 'bg-white border-b hover:bg-gray-50'
                }`}
              >
                <td className="py-4 px-6">
                  {request.empleado1?.nombre} {request.empleado1?.apellido}
                </td>
                <td className="py-4 px-6">
                  {request.empleado2?.nombre} {request.empleado2?.apellido}
                </td>
                <td className="py-4 px-6">{dayjs(request.fecha).format('DD-MM-YYYY')}</td>
                <td className="py-4 px-6">{request.turno}</td>
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
