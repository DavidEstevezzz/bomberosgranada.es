import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPlus, faEllipsisH, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import IncidentApiService from '../services/IncidentApiService';
import AddIncidentModal from '../components/AddIncidentModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const IncidentListPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await IncidentApiService.getIncidents();
      console.log("Incidencias recibidas:", response.data); // Log para depuración
      // Ordena por fecha ascendente usando el campo "fecha"
      const sorted = response.data.sort((a, b) => dayjs(a.fecha).diff(dayjs(b.fecha)));
      setIncidents(sorted);
      setError(null);
    } catch (err) {
      console.error("Error al cargar incidencias:", err);
      setError("Error al cargar incidencias");
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

  // Filtrar incidencias del mes actual
  const filteredIncidents = incidents.filter((incident) =>
    dayjs(incident.fecha).isSame(currentMonth, 'month')
  );
  const pendingIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'pendiente'
  );
  const resolvedIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'resuelta'
  );

  // Funciones auxiliares para mostrar nombres
  const getCreatorName = (incident) =>
    incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : incident.id_empleado;
  const getEmployee2Name = (incident) =>
    incident.employee2 ? `${incident.employee2.nombre} ${incident.employee2.apellido}` : '';

  // Marcar incidencia como resuelta
  const handleResolve = async (incidentId) => {
    try {
      // En un escenario real, se usaría el id del usuario autenticado
      const resolverData = { resulta_por: user.id_empleado };
      console.log("Datos de resolución:", resolverData); // Log para depuración
      await IncidentApiService.resolveIncident(incidentId, resolverData);
      fetchIncidents();
    } catch (err) {
      console.error("Error al resolver incidencia:", err);
    }
  };

  // Marcar incidencia como leída (solo para jefes)
  const handleMarkAsRead = async (incidentId) => {
    try {
      await IncidentApiService.markAsRead(incidentId);
      fetchIncidents();
    } catch (err) {
      console.error("Error al marcar incidencia como leída:", err);
    }
  };

  // Abrir modal de detalle
  const openDetailModal = (incident) => {
    setDetailIncident(incident);
    setIsDetailModalOpen(true);
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
        <span className="text-xl font-semibold">{currentMonth.format('MMMM YYYY')}</span>
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
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo === 'vehiculo' && incident.matricula && (
                        <span>{incident.vehicle.nombre}</span>
                      )}
                      {incident.tipo === 'personal' && incident.employee2 && (
                        <span>{getEmployee2Name(incident)}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => handleResolve(incident.id_incidencia)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Resuelta
                      </button>
                      <button
                        onClick={() => openDetailModal(incident)}
                        className="bg-gray-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>Detalle</span>
                      </button>
                      {user?.type === 'jefe' && !incident.leido && (
                        <button
                          onClick={() => handleMarkAsRead(incident.id_incidencia)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Marcar Leída
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center">
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
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
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
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo === 'vehiculo' && incident.matricula && (
                        <span>Vehículo: {incident.matricula}</span>
                      )}
                      {incident.tipo === 'personal' && incident.employee2 && (
                        <span>Empleado: {getEmployee2Name(incident)}</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => openDetailModal(incident)}
                        className="bg-gray-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>Detalle</span>
                      </button>
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

      {isDetailModalOpen && detailIncident && (
        <IncidentDetailModal
          incident={detailIncident}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IncidentListPage;
