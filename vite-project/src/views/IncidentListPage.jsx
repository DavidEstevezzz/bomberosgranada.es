import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEyeSlash, faTimes, faEdit, faPlus, faInfoCircle,
  faHammer, faStop, faBan, faArrowDown, faArrowUp, faFilePdf,
  faCheckCircle, faTrash, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
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
import MarkResolvingModal from '../components/MarkResolvingModal';


const IncidentListPage = () => {
  // Estados generales
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  // Estados de ordenación
  const [pendingHighSortOrder, setPendingHighSortOrder] = useState('asc');
  const [pendingMediumSortOrder, setPendingMediumSortOrder] = useState('asc');
  const [pendingLowSortOrder, setPendingLowSortOrder] = useState('asc');
  const [resolvedSortOrder, setResolvedSortOrder] = useState('asc');

  // Estados de modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionText, setResolutionText] = useState("");

  // Filtros
  const [selectedParkFilter, setSelectedParkFilter] = useState("Todas");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Todas");

  // Estados para incidencias resueltas (filtradas por mes)
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [resolvedCurrentPage, setResolvedCurrentPage] = useState(1);
  const resolvedItemsPerPage = 5;

  // Estados para paginación de incidencias pendientes
  const pendingItemsPerPage = 10;
  const [pendingHighPage, setPendingHighPage] = useState(1);
  const [pendingMediumPage, setPendingMediumPage] = useState(1);
  const [pendingLowPage, setPendingLowPage] = useState(1);

  // Estados para ordenación por extras
  const [pendingHighExtrasSortOrder, setPendingHighExtrasSortOrder] = useState('asc');
  const [pendingMediumExtrasSortOrder, setPendingMediumExtrasSortOrder] = useState('asc');
  const [pendingLowExtrasSortOrder, setPendingLowExtrasSortOrder] = useState('asc');
  const [resolvedExtrasSortOrder, setResolvedExtrasSortOrder] = useState('asc');

  // Estados para controlar qué columna está activa para ordenar
  const [pendingHighSortBy, setPendingHighSortBy] = useState('fecha');
  const [pendingMediumSortBy, setPendingMediumSortBy] = useState('fecha');
  const [pendingLowSortBy, setPendingLowSortBy] = useState('fecha');
  const [resolvedSortBy, setResolvedSortBy] = useState('fecha');

  const [isMarkResolvingModalOpen, setIsMarkResolvingModalOpen] = useState(false);
  const [resolvingText, setResolvingText] = useState("");

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

  // Funciones auxiliares
  const getCreatorName = (incident) =>
    incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : incident.id_empleado;

  const getEmployee2Name = (incident) =>
    incident.employee2 ? `${incident.employee2.nombre} ${incident.employee2.apellido}` : '';

  const normalizeTypeName = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'vehiculo': return 'Vehículo';
      case 'personal': return 'Personal';
      case 'instalacion': return 'Instalación';
      case 'equipo': return 'Equipos Personales';
      case 'vestuario': return 'Vestuario';
      case 'equipos_comunes': return 'Equipos Comunes';
      default: return tipo?.charAt(0).toUpperCase() + tipo?.slice(1) || '';
    }
  };

  const getExtraValue = (incident) => {
    if (incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle && incident.vehicle.nombre) {
      return incident.vehicle.nombre;
    } else if (incident.tipo.toLowerCase() === 'personal' && incident.employee2) {
      return getEmployee2Name(incident);
    } else if (incident.tipo.toLowerCase() === 'equipo' && incident.equipment) {
      return incident.equipment.nombre;
    } else if (incident.tipo.toLowerCase() === 'equipos_comunes' && incident.nombre_equipo) {
      return incident.nombre_equipo;
    } else if (incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item) {
      return incident.clothing_item.name;
    }
    return '';
  };

  const sortByExtras = (array, order) => {
    return [...array].sort((a, b) => {
      const extraA = getExtraValue(a).toLowerCase();
      const extraB = getExtraValue(b).toLowerCase();
      return order === 'asc' ? extraA.localeCompare(extraB) : extraB.localeCompare(extraA);
    });
  };

  const sortIncidents = (array, sortBy, order) => {
    if (sortBy === 'fecha') {
      return sortByFecha(array, order);
    } else if (sortBy === 'extras') {
      return sortByExtras(array, order);
    }
    return array;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;
    doc.setFontSize(16);
    doc.text(`Incidencias No Resueltas - ${selectedParkFilter}`, 14, yOffset);
    yOffset += 10;

    const tableData = [];
    pendingIncidents.forEach(incident => {
      let extraInfo = getExtraValue(incident);
      tableData.push({
        fecha: dayjs(incident.fecha).format('DD/MM/YYYY'),
        descripcion: incident.descripcion,
        tipo: normalizeTypeName(incident.tipo),
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
      fetchIncidents();
    } catch (err) {
      console.error("Error al resolver la incidencia: ", err);
    }
  };

  const handleMarkAsRead = async (incidentId) => {
    try {
      await IncidentApiService.markAsRead(incidentId);
      fetchIncidents();
    } catch (err) {
      console.error("Error al marcar incidencia como leída:", err);
    }
  };

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

  const handleMarkResolvingSubmit = async () => {
    try {
      const updateData = {
        ...selectedIncident,
        resolviendo: resolvingText || "", // Acepta vacío
        leido: true,
      };
      await IncidentApiService.updateIncident(selectedIncident.id_incidencia, updateData);
      setIsMarkResolvingModalOpen(false);
      setResolvingText("");
      fetchIncidents();
    } catch (err) {
      console.error("Error al marcar incidencia como resolviendo: ", err);
    }
  };

  const openDetailModal = (incident) => {
    setDetailIncident(incident);
    setIsDetailModalOpen(true);
  };

  // Filtrar incidencias
  const filteredIncidents = incidents.filter((incident) => {
    const matchesPark = selectedParkFilter === "Todas" ||
      (incident.park && incident.park.nombre.toLowerCase() === selectedParkFilter.toLowerCase());
    const matchesType = selectedTypeFilter === "Todas" ||
      (incident.tipo && incident.tipo.toLowerCase() === selectedTypeFilter.toLowerCase());
    return matchesPark && matchesType;
  });

  // Separar pendientes y resueltas
  const pendingIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'pendiente'
  );
  const resolvedIncidents = filteredIncidents.filter(
    (incident) => incident.estado.toLowerCase() === 'resuelta'
  );

  // Incidencias resueltas filtradas por mes
  const filteredResolvedIncidents = resolvedIncidents.filter((incident) =>
    dayjs(incident.fecha).month() === currentMonth
  );
  const sortedResolvedIncidents = sortIncidents(
    filteredResolvedIncidents,
    resolvedSortBy,
    resolvedSortBy === 'fecha' ? resolvedSortOrder : resolvedExtrasSortOrder
  );
  const totalResolvedPages = Math.ceil(sortedResolvedIncidents.length / resolvedItemsPerPage);
  const resolvedIndexOfLast = resolvedCurrentPage * resolvedItemsPerPage;
  const resolvedIndexOfFirst = resolvedIndexOfLast - resolvedItemsPerPage;
  const currentResolvedIncidents = sortedResolvedIncidents.slice(resolvedIndexOfFirst, resolvedIndexOfLast);

  const monthName = dayjs().month(currentMonth).format('MMMM');
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Dividir pendientes por nivel
  const pendingHigh = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'alto'
  );
  const pendingMedium = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'medio'
  );
  const pendingLow = pendingIncidents.filter(
    (incident) => incident.nivel && incident.nivel.toLowerCase() === 'bajo'
  );

  // Paginación para nivel Alto
  const totalHighPages = Math.ceil(pendingHigh.length / pendingItemsPerPage);
  const highIndexOfLast = pendingHighPage * pendingItemsPerPage;
  const highIndexOfFirst = highIndexOfLast - pendingItemsPerPage;
  const sortedPendingHigh = sortIncidents(
    pendingHigh,
    pendingHighSortBy,
    pendingHighSortBy === 'fecha' ? pendingHighSortOrder : pendingHighExtrasSortOrder
  );
  const currentPendingHigh = sortedPendingHigh.slice(highIndexOfFirst, highIndexOfLast);

  // Paginación para nivel Medio
  const totalMediumPages = Math.ceil(pendingMedium.length / pendingItemsPerPage);
  const mediumIndexOfLast = pendingMediumPage * pendingItemsPerPage;
  const mediumIndexOfFirst = mediumIndexOfLast - pendingItemsPerPage;
  const sortedPendingMedium = sortIncidents(
    pendingMedium,
    pendingMediumSortBy,
    pendingMediumSortBy === 'fecha' ? pendingMediumSortOrder : pendingMediumExtrasSortOrder
  );
  const currentPendingMedium = sortedPendingMedium.slice(mediumIndexOfFirst, mediumIndexOfLast);

  // Paginación para nivel Bajo
  const totalLowPages = Math.ceil(pendingLow.length / pendingItemsPerPage);
  const lowIndexOfLast = pendingLowPage * pendingItemsPerPage;
  const lowIndexOfFirst = lowIndexOfLast - pendingItemsPerPage;
  const sortedPendingLow = sortIncidents(
    pendingLow,
    pendingLowSortBy,
    pendingLowSortBy === 'fecha' ? pendingLowSortOrder : pendingLowExtrasSortOrder
  );
  const currentPendingLow = sortedPendingLow.slice(lowIndexOfFirst, lowIndexOfLast);

  // ESTILOS MODERNOS
  const containerClass = `min-h-screen space-y-6 ${darkMode ? 'bg-gray-800 text-slate-100' : 'bg-gray-100 text-slate-900'}`;
  const headerClass = `rounded-3xl border p-8 ${darkMode
    ? 'border-slate-800 bg-gradient-to-r from-primary-900/50 via-primary-800/50 to-primary-700/50'
    : 'border-slate-200 bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50'
    }`;

  const buttonPrimaryClass = `inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg ${darkMode
    ? 'bg-primary-600 text-white hover:bg-primary-500'
    : 'bg-primary-600 text-white hover:bg-primary-500'
    }`;

  const buttonSecondaryClass = `inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${darkMode
    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
    }`;

  const filterButtonClass = (isActive) => `
    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive
      ? 'bg-primary-600 text-white shadow-lg scale-105'
      : darkMode
        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
    }
  `;

  const tableContainerClass = `rounded-3xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
    }`;

  const tableHeaderClass = (bgColor) => `
    px-6 py-4 text-white font-semibold text-lg ${bgColor}
  `;

  const tableClass = `w-full ${darkMode ? 'text-slate-200' : 'text-slate-900'}`;

  const thClass = `px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider ${darkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-slate-50 text-slate-600'
    }`;

  const tdClass = `px-4 py-3 text-sm ${darkMode ? 'border-slate-800' : 'border-slate-200'} border-b`;

  const actionButtonClass = (variant) => {
    const variants = {
      success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      info: 'bg-slate-600 hover:bg-slate-500 text-white',
      warning: 'bg-amber-600 hover:bg-amber-500 text-white',
      danger: 'bg-red-600 hover:bg-red-500 text-white',
      primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    };
    return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${variants[variant]}`;
  };

  const paginationClass = `flex items-center justify-center gap-4 mt-6 px-6 pb-6`;

  const paginationButtonClass = (disabled) => `
    rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200
    ${disabled
      ? darkMode
        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
      : darkMode
        ? 'bg-primary-600 text-white hover:bg-primary-500'
        : 'bg-primary-600 text-white hover:bg-primary-500'
    }
  `;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Cargando incidencias...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`rounded-3xl border p-8 max-w-md ${darkMode ? 'border-red-900 bg-red-950/50' : 'border-red-200 bg-red-50'
          }`}>
          <p className={`text-sm font-semibold ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
            Error: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className={headerClass}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${darkMode ? 'text-primary-300' : 'text-primary-600'
              }`}>
              Gestión de Incidencias
            </p>
            <h1 className={`mt-2 text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Incidencias
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setIsAddModalOpen(true)} className={buttonPrimaryClass}>
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              <span>Nueva Incidencia</span>
            </button>
            <button onClick={exportPDF} className={buttonSecondaryClass}>
              <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`rounded-3xl border p-6 space-y-6 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}>
        {/* Filtro por Parque */}
        <div>
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Filtrar por Parque
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedParkFilter("Todas")}
              className={filterButtonClass(selectedParkFilter === "Todas")}
            >
              Todos los Parques
            </button>
            <button
              onClick={() => setSelectedParkFilter("Parque Sur")}
              className={filterButtonClass(selectedParkFilter === "Parque Sur")}
            >
              Parque Sur
            </button>
            <button
              onClick={() => setSelectedParkFilter("Parque Norte")}
              className={filterButtonClass(selectedParkFilter === "Parque Norte")}
            >
              Parque Norte
            </button>
          </div>
        </div>

        {/* Filtro por Tipo */}
        <div>
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Filtrar por Tipo
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Todas', 'vehiculo', 'personal', 'instalacion', 'equipo', 'vestuario', 'equipos_comunes'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={filterButtonClass(selectedTypeFilter === type)}
              >
                {type === 'Todas' ? 'Todos los Tipos' : normalizeTypeName(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Nivel Alto */}
      <div className={tableContainerClass}>
        <div className={tableHeaderClass('bg-red-600')}>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
            <span>Incidencias Pendientes - Nivel Alto</span>
            {pendingHigh.length > 0 && (
              <span className="ml-auto inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
                {pendingHigh.length}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Creado por</th>
                <th className={thClass}>Tipo</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingHighSortBy === 'fecha') {
                      setPendingHighSortOrder(pendingHighSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingHighSortBy('fecha');
                      setPendingHighSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    {pendingHighSortBy === 'fecha' && (
                      <FontAwesomeIcon icon={pendingHighSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Resolviendo</th>
                <th className={thClass}>Parque</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingHighSortBy === 'extras') {
                      setPendingHighExtrasSortOrder(pendingHighExtrasSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingHighSortBy('extras');
                      setPendingHighExtrasSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Detalles
                    {pendingHighSortBy === 'extras' && (
                      <FontAwesomeIcon icon={pendingHighExtrasSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingHigh.length > 0 ? (
                currentPendingHigh.map((incident) => (
                  <tr key={incident.id_incidencia} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                    <td className={tdClass}>{getCreatorName(incident)}</td>
                    <td className={tdClass}>
                      <span className="inline-flex px-2 py-1 rounded-lg bg-slate-700 text-white text-sm font-medium">
                        {normalizeTypeName(incident.tipo)}
                      </span>
                    </td>
                    <td className={tdClass}>{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className={tdClass}>
                      {incident.resolviendo ? (
                        <span className="text-amber-500 text-sm">● En progreso</span>
                      ) : (
                        <span className="text-slate-400 text-sm">○ No resolviendo</span>
                      )}
                    </td>
                    <td className={tdClass}>{incident.park?.nombre || 'N/A'}</td>
                    <td className={tdClass}>
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle ? (
                        <span className="text-sm">{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span className="text-sm">{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span className="text-sm">{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span className="text-sm">{incident.clothing_item.name}</span>
                      ) : incident.tipo.toLowerCase() === 'equipos_comunes' && incident.nombre_equipo ? (
                        <span className="text-sm">{incident.nombre_equipo}</span>
                      ) : null}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openResolveModal(incident)} className={actionButtonClass('success')}>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span className="hidden sm:inline">Resolver</span>
                        </button>
                        <button onClick={() => openDetailModal(incident)} className={actionButtonClass('info')}>
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        {!incident.resolviendo && (
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsMarkResolvingModalOpen(true);
                            }}
                            className={actionButtonClass('warning')}
                          >
                            <FontAwesomeIcon icon={faHammer} />
                            <span className="hidden sm:inline">Resolviendo</span>
                          </button>
                        )}
                        {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                          <button onClick={() => handleDelete(incident.id_incidencia)} className={actionButtonClass('danger')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditIncident(incident);
                            setIsEditModalOpen(true);
                          }}
                          className={actionButtonClass('primary')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`${tdClass} text-center py-8`}>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      No hay incidencias pendientes de nivel alto
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalHighPages > 1 && (
          <div className={paginationClass}>
            <button
              onClick={() => setPendingHighPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingHighPage === 1}
              className={paginationButtonClass(pendingHighPage === 1)}
            >
              Anterior
            </button>
            <span className="text-sm font-medium">
              Página {pendingHighPage} de {totalHighPages}
            </span>
            <button
              onClick={() => setPendingHighPage(prev => Math.min(prev + 1, totalHighPages))}
              disabled={pendingHighPage === totalHighPages}
              className={paginationButtonClass(pendingHighPage === totalHighPages)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla Nivel Medio */}
      <div className={tableContainerClass}>
        <div className={tableHeaderClass('bg-orange-500')}>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
            <span>Incidencias Pendientes - Nivel Medio</span>
            {pendingMedium.length > 0 && (
              <span className="ml-auto inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
                {pendingMedium.length}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Creado por</th>
                <th className={thClass}>Tipo</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingMediumSortBy === 'fecha') {
                      setPendingMediumSortOrder(pendingMediumSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingMediumSortBy('fecha');
                      setPendingMediumSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    {pendingMediumSortBy === 'fecha' && (
                      <FontAwesomeIcon icon={pendingMediumSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Resolviendo</th>
                <th className={thClass}>Parque</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingMediumSortBy === 'extras') {
                      setPendingMediumExtrasSortOrder(pendingMediumExtrasSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingMediumSortBy('extras');
                      setPendingMediumExtrasSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Detalles
                    {pendingMediumSortBy === 'extras' && (
                      <FontAwesomeIcon icon={pendingMediumExtrasSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingMedium.length > 0 ? (
                currentPendingMedium.map((incident) => (
                  <tr key={incident.id_incidencia} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                    <td className={tdClass}>{getCreatorName(incident)}</td>
                    <td className={tdClass}>
                      <span className="inline-flex px-2 py-1 rounded-lg bg-slate-700 text-white text-sm font-medium">
                        {normalizeTypeName(incident.tipo)}
                      </span>
                    </td>
                    <td className={tdClass}>{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className={tdClass}>
                      {incident.resolviendo ? (
                        <span className="text-amber-500 text-sm">● En progreso</span>
                      ) : (
                        <span className="text-slate-400 text-sm">○ No resolviendo</span>
                      )}
                    </td>
                    <td className={tdClass}>{incident.park?.nombre || 'N/A'}</td>
                    <td className={tdClass}>
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle ? (
                        <span className="text-sm">{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span className="text-sm">{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span className="text-sm">{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span className="text-sm">{incident.clothing_item.name}</span>
                      ) : incident.tipo.toLowerCase() === 'equipos_comunes' && incident.nombre_equipo ? (
                        <span className="text-sm">{incident.nombre_equipo}</span>
                      ) : null}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openResolveModal(incident)} className={actionButtonClass('success')}>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span className="hidden sm:inline">Resolver</span>
                        </button>
                        <button onClick={() => openDetailModal(incident)} className={actionButtonClass('info')}>
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        {!incident.resolviendo && (
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsMarkResolvingModalOpen(true);
                            }}
                            className={actionButtonClass('warning')}
                          >
                            <FontAwesomeIcon icon={faHammer} />
                            <span className="hidden sm:inline">Resolviendo</span>
                          </button>
                        )}
                        {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                          <button onClick={() => handleDelete(incident.id_incidencia)} className={actionButtonClass('danger')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditIncident(incident);
                            setIsEditModalOpen(true);
                          }}
                          className={actionButtonClass('primary')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`${tdClass} text-center py-8`}>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      No hay incidencias pendientes de nivel medio
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalMediumPages > 1 && (
          <div className={paginationClass}>
            <button
              onClick={() => setPendingMediumPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingMediumPage === 1}
              className={paginationButtonClass(pendingMediumPage === 1)}
            >
              Anterior
            </button>
            <span className="text-sm font-medium">
              Página {pendingMediumPage} de {totalMediumPages}
            </span>
            <button
              onClick={() => setPendingMediumPage(prev => Math.min(prev + 1, totalMediumPages))}
              disabled={pendingMediumPage === totalMediumPages}
              className={paginationButtonClass(pendingMediumPage === totalMediumPages)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla Nivel Bajo */}
      <div className={tableContainerClass}>
        <div className={tableHeaderClass('bg-yellow-500')}>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
            <span>Incidencias Pendientes - Nivel Bajo</span>
            {pendingLow.length > 0 && (
              <span className="ml-auto inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
                {pendingLow.length}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Creado por</th>
                <th className={thClass}>Tipo</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingLowSortBy === 'fecha') {
                      setPendingLowSortOrder(pendingLowSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingLowSortBy('fecha');
                      setPendingLowSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    {pendingLowSortBy === 'fecha' && (
                      <FontAwesomeIcon icon={pendingLowSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Resolviendo</th>
                <th className={thClass}>Parque</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (pendingLowSortBy === 'extras') {
                      setPendingLowExtrasSortOrder(pendingLowExtrasSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setPendingLowSortBy('extras');
                      setPendingLowExtrasSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Detalles
                    {pendingLowSortBy === 'extras' && (
                      <FontAwesomeIcon icon={pendingLowExtrasSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingLow.length > 0 ? (
                currentPendingLow.map((incident) => (
                  <tr key={incident.id_incidencia} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                    <td className={tdClass}>{getCreatorName(incident)}</td>
                    <td className={tdClass}>
                      <span className="inline-flex px-2 py-1 rounded-lg bg-slate-700 text-white text-sm font-medium">
                        {normalizeTypeName(incident.tipo)}
                      </span>
                    </td>
                    <td className={tdClass}>{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className={tdClass}>
                      {incident.resolviendo ? (
                        <span className="text-amber-500 text-sm">● En progreso</span>
                      ) : (
                        <span className="text-slate-400 text-sm">○ No resolviendo</span>
                      )}
                    </td>
                    <td className={tdClass}>{incident.park?.nombre || 'N/A'}</td>
                    <td className={tdClass}>
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle ? (
                        <span className="text-sm">{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span className="text-sm">{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span className="text-sm">{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span className="text-sm">{incident.clothing_item.name}</span>
                      ) : incident.tipo.toLowerCase() === 'equipos_comunes' && incident.nombre_equipo ? (
                        <span className="text-sm">{incident.nombre_equipo}</span>
                      ) : null}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openResolveModal(incident)} className={actionButtonClass('success')}>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span className="hidden sm:inline">Resolver</span>
                        </button>
                        <button onClick={() => openDetailModal(incident)} className={actionButtonClass('info')}>
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        {!incident.resolviendo && (
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsMarkResolvingModalOpen(true);
                            }}
                            className={actionButtonClass('warning')}
                          >
                            <FontAwesomeIcon icon={faHammer} />
                            <span className="hidden sm:inline">Resolviendo</span>
                          </button>
                        )}
                        {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                          <button onClick={() => handleDelete(incident.id_incidencia)} className={actionButtonClass('danger')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditIncident(incident);
                            setIsEditModalOpen(true);
                          }}
                          className={actionButtonClass('primary')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`${tdClass} text-center py-8`}>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      No hay incidencias pendientes de nivel bajo
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalLowPages > 1 && (
          <div className={paginationClass}>
            <button
              onClick={() => setPendingLowPage(prev => Math.max(prev - 1, 1))}
              disabled={pendingLowPage === 1}
              className={paginationButtonClass(pendingLowPage === 1)}
            >
              Anterior
            </button>
            <span className="text-sm font-medium">
              Página {pendingLowPage} de {totalLowPages}
            </span>
            <button
              onClick={() => setPendingLowPage(prev => Math.min(prev + 1, totalLowPages))}
              disabled={pendingLowPage === totalLowPages}
              className={paginationButtonClass(pendingLowPage === totalLowPages)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Tabla Incidencias Resueltas */}
      <div className={tableContainerClass}>
        <div className={tableHeaderClass('bg-emerald-600')}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
              <span>Incidencias Resueltas - {formattedMonthName}</span>
              {currentResolvedIncidents.length > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
                  {sortedResolvedIncidents.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentMonth(prev => Math.max(prev - 1, 0));
                  setResolvedCurrentPage(1);
                }}
                disabled={currentMonth === 0}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentMonth === 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
              >
                ← Anterior
              </button>
              <span className="text-sm font-semibold">{formattedMonthName}</span>
              <button
                onClick={() => {
                  setCurrentMonth(prev => Math.min(prev + 1, 11));
                  setResolvedCurrentPage(1);
                }}
                disabled={currentMonth === 11}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentMonth === 11
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Creado por</th>
                <th className={thClass}>Tipo</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (resolvedSortBy === 'fecha') {
                      setResolvedSortOrder(resolvedSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setResolvedSortBy('fecha');
                      setResolvedSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    {resolvedSortBy === 'fecha' && (
                      <FontAwesomeIcon icon={resolvedSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Resuelto por</th>
                <th className={thClass}>Parque</th>
                <th
                  className={`${thClass} cursor-pointer hover:bg-slate-700/50`}
                  onClick={() => {
                    if (resolvedSortBy === 'extras') {
                      setResolvedExtrasSortOrder(resolvedExtrasSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setResolvedSortBy('extras');
                      setResolvedExtrasSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Detalles
                    {resolvedSortBy === 'extras' && (
                      <FontAwesomeIcon icon={resolvedExtrasSortOrder === 'asc' ? faArrowUp : faArrowDown} className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className={thClass}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentResolvedIncidents.length > 0 ? (
                currentResolvedIncidents.map((incident) => (
                  <tr key={incident.id_incidencia} className={darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                    <td className={tdClass}>{getCreatorName(incident)}</td>
                    <td className={tdClass}>
                      <span className="inline-flex px-2 py-1 rounded-lg bg-emerald-700/20 text-emerald-400 text-sm font-medium">
                        {normalizeTypeName(incident.tipo)}
                      </span>
                    </td>
                    <td className={tdClass}>{dayjs(incident.fecha).format('DD/MM/YYYY')}</td>
                    <td className={tdClass}>
                      {incident.resolver ? `${incident.resolver.nombre} ${incident.resolver.apellido}` : 'N/A'}
                    </td>
                    <td className={tdClass}>{incident.park?.nombre || 'N/A'}</td>
                    <td className={tdClass}>
                      {incident.tipo.toLowerCase() === 'vehiculo' && incident.vehicle ? (
                        <span className="text-sm">{incident.vehicle.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'personal' && incident.employee2 ? (
                        <span className="text-sm">{getEmployee2Name(incident)}</span>
                      ) : incident.tipo.toLowerCase() === 'equipo' && incident.equipment ? (
                        <span className="text-sm">{incident.equipment.nombre}</span>
                      ) : incident.tipo.toLowerCase() === 'vestuario' && incident.clothing_item ? (
                        <span className="text-sm">{incident.clothing_item.name}</span>
                      ) : incident.tipo.toLowerCase() === 'equipos_comunes' && incident.nombre_equipo ? (
                        <span className="text-sm">{incident.nombre_equipo}</span>
                      ) : null}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openDetailModal(incident)} className={actionButtonClass('info')}>
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        {(user?.type === 'jefe' || incident.id_empleado === user?.id_empleado) && (
                          <button onClick={() => handleDelete(incident.id_incidencia)} className={actionButtonClass('danger')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditIncident(incident);
                            setIsEditModalOpen(true);
                          }}
                          className={actionButtonClass('primary')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`${tdClass} text-center py-8`}>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      No hay incidencias resueltas en {formattedMonthName}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalResolvedPages > 1 && (
          <div className={paginationClass}>
            <button
              onClick={() => setResolvedCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={resolvedCurrentPage === 1}
              className={paginationButtonClass(resolvedCurrentPage === 1)}
            >
              Anterior
            </button>
            <span className="text-sm font-medium">
              Página {resolvedCurrentPage} de {totalResolvedPages}
            </span>
            <button
              onClick={() => setResolvedCurrentPage(prev => Math.min(prev + 1, totalResolvedPages))}
              disabled={resolvedCurrentPage === totalResolvedPages}
              className={paginationButtonClass(resolvedCurrentPage === totalResolvedPages)}
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
      {isMarkResolvingModalOpen && (
        <MarkResolvingModal
          isOpen={isMarkResolvingModalOpen}
          onClose={() => setIsMarkResolvingModalOpen(false)}
          resolvingText={resolvingText}
          setResolvingText={setResolvingText}
          onSubmit={handleMarkResolvingSubmit}
        />
      )}
    </div>
  );
};

export default IncidentListPage;