import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faTimes, faEdit, faPlus, faInfoCircle, faHammer, faStop, faBan, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import IncidentApiService from '../services/IncidentApiService';
import AddIncidentModal from '../components/AddIncidentModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import EditIncidentModal from '../components/EditIncidentModal';
import ResolveIncidentModal from '../components/ResolveIncidentModal';


const IncidentListPage = () => {
  // Estados generales
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [pendingHighSortOrder, setPendingHighSortOrder] = useState('asc');
  const [pendingMediumSortOrder, setPendingMediumSortOrder] = useState('asc');
  const [pendingLowSortOrder, setPendingLowSortOrder] = useState('asc');
  const [resolvedSortOrder, setResolvedSortOrder] = useState('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchParams] = useState();
  const [selectedParkFilter, setSelectedParkFilter] = useState("Todas");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Todas");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionText, setResolutionText] = useState("");

  // Estados para incidencias resueltas (filtradas por mes)  
  const [currentMonth, setCurrentMonth] = useState(dayjs().month()); // 0 = enero, 11 = diciembre
  const [resolvedCurrentPage, setResolvedCurrentPage] = useState(1);
  const resolvedItemsPerPage = 5;

  // Estados para la paginación de incidencias pendientes (10 por página)
  const pendingItemsPerPage = 10;
  const [pendingHighPage, setPendingHighPage] = useState(1);
  const [pendingMediumPage, setPendingMediumPage] = useState(1);
  const [pendingLowPage, setPendingLowPage] = useState(1);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const openResolveModal = (incident) => {
    setSelectedIncident(incident);
    setIsResolveModalOpen(true);
  };

  const sortByFecha = (array, order) => {
    return [...array].sort((a, b) =>
      order === 'asc'
        ? dayjs(a.fecha).diff(dayjs(b.fecha))
        : dayjs(b.fecha).diff(dayjs(a.fecha))
    );
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await IncidentApiService.getIncidents();
      console.log("Incidencias recibidas:", response.data);
      // Ordenar por fecha ascendente usando el campo "fecha"
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

  // Filtrar incidencias por parque (si se selecciona alguna; de lo contrario se muestran todas)
  const filteredIncidents = incidents.filter((incident) => {
    const matchesPark =
      selectedParkFilter === "Todas" ||
      (incident.park &&
        incident.park.nombre.toLowerCase() === selectedParkFilter.toLowerCase());

    const matchesType =
      selectedTypeFilter === "Todas" ||
      (incident.tipo &&
        incident.tipo.toLowerCase() === selectedTypeFilter.toLowerCase());

    return matchesPark && matchesType;
  });

  // Separar incidencias en pendientes y resueltas
  const pendingIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'pendiente'
  );
  const resolvedIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'resuelta'
  );

  // Para las incidencias resueltas, filtramos por mes
  // Para las incidencias resueltas, filtramos por mes
  const filteredResolvedIncidents = resolvedIncidents.filter((incident) =>
    dayjs(incident.fecha).month() === currentMonth
  );
  // Ordenamos según el estado (ascendente o descendente)
  const sortedResolvedIncidents = sortByFecha(filteredResolvedIncidents, resolvedSortOrder);
  const totalResolvedPages = Math.ceil(sortedResolvedIncidents.length / resolvedItemsPerPage);
  const resolvedIndexOfLast = resolvedCurrentPage * resolvedItemsPerPage;
  const resolvedIndexOfFirst = resolvedIndexOfLast - resolvedItemsPerPage;
  const currentResolvedIncidents = sortedResolvedIncidents.slice(resolvedIndexOfFirst, resolvedIndexOfLast);

  // Obtener el nombre del mes con la primera letra en mayúscula
  const monthName = dayjs().month(currentMonth).format('MMMM');
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Dividir las incidencias pendientes según su nivel
  const pendingHigh = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'alto'
  );
  const pendingMedium = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'medio'
  );
  const pendingLow = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'bajo'
  );

  // Paginación para pendientes de nivel Alto
  const totalHighPages = Math.ceil(pendingHigh.length / pendingItemsPerPage);
  const highIndexOfLast = pendingHighPage * pendingItemsPerPage;
  const highIndexOfFirst = highIndexOfLast - pendingItemsPerPage;
  const sortedPendingHigh = sortByFecha(pendingHigh, pendingHighSortOrder);
  const currentPendingHigh = sortedPendingHigh.slice(highIndexOfFirst, highIndexOfLast);

  // Paginación para pendientes de nivel Medio
  const totalMediumPages = Math.ceil(pendingMedium.length / pendingItemsPerPage);
  const mediumIndexOfLast = pendingMediumPage * pendingItemsPerPage;
  const mediumIndexOfFirst = mediumIndexOfLast - pendingItemsPerPage;
  const sortedPendingMedium = sortByFecha(pendingMedium, pendingMediumSortOrder);
  const currentPendingMedium = sortedPendingMedium.slice(mediumIndexOfFirst, mediumIndexOfLast);

  // Paginación para pendientes de nivel Bajo
  const totalLowPages = Math.ceil(pendingLow.length / pendingItemsPerPage);
  const lowIndexOfLast = pendingLowPage * pendingItemsPerPage;
  const lowIndexOfFirst = lowIndexOfLast - pendingItemsPerPage;

  const sortedPendingLow = sortByFecha(pendingLow, pendingLowSortOrder);
  const currentPendingLow = sortedPendingLow.slice(lowIndexOfFirst, lowIndexOfLast);
  // Funciones auxiliares para mostrar nombres
  const getCreatorName = (incident) =>
    incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : incident.id_empleado;
  const getEmployee2Name = (incident) =>
    incident.employee2 ? `${incident.employee2.nombre} ${incident.employee2.apellido}` : '';

  // Función para exportar a PDF (usa todos los pendientes sin paginar)
  const exportPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;
    doc.setFontSize(16);
    doc.text(`Incidencias No Resueltas - ${selectedParkFilter}`, 14, yOffset);
    yOffset += 10;

    const tableData = [];
    pendingIncidents.forEach(incident => {
      let extraInfo = '';
      if (incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre) {
        extraInfo = incident.vehicle.nombre;
      } else if (incident.tipo.toLowerCase() === 'personal' && incident.employee2) {
        extraInfo = getEmployee2Name(incident);
      } else if (incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item) {
        extraInfo = incident.clothing_item.name;
      } else if (incident.tipo.toLowerCase() === 'equipo' && incident.equipment) {
        extraInfo = incident.equipment.nombre;
      }
      tableData.push({
        fecha: dayjs(incident.fecha).format('DD/MM/YYYY'),
        descripcion: incident.descripcion,
        tipo: incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1),
        extra: extraInfo,
        nivel: incident.nivel ? incident.nivel.toLowerCase() : ''
      });
    });

    tableData.sort((a, b) => a.extra.localeCompare(b.extra));

    const columns = [
      { header: 'Tipo', dataKey: 'tipo' },
      { header: 'Vehículo/Empleado', dataKey: 'extra' },
      { header: 'Descripción', dataKey: 'descripcion' },
      { header: 'Fecha', dataKey: 'fecha' },

    ];

    doc.autoTable({
      startY: yOffset,
      head: [columns.map(col => col.header)],
      body: tableData.map(row => columns.map(col => row[col.dataKey])),
      theme: 'grid',
      headStyles: { fillColor: 150 },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const rowObj = tableData[data.row.index];
          if (rowObj.nivel === 'alto') {
            data.cell.styles.fillColor = [255, 153, 153];
          } else if (rowObj.nivel === 'medio') {
            data.cell.styles.fillColor = [255, 219, 153];
          } else if (rowObj.nivel === 'bajo') {
            data.cell.styles.fillColor = [255, 255, 153];
          }
        }
      }
    });

    doc.save("incidencias_no_resueltas.pdf");
  };

  const handleResolveSubmit = async () => {
    try {
      const resolverData = {
        resolucion: resolutionText,
        resulta_por: user.id_empleado
      };
      await IncidentApiService.resolveIncident(selectedIncident.id_incidencia, resolverData);
      setIsResolveModalOpen(false);
      setResolutionText("");
      fetchIncidents(); // Actualiza la lista de incidencias
    } catch (err) {
      console.error("Error al resolver la incidencia: ", err);
    }
  };


  // Función para marcar una incidencia como leída
  const handleMarkAsRead = async (incidentId) => {
    try {
      await IncidentApiService.markAsRead(incidentId);
      fetchIncidents();
    } catch (err) {
      console.error("Error al marcar incidencia como leída:", err);
    }
  };

  // Función para eliminar una incidencia
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

  // Función para abrir el modal de detalle
  const openDetailModal = (incident) => {
    setDetailIncident(incident);
    setIsDetailModalOpen(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Encabezado y acciones */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Incidencias</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nueva Incidencia</span>
          </button>
          <button
            onClick={exportPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <span>Exportar a PDF</span>
          </button>
        </div>
      </div>

      {/* Filtro por parque */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Filtrar por Parque
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedParkFilter("Todas")}
            className={`px-4 py-2 rounded transition-colors ${selectedParkFilter === "Todas"
              ? "bg-blue-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Todos los Parques
          </button>
          <button
            onClick={() => setSelectedParkFilter("Parque Sur")}
            className={`px-4 py-2 rounded transition-colors ${selectedParkFilter === "Parque Sur"
              ? "bg-blue-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Parque Sur
          </button>
          <button
            onClick={() => setSelectedParkFilter("Parque Norte")}
            className={`px-4 py-2 rounded transition-colors ${selectedParkFilter === "Parque Norte"
              ? "bg-blue-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Parque Norte
          </button>
        </div>
      </div>

      {/* Filtro por tipo de incidencia */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Filtrar por Tipo
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedTypeFilter("Todas")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "Todas"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Todos los Tipos
          </button>
          <button
            onClick={() => setSelectedTypeFilter("vehiculo")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "vehiculo"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Vehículos
          </button>
          <button
            onClick={() => setSelectedTypeFilter("personal")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "personal"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Personal
          </button>
          <button
            onClick={() => setSelectedTypeFilter("instalacion")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "instalacion"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Instalaciones
          </button>
          <button
            onClick={() => setSelectedTypeFilter("equipo")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "equipo"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Equipos
          </button>
          <button
            onClick={() => setSelectedTypeFilter("vestuario")}
            className={`px-4 py-2 rounded transition-colors ${selectedTypeFilter === "vestuario"
              ? "bg-indigo-600 text-white shadow-md"
              : `${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`
              }`}
          >
            Vestuario
          </button>
        </div>
      </div>

      {/* Tabla de Incidencias Pendientes - Nivel Alto */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4 bg-red-600 text-white p-2 rounded">
          Incidencias Pendientes - Nivel Alto
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th
                  className="py-2 px-2 cursor-pointer"
                  onClick={() => setPendingHighSortOrder(pendingHighSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  Fecha {pendingHighSortOrder === 'asc' ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
                </th>                <th className="py-2 px-2">Resolviendo</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingHigh.length > 0 ? (
                currentPendingHigh.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">{incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}</td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faHammer} title="Resolviendo" />
                      ) : (
                        <FontAwesomeIcon icon={faBan} title="No Resolviendo" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre ? (
                        <span>{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span>{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span>{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span>{incident.clothing_item.name}</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => openResolveModal(incident)}
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
                      {!incident.leido && (
                        <button
                          onClick={() => handleMarkAsRead(incident.id_incidencia)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Resolviendo
                        </button>
                      )}
                      {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                        <button
                          onClick={() => handleDelete(incident.id_incidencia)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Borrar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditIncident(incident);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center">
                    No hay incidencias pendientes de nivel alto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación para nivel Alto */}
        {totalHighPages > 1 && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setPendingHighPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingHighPage === 1}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Anterior
            </button>
            <span>
              Página {pendingHighPage} de {totalHighPages}
            </span>
            <button
              onClick={() => setPendingHighPage(prev => Math.min(prev + 1, totalHighPages))}
              disabled={pendingHighPage === totalHighPages}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Incidencias Pendientes - Nivel Medio */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4 bg-orange-500 text-white p-2 rounded">
          Incidencias Pendientes - Nivel Medio
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th
                  className="py-2 px-2 cursor-pointer"
                  onClick={() => setPendingMediumSortOrder(pendingMediumSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  Fecha {pendingMediumSortOrder === 'asc' ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
                </th>                <th className="py-2 px-2">Resolviendo</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingMedium.length > 0 ? (
                currentPendingMedium.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">{incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}</td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faHammer} title="Resolviendo" />
                      ) : (
                        <FontAwesomeIcon icon={faBan} title="No Resolviendo" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre ? (
                        <span>{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span>{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span>{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span>{incident.clothing_item.name}</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => openResolveModal(incident)}
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
                      {!incident.leido && (
                        <button
                          onClick={() => handleMarkAsRead(incident.id_incidencia)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Resolviendo
                        </button>
                      )}
                      {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                        <button
                          onClick={() => handleDelete(incident.id_incidencia)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Borrar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditIncident(incident);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center">
                    No hay incidencias pendientes de nivel medio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación para nivel Medio */}
        {totalMediumPages > 1 && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setPendingMediumPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingMediumPage === 1}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Anterior
            </button>
            <span>
              Página {pendingMediumPage} de {totalMediumPages}
            </span>
            <button
              onClick={() => setPendingMediumPage(prev => Math.min(prev + 1, totalMediumPages))}
              disabled={pendingMediumPage === totalMediumPages}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Incidencias Pendientes - Nivel Bajo */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4 bg-yellow-500 text-white p-2 rounded">
          Incidencias Pendientes - Nivel Bajo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th
                  className="py-2 px-2 cursor-pointer"
                  onClick={() => setPendingLowSortOrder(pendingLowSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  Fecha {pendingLowSortOrder === 'asc' ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
                </th>                <th className="py-2 px-2">Resolviendo</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingLow.length > 0 ? (
                currentPendingLow.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">{incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}</td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faHammer} title="Resolviendo" />
                      ) : (
                        <FontAwesomeIcon icon={faBan} title="No Resolviendo" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre ? (
                        <span>{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span>{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span>{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span>{incident.clothing_item.name}</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => openResolveModal(incident)}
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
                      {!incident.leido && (
                        <button
                          onClick={() => handleMarkAsRead(incident.id_incidencia)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Resolviendo
                        </button>
                      )}
                      {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                        <button
                          onClick={() => handleDelete(incident.id_incidencia)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Borrar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditIncident(incident);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center">
                    No hay incidencias pendientes de nivel bajo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación para nivel Bajo */}
        {totalLowPages > 1 && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setPendingLowPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingLowPage === 1}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Anterior
            </button>
            <span>
              Página {pendingLowPage} de {totalLowPages}
            </span>
            <button
              onClick={() => setPendingLowPage(prev => Math.min(prev + 1, totalLowPages))}
              disabled={pendingLowPage === totalLowPages}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Incidencias Resueltas */}
      <div className={`p-4 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4 bg-green-600 text-white p-2 rounded">
          Incidencias Resueltas - {formattedMonthName}
        </h2>
        {/* Controles para filtrar por mes */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              setCurrentMonth(prev => Math.max(prev - 1, 0));
              setResolvedCurrentPage(1); // reiniciar paginación
            }}
            disabled={currentMonth === 0}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            Mes Anterior
          </button>
          <span className="font-bold">{formattedMonthName}</span>
          <button
            onClick={() => {
              setCurrentMonth(prev => Math.min(prev + 1, 11));
              setResolvedCurrentPage(1);
            }}
            disabled={currentMonth === 11}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            Mes Siguiente
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Creado por</th>
                <th className="py-2 px-2">Tipo</th>
                <th
                  className="py-2 px-2 cursor-pointer"
                  onClick={() => setResolvedSortOrder(resolvedSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  Fecha {resolvedSortOrder === 'asc' ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
                </th>
                <th className="py-2 px-2">Resolviendo</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Extras</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentResolvedIncidents.length > 0 ? (
                currentResolvedIncidents.map((incident) => (
                  <tr key={incident.id_incidencia} className="border-b border-gray-700">
                    <td className="py-2 px-2">{getCreatorName(incident)}</td>
                    <td className="py-2 px-2">{incident.tipo.charAt(0).toUpperCase() + incident.tipo.slice(1)}</td>
                    <td className="py-2 px-2">{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className="py-2 px-2">
                      {incident.leido ? (
                        <FontAwesomeIcon icon={faHammer} title="Resolviendo" />
                      ) : (
                        <FontAwesomeIcon icon={faBan} title="No Resolviendo" />
                      )}
                    </td>
                    <td className="py-2 px-2">{incident.park ? incident.park.nombre : incident.id_parque}</td>
                    <td className="py-2 px-2">
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre ? (
                        <span>{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span>{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span>{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span>{incident.clothing_item.name}</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 flex space-x-2">
                      <button
                        onClick={() => openDetailModal(incident)}
                        className="bg-gray-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>Detalle</span>
                      </button>
                      {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                        <button
                          onClick={() => handleDelete(incident.id_incidencia)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Borrar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditIncident(incident);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        <span>Editar</span>
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
        {/* Controles de paginación para incidencias resueltas */}
        {totalResolvedPages > 1 && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setResolvedCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={resolvedCurrentPage === 1}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Anterior
            </button>
            <span>
              Página {resolvedCurrentPage} de {totalResolvedPages}
            </span>
            <button
              onClick={() => setResolvedCurrentPage(prev => Math.min(prev + 1, totalResolvedPages))}
              disabled={resolvedCurrentPage === totalResolvedPages}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
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
      {isEditModalOpen && editIncident && (
        <EditIncidentModal
          isOpen={isEditModalOpen}
          incident={editIncident}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={fetchIncidents}
        />
      )}

      {isResolveModalOpen && (
        <ResolveIncidentModal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          resolutionText={resolutionText}
          setResolutionText={setResolutionText}
          onSubmit={handleResolveSubmit}
        />
      )}

    </div>
  );
};

export default IncidentListPage;
