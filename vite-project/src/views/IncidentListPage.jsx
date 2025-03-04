import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import IncidentApiService from '../services/IncidentApiService';
import AddIncidentModal from '../components/AddIncidentModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faTimes, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const IncidentListPage = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { darkMode } = useDarkMode();
    const { user } = useStateContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [detailIncident, setDetailIncident] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchParams] = useSearchParams();

    // Nueva variable para filtrar por parque
    const [selectedParkFilter, setSelectedParkFilter] = useState("Todas");

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const response = await IncidentApiService.getIncidents();
            console.log("Incidencias recibidas:", response.data);
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

    // Filtrar incidencias por parque (ya no se filtra por mes)
    const filteredIncidents = incidents.filter((incident) => {
        const matchesPark =
            selectedParkFilter === "Todas" ||
            (incident.park &&
                incident.park.nombre.toLowerCase() === selectedParkFilter.toLowerCase());
        return matchesPark;
    });
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
            const resolverData = { resulta_por: user.id_empleado };
            console.log("Datos de resolución:", resolverData);
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

    // Eliminar incidencia
    const handleDelete = async (incidentId) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta incidencia?")) {
            try {
                await IncidentApiService.deleteIncident(incidentId);
                fetchIncidents();
            } catch (err) {
                console.error("Error al eliminar incidencia:", err);
            }
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
            {/* Sección de filtro por parque */}
            <div className="flex justify-center space-x-4 mb-4">
                <button
                    onClick={() => setSelectedParkFilter("Todas")}
                    className={`px-4 py-2 rounded ${selectedParkFilter === "Todas" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setSelectedParkFilter("Parque Sur")}
                    className={`px-4 py-2 rounded ${selectedParkFilter === "Parque Sur" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
                >
                    Parque Sur
                </button>
                <button
                    onClick={() => setSelectedParkFilter("Parque Norte")}
                    className={`px-4 py-2 rounded ${selectedParkFilter === "Parque Norte" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
                >
                    Parque Norte
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
                                            <button
                                                onClick={() => handleDelete(incident.id_incidencia)}
                                                className="bg-red-600 text-white px-3 py-1 rounded"
                                            >
                                                Borrar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-4 text-center">
                                        No hay incidencias pendientes.
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
                                                <span>Vehículo: {incident.vehicle.nombre}</span>
                                            )}
                                            {incident.tipo === 'personal' && incident.employee2 && (
                                                <span>Empleado: {getEmployee2Name(incident)}</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 flex space-x-2">
                                            <button
                                                onClick={() => openDetailModal(incident)}
                                                className="bg-gray-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                                            >
                                                <FontAwesomeIcon icon={faInfoCircle} />
                                                <span>Detalle</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(incident.id_incidencia)}
                                                className="bg-red-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                                <span>Borrar</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-4 text-center">
                                        No hay incidencias resueltas.
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
