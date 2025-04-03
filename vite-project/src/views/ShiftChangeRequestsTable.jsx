import React, { useState, useEffect } from 'react';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import EditShiftChangeModal from '../components/EditShiftChangeModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FaSortUp, FaSortDown } from 'react-icons/fa'; // Importamos íconos de ordenamiento
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs'; // Importamos dayjs

const ShiftChangeRequestsTable = () => {
  const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Paginación por estado
  const [currentPage, setCurrentPage] = useState({
    en_tramite: 1,
    aceptado_por_empleados: 1,
    rechazado: 1,
    aceptado: 1,
  });

  // Mes actual por estado (inicializamos todos en el mes corriente)
  const [currentMonth, setCurrentMonth] = useState({
    en_tramite: dayjs(),
    aceptado_por_empleados: dayjs(),
    rechazado: dayjs(),
    aceptado: dayjs(),
  });

  // Estados para el ordenamiento
  const [sortField, setSortField] = useState('fecha');
  const [sortDirection, setSortDirection] = useState('asc');

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
      if (sortField === 'fecha') {
        const dateA = dayjs(a.fecha);
        const dateB = dayjs(b.fecha);
        
        if (sortDirection === 'asc') {
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
        } else {
          return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
        }
      }
      return 0;
    });
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

  // Manejadores para cambiar de mes (por estado)
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

  // (1) Función para filtrar por mes
  const filterRequestsByMonth = (requests, status) => {
    return requests.filter((request) => {
      if (!request.fecha) return false;
      const requestDate = dayjs(request.fecha);
      return requestDate.isSame(currentMonth[status], 'month');
    });
  };

  // (2) Paginación
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

  if (loading) {
    return <div>Cargando solicitudes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-4">Solicitudes de Cambio de Guardia</h1>

      {/* Mapeamos por cada estado y renderizamos su bloque */}
      {['en_tramite', 'aceptado_por_empleados', 'rechazado', 'aceptado'].map((status) => {
        // (1) Filtrar por estado
        const requestsByStatus = shiftChangeRequests.filter((req) => req.estado === status);

        // (2) Filtrar adicionalmente por mes
        const filteredRequests = filterRequestsByMonth(requestsByStatus, status);

        // (3) Ordenar los datos según el campo y dirección de ordenamiento
        const sortedRequests = sortData(filteredRequests);

        // (4) Paginación
        const totalPages = Math.ceil(sortedRequests.length / itemsPerPage) || 1;
        const currentRequests = paginate(sortedRequests, currentPage[status]);

        return (
          <div
            key={status}
            className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            {/* Encabezado de la sección */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {normalizeStatus(status)}
              </h2>

              {/* Controles de mes (anteriores/siguientes) */}
              <div className="flex space-x-4 items-center">
                <button
                  onClick={() => handlePreviousMonth(status)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Mes Anterior
                </button>
                <span className="text-lg font-semibold">
                  {currentMonth[status].format('MMMM YYYY').charAt(0).toUpperCase() +
                    currentMonth[status].format('MMMM YYYY').slice(1)}
                </span>
                <button
                  onClick={() => handleNextMonth(status)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Mes Siguiente
                </button>
              </div>
            </div>

            {/* Tabla de solicitudes */}
            <div className="overflow-x-auto">
              {sortedRequests.length === 0 ? (
                <div className="text-center py-4">
                  No hay solicitudes en este estado para el mes seleccionado.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 px-2">Bombero 1</th>
                      <th className="py-2 px-2">Bombero 2</th>
                      <th 
                        className="py-2 px-2 cursor-pointer select-none flex items-center"
                        onClick={() => handleSort('fecha')}
                      >
                        Fecha
                        {sortField === 'fecha' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                          </span>
                        )}
                      </th>
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
                        <td className="py-2 px-2">
                          {request.fecha}
                          {request.fecha2 && ` / ${request.fecha2}`} {/* Mostrar fecha2 si existe */}
                        </td>
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

              {/* Controles de paginación */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handlePageChange(status, -1, totalPages)}
                  disabled={currentPage[status] === 1}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Anterior
                </button>
                <span className="text-center py-2">
                  {sortedRequests.length === 0
                    ? '0 de 0'
                    : `Página ${currentPage[status]} de ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(status, 1, totalPages)}
                  disabled={currentPage[status] === totalPages || sortedRequests.length === 0}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal de edición */}
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