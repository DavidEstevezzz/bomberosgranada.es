import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import GuardAssignmentApiService from '../services/GuardAssignmentApiService';
import ShiftChangeRequestApiService from '../services/ShiftChangeRequestApiService';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import AddGuardCommentsModal from './AddGuardCommentsModal';
import AddDailyActivitiesModal from './AddDailyActivitiesModal';
import InterventionsTable from './InterventionsTable.jsx';
import AddInterventionModal from './AddInterventionModal';
import EditInterventionModal from './EditInterventionModal';
import InterventionApiService from '../services/InterventionApiService';
import AssignFirefighterModal from './AssignFirefighterModal';
import ExtendWorkingDayModal from './ExtendWorkingDayModal';
import AssignFirefighterToBajasModal from './AssignFirefighterToBajasModal.jsx';
import RequireFirefighterModal from './RequireFirefighterModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../assets/logo.png';
import { useStateContext } from '../contexts/ContextProvider.jsx';
import { useDarkMode } from '../contexts/DarkModeContext';


const BrigadeDetail = () => {
  const { user } = useStateContext();
  const { id_brigada } = useParams();
  const [brigade, setBrigade] = useState(null);
  const [guardDetails, setGuardDetails] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [comentarios, setComentarios] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [incidenciasPersonal, setIncidenciasPersonal] = useState('');
  const [showAssignFirefighterToBajasModal, setShowAssignFirefighterToBajasModal] = useState(false);
  const [showRequireFirefighterModal, setShowRequireFirefighterModal] = useState(false);
  const [showAssignFirefighterModal, setShowAssignFirefighterModal] = useState(false);
  const [isUpdatingPersonal, setIsUpdatingPersonal] = useState(false);
  const [isResettingEquipments, setIsResettingEquipments] = useState(false);
  const [showExtendWorkingDayModal, setShowExtendWorkingDayModal] = useState(false);
  const [incidenciasGenerales, setIncidenciasGenerales] = useState('');
  const [isUpdatingGenerales, setIsUpdatingGenerales] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();


  // Mínimos y prioridad para puestos
  const minimums = {
    1: { Subinspector: 1, Oficial: 1, Operador: 2, Conductor: 3, Bombero: 6 },
    2: { Subinspector: 1, Oficial: 1, Operador: 0, Conductor: 3, Bombero: 6 },
  };
  const puestoPriority = {
    Subinspector: 1,
    Oficial: 2,
    Operador: 3,
    Conductor: 4,
    Bombero: 5,
  };


  const [showAddInterventionModal, setShowAddInterventionModal] = useState(false);
  const [showEditInterventionModal, setShowEditInterventionModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [refreshInterventions, setRefreshInterventions] = useState(false);
  const [assignedRadioNumbers, setAssignedRadioNumbers] = useState(new Set());
  const [changeRequestsInfo, setChangeRequestsInfo] = useState({});



  const handleEditIntervention = (intervention) => {
    setSelectedIntervention(intervention);
    setShowEditInterventionModal(true);
  };

  const handleDeleteIntervention = async (parte) => {
    try {
      await InterventionApiService.deleteIntervention(parte);
      setRefreshInterventions((prev) => !prev);
    } catch (error) {
      console.error('Error al borrar la intervención:', error);
      alert('Error al borrar la intervención');
    }
  };

  // Mapeo para vehículos (para turno Mañana y variantes)
  const vehicleMappingNorte = {
    'B1': 'BUL-3-7 / BRP-1',
    'B2': 'BUL-3-7 / BRP-1',
    'B3': 'FSV-3 / BIP-1 / BUL-1 / UMC-1 / UPI-1',
    'B4': 'FSV-3 / BIP-1 / BUL-1 / UMC-1 / UPI-1',
    'B5': 'AEA-3 / VAT-1 / UBH-1 / UPC-1-3 / BNP-1',
    'B6': 'AEA-3 / VAT-1 / UBH-1 / UPC-1-3 / BNP-1',
    'B7': 'Apoyo equipo 2 (B3 y B4)',
    'B8': 'Apoyo equipo 3 (B5 y B6)',
    'B9': 'Apoyo',
    'C1': 'BUL-1-3 / BRP-1 / UPC-1-3',
    'C2': 'AEA-3 / UBH-1 / BIP-1 / UPI-1',
    'C3': 'FSV-3 / UMC-1 / BNP-1 / BUL-7 / VAT-1',
    'C4': 'Apoyo',
    'C5': 'Apoyo',
  };

  const vehicleMappingSur = {
    'B1': 'BUL-4-6 / BRP-2',
    'B2': 'BUL-4-6 / BRP-2',
    'B3': 'FSV-4 / BIP-2 / BUL-2 / UMC-2 / UP-2',
    'B4': 'FSV-4 / BIP-2 / BUL-2 / UMC-2 / UP-2',
    'B5': 'AEA-4-6 / VAT-2 / UBH-2 / UPC-2',
    'B6': 'AEA-4-6 / VAT-2 / UBH-2 / UPC-2',
    'B7': 'Apoyo equipo 2 (B3 y B4)',
    'B8': 'Apoyo equipo 3 (B5 y B6)',
    'B9': 'Apoyo',
    'C1': 'BUL-2-4 / BRP-2 / UPC-2',
    'C2': 'AEA-4-6 / UBH-2 / UPI-2',
    'C3': 'FSV-4 / BIP-2 / UMC-2 / BUL-6 / VAT-2',
    'C4': 'Apoyo',
    'C5': 'Apoyo',
  };


  // Cálculo de colores según el nombre de la brigada (para exportar al PDF)
  let brigadeColor = '';
  let nameColor = '';
  switch (brigade?.nombre) {
    case 'Brigada A':
      brigadeColor = 'bg-green-500';
      nameColor = 'text-white';
      break;
    case 'Brigada B':
      brigadeColor = darkMode ? 'bg-slate-700' : 'bg-zinc-50';
      nameColor = darkMode ? 'text-slate-200' : 'text-slate-700';
      break;
    case 'Brigada C':
      brigadeColor = 'bg-blue-500';
      nameColor = 'text-white';
      break;
    case 'Brigada D':
      brigadeColor = 'bg-red-600';
      nameColor = 'text-white';
      break;
    case 'Brigada E':
      brigadeColor = 'bg-yellow-300';
      nameColor = darkMode ? 'text-slate-900' : 'text-slate-900';
      break;
    case 'Brigada F':
      brigadeColor = 'bg-gray-300';
      nameColor = 'text-gray-700';
      break;
    default:
      brigadeColor = '';
      nameColor = '';
  }






  const handleRefreshData = async () => {
    try {
      // Vuelve a consultar los bomberos y otros datos de la brigada.
      const response = await BrigadesApiService.getFirefightersByBrigadeDebouncing(id_brigada, selectedDate);
      if (response.data.brigade) {
        setBrigade(response.data.brigade);
      }
      const dataFF = Object.values(response.data.firefighters);
      setFirefighters(dataFF);
      const ids = [...new Set(dataFF.map(ff => ff.id_change_request).filter(id => id))];
      if (ids.length > 0) {
        try {
          const crRes = await ShiftChangeRequestApiService.getRequests();
          const map = {};
          crRes.data.forEach(req => {
            if (ids.includes(req.id)) {
              map[req.id] = {
                empleado1: req.empleado1,
                empleado2: req.empleado2,
              };
            }
          });
          setChangeRequestsInfo(map);
        } catch (err) {
          console.error('Error fetching change requests info:', err);
        }
      } else {
        setChangeRequestsInfo({});
      }
    } catch (error) {
      console.error('Error recargando datos:', error);
    }
  };

  /**
   * Función para resetear todas las asignaciones de equipos para el parque y fecha actuales
   */
  const handleResetEquipmentAssignments = async () => {
    if (!user || !['mando', 'jefe'].includes(user.type)) {
      return;
    }

    setIsResettingEquipments(true);
    try {
      const response = await PersonalEquipmentApiService.resetEquipmentAssignments(
        brigade?.park?.id_parque || 1,
        selectedDate
      );

      if (response && response.data && response.data.success) {
        //alert(`Asignaciones reseteadas correctamente: ${response.data.message}`);

        // Recargar datos para actualizar la interfaz
        handleRefreshData();
      } else {
        alert('Error al resetear las asignaciones de equipos');
      }
    } catch (error) {
      console.error('Error al resetear las asignaciones de equipos:', error);
      alert('Ha ocurrido un error al resetear las asignaciones de equipos');
    } finally {
      setIsResettingEquipments(false);
    }
  };

  const handlePersonalIncidentsSubmit = async () => {
    if (!user || !['jefe', 'mando'].includes(user.type)) return;
    setIsUpdatingPersonal(true);
    try {
      const response = await GuardsApiService.updatePersonalIncidents(
        id_brigada,
        selectedDate,
        incidenciasPersonal
      );
      setIncidenciasPersonal(response.data.incidencias_personal);
      // Puedes actualizar guardDetails si lo requieres:
      setGuardDetails(response.data.guard ? response.data.guard : response.data);
    } catch (error) {
      console.error('Error actualizando incidencias de personal:', error);
    } finally {
      setIsUpdatingPersonal(false);
    }
  };

  const handleGeneralIncidentsSubmit = async () => {
    if (!user || !['jefe', 'mando'].includes(user.type)) return;
    setIsUpdatingGenerales(true);
    try {
      const response = await GuardsApiService.updateGeneralIncidents(
        id_brigada,
        selectedDate,
        incidenciasGenerales
      );
      setIncidenciasGenerales(response.data.incidencias_generales);
      // Puedes actualizar guardDetails si lo requieres:
      setGuardDetails(response.data.guard ? response.data.guard : response.data);
    } catch (error) {
      console.error('Error actualizando incidencias generales:', error);
    } finally {
      setIsUpdatingGenerales(false);
    }
  };

  // Estado para asignaciones actuales y asignaciones previas (guard anterior: id_guard - 10)
  const [assignments, setAssignments] = useState({
    Mañana: {},
    Tarde: {},
    Noche: {},
  });
  const [prevAssignments, setPrevAssignments] = useState({
    Mañana: {},
    Tarde: {},
    Noche: {},
  });
  // Opciones de asignación (se permiten valores reutilizables)
  const options = ['N1', 'N2', 'N3', 'N4', 'S1', 'S2', 'S3', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'C1', 'C2', 'C3', 'C4', 'C5', 'Operador 1', 'Operador 2', 'Operador 3', 'Telefonista', 'Jefe de Guardia'];

  const getFilteredOptions = (puesto) => {
    if (puesto === "Bombero" && brigade.park.nombre.toLowerCase().includes("sur")) {
      // Para parque sur, se muestran las opciones que comienzan con "B" o "T" (incluye "Telefonista")
      return options.filter(opt => opt.startsWith("B") || opt.startsWith("T"));
    } else if (puesto === "Bombero") {
      // Para parque norte, solo se muestran opciones que comienzan con "B"
      return options.filter(opt => opt.startsWith("B"));
    } else if (puesto === "Conductor" && brigade.park.nombre.toLowerCase().includes("sur")) {
      return options.filter(opt => opt.startsWith("C") || opt.startsWith("T"));
    } else if (puesto === "Conductor") {
      return options.filter(opt => opt.startsWith("C"));
    } else if (puesto === "Operador") {
      return options.filter(opt => opt.toLowerCase().includes("operador"));
    } else if (puesto === "Subinspector" || puesto === "Oficial") {
      if (brigade && brigade.park && brigade.park.nombre.toLowerCase().includes("norte")) {
        return options.filter(opt => opt.startsWith("N") || opt.startsWith("J"));
      } else {
        return options.filter(opt => opt.startsWith("S") || opt.startsWith("J"));
      }
    } else {
      return options;
    }
  };

  const [previousGuards, setPreviousGuards] = useState([]);
  const [previousAssignmentsCache, setPreviousAssignmentsCache] = useState({});
  const [loadingPreviousAssignments, setLoadingPreviousAssignments] = useState(false);

  useEffect(() => {
    const fetchBrigadeDetails = async () => {
      setFirefighters([]);
      if (!id_brigada) {
        setError('No ID provided in URL');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await BrigadesApiService.getFirefightersByBrigadeDebouncing(id_brigada, selectedDate);
        if (response.data.brigade) {
          setBrigade(response.data.brigade);
        } else {
          setError('No brigade data found');
        }
        const dataFF = Object.values(response.data.firefighters);
        setFirefighters(dataFF);
        const ids = [...new Set(dataFF.map(ff => ff.id_change_request).filter(id => id))];
        if (ids.length > 0) {
          try {
            const crRes = await ShiftChangeRequestApiService.getRequests();
            const map = {};
            crRes.data.forEach(req => {
              if (ids.includes(req.id)) {
                map[req.id] = {
                  empleado1: req.empleado1,
                  empleado2: req.empleado2,
                };
              }
            });
            setChangeRequestsInfo(map);
          } catch (err) {
            console.error('Error fetching change requests info:', err);
          }
        } else {
          setChangeRequestsInfo({});
        }

        const commentsResponse = await GuardsApiService.getGuard(id_brigada, selectedDate);
        if (commentsResponse.data.guard) {
          setGuardDetails(commentsResponse.data.guard);
          setComentarios(commentsResponse.data.guard.comentarios || '');
          setIncidenciasPersonal(commentsResponse.data.guard.incidencias_personal || '');
          setIncidenciasGenerales(commentsResponse.data.guard.incidencias_generales || ''); // ← Añadir esta línea

          // Si tenemos guardDetails, cargar asignaciones actuales inmediatamente
          const guardId = commentsResponse.data.guard.id;
          if (guardId) {
            const assignmentsResponse = await GuardAssignmentApiService.getGuardAssignments();
            const assignmentsData = assignmentsResponse.data.filter(item => item.id_guard === guardId);
            const assignmentsByTurn = { Mañana: {}, Tarde: {}, Noche: {} };
            assignmentsData.forEach(item => {
              assignmentsByTurn[item.turno][item.id_empleado] = item.asignacion;
            });
            setAssignments(assignmentsByTurn);
          }
        } else {
          setGuardDetails(null);
          setComentarios('');
          setIncidenciasPersonal('');
          setIncidenciasGenerales(''); // ← Añadir esta línea
        }

        // Agregar carga de guardias anteriores
        setLoadingPreviousAssignments(true);
        const previousGuardsData = await GuardsApiService.getPreviousGuards(id_brigada, selectedDate);
        setPreviousGuards(previousGuardsData);

        setError(null);
      } catch (error) {
        console.error('Error en fetchBrigadeDetails:', error);
        setError('Failed to load brigade details');
      } finally {
        setLoading(false);
        setLoadingPreviousAssignments(false);
      }
    };

    fetchBrigadeDetails();
  }, [id_brigada, selectedDate]);


  useEffect(() => {
    if (guardDetails && guardDetails.id) {
      // Cargar asignaciones actuales
      GuardAssignmentApiService.getGuardAssignments()
        .then(response => {
          const assignmentsData = response.data.filter(item => item.id_guard === guardDetails.id);
          const assignmentsByTurn = { Mañana: {}, Tarde: {}, Noche: {} };
          assignmentsData.forEach(item => {
            assignmentsByTurn[item.turno][item.id_empleado] = item.asignacion;
          });
          setAssignments(assignmentsByTurn);
        })
        .catch(error => {
          console.error("Error fetching guard assignments:", error);
        });
    }
  }, [guardDetails]);

  const getPreviousAssignmentInfo = async (firefighterId) => {
    if (previousAssignmentsLoading || previousGuards.length === 0) {
      return '';
    }

    try {
      // Obtener todas las asignaciones
      const allAssignments = await GuardAssignmentApiService.getGuardAssignments();

      // Buscar asignaciones para este bombero en las guardias anteriores
      for (const guardData of previousGuards) {
        const matchingAssignments = allAssignments.data.filter(
          assignment => assignment.id_guard === guardData.guard.id &&
            assignment.id_empleado === firefighterId
        );

        if (matchingAssignments.length > 0) {
          // Formatear la fecha: DD-MM
          const date = new Date(guardData.date);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

          // Devolver la asignación con la fecha
          return `${matchingAssignments[0].asignacion} (${formattedDate})`;
        }
      }

      // Si no se encontraron asignaciones previas
      return '';

    } catch (error) {
      console.error(`Error obteniendo asignación previa para bombero ${firefighterId}:`, error);
      return '';
    }
  };

  useEffect(() => {
    const loadAllPreviousAssignments = async () => {
      if (!previousGuards || previousGuards.length === 0) {
        setLoadingPreviousAssignments(false);
        return;
      }

      try {
        // Obtener todas las asignaciones en una sola petición
        const response = await GuardAssignmentApiService.getGuardAssignments();
        const allAssignments = response.data;

        // Crear un caché de asignaciones por bombero
        const firefighterAssignments = {};

        // Para cada guardia anterior, buscar asignaciones
        for (const guardData of previousGuards) {
          const guardId = guardData.guard.id;

          // Filtrar asignaciones para esta guardia
          const guardAssignments = allAssignments.filter(a => a.id_guard === guardId);

          // Para cada asignación, guardarla en el caché
          guardAssignments.forEach(assignment => {
            const firefighterId = assignment.id_empleado;

            // Solo guardar la primera asignación encontrada (la más reciente)
            if (!firefighterAssignments[firefighterId]) {
              const date = new Date(guardData.date);
              const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

              firefighterAssignments[firefighterId] = {
                asignacion: assignment.asignacion,
                fecha: formattedDate,
                turno: assignment.turno,
                diasAtras: guardData.daysBack
              };
            }
          });
        }

        setPreviousAssignmentsCache(firefighterAssignments);
      } catch (error) {
        console.error('Error cargando asignaciones previas:', error);
      } finally {
        setLoadingPreviousAssignments(false);
      }
    };

    if (previousGuards.length > 0) {
      loadAllPreviousAssignments();
    }
  }, [previousGuards]);

  const PreviousAssignmentDisplay = ({ firefighter }) => {
    // Obtener asignación del caché
    const prevAssignmentInfo = previousAssignmentsCache[firefighter.id_empleado];

    // 🔍 LOG GENERAL PARA TODOS LOS CAMBIOS DE GUARDIA
    if (firefighter.id_change_request) {
      console.log(`🔄 FRONTEND CG ${firefighter.id_change_request} - ${firefighter.nombre} ${firefighter.apellido}:`, {
        id_empleado: firefighter.id_empleado,
        id_change_request: firefighter.id_change_request,
        tipo_asignacion: firefighter.tipo_asignacion,
        tipo_asignacion_type: typeof firefighter.tipo_asignacion,
        requerimiento: firefighter.requerimiento,
        changeRequestsInfo_disponible: !!changeRequestsInfo[firefighter.id_change_request],
        changeRequestsInfo_data: changeRequestsInfo[firefighter.id_change_request],
        todas_las_props: Object.keys(firefighter)
      });
    }

    let extra = '';
    if (firefighter.requerimiento) {
      extra = ' (R)';

      // Log para requerimientos
      if (firefighter.id_change_request) {
        console.log(`🔄 CG ${firefighter.id_change_request} - Marcado como requerimiento, usando (R)`);
      }
    } else if (firefighter.id_change_request) {
      console.log(`🔄 CG ${firefighter.id_change_request} - Entrando en lógica CG:`, {
        tipo_asignacion: firefighter.tipo_asignacion,
        es_ida: firefighter.tipo_asignacion === 'ida',
        es_string: typeof firefighter.tipo_asignacion === 'string'
      });

      // NUEVA LÓGICA: Solo mostrar CG si tipo_asignacion es 'ida'
      if (firefighter.tipo_asignacion === 'ida') {
        console.log(`🔄 CG ${firefighter.id_change_request} - Es tipo "ida", procesando...`);

        const info = changeRequestsInfo[firefighter.id_change_request];

        if (info) {
          console.log(`🔄 CG ${firefighter.id_change_request} - Info encontrada:`, {
            empleado1: info.empleado1,
            empleado2: info.empleado2
          });

          const other = info.empleado1?.id_empleado === firefighter.id_empleado
            ? info.empleado2
            : info.empleado1;

          console.log(`🔄 CG ${firefighter.id_change_request} - Other determinado:`, {
            empleado1_id: info.empleado1?.id_empleado,
            empleado2_id: info.empleado2?.id_empleado,
            firefighter_id: firefighter.id_empleado,
            other: other,
            other_valid: other && other.id_empleado !== firefighter.id_empleado
          });

          if (other && other.id_empleado !== firefighter.id_empleado) {
            extra = ` (CG ${other.nombre} ${other.apellido})`;
            console.log(`🔄 CG ${firefighter.id_change_request} - Extra final con nombre:`, extra);
          } else {
            extra = ' (CG)';
            console.log(`🔄 CG ${firefighter.id_change_request} - Extra final sin nombre:`, extra);
          }
        } else {
          extra = ' (CG)';
          console.log(`🔄 CG ${firefighter.id_change_request} - No info disponible, usando (CG)`);
        }
      } else {
        console.log(`🔄 CG ${firefighter.id_change_request} - NO es "ida" (es "${firefighter.tipo_asignacion}"), no mostrando CG`);
      }
    }

    // Log final del resultado
    if (firefighter.id_change_request) {
      console.log(`🔄 CG ${firefighter.id_change_request} - RESULTADO FINAL: "${firefighter.nombre} ${firefighter.apellido}${extra}"`);
    }

    return (
      <div className="flex items-center gap-2">
        <span className={darkMode ? 'text-slate-200' : 'text-slate-900'}>
          {firefighter.nombre} {firefighter.apellido}{extra}
        </span>
        {prevAssignmentInfo && (
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {prevAssignmentInfo.asignacion} ({prevAssignmentInfo.fecha})
          </span>
        )}
      </div>
    );
  };
  // Funciones de modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleUpdateComments = (updatedData) => {
    console.log('Comentarios actualizados:', updatedData);
    setComentarios(updatedData.comentarios);
    setGuardDetails(updatedData.guard ? updatedData.guard : updatedData);
  };

  const handleOpenDailyModal = () => setIsDailyModalOpen(true);
  const handleCloseDailyModal = () => setIsDailyModalOpen(false);
  const handleUpdateDailyActivities = (updatedData) => {
    console.log('Actividades diarias actualizadas:', updatedData);
    // Actualiza el estado o detalles de guard si fuera necesario
  };

  // Función para guardar la asignación en la BD usando el endpoint updateOrCreateAssignment
  const saveAssignment = async (shift, employeeId, value) => {
    if (!guardDetails || !guardDetails.id) return;
    try {
      await GuardAssignmentApiService.updateOrCreateAssignment({
        id_guard: guardDetails.id,
        id_empleado: employeeId,
        turno: shift,
        asignacion: value,
      });
      console.log(`Asignación guardada para ${shift} del empleado ${employeeId}`);
    } catch (error) {
      console.error('Error guardando la asignación:', error);
    }
  };

  const findMaxAssignment = (firefighters) => {
    // Filtrar bomberos con asignaciones
    const assignedFirefighters = firefighters.filter(ff => {
      const assignment = getMorningAssignment(ff.id_empleado);
      return assignment !== 'No asignado';
    });

    if (assignedFirefighters.length === 0) return '';

    // Ordenar por tipo de asignación (J, N/S, C, B) y número
    const sortedAssignments = assignedFirefighters
      .map(ff => getMorningAssignment(ff.id_empleado))
      .sort((a, b) => {
        // Extraer tipo y número
        const typeA = a.charAt(0);
        const typeB = b.charAt(0);

        // Orden de prioridad: J > N/S > C > B
        const typeOrder = { 'J': 0, 'N': 1, 'S': 1, 'C': 2, 'B': 3 };

        if (typeOrder[typeA] !== typeOrder[typeB]) {
          return typeOrder[typeA] - typeOrder[typeB];
        }

        // Si son del mismo tipo, ordenar por número
        const numA = parseInt(a.substring(1), 10) || 0;
        const numB = parseInt(b.substring(1), 10) || 0;

        return numB - numA; // Orden descendente para obtener el mayor
      });

    // Retornar la asignación con el mayor número dentro de su tipo
    return sortedAssignments[0];
  };

  // Función para recopilar todos los datos de equipos de los bomberos
  const collectEquipmentData = async () => {
    // Mapa para almacenar la asignación de equipos por bombero
    const equipmentByFirefighter = new Map();

    // Encontrar la última asignación entre todos los bomberos
    const maxAssignment = findMaxAssignment(firefighters);

    // Conjunto de números ya usados para minimizar conflictos
    const usedEquipmentNumbers = new Set();

    // Ordenar primero los bomberos por prioridad de puesto y luego por asignación
    const sortedFirefighters = [...firefighters].sort((a, b) => {
      // Primero ordenar por prioridad de puesto
      const puestoDiff = puestoPriority[a.puesto] - puestoPriority[b.puesto];
      if (puestoDiff !== 0) return puestoDiff;

      // Ordenar por la asignación completa
      const assignmentA = getAssignmentValue(a);
      const assignmentB = getAssignmentValue(b);

      // Si ambas asignaciones completas son iguales, usar la asignación de la mañana para desempatar
      if (assignmentA === assignmentB) {
        const morningAssignmentA = getMorningAssignment(a.id_empleado);
        const morningAssignmentB = getMorningAssignment(b.id_empleado);

        // Manejar el caso de 'No asignado'
        if (morningAssignmentA === 'No asignado' && morningAssignmentB !== 'No asignado') return 1;
        if (morningAssignmentB === 'No asignado' && morningAssignmentA !== 'No asignado') return -1;
        if (morningAssignmentA === 'No asignado' && morningAssignmentB === 'No asignado') return 0;

        // Comparar la letra de la asignación de la mañana
        const letterA = morningAssignmentA.charAt(0);
        const letterB = morningAssignmentB.charAt(0);
        if (letterA !== letterB) return letterA.localeCompare(letterB);

        // Luego comparar numéricamente
        const numberA = parseInt(morningAssignmentA.slice(1), 10);
        const numberB = parseInt(morningAssignmentB.slice(1), 10);
        if (!isNaN(numberA) && !isNaN(numberB)) {
          return numberA - numberB;
        }
        return morningAssignmentA.localeCompare(morningAssignmentB);
      }

      // Si las asignaciones completas son distintas, comparar teniendo en cuenta 'No asignado'
      if (assignmentA === 'No asignado' && assignmentB !== 'No asignado') return 1;
      if (assignmentB === 'No asignado' && assignmentA !== 'No asignado') return -1;
      if (assignmentA === 'No asignado' && assignmentB === 'No asignado') return 0;

      // Extraer la letra para comparar
      const letterA = assignmentA.charAt(0);
      const letterB = assignmentB.charAt(0);
      if (letterA !== letterB) return letterA.localeCompare(letterB);

      // Comparar numéricamente
      const numberA = parseInt(assignmentA.slice(1), 10);
      const numberB = parseInt(assignmentB.slice(1), 10);
      if (!isNaN(numberA) && !isNaN(numberB)) {
        return numberA - numberB;
      }
      return assignmentA.localeCompare(assignmentB);
    });

    // Para cada bombero con asignación, obtener sus equipos en el orden correcto
    for (const firefighter of sortedFirefighters) {
      // Omitir operadores solo para la tabla de equipos
      if (firefighter.puesto === 'Operador' ||
        getAssignmentValue(firefighter) === 'Telefonista') continue;

      const assignmentValue = getAssignmentValue(firefighter);

      if (assignmentValue !== 'No asignado') {
        // Tomar la primera asignación (si hay varias separadas por comas)
        const primaryAssignment = assignmentValue.split(',')[0].trim();

        try {
          // Obtener equipos usando la API mejorada y pasar la fecha
          const response = await PersonalEquipmentApiService.checkAndAssignEquipment({
            parkId: brigade?.park?.id_parque || 1,
            assignment: primaryAssignment,
            maxAssignment,
            date: selectedDate // Incluir la fecha seleccionada
          });

          if (response && response.data && response.data.equipment_details) {
            // Guardar los detalles de equipos para este bombero
            equipmentByFirefighter.set(firefighter.id_empleado, {
              nombre: `${firefighter.nombre} ${firefighter.apellido}`,
              puesto: firefighter.puesto,
              asignacion: primaryAssignment,
              equipos: response.data.equipment_details
            });

            // Actualizar el conjunto de números usados para minimizar conflictos
            if (response.data.equipment_assigned) {
              Object.values(response.data.equipment_assigned).forEach(numero => {
                usedEquipmentNumbers.add(parseInt(numero));
              });
            }
          }
        } catch (error) {
          console.error(`Error al obtener equipos para ${firefighter.nombre}:`, error);
        }
      }
    }
    return equipmentByFirefighter;
  };

  // Función auxiliar para verificar si un equipo está disponible
  const isEquipmentAvailable = async (radioNumber) => {
    try {
      const response = await PersonalEquipmentApiService.checkEquipmentAvailability(radioNumber);
      return response.data.available;
    } catch (error) {
      console.error(`Error verificando disponibilidad del equipo ${radioNumber}:`, error);
      return false; // En caso de error, asumimos que no está disponible por seguridad
    }
  };

  // Función auxiliar para encontrar el siguiente número disponible
  const findNextAvailableNumber = async (startNumber, increment = 2, usedNumbers = new Set()) => {
    let currentNumber = startNumber;

    // Verificar si el número ya está en uso o no está disponible
    let isUsed = usedNumbers.has(currentNumber);
    let isAvailable = !isUsed && await isEquipmentAvailable(currentNumber);

    while (isUsed || !isAvailable) {
      currentNumber += increment;
      isUsed = usedNumbers.has(currentNumber);
      isAvailable = !isUsed && await isEquipmentAvailable(currentNumber);
    }

    // Agregar el número encontrado al conjunto de usados
    usedNumbers.add(currentNumber);
    return currentNumber;
  };

  // Función para manejar cambios de asignación.
  // Si se modifica en "Mañana", se propaga a "Tarde" y "Noche" según el turno real; si se cambia en Tarde o Noche, se actualiza solo ese turno.
  const handleAssignmentChange = (shift, employeeId, value) => {
    setAssignments(prev => {
      let newAssignments = { ...prev };
      newAssignments[shift] = { ...newAssignments[shift], [employeeId]: value };
      // Guardar asignación para el turno actual
      saveAssignment(shift, employeeId, value);
      if (shift === 'Mañana') {
        const firefighter = firefighters.find(f => f.id_empleado === employeeId);
        if (firefighter) {
          const turno = firefighter.turno.toLowerCase();
          if (turno === 'día completo') {
            ["Tarde", "Noche"].forEach(s => {
              newAssignments[s] = { ...newAssignments[s], [employeeId]: value };
              saveAssignment(s, employeeId, value);
            });
          } else if (turno === 'mañana y tarde') {
            newAssignments["Tarde"] = { ...newAssignments["Tarde"], [employeeId]: value };
            saveAssignment("Tarde", employeeId, value);
          } else if (turno === 'mañana y noche') {
            newAssignments["Noche"] = { ...newAssignments["Noche"], [employeeId]: value };
            saveAssignment("Noche", employeeId, value);
          }
        }
      }
      return newAssignments;
    });
  };

  // Función auxiliar para obtener la asignación actual (actualizada en el estado) para un bombero sin duplicados
  const getAssignmentValue = (firefighter) => {
    const possibleShifts = ["Mañana", "Tarde", "Noche"];
    let values = [];
    possibleShifts.forEach((shift) => {
      if (assignments[shift] && assignments[shift][firefighter.id_empleado]) {
        values.push(assignments[shift][firefighter.id_empleado]);
      }
    });
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length > 0 ? uniqueValues.join(', ') : 'No asignado';
  };

  // Nueva función para obtener específicamente la asignación del turno de mañana
  const getMorningAssignment = (firefighterId) => {
    if (assignments["Mañana"] && assignments["Mañana"][firefighterId]) {
      return assignments["Mañana"][firefighterId];
    }
    return 'No asignado';
  };

  // Función auxiliar para obtener la asignación previa del guard anterior para un bombero en un turno dado
  const getPreviousAssignment = (shift, employeeId) => {
    if (prevAssignments[shift] && prevAssignments[shift][employeeId]) {
      return prevAssignments[shift][employeeId];
    }
    return '';
  };

  const handleCommentSubmit = async () => {
    if (!user || user.type !== 'jefe') return;
    setIsUpdating(true);
    try {
      const response = await GuardsApiService.updateGuardComments(
        id_brigada,
        selectedDate,
        comentarios
      );
      setComentarios(response.data.comentarios);
      setGuardDetails(response.data.guard ? response.data.guard : response.data);
    } catch (error) {
      console.error('Error actualizando comentarios:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreviousDay = () => {
    const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    setSelectedDate(nextDay);
  };

  const categorizeFirefighters = (shift) => {
    const categories = ['Subinspector', 'Oficial', 'Operador', 'Conductor', 'Bombero'];
    const counts = categories.map(category => {
      const count = firefighters.filter(firefighter => {
        const isCategory = firefighter.puesto === category;
        const hasShift = [shift, 'Día completo'].includes(firefighter.turno);
        const isCombinedShift =
          (firefighter.turno === 'Mañana y tarde' && (shift === 'Mañana' || shift === 'Tarde')) ||
          (firefighter.turno === 'Tarde y noche' && (shift === 'Tarde' || shift === 'Noche')) ||
          (firefighter.turno === 'Mañana y noche' && (shift === 'Mañana' || shift === 'Noche'));
        return isCategory && (hasShift || isCombinedShift);
      }).length;
      return { category, count };
    });
    if (brigade?.park?.id_parque === 2) {
      const tropaCount = counts.reduce((sum, { category, count }) => {
        if (['Bombero', 'Conductor', 'Operador'].includes(category)) {
          return sum + count;
        }
        return sum;
      }, 0);
      counts.push({ category: 'Tropa', count: tropaCount });
    }
    return counts;
  };

  const checkMinimums = (category, count) => {
    const parkId = brigade?.park?.id_parque;
    let minimumCount = minimums[parkId]?.[category] || 0;
    if (category === 'Tropa' && parkId === 2) {
      minimumCount = 10;
    }
    return { isBelowMinimum: count < minimumCount, minimumCount };
  };

  const filterFirefightersByShift = (shift) => {
    return firefighters
      .filter(firefighter =>
        firefighter.turno === shift ||
        firefighter.turno === 'Día completo' ||
        (shift === 'Mañana' && ['Mañana y tarde', 'Mañana y noche'].includes(firefighter.turno)) ||
        (shift === 'Tarde' && ['Mañana y tarde', 'Tarde y noche'].includes(firefighter.turno)) ||
        (shift === 'Noche' && ['Tarde y noche', 'Mañana y noche'].includes(firefighter.turno))
      )
      .sort((a, b) => {
        const diff = puestoPriority[a.puesto] - puestoPriority[b.puesto];
        if (diff !== 0) return diff;
        return a.dni - b.dni;
      });
  };


  // Función auxiliar para calcular el número de radio según la asignación y parque
  const getRadioNumber = async (assignment, parkId, usedNumbers = new Set()) => {
    if (!assignment || assignment === 'No asignado') return '';
    const cleanAssignment = assignment.trim();
    const letter = cleanAssignment.charAt(0).toUpperCase();
    const number = parseInt(cleanAssignment.slice(1), 10);
    if (isNaN(number)) return '-';

    // Casos específicos que no requieren verificación
    if (letter === 'J') {
      return 1;
    }

    if (letter === 'N') {
      if (number === 1) return 1;
      if (number === 2) {
        const baseNumber = 3;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      }
      if (number === 3 || number === 4) {
        const baseNumber = 5;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      }
    } else if (letter === 'S') {
      if (number === 1) return 2;
      if (number === 2) {
        const baseNumber = 4;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      }
      if (number === 3) {
        const baseNumber = 6;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      }
    } else if (letter === 'C') {
      if (parkId === 2) {
        if (number === 1) return 8;
        if (number === 2) {
          const baseNumber = 10;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 3) {
          const baseNumber = 12;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 4) {
          const baseNumber = 14;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 5) {
          const baseNumber = 16;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
      } else {
        if (number === 1) return 7;
        if (number === 2) {
          const baseNumber = 9;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 3) {
          const baseNumber = 11;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 4) {
          const baseNumber = 13;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
        if (number === 5) {
          const baseNumber = 15;
          return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
        }
      }
    } else if (letter === 'B') {
      if (parkId === 2) {
        const baseNumber = 14 + number * 2;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      } else {
        const baseNumber = 13 + number * 2;
        return await findNextAvailableNumber(baseNumber, 2, usedNumbers);
      }
    }

    return '-';
  };

  // Función para obtener las guardias y asignaciones anteriores
  const fetchPreviousAssignments = async (id_brigada, selectedDate) => {
    try {
      // Obtener guardias anteriores (5, 10 y 15 días atrás)
      const previousGuards = await GuardsApiService.getPreviousGuards(id_brigada, selectedDate);

      // Si no hay guardias anteriores, devolver un mapa vacío
      if (previousGuards.length === 0) {
        return new Map();
      }

      // Inicializar un mapa para almacenar las asignaciones previas por bombero
      const previousAssignmentsByFirefighter = new Map();

      return previousGuards;
    } catch (error) {
      console.error('Error obteniendo asignaciones previas:', error);
      return new Map();
    }
  };

  // Función para buscar asignaciones previas para un bombero específico
  const findPreviousAssignmentForFirefighter = async (employeeId, previousGuards) => {
    try {
      // Verificar si hay guardias anteriores
      if (!previousGuards || previousGuards.length === 0) {
        return null;
      }

      // Buscar asignaciones previas para este bombero
      const previousAssignment = await GuardAssignmentApiService.findPreviousAssignmentsForEmployee(
        employeeId,
        previousGuards
      );

      return previousAssignment;
    } catch (error) {
      console.error(`Error buscando asignación previa para bombero ${employeeId}:`, error);
      return null;
    }
  };

  // Función para formatear la fecha a un formato legible
  const formatPreviousDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${day}-${month}`;
  };

  // Función para recuperar y formatear la información de asignación previa para mostrar
  const getPreviousAssignmentDisplay = async (firefighterId, previousGuards) => {
    const prevAssignment = await findPreviousAssignmentForFirefighter(firefighterId, previousGuards);

    if (!prevAssignment) return '';

    // Formatear la información para mostrar: "asignación (fecha)"
    const formattedDate = formatPreviousDate(prevAssignment.date);
    return `${prevAssignment.assignment.asignacion} (${formattedDate})`;
  };

  const exportToPDF = async () => {
    try {
      // Iniciar el PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const parqueNombre = brigade?.park ? brigade.park.nombre : 'Parque no disponible';
      const brigadeNombre = brigade ? brigade.nombre : 'Brigada no disponible';
      const fechaCompleta = dayjs(selectedDate).format('[Día] D [de] MMMM [de] YYYY');
      await handleResetEquipmentAssignments();
      await handleRefreshData();
      // Barra de color en la parte superior
      let headerColor;
      if (brigade?.nombre === 'Brigada A') {
        headerColor = [34, 197, 94]; // verde
      } else if (brigade?.nombre === 'Brigada B') {
        headerColor = [250, 250, 250]; // blanco
      } else if (brigade?.nombre === 'Brigada C') {
        headerColor = [59, 130, 246]; // azul
      } else if (brigade?.nombre === 'Brigada D') {
        headerColor = [220, 38, 38]; // rojo
      } else if (brigade?.nombre === 'Brigada E') {
        headerColor = [253, 224, 71]; // amarillo
      } else if (brigade?.nombre === 'Brigada F') {
        headerColor = [209, 213, 219]; // gris
      } else {
        headerColor = [150, 154, 133]; // gris verde
      }

      // Añadir rectángulo de color en la parte superior
      doc.setFillColor(...headerColor);
      doc.rect(0, 0, pageWidth, 35, 'F');

      // Añadir logo con mejor posición
      doc.addImage(logo, 'PNG', 10, 5, 18, 25);

      // Línea separadora debajo del encabezado de color
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(0, 35, pageWidth, 35);

      // Configurar textos del encabezado
      doc.setFont('helvetica', 'bold');

      // Determinar color de texto basado en el fondo
      let textColor;
      if (brigade?.nombre === 'Brigada B' || brigade?.nombre === 'Brigada E') {
        textColor = [0, 0, 0]; // negro para fondos claros
      } else {
        textColor = [255, 255, 255]; // blanco para fondos oscuros
      }

      // Título y subtítulos con mejor posicionamiento
      doc.setTextColor(...textColor);
      doc.setFontSize(16);
      doc.text(brigadeNombre, 40, 15);

      doc.setFontSize(14);
      doc.text(parqueNombre, 40, 25);

      // Fecha con formato elegante a la derecha
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(fechaCompleta, pageWidth - 10, 20, { align: 'right' });

      // Espacio para comenzar la tabla
      const startY = 45;

      // Configuración de colores para el PDF
      let pdfHeaderFillColor, pdfHeaderTextColor;
      if (brigade?.nombre === 'Brigada A') {
        pdfHeaderFillColor = '#22c55e';
        pdfHeaderTextColor = '#000000';
      } else if (brigade?.nombre === 'Brigada B') {
        pdfHeaderFillColor = '#fafafa';
        pdfHeaderTextColor = '#000000';
      } else if (brigade?.nombre === 'Brigada C') {
        pdfHeaderFillColor = '#3b82f6';
        pdfHeaderTextColor = '#000000';
      } else if (brigade?.nombre === 'Brigada D') {
        pdfHeaderFillColor = '#dc2626';
        pdfHeaderTextColor = '#000000';
      } else if (brigade?.nombre === 'Brigada E') {
        pdfHeaderFillColor = '#fde047';
        pdfHeaderTextColor = '#000000';
      } else if (brigade?.nombre === 'Brigada F') {
        pdfHeaderFillColor = '#d1d5db';
        pdfHeaderTextColor = '#4b5563';
      } else {
        pdfHeaderFillColor = '#969a85';
        pdfHeaderTextColor = '#ffffff';
      }

      // ID del parque
      const parkId = brigade?.park?.id_parque || 1;

      // Obtener todos los tipos de asignaciones que necesitamos procesar
      const allAssignments = [];

      // Extraer todos los tipos de asignación únicos de los bomberos
      firefighters.forEach(ff => {
        const assignmentValue = getAssignmentValue(ff);
        if (assignmentValue !== 'No asignado') {
          // Dividir en caso de que haya múltiples asignaciones
          const assignments = assignmentValue.split(',').map(a => a.trim());
          assignments.forEach(a => {
            if (!a.startsWith('Operador') && a !== 'Telefonista' && a !== 'Jefe de Guardia' && !allAssignments.includes(a)) {
              allAssignments.push(a);
            }
          });
        }
      });

      // Ordenar las asignaciones por tipo
      allAssignments.sort((a, b) => {
        const letterA = a.charAt(0);
        const letterB = b.charAt(0);

        if (letterA !== letterB) {
          // Ordenar por tipo: J, N, S, C, B
          const order = { 'J': 1, 'N': 2, 'S': 3, 'C': 4, 'B': 5 };
          return (order[letterA] || 99) - (order[letterB] || 99);
        }

        const numA = parseInt(a.slice(1), 10);
        const numB = parseInt(b.slice(1), 10);
        return numA - numB;
      });

      // Recopilar los datos de equipos para todos los bomberos
      const equipmentData = await collectEquipmentData();

      // Construir el cuerpo de la tabla con los números de radio asignados
      const sortedFirefighters = [...firefighters].sort((a, b) => {
        // Primero ordenar por prioridad de puesto
        const puestoDiff = puestoPriority[a.puesto] - puestoPriority[b.puesto];
        if (puestoDiff !== 0) return puestoDiff;

        // Ordenar por la asignación completa
        const assignmentA = getAssignmentValue(a);
        const assignmentB = getAssignmentValue(b);

        // Si ambas asignaciones completas son iguales, usar la asignación de la mañana para desempatar
        if (assignmentA === assignmentB) {
          const morningAssignmentA = getMorningAssignment(a.id_empleado);
          const morningAssignmentB = getMorningAssignment(b.id_empleado);

          // Manejar el caso de 'No asignado'
          if (morningAssignmentA === 'No asignado' && morningAssignmentB !== 'No asignado') return 1;
          if (morningAssignmentB === 'No asignado' && morningAssignmentA !== 'No asignado') return -1;
          if (morningAssignmentA === 'No asignado' && morningAssignmentB === 'No asignado') return 0;

          // Comparar la letra de la asignación de la mañana
          const letterA = morningAssignmentA.charAt(0);
          const letterB = morningAssignmentB.charAt(0);
          if (letterA !== letterB) return letterA.localeCompare(letterB);

          // Luego comparar numéricamente
          const numberA = parseInt(morningAssignmentA.slice(1), 10);
          const numberB = parseInt(morningAssignmentB.slice(1), 10);
          if (!isNaN(numberA) && !isNaN(numberB)) {
            return numberA - numberB;
          }
          return morningAssignmentA.localeCompare(morningAssignmentB);
        }

        // Si las asignaciones completas son distintas, comparar teniendo en cuenta 'No asignado'
        if (assignmentA === 'No asignado' && assignmentB !== 'No asignado') return 1;
        if (assignmentB === 'No asignado' && assignmentA !== 'No asignado') return -1;
        if (assignmentA === 'No asignado' && assignmentB === 'No asignado') return 0;

        // Extraer la letra para comparar
        const letterA = assignmentA.charAt(0);
        const letterB = assignmentB.charAt(0);
        if (letterA !== letterB) return letterA.localeCompare(letterB);

        // Comparar numéricamente
        const numberA = parseInt(assignmentA.slice(1), 10);
        const numberB = parseInt(assignmentB.slice(1), 10);
        if (!isNaN(numberA) && !isNaN(numberB)) {
          return numberA - numberB;
        }
        return assignmentA.localeCompare(assignmentB);
      });

      const headers = ['Nombre', 'Puesto', 'Turno', 'Asignación', 'Vehículos'];
      const body = sortedFirefighters.map(firefighter => {
        const assignmentValue = getAssignmentValue(firefighter);
        const morningAssignment = getMorningAssignment(firefighter.id_empleado);

        // Construir el nombre con el número de radio
        let fullName = `${firefighter.nombre} ${firefighter.apellido}`;
        let radioNumber = '';

        if (assignmentValue !== 'No asignado') {
          // Obtener datos de equipos del mapa de equipos
          const equipInfo = equipmentData.get(firefighter.id_empleado);
          if (equipInfo && equipInfo.equipos) {
            // Buscar el equipo "Portátil" para mostrar como número principal
            const portatil = equipInfo.equipos.find(e => e.categoria === 'Portátil');
            if (portatil) {
              radioNumber = ` (${portatil.numero})`;
            }
          }
        }

        fullName += radioNumber;

        // Verificar si el bombero está en turno de mañana
        const turnoLower = firefighter.turno.toLowerCase();
        const isInMorningShift = turnoLower === 'mañana' ||
          turnoLower === 'día completo' ||
          turnoLower === 'mañana y tarde' ||
          turnoLower === 'mañana y noche';

        // Seleccionar el mapeo adecuado según el nombre del parque
        const mapping = brigade?.park?.nombre.toLowerCase().includes("sur")
          ? vehicleMappingSur
          : vehicleMappingNorte;

        // Usar el mapeo para obtener la información del vehículo
        const vehicleInfo = isInMorningShift ? (mapping[morningAssignment] || '') : '';

        return [
          fullName,
          firefighter.puesto,
          firefighter.turno,
          assignmentValue,
          vehicleInfo,
        ];
      });

      // Función para determinar el color de fondo de una celda
      const getNameCellBgColor = (assignment, puesto) => {
        if (puesto.toLowerCase() === 'operador') return [255, 255, 255];
        if (!assignment || assignment === 'No asignado') return [255, 255, 255];
        const cleanAssignment = assignment.trim().toUpperCase();
        const letter = cleanAssignment.charAt(0);
        if (letter === 'J') {
          return [255, 255, 153];
        }
        if (letter === 'N' || letter === 'S') {
          if (puesto.toLowerCase() === 'subinspector') {
            return [255, 255, 153];
          } else {
            return [255, 102, 102];
          }
        } else if (letter === 'C' || letter === 'B') {
          return [255, 240, 220];
        }
        return [255, 255, 255];
      };

      // Calcular espacio disponible en la página
      const pageHeight = doc.internal.pageSize.getHeight();
      const availableSpace = pageHeight - startY - 20; // 20 es margen de seguridad

      // Estimar altura necesaria para la tabla principal
      // Aproximadamente 10 puntos por fila (considerando que cada fila tiene aprox. 9pts de alto + pequeño margen)
      const estimatedTableHeight = (body.length * 10) + 15; // 15 para el encabezado

      // Ajustar el tamaño de fuente si la tabla es demasiado grande para la página
      let fontSize = 9;
      let cellPadding = 2.5;

      if (estimatedTableHeight > availableSpace && body.length > 10) {
        // Reducir tamaño si hay muchas filas y no caben
        fontSize = Math.max(7, fontSize - Math.ceil((estimatedTableHeight - availableSpace) / 100));
        cellPadding = Math.max(1.5, cellPadding - 0.5);
      }

      // Generar la tabla con configuración para evitar divisiones entre páginas
      doc.autoTable({
        startY,
        head: [headers],
        body: body,
        theme: 'striped',
        styles: {
          halign: 'center',
          cellPadding: cellPadding,
          fontSize: fontSize
        },
        headStyles: {
          fillColor: [52, 73, 94], // Color gris fijo igual que las tablas inferiores
          textColor: [255, 255, 255], // Texto blanco
          fontStyle: 'bold',
          fontSize: fontSize + 1
        },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: startY, horizontal: 10 },
        didParseCell: function (data) {
          if (data.column.index === 0 && data.section === 'body') {
            const employee = sortedFirefighters[data.row.index];
            const assignmentValue = getAssignmentValue(employee);
            const bgColor = getNameCellBgColor(assignmentValue, employee.puesto);
            data.cell.styles.fillColor = bgColor;
          }
        },
        // Evitar división de filas entre páginas
        rowPageBreak: 'avoid',
        // Si no cabe toda la tabla, ponerla en la siguiente página
        startY: function (pageCount, doc) {
          if (pageCount > 1 && estimatedTableHeight > availableSpace) {
            return 10; // Empezar casi al principio de la nueva página
          }
          return startY;
        }
      });

      // Obtener la posición Y final después de generar la tabla principal
      let finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY : startY;

      // Añadir comentarios y otros detalles - SECCIÓN MEJORADA
      if (guardDetails) {
        // Título para la sección de datos adicionales
        doc.addPage();
        const newStartY = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('DATOS ADICIONALES DEL SERVICIO', pageWidth / 2, newStartY, { align: 'center' });

        // Preparar los datos de comentarios
        const commentsData = guardDetails.guard || guardDetails;

        // Definir los campos y convertir las claves a nombres mostrados
        const allFields = [
          { key: 'revision', name: 'Revisión', group: 1 },
          { key: 'practica', name: 'Práctica', group: 1 },
          { key: 'basura', name: 'Basura', group: 1 },
          { key: 'anotaciones', name: 'Anotaciones', group: 2 },
          { key: 'incidencias_de_trafico', name: 'Incidencias de Tráfico', group: 2 },
          { key: 'mando', name: 'Mando', group: 2 }
        ];

        // Convertir a formato para jsPDF-autoTable
        const group1Fields = allFields.filter(field => field.group === 1);
        const group2Fields = allFields.filter(field => field.group === 2);

        // Cabeceras de la primera tabla
        const headersRow1 = group1Fields.map(field => field.name);
        // Valores de la primera tabla
        const valuesRow1 = group1Fields.map(field => commentsData[field.key] || '');

        // Cabeceras de la segunda tabla
        const headersRow2 = group2Fields.map(field => field.name);
        // Valores de la segunda tabla
        const valuesRow2 = group2Fields.map(field => commentsData[field.key] || '');

        // Estilos de color usando el color de la brigada para mantener consistencia
        const hexToRgb = (hex) => {
          // Convertir color hexadecimal a RGB
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r, g, b];
        };

        // Usar el mismo color que el encabezado principal pero con un tono más oscuro
        const headerFillColor = hexToRgb(pdfHeaderFillColor);
        // Oscurecer el color para los encabezados de las tablas de comentarios
        const darkenColor = (color, factor = 0.8) => {
          return [
            Math.floor(color[0] * factor),
            Math.floor(color[1] * factor),
            Math.floor(color[2] * factor)
          ];
        };

        const commentHeaderFillColor = darkenColor(headerFillColor);

        // Color fijo para los encabezados de ambas tablas
        const fixedHeaderColor = [52, 73, 94]; // Azul oscuro/gris
        const fixedHeaderTextColor = [255, 255, 255]; // Blanco

        // Verificar espacio disponible para tablas de comentarios en la página actual
        let commentStartY = newStartY + 10; // Ajustar según sea necesario
        let titleWritten = true; // Ya hemos escrito el título

        // Primera tabla de comentarios (mejorada)
        doc.autoTable({
          startY: commentStartY,
          head: [headersRow1],
          body: [valuesRow1],
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 5,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            halign: 'center', // Texto centrado
            valign: 'middle'
          },
          headStyles: {
            fillColor: fixedHeaderColor,
            textColor: fixedHeaderTextColor,
            fontStyle: 'bold',
            halign: 'center' // Asegurar que los encabezados estén centrados
          },
          bodyStyles: {
            halign: 'center' // Asegurar que el contenido esté centrado
          },
          margin: { horizontal: 10 },
          // Evitar división entre páginas
          rowPageBreak: 'avoid'
        });

        // Obtener la posición Y después de la primera tabla
        finalY = doc.previousAutoTable.finalY;

        // Segunda tabla de comentarios (mejorada)
        doc.autoTable({
          startY: finalY + 8,
          head: [headersRow2],
          body: [valuesRow2],
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 5,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            halign: 'center', // Texto centrado
            valign: 'middle'
          },
          headStyles: {
            fillColor: fixedHeaderColor,
            textColor: fixedHeaderTextColor,
            fontStyle: 'bold',
            halign: 'center' // Asegurar que los encabezados estén centrados
          },
          bodyStyles: {
            halign: 'center' // Asegurar que el contenido esté centrado
          },
          margin: { horizontal: 10 },
          // Evitar división entre páginas
          rowPageBreak: 'avoid'
        });

        // Actualizar finalY después de la segunda tabla
        finalY = doc.previousAutoTable.finalY;
      }

      // NUEVA SECCIÓN - TABLA DE EQUIPOS ASIGNADOS
      if (doc.previousAutoTable) {
        finalY = doc.previousAutoTable.finalY + 15;

        // Encabezado para la sección de equipos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('ASIGNACIÓN DE EQUIPOS', pageWidth / 2, finalY, { align: 'center' });

        // Preparar las columnas de la tabla
        const equipmentColumns = [
          'Nombre',
          'Puesto',
          'Asignación',
          'Portátil',
          'PTT',
          'Micro',
          'Linterna casco',
          'Linterna pecho'
        ];

        // Preparar los datos para la tabla de equipos
        const equipmentRows = [];

        // Procesar cada bombero en el orden de la tabla principal
        for (const firefighter of sortedFirefighters) {
          if (firefighter.puesto === 'Operador' ||
            getAssignmentValue(firefighter) === 'Telefonista') continue;

          const assignmentValue = getAssignmentValue(firefighter);

          if (assignmentValue !== 'No asignado') {
            // Tomar la primera asignación (si hay varias separadas por comas)
            const primaryAssignment = assignmentValue.split(',')[0].trim();

            // Obtener los datos de equipos del mapa
            const equipInfo = equipmentData.get(firefighter.id_empleado);

            // Preparar fila con datos básicos
            const row = [
              `${firefighter.nombre} ${firefighter.apellido}`,
              firefighter.puesto,
              primaryAssignment,
              '-', // Portátil
              '-', // PTT
              '-', // Micro
              '-', // Linterna casco
              '-'  // Linterna pecho
            ];

            // Si hay datos de equipos, rellenar con los números asignados
            if (equipInfo && equipInfo.equipos) {
              // Rellenar cada columna con su valor correspondiente
              equipInfo.equipos.forEach(equipo => {
                const index = equipmentColumns.indexOf(equipo.categoria);
                if (index !== -1) {
                  row[index] = equipo.numero;
                }
              });
            }

            equipmentRows.push(row);
          }
        }

        // Verificar espacio disponible
        const remainingHeight = doc.internal.pageSize.getHeight() - finalY - 15;
        const estimatedTableHeight = (equipmentRows.length * 8) + 10; // Altura aproximada

        // Si no hay espacio suficiente, crear una nueva página
        let equipmentTableY = finalY + 5;
        if (remainingHeight < estimatedTableHeight) {
          doc.addPage();
          equipmentTableY = 15; // Inicio en nueva página

          // Repetir encabezado en la nueva página
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text('ASIGNACIÓN DE EQUIPOS', pageWidth / 2, 10, { align: 'center' });
        }

        // Generar tabla de equipos
        doc.autoTable({
          startY: equipmentTableY,
          head: [equipmentColumns],
          body: equipmentRows,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            halign: 'center',
            valign: 'middle'
          },
          headStyles: {
            fillColor: [52, 73, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'left' },  // Nombre alineado a la izquierda
            1: { halign: 'center' }, // Puesto centrado
            2: { halign: 'center' }  // Asignación centrada
          },
          margin: { horizontal: 10 },
          // Evitar división entre páginas
          rowPageBreak: 'avoid'
        });
      }

      // Añadir pie de página con fecha de generación
      const generationDate = new Date().toLocaleString();
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Documento generado: ${generationDate}`, pageWidth - 10, pageHeight - 5, { align: 'right' });

      // Guardar el PDF con nombre descriptivo
      doc.save(`Bomberos_${brigade?.nombre || ''}_${selectedDate}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Ha ocurrido un error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
        <div className={`text-lg font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
        <div className={`rounded-2xl border p-6 ${
          darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <p className="font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!brigade) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
        <div className={`text-lg font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          No hay datos de brigada disponibles.
        </div>
      </div>
    );
  }

  // Para la tabla de la página, definimos los turnos
  const shifts = [
    { label: 'Mañana', key: 'Mañana' },
    { label: 'Tarde', key: 'Tarde' },
    { label: 'Noche', key: 'Noche' },
  ];

  return (
    <div className={`min-h-screen px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-slate-950' : 'bg-slate-100'
    }`}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Botón Volver */}
        <button 
          onClick={() => navigate(-1)} 
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            darkMode
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          <span>Volver</span>
        </button>

       

        {/* Card Principal */}
        <div className={`rounded-3xl border transition-colors duration-300 overflow-hidden ${
          darkMode 
            ? 'border-slate-800 bg-slate-900/80' 
            : 'border-slate-200 bg-white'
        }`}>
          {/* Header con gradiente de color de brigada */}
          <div className={`px-6 py-8 sm:px-8 ${brigadeColor}`}>
            <h1 className={`text-3xl font-bold text-center ${nameColor}`}>
              {brigade.nombre}
            </h1>
            <div className={`mt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm ${nameColor}`}>
              <p>
                <span className="font-semibold">Parque:</span> {brigade.park ? brigade.park.nombre : 'No disponible'}
              </p>
              <span className="hidden sm:inline">•</span>
              <p>
                <span className="font-semibold">Bomberos:</span> {firefighters.length}
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Grid de Estadísticas por Turno */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shifts.map(shift => (
                <div 
                  key={shift.key} 
                  className={`rounded-2xl border p-5 transition-colors ${
                    darkMode 
                      ? 'border-slate-800 bg-slate-900/60' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <h3 className={`text-sm font-semibold uppercase tracking-[0.3em] mb-4 text-center ${
                    darkMode ? 'text-primary-400' : 'text-primary-600'
                  }`}>
                    {shift.label}
                  </h3>
                  
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <th className={`py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Categoría
                        </th>
                        <th className={`py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Conteo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorizeFirefighters(shift.key).map((data, index) => {
                        const { isBelowMinimum, minimumCount } = checkMinimums(data.category, data.count);
                        return (
                          <tr 
                            key={index} 
                            className={`border-b ${darkMode ? 'border-slate-800/50' : 'border-slate-200/50'}`}
                          >
                            <td className={`py-2 px-3 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                              {data.category}
                            </td>
                            <td className={`py-2 px-3 text-right font-medium ${
                              isBelowMinimum 
                                ? darkMode ? 'text-red-400' : 'text-red-600' 
                                : darkMode ? 'text-slate-200' : 'text-slate-900'
                            }`}>
                              {data.count} 
                              {isBelowMinimum && (
                                <span className="text-xs ml-1">(mín {minimumCount})</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Tabla Principal de Bomberos */}
            <div>
              <h2 className={`text-xl font-bold mb-6 ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Bomberos Asignados
              </h2>
              
              <div className="overflow-x-auto rounded-2xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}">
                <table className="w-full">
                  <thead className={`${brigadeColor} ${nameColor}`}>
                    <tr>
                      <th className="py-3 px-4 text-sm font-semibold text-left">Nombre</th>
                      <th className="py-3 px-4 text-sm font-semibold text-left">Puesto</th>
                      <th className="py-3 px-4 text-sm font-semibold text-left">Turno Asignado</th>
                      {['mando', 'jefe'].includes(user.type) && (
                        <th className="py-3 px-4 text-sm font-semibold text-left">Asignación</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(shift => (
                      <React.Fragment key={shift.key}>
                        <tr className={`${
                          darkMode 
                            ? 'bg-slate-800/80 text-slate-100' 
                            : 'bg-slate-100 text-slate-900'
                        }`}>
                          <td colSpan="4" className="py-3 px-4 text-center font-bold text-sm uppercase tracking-wider">
                            {shift.label}
                          </td>
                        </tr>
                        {filterFirefightersByShift(shift.key).length > 0 ? (
                          filterFirefightersByShift(shift.key).map((firefighter, index) => (
                            <tr 
                              key={`${firefighter.id_empleado}-${index}`} 
                              className={`border-b transition-colors ${
                                darkMode 
                                  ? 'border-slate-800/50 hover:bg-slate-800/50' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                {loadingPreviousAssignments ? (
                                  <div className="flex items-center gap-2">
                                    <span>{firefighter.nombre} {firefighter.apellido}</span>
                                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                      cargando...
                                    </span>
                                  </div>
                                ) : (
                                  <PreviousAssignmentDisplay firefighter={firefighter} />
                                )}
                              </td>
                              <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                {firefighter.puesto}
                              </td>
                              <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                {firefighter.turno}
                              </td>
                              {['mando', 'jefe'].includes(user.type) && (
                                <td className="py-3 px-4">
                                  <select
                                    className={`rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 w-full ${
                                      darkMode
                                        ? 'border-slate-700 bg-slate-800 text-slate-100'
                                        : 'border-slate-300 bg-white text-slate-900'
                                    }`}
                                    value={assignments[shift.key][firefighter.id_empleado] || ''}
                                    onChange={(e) =>
                                      handleAssignmentChange(shift.key, firefighter.id_empleado, e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Seleccione
                                    </option>
                                    {getFilteredOptions(firefighter.puesto).map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td 
                              colSpan="4" 
                              className={`text-center py-4 text-sm ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              No hay bomberos asignados para este turno.
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón Exportar PDF */}
            <button 
              onClick={() => exportToPDF()} 
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                darkMode
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
              Exportar a PDF
            </button>

            {/* Botones de Acción - Solo para Mandos y Jefes */}
            {['mando', 'jefe'].includes(user.type) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Completar Cuadrante
                </button>
                <button
                  onClick={handleOpenDailyModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Actividades Diarias
                </button>
                <button 
                  onClick={() => setShowAssignFirefighterModal(true)} 
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Trasladar bombero
                </button>
                <button
                  onClick={() => setShowRequireFirefighterModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Requerir Bombero
                </button>
                <button
                  onClick={() => setShowAssignFirefighterToBajasModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Asignar Baja Sobrevenida
                </button>
                <button
                  onClick={() => setShowExtendWorkingDayModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                >
                  Prolongar Jornada
                </button>
              </div>
            )}

            {/* Sección de Comentarios */}
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Comentarios
                </h2>
                <div className={`rounded-2xl border p-6 transition-colors ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-900/60' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {user.type === 'jefe' ? (
                    <>
                      <textarea
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                          darkMode
                            ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-400'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                        }`}
                        rows="4"
                        placeholder="Añadir comentarios..."
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                      />
                      <button
                        onClick={handleCommentSubmit}
                        className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                          isUpdating 
                            ? 'bg-slate-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Guardando...' : 'Guardar Comentarios'}
                      </button>
                    </>
                  ) : (
                    <p className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                      {comentarios || 'No hay comentarios disponibles.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Incidencias de Personal */}
              <div>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Incidencias de Personal
                </h2>
                <div className={`rounded-2xl border p-6 transition-colors ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-900/60' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {['mando', 'jefe'].includes(user.type) ? (
                    <>
                      <textarea
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                          darkMode
                            ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-400'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                        }`}
                        rows="4"
                        placeholder="Añadir incidencias de personal..."
                        value={incidenciasPersonal}
                        onChange={(e) => setIncidenciasPersonal(e.target.value)}
                      />
                      <button
                        onClick={handlePersonalIncidentsSubmit}
                        className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                          isUpdatingPersonal 
                            ? 'bg-slate-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={isUpdatingPersonal}
                      >
                        {isUpdatingPersonal ? 'Guardando...' : 'Guardar Incidencias de Personal'}
                      </button>
                    </>
                  ) : (
                    <p className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                      {incidenciasPersonal || 'No hay incidencias de personal disponibles.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Incidencias Generales y Propuestas */}
              <div>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  Incidencias Generales y Propuestas
                </h2>
                <div className={`rounded-2xl border p-6 transition-colors ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-900/60' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {['mando', 'jefe'].includes(user.type) ? (
                    <>
                      <textarea
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                          darkMode
                            ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-400'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                        }`}
                        rows="4"
                        placeholder="Añadir incidencias generales y propuestas..."
                        value={incidenciasGenerales}
                        onChange={(e) => setIncidenciasGenerales(e.target.value)}
                      />
                      <button
                        onClick={handleGeneralIncidentsSubmit}
                        className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                          isUpdatingGenerales 
                            ? 'bg-slate-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={isUpdatingGenerales}
                      >
                        {isUpdatingGenerales ? 'Guardando...' : 'Guardar Incidencias Generales'}
                      </button>
                    </>
                  ) : (
                    <p className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                      {incidenciasGenerales || 'No hay incidencias generales disponibles.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Sección de Intervenciones - Solo para Mandos y Jefes */}
              {(['mando', 'jefe'].includes(user.type)) && (
                <div>
                  <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Intervenciones
                  </h2>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {
                        if (!guardDetails?.id) {
                          alert('No se ha creado una guardia para esta fecha. Primero complete el cuadrante.');
                          return;
                        }
                        setShowAddInterventionModal(true);
                      }}
                      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                        !guardDetails?.id
                          ? 'bg-slate-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      disabled={!guardDetails?.id}
                    >
                      Añadir Intervención
                    </button>
                  </div>
                  <InterventionsTable
                    idGuard={guardDetails?.id}
                    darkMode={darkMode}
                    refreshTrigger={refreshInterventions}
                    onEditIntervention={handleEditIntervention}
                    onDeleteIntervention={handleDeleteIntervention}
                    />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modales */}
        <AddInterventionModal
          show={showAddInterventionModal}
          onClose={() => setShowAddInterventionModal(false)}
          onAdded={() => setRefreshInterventions((prev) => !prev)}
          idGuard={guardDetails?.id}
          firefighters={firefighters.filter((f) => f.puesto === 'Subinspector' || f.puesto === 'Oficial')}
        />

        <RequireFirefighterModal
          show={showRequireFirefighterModal}
          onClose={() => setShowRequireFirefighterModal(false)}
          onAdd={handleRefreshData}
          brigade={brigade}
          fecha={selectedDate}
        />

        <EditInterventionModal
          show={showEditInterventionModal}
          intervention={selectedIntervention}
          onClose={() => setShowEditInterventionModal(false)}
          onEdited={() => setRefreshInterventions((prev) => !prev)}
          firefighters={firefighters.filter((f) => f.puesto === 'Subinspector' || f.puesto === 'Oficial')}
        />

        <AddDailyActivitiesModal
          isOpen={isDailyModalOpen}
          onClose={handleCloseDailyModal}
          onUpdate={handleUpdateDailyActivities}
          id_brigada={id_brigada}
          selectedDate={selectedDate}
        />

        <AssignFirefighterToBajasModal
          isOpen={showAssignFirefighterToBajasModal}
          onClose={() => setShowAssignFirefighterToBajasModal(false)}
          firefighters={firefighters}
          guardDate={selectedDate}
          currentBrigade={brigade}
        />

        <AddGuardCommentsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleUpdateComments}
          id_brigada={id_brigada}
          selectedDate={selectedDate}
        />

        <AssignFirefighterModal
          isOpen={showAssignFirefighterModal}
          onClose={() => setShowAssignFirefighterModal(false)}
          firefighters={firefighters}
          currentBrigade={brigade}
          guardDate={selectedDate}
        />

        <ExtendWorkingDayModal
          isOpen={showExtendWorkingDayModal}
          onClose={() => setShowExtendWorkingDayModal(false)}
          firefighters={firefighters}
          guardDate={selectedDate}
          onSuccess={handleRefreshData}
        />
      </div>
    </div>
  );
};

export default BrigadeDetail;