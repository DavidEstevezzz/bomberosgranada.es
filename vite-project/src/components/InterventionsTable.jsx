// src/components/InterventionsTable.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import InterventionApiService from '../services/InterventionApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const InterventionsTable = ({
  idGuard,
  darkMode,
  onEditIntervention, // función para abrir el modal de edición con los datos seleccionados
  onDeleteIntervention, // función para borrar (opcional; también se puede manejar aquí)
  refreshTrigger,       // variable para refrescar la lista
}) => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  // Obtener usuarios para mostrar nombre y apellido del "mando"
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UsuariosApiService.getUsuarios();
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const response = await InterventionApiService.getInterventionsByGuard(idGuard);
      setInterventions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError('Error fetching interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idGuard) {
      fetchInterventions();
    }
  }, [idGuard, refreshTrigger]);

  const getUserName = (id_empleado) => {
    const user = users.find((u) => u.id_empleado === id_empleado);
    return user ? `${user.nombre} ${user.apellido}` : 'Desconocido';
  };

  if (loading) {
    return <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Cargando...</p>;
  }
  if (error) {
    return <p className={darkMode ? 'text-red-300' : 'text-red-500'}>Error: {error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full text-left border-collapse rounded-lg ${
          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
        }`}
      >
        <thead>
          <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'}>
            <th className="py-2 px-2">Parte</th>
            <th className="py-2 px-2">Mando</th>
            <th className="py-2 px-2">Tipo</th>
            <th className="py-2 px-2" style={{ width: '200px' }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {interventions.length > 0 ? (
            interventions.map((intervention) => (
              <tr
                key={intervention.parte}
                className={`border-b ${
                  darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <td className="py-2 px-2">{intervention.parte}</td>
                <td className="py-2 px-2">{getUserName(intervention.mando)}</td>
                <td className="py-2 px-2">{intervention.tipo}</td>
                <td className="py-2 px-2 flex space-x-2">
                  <button
                    onClick={() => onEditIntervention(intervention)}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onDeleteIntervention(intervention.parte)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded flex items-center space-x-1"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Borrar</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4">
                No hay intervenciones disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InterventionsTable;
