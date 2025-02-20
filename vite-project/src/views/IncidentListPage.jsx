import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPlus, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import IncidentApiService from '../services/IncidentApiService';
import AddIncidentModal from '../components/AddIncidentModal'; // Modal para nueva incidencia (a diseñar)
import { useDarkMode } from '../contexts/DarkModeContext';

const IncidentListPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const { darkMode } = useDarkMode();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await IncidentApiService.getIncidents();
      // Ordenar por fecha ascendente
      const sorted = response.data.sort((a, b) => dayjs(a.fecha).diff(dayjs(b.fecha)));
      setIncidents(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  // Filtrar las incidencias según el mes actual (comparando la fecha de la incidencia)
  const filteredIncidents = incidents.filter((incident) =>
    dayjs(incident.fecha).isSame(currentMonth, 'month')
  );

  const pendingIncidents = filteredIncidents.filter(
    (incident) => incident.estado === 'Pendiente'
  );
  const resolvedIncidents = filteredIncidents.filter(
    (incident) => incident.estado === 'Resuelta'
  );

  // Función para marcar una incidencia como resuelta (se asume que el API requiere enviar el id del empleado que resuelve)
  const handleResolve = async (incidentId) => {
    try {
      // En un escenario real, el id del empleado que resuelve se obtendría del contexto de autenticación.
      const resolverData = { resulta_por: "CURRENT_USER_ID" };
      await IncidentApiService.resolveIncident(incidentId, resolverData);
      fetchIncidents();
    } catch (err) {
      console.error('Error al resolver incidencia:', err);
    }
  };

  // Función auxiliar para mostrar el nombre del usuario creador
  const getCreatorName = (incident) => {
    if (incident.creator) {
      return `${incident.creator.nombre} ${incident.creator.apellido}`;
    }
    return incident.id_empleado;
  };

  // Función auxiliar para mostrar el nombre del empleado referenciado en incidencias de tipo personal
  const getEmployee2Name = (incident) => {
    if (incident.employee2) {
      return `${incident.employee2.nombre} ${incident.employee2.apellido}`;
    }
    return '';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Incidencias</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Incidencia</span>
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Mes Anterior
        </button>
        <span className="text-xl font-semibold">
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button
          onClick={handleNextMonth}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Mes Siguiente
        </button>
      </div>

      {/* Tabla de Incidencias Pendientes */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4">Incidencias Pendientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2">Leído</th>
                <th className="py-2 px-2">Descripción</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingIncidents.length > 0 ? (
                pendingIncidents.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}
                    </td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faEye} title="Leído" />
                      ) : (
                        <FontAwesomeIcon icon={faEyeSlash} title="No leído" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.descripcion}</td>
                    <td className="py-2 px-2">
                      {incident.park ? incident.park.nombre : incident.id_parque}
                    </td>
                    <td className="py-2 px-2">
                      {incident.tipo === 'vehiculo' && incident.matricula && (
                        <span>Mat: {incident.matricula}</span>
                      )}
                      {incident.tipo === 'personal' && incident.employee2 && (
                        <span>{getEmployee2Name(incident)}</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleResolve(incident.id_incidencia)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Marcar Resuelta
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-4 text-center">
                    No hay incidencias pendientes en este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Incidencias Resueltas */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4">Incidencias Resueltas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2">Leído</th>
                <th className="py-2 px-2">Descripción</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
              </tr>
            </thead>
            <tbody>
              {resolvedIncidents.length > 0 ? (
                resolvedIncidents.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}
                    </td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faEye} title="Leído" />
                      ) : (
                        <FontAwesomeIcon icon={faEyeSlash} title="No leído" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.descripcion}</td>
                    <td className="py-2 px-2">
                      {incident.park ? incident.park.nombre : incident.id_parque}
                    </td>
                    <td className="py-2 px-2">
                      {incident.tipo === 'vehiculo' && incident.matricula && (
                        <span>Mat: {incident.matricula}</span>
                      )}
                      {incident.tipo === 'personal' && incident.employee2 && (
                        <span>{getEmployee2Name(incident)}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center">
                    No hay incidencias resueltas en este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddIncidentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={fetchIncidents}
        />
      )}
    </div>
  );
};

export default IncidentListPage;
