import React, { useState, useEffect } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import EditShiftChangeModal from '../components/EditShiftChangeModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const ShiftChangeRequestsTable = () => {
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState({ en_tramite: 1, aceptado_por_empleados: 1, rechazado: 1, aceptado: 1 });
  const itemsPerPage = 10;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShiftChangeRequest, setSelectedShiftChangeRequest] = useState(null);

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
    } catch (error) {
      console.error('Failed to fetch shift change requests:', error);
      setError('Failed to load shift change requests');
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
    } catch (error) {
      console.error('Failed to update shift change request:', error);
    }
  };

  const normalizeStatus = (status) => {
    switch (status) {
      case 'en_tramite':
        return 'En trámite';
      case 'aceptado_por_empleados':
        return 'Aceptado por empleados';
      case 'rechazado':
        return 'Rechazado';
      case 'aceptado':
        return 'Aceptado';
      default:
        return status;
    }
  };

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

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-4">Solicitudes de Cambio de Guardia</h1>

      {['en_tramite', 'aceptado_por_empleados', 'rechazado', 'aceptado'].map((status) => {
        const filteredRequests = shiftChangeRequests.filter((request) => request.estado === status);
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1; // Ensure totalPages is at least 1
        const currentRequests = paginate(filteredRequests, currentPage[status]);

        return (
          <div key={status} className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">{normalizeStatus(status)}</h2>
            <div className="overflow-x-auto">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-4">No hay solicitudes en este estado.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 px-2">Bombero 1</th>
                      <th className="py-2 px-2">Bombero 2</th>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Turno</th>
                      <th className="py-2 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-700">
                        <td className="py-2 px-2">
                          {request.empleado1?.nombre} {request.empleado1?.apellido}
                        </td>
                        <td className="py-2 px-2">
                          {request.empleado2?.nombre} {request.empleado2?.apellido}
                        </td>
                        <td className="py-2 px-2">{request.fecha}</td>
                        <td className="py-2 px-2">{request.turno}</td>
                        <td className="py-2 px-2 flex space-x-2">
                          <button
                            onClick={() => handleEditClick(request)}
                            className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handlePageChange(status, -1, totalPages)}
                  disabled={currentPage[status] === 1}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Anterior
                </button>
                <span className="text-center py-2">
                  {filteredRequests.length === 0
                    ? '0 de 0'
                    : `Página ${currentPage[status]} de ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(status, 1, totalPages)}
                  disabled={currentPage[status] === totalPages || filteredRequests.length === 0}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {selectedShiftChangeRequest && (
        <EditShiftChangeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          shiftChangeRequest={selectedShiftChangeRequest}
          onUpdate={handleUpdateShiftChangeRequest}
        />
      )}
    </div>
  );
};

export default ShiftChangeRequestsTable;
