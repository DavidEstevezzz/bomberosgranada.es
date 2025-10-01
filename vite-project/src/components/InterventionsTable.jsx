// src/components/InterventionsTable.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import InterventionApiService from '../services/InterventionApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const InterventionsTable = ({
  idGuard,
  darkMode,
  onEditIntervention,
  onDeleteIntervention,
  refreshTrigger,
}) => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

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
    return (
      <div className="flex items-center justify-center py-8">
        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Cargando intervenciones...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border p-6 ${
        darkMode ? 'border-red-500/40 bg-red-500/10' : 'border-red-200 bg-red-50'
      }`}>
        <p className={`text-sm font-medium ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-colors ${
      darkMode 
        ? 'border-slate-800 bg-slate-900/60' 
        : 'border-slate-200 bg-white'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <th className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Parte
              </th>
              <th className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Mando
              </th>
              <th className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Tipo
              </th>
              <th className={`py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {interventions.length > 0 ? (
              interventions.map((intervention) => (
                <tr
                  key={intervention.parte}
                  className={`border-b transition-colors ${
                    darkMode 
                      ? 'border-slate-800/50 hover:bg-slate-800/50' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <td className={`py-3 px-4 text-sm font-medium ${
                    darkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {intervention.parte}
                  </td>
                  <td className={`py-3 px-4 text-sm ${
                    darkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {getUserName(intervention.mando)}
                  </td>
                  <td className={`py-3 px-4 text-sm ${
                    darkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {intervention.tipo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditIntervention(intervention)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                          darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => onDeleteIntervention(intervention.parte)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                          darkMode
                            ? 'bg-red-600 text-white hover:bg-red-500'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                        <span>Borrar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No hay intervenciones disponibles
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InterventionsTable;