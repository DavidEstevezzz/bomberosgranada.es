import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaSortUp, FaSortDown } from 'react-icons/fa'; // Añadido íconos de ordenamiento
import dayjs from 'dayjs'; // Manejo de fechas
import RequestApiService from '../services/RequestApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const RequestListPage = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs()); // Estado para el mes actual
  const [pagination, setPagination] = useState({
    Pendiente: 1,
    Confirmada: 1,
    Cancelada: 1,
  });
  // Añadir estados para el ordenamiento
  const [sortField, setSortField] = useState('fecha_ini');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const itemsPerPage = 10; // Filas por página
  const { darkMode } = useDarkMode();

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
  }

  const updateUserAPDays = async (userId, daysChange) => {
    try {
      const user = users.find((user) => user.id_empleado === userId);
      const newAP = (user?.AP || 0) + daysChange;

      await UsuariosApiService.updateUserAP(userId, newAP);
      setUsers(users.map((user) =>
        user.id_empleado === userId ? { ...user, AP: newAP } : user
      ));
    } catch (error) {
      console.error('Error al actualizar los días de AP en el backend:', error);
    }
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
  
      if (tipo === 'asuntos propios') {
        let requestedAPDays;
        if (turno === 'Día Completo') {
          requestedAPDays = 3;
        } else if (turno === 'Mañana y tarde' || turno === 'Tarde y noche') {
          requestedAPDays = 2;
        } else {
          requestedAPDays = 1;
        }
  
        const remainingAPDays = getAPDaysRemaining(idEmpleado);
  
        if (newStatus === 'Confirmada' && currentStatus !== 'Confirmada') {
          if (requestedAPDays > remainingAPDays) {
            alert('No te quedan suficientes días de asuntos propios (AP) para aceptar esta solicitud.');
            return;
          }
          await updateUserAPDays(idEmpleado, -requestedAPDays);
        } else if (newStatus !== 'Confirmada' && currentStatus === 'Confirmada') {
          await updateUserAPDays(idEmpleado, requestedAPDays);
        }
      } else if (tipo === 'compensación') {
        let requestedCompensacionDays;
        if (turno === 'Día Completo') {
          requestedCompensacionDays = 3;
        } else if (turno === 'Mañana y tarde' || turno === 'Tarde y noche') {
          requestedCompensacionDays = 2;
        } else {
          requestedCompensacionDays = 1;
        }
  
        const remainingCompensacionDays = getCompensacionDaysRemaining(idEmpleado);
  
        if (newStatus === 'Confirmada' && currentStatus !== 'Confirmada') {
          if (requestedCompensacionDays > remainingCompensacionDays) {
            alert('No te quedan suficientes días de compensación para aceptar esta solicitud.');
            return;
          }
          await updateUserAPDays(idEmpleado, -requestedCompensacionDays); // Cambia a una función específica si es necesario
        } else if (newStatus !== 'Confirmada' && currentStatus === 'Confirmada') {
          await updateUserAPDays(idEmpleado, requestedCompensacionDays); // Cambia a una función específica si es necesario
        }
      }
  
      const payload = { estado: newStatus };
      if (tipo === 'asuntos propios' || tipo === 'compensacion grupos especiales') {
        payload.turno = turno;
      }
  
      await RequestApiService.updateRequest(id, payload);
      fetchRequests();
    } catch (error) {
      console.error('Error al actualizar el estado de la solicitud:', error);
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
    return requests.filter((request) =>
      dayjs(request.fecha_ini).isSame(currentMonth, 'month')
    );
  };

  const paginate = (data, status) => {
    const startIndex = (pagination[status] - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage);

  const updatePage = (status, newPage) => {
    setPagination((prev) => ({
      ...prev,
      [status]: newPage,
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredRequests = filterRequestsByMonth();

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <div className="flex space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mes Anterior
          </button>
            <span className="text-xl font-semibold">{currentMonth.format('MMMM YYYY').charAt(0).toUpperCase() + currentMonth.format('MMMM YYYY').slice(1)}</span>
          <button
            onClick={handleNextMonth}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mes Siguiente
          </button>
        </div>
      </div>

      {['Pendiente', 'Confirmada', 'Cancelada'].map((status) => {
        const filteredByStatus = filteredRequests.filter((request) => request.estado === status);
        const sortedRequests = sortData(filteredByStatus);
        const paginatedRequests = paginate(sortedRequests, status);
        const totalPages = getTotalPages(filteredByStatus);

        return (
          <div key={status} className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">{status}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-2">Empleado</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2">Motivo</th>
                    <th 
                      className="py-2 px-2 cursor-pointer select-none flex items-center"
                      onClick={() => handleSort('fecha_ini')}
                    >
                      Fecha Inicio
                      {sortField === 'fecha_ini' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </th>
                    <th className="py-2 px-2">Fecha Fin</th>
                    <th className="py-2 px-2">Turno</th>
                    <th className="py-2 px-2">Creación</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2">Archivo</th>
                    <th className="py-2 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-700">
                        <td className="py-2 px-2">{findUserById(request.id_empleado)}</td>
                        <td className="py-2 px-2">{request.tipo.charAt(0).toUpperCase() + request.tipo.slice(1)}</td>
                        <td className="py-2 px-2">{request.motivo}</td>
                        <td className="py-2 px-2">{request.fecha_ini}</td>
                        <td className="py-2 px-2">{request.fecha_fin}</td>
                        <td className="py-2 px-2">{request.turno}</td>
                        <td className="py-2 px-2">{request.creacion}</td>
                        <td className="py-2 px-2">{request.estado}</td>
                        <td className="py-2 px-2">
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
                              className="text-red-500 hover:text-red-700"
                              title="Descargar archivo PDF"
                            >
                              <FaFilePdf size={24} />
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-2 flex space-x-2">
                          <button
                            onClick={() => handleUpdateRequestStatus(request.id, 'Confirmada', request.tipo, request.id_empleado, request.turno)}
                            className="bg-green-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                          >
                            Aceptar
                          </button>
                          {request.estado !== 'Cancelada' && (
                            <button
                              onClick={() => handleUpdateRequestStatus(request.id, 'Cancelada', request.tipo, request.id_empleado, request.turno)}
                              className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                            >
                              Rechazar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-4">No hay solicitudes para este estado este mes</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => updatePage(status, Math.max(pagination[status] - 1, 1))}
                  disabled={pagination[status] === 1}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Anterior
                </button>
                <span className="text-center py-2">{`Página ${pagination[status]} de ${totalPages}`}</span>
                <button
                  onClick={() => updatePage(status, Math.min(pagination[status] + 1, totalPages))}
                  disabled={pagination[status] === totalPages}
                  className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestListPage;