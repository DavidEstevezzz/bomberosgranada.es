import React, { useState, useEffect } from 'react';
import RequestApiService from '../services/RequestApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const RequestListPage = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const itemsPerPage = 10; // Filas por página

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

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

  const getAPDaysRemaining = (userId) => {
    const user = users.find((user) => user.id_empleado === userId);
    return user ? user.AP : 0;
  };

  const updateUserAPDays = async (userId, daysChange) => {
    try {
      const user = users.find((user) => user.id_empleado === userId);
      const newAP = (user?.AP || 0) + daysChange;

      await UsuariosApiService.updateUserAP(userId, newAP);
      console.log(`Actualizado AP en el backend para usuario ${userId}: ${newAP}`);

      setUsers(users.map((user) =>
        user.id_empleado === userId ? { ...user, AP: newAP } : user
      ));
    } catch (error) {
      console.error('Error al actualizar los días de AP en el backend:', error);
    }
  };

  const handleUpdateRequestStatus = async (id, newStatus, tipo, idEmpleado, turno = 'Mañana') => {
    try {
        console.log(`Actualizando solicitud con ID ${id} a estado: ${newStatus}`);

        const request = requests.find((req) => req.id === id);
        const currentStatus = request?.estado;

        if (tipo === 'asuntos propios') {
            // Determina la cantidad de días de AP según el tipo de turno
            let requestedAPDays;
            if (turno === 'Día Completo') {
                requestedAPDays = 3;
            } else if (turno === 'Mañana y tarde' || turno === 'Tarde y noche') {
                requestedAPDays = 2; // Turno doble
            } else {
                requestedAPDays = 1; // Turno simple
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
        }

        // Enviar solo si el tipo es asuntos propios
        const payload = { estado: newStatus };
        if (tipo === 'asuntos propios') {
            payload.turno = turno; // Incluye el turno en el payload si es asuntos propios
        }

        await RequestApiService.updateRequest(id, payload);
        fetchRequests(); // Refresca la lista de solicitudes tras la actualización
    } catch (error) {
        console.error('Error al actualizar el estado de la solicitud:', error);
    }
};


  const findUserById = (id_empleado) => {
    const user = users.find((user) => user.id_empleado === id_empleado);
    return user ? `${user.nombre} ${user.apellido}` : 'N/A';
  };

  const paginate = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(requests.length / itemsPerPage);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-4">Solicitudes</h1>

      {['Pendiente', 'Confirmada', 'Cancelada'].map((status) => (
        <div key={status} className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">{status}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-2">Empleado</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">Motivo</th>
                  <th className="py-2 px-2">Fecha Inicio</th>
                  <th className="py-2 px-2">Fecha Fin</th>
                  <th className="py-2 px-2">Turno</th>
                  <th className="py-2 px-2">Estado</th>
                  <th className="py-2 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginate(requests.filter((request) => request.estado === status)).map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-2 px-2">{findUserById(request.id_empleado)}</td>
                    <td className="py-2 px-2">{request.tipo.charAt(0).toUpperCase() + request.tipo.slice(1)}</td>
                    <td className="py-2 px-2">{request.motivo}</td>
                    <td className="py-2 px-2">{request.fecha_ini}</td>
                    <td className="py-2 px-2">{request.fecha_fin}</td>
                     <td className="py-2 px-2">{request.turno}</td>
                    <td className="py-2 px-2">{request.estado}</td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => handleUpdateRequestStatus(request.id, 'Confirmada', request.tipo, request.id_empleado, request.turno)}
                        className="bg-green-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleUpdateRequestStatus(request.id, 'Cancelada', request.tipo, request.id_empleado, request.turno)}
                        className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
              >
                Anterior
              </button>
              <span className="text-center py-2">{`Página ${currentPage} de ${totalPages}`}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestListPage;
