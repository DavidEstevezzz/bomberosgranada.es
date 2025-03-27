import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import GuardAssignmentApiService from '../services/GuardAssignmentApiService'; // Servicio de asignaciones
import AddGuardCommentsModal from './AddGuardCommentsModal';
import AddDailyActivitiesModal from './AddDailyActivitiesModal';
import InterventionsTable from './InterventionsTable.jsx';
import AddInterventionModal from './AddInterventionModal';
import EditInterventionModal from './EditInterventionModal';
import InterventionApiService from '../services/InterventionApiService';
import AssignFirefighterModal from './AssignFirefighterModal';
import AssignFirefighterToBajasModal from './AssignFirefighterToBajasModal.jsx';
import RequireFirefighterModal from './RequireFirefighterModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
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
    'C3': 'FSV-4 / BIP-2 / UMC-2 / BUL-6',
    'C4': 'Apoyo',
    'C5': 'Apoyo',
  };


  // Cálculo de colores según el nombre de la brigada (para exportar al PDF)
  let brigadeColor = '';
  let nameColor = '';
  switch (brigade?.nombre) {
    case 'Brigada A':
      brigadeColor = 'bg-green-500';
      nameColor = 'text-black';
      break;
    case 'Brigada B':
      brigadeColor = 'bg-zinc-50';
      nameColor = 'text-black';
      break;
    case 'Brigada C':
      brigadeColor = 'bg-blue-500';
      nameColor = 'text-black';
      break;
    case 'Brigada D':
      brigadeColor = 'bg-red-600';
      nameColor = 'text-black';
      break;
    case 'Brigada E':
      brigadeColor = 'bg-yellow-300';
      nameColor = 'text-black';
      break;
    case 'Brigada F':
      brigadeColor = 'bg-gray-300';
      nameColor = 'text-gray-600';
      break;
    default:
      brigadeColor = '';
      nameColor = '';
  }




  // Cargar datos de la brigada, bomberos y guardDetails
  useEffect(() => {
    const fetchBrigadeDetails = async () => {
      setFirefighters([]);
      if (!id_brigada) {
        setError('No ID provided in URL');
        setLoading(false);
        return;
      }
      try {
        const response = await BrigadesApiService.getFirefightersByBrigadeDebouncing(id_brigada, selectedDate);
        if (response.data.brigade) {
          setBrigade(response.data.brigade);
        } else {
          setError('No brigade data found');
        }
        setFirefighters(Object.values(response.data.firefighters));

        const commentsResponse = await GuardsApiService.getGuard(id_brigada, selectedDate);
        if (commentsResponse.data.guard) {
          setGuardDetails(commentsResponse.data.guard);
          setComentarios(commentsResponse.data.guard.comentarios || '');
          setIncidenciasPersonal(commentsResponse.data.guard.incidencias_personal || '');
        } else {
          setGuardDetails(null);
          setComentarios('');
          setIncidenciasPersonal('');
        }
        setError(null);
      } catch (error) {
        console.error('Error en fetchBrigadeDetails:', error);
        setError('Failed to load brigade details');
      } finally {
        setLoading(false);
      }
    };
    fetchBrigadeDetails();
  }, [id_brigada, selectedDate]);


  const handleRefreshData = async () => {
    try {
      // Vuelve a consultar los bomberos y otros datos de la brigada.
      const response = await BrigadesApiService.getFirefightersByBrigadeDebouncing(id_brigada, selectedDate);
      if (response.data.brigade) {
        setBrigade(response.data.brigade);
      }
      setFirefighters(Object.values(response.data.firefighters));
    } catch (error) {
      console.error('Error recargando datos:', error);
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
  

  // Al tener guardDetails, cargar asignaciones actuales y previas
  useEffect(() => {
    if (guardDetails && guardDetails.id) {
      // Asignaciones actuales
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
      // Asignaciones previas (guard anterior = guardDetails.id - 10)
      const previousGuardId = guardDetails.id - 10;
      GuardAssignmentApiService.getGuardAssignments()
        .then(response => {
          const prevData = response.data.filter(item => item.id_guard === previousGuardId);
          const prevByTurn = { Mañana: {}, Tarde: {}, Noche: {} };
          prevData.forEach(item => {
            prevByTurn[item.turno][item.id_empleado] = item.asignacion;
          });
          setPrevAssignments(prevByTurn);
        })
        .catch(error => {
          console.error("Error fetching previous guard assignments:", error);
        });
    }
  }, [guardDetails]);

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
  const getRadioNumber = (assignment, parkId) => {
    if (!assignment || assignment === 'No asignado') return '';
    const cleanAssignment = assignment.trim();
    const letter = cleanAssignment.charAt(0).toUpperCase();
    const number = parseInt(cleanAssignment.slice(1), 10);
    if (isNaN(number)) return '-';
    if (letter === 'J') {
      return 1;
    }
    if (letter === 'N') {
      if (number === 1) return 1;
      if (number === 2) return 3;
      if (number === 3) return 5;
      if (number === 4) return 5;
    } else if (letter === 'S') {
      if (number === 1) return 2;
      if (number === 2) return 4;
      if (number === 3) return 6;
    } else if (letter === 'C') {
      if (parkId === 2) {
        if (number === 1) return 8;
        if (number === 2) return 10;
        if (number === 3) return 12;
        if (number === 4) return 14;
        if (number === 5) return 16;
      } else {
        if (number === 1) return 7;
        if (number === 2) return 9;
        if (number === 3) return 11;
        if (number === 4) return 13;
        if (number === 5) return 15;
      }
    } else if (letter === 'B') {
      if (parkId === 2) {
        return 14 + number * 2;
      } else {
        return 13 + number * 2;
      }
    }

  };

  // Función para exportar a PDF (modificada para usar la asignación específica del turno de mañana)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.addImage(logo, 'PNG', 10, 10, 20, 30);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    const parqueNombre = brigade?.park ? brigade.park.nombre : 'Parque no disponible';
    const brigadeNombre = brigade ? brigade.nombre : 'Brigada no disponible';
    const fechaCompleta = dayjs(selectedDate).format('[Día] D [de] MMMM [de] YYYY');
    doc.setFontSize(16);
    doc.text(parqueNombre, pageWidth / 2, 20, { align: 'center' });
    doc.text(brigadeNombre, pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text(fechaCompleta, pageWidth / 2, 40, { align: 'center' });
    const startY = 45;
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
    // Función de ordenación modificada que ordena primero por puesto, luego por asignación
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
    const headers = ['Nombre', 'Puesto', 'Turno', 'Asignación', 'Vehículos'];
    const body = sortedFirefighters.map((firefighter) => {
      // Usamos el valor de asignación completo para mostrar todas las asignaciones
      const assignmentValue = getAssignmentValue(firefighter);

      // Pero para los vehículos, solo usamos la asignación del turno de mañana
      const morningAssignment = getMorningAssignment(firefighter.id_empleado);

      const radio = assignmentValue !== 'No asignado'
        ? ` (${getRadioNumber(assignmentValue, brigade.park?.id_parque)})`
        : '';
      const fullName = `${firefighter.nombre} ${firefighter.apellido}${radio}`;

      // Verificar si el bombero está en turno de mañana, día completo o combinado con mañana
      const turnoLower = firefighter.turno.toLowerCase();
      const isInMorningShift = turnoLower === 'mañana' ||
        turnoLower === 'día completo' ||
        turnoLower === 'mañana y tarde' ||
        turnoLower === 'mañana y noche';

      // Solo asignar vehículo si está en turno de mañana y tiene asignación de mañana
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
    doc.autoTable({
      startY,
      head: [headers],
      body: body,
      theme: 'striped',
      styles: { halign: 'center', cellPadding: 2.5, fontSize: 9 },
      headStyles: { fillColor: pdfHeaderFillColor, textColor: pdfHeaderTextColor, fontSize: 10 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: startY, horizontal: 10 },
      didParseCell: function (data) {
        if (data.column.index === 0 && data.section === 'body') {
          const employee = sortedFirefighters[data.row.index];
          const assignmentValue = getAssignmentValue(employee);
          const bgColor = getNameCellBgColor(assignmentValue, employee.puesto);
          data.cell.styles.fillColor = bgColor;
        }
      }
    });
    console.log('guardDetails en exportToPDF:', guardDetails);
    if (guardDetails) {
      const commentsData = guardDetails.guard || guardDetails;
      const commentFieldsRow1 = ['revision', 'practica', 'basura'];
      const commentFieldsRow2 = ['anotaciones', 'incidencias_de_trafico', 'mando'];
      const headersRow1 = commentFieldsRow1.map(field =>
        field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );
      const headersRow2 = commentFieldsRow2.map(field =>
        field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );
      const valuesRow1 = commentFieldsRow1.map(field => commentsData[field] || '');
      const valuesRow2 = commentFieldsRow2.map(field => commentsData[field] || '');
      const finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : startY + 10;
      doc.autoTable({
        startY: finalY,
        head: [headersRow1],
        body: [valuesRow1],
        theme: 'grid',
        styles: { halign: 'center', cellPadding: 4, fontSize: 9 },
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        margin: { left: 10, right: 10 },
      });
      doc.autoTable({
        startY: doc.previousAutoTable.finalY + 4,
        head: [headersRow2],
        body: [valuesRow2],
        theme: 'grid',
        styles: { halign: 'center', cellPadding: 4, fontSize: 9 },
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        margin: { left: 10, right: 10 },
      });
    }
    doc.save('Bomberos_Por_Turno.pdf');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!brigade) return <div>No brigade data available.</div>;

  // Para la tabla de la página, definimos los turnos
  const shifts = [
    { label: 'Mañana', key: 'Mañana' },
    { label: 'Tarde', key: 'Tarde' },
    { label: 'Noche', key: 'Noche' },
  ];

  return (
    <div className="p-4 flex flex-col items-center w-full">
      <button onClick={() => navigate(-1)} className="bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>Volver</span>
      </button>
      <div className="bg-gray-800 text-white p-4 rounded-lg w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">{brigade.nombre}</h1>
        <p className="text-center"><strong>Parque:</strong> {brigade.park ? brigade.park.nombre : 'No disponible'}</p>
        <p className="text-center"><strong>Número de Bomberos:</strong> {firefighters.length}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {shifts.map(shift => (
            <div key={shift.key} className="bg-gray-700 p-2 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-center">{shift.label}</h3>
              {/* Fila separadora en blanco */}
              <table className="w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="py-1 px-2">Categoría</th>
                    <th className="py-1 px-2 text-right">Conteo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="2" className="py-1"></td>
                  </tr>
                  {categorizeFirefighters(shift.key).map((data, index) => {
                    const { isBelowMinimum, minimumCount } = checkMinimums(data.category, data.count);
                    return (
                      <tr key={index} className="border-b border-gray-600">
                        <td className="py-1 px-2">{data.category}</td>
                        <td className={`py-1 px-2 text-right ${isBelowMinimum ? 'text-red-500' : ''}`}>
                          {data.count} {isBelowMinimum && <span className="text-sm">(min {minimumCount})</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mt-6 mb-6 text-center">Bomberos Asignados</h2>
        <div className="overflow-x-auto w-full rounded-lg">
          <table className="w-full text-center bg-gray-700 rounded-lg border-2 border-gray-700">
            <thead className={`${brigadeColor} ${nameColor}`}>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Puesto</th>
                <th className="py-2 px-2">Turno Asignado</th>
                {['mando', 'jefe'].includes(user.type) && (
                  <th className="py-2 px-2">Asignación</th>
                )}
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <React.Fragment key={shift.key}>
                  <tr className="bg-gray-800 text-white">
                    <td colSpan="4" className="py-4 px-4 text-center font-bold">{shift.label}</td>
                  </tr>
                  {/* Separador en blanco */}
                  <tr>
                    <td colSpan="4" className="py-1"></td>
                  </tr>
                  {filterFirefightersByShift(shift.key).length > 0 ? (
                    filterFirefightersByShift(shift.key).map((firefighter, index) => {
                      // Obtenemos la asignación previa para este turno y empleado (guard anterior: id_guard - 10)
                      const prevAssign = getPreviousAssignment(shift.key, firefighter.id_empleado);
                      return (
                        <tr key={`${firefighter.id_empleado}-${index}`} className="border-b border-gray-700">
                          <td className="py-2 px-2">
                            {firefighter.nombre} {firefighter.apellido} {prevAssign ? `(${prevAssign})` : ''}
                          </td>
                          <td className="py-2 px-2">{firefighter.puesto}</td>
                          <td className="py-2 px-2">{firefighter.turno}</td>
                          <td className="py-2 px-2">
                            {['mando', 'jefe'].includes(user.type) && (
                              <select
                                className="bg-gray-700 text-white p-1 rounded"
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
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">No hay bomberos asignados para este turno.</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={exportToPDF} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
          Exportar a PDF
        </button>

        {['mando', 'jefe'].includes(user.type) && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Completar Cuadrante
            </button>
            <button
              onClick={handleOpenDailyModal}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Actividades Diarias
            </button>
            <button onClick={() => setShowAssignFirefighterModal(true)} className="px-4 py-2 bg-purple-500 text-white rounded">
              Trasladar bombero
            </button>
            <button
              onClick={() => setShowRequireFirefighterModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded"
            >
              Requerir Bombero
            </button>
            <button
              onClick={() => setShowAssignFirefighterToBajasModal(true)}
              className="px-4 py-2 bg-teal-500 text-white rounded"
            >
              Asignar Baja Sobrevenida
            </button>
          </div>
        )}

        <div className="mt-6 w-full">
          <h2 className="text-xl font-bold mb-4">Comentarios</h2>
          <div className="bg-gray-700 p-4 rounded-lg">
            {user.type === 'jefe' ? (
              <>
                <textarea
                  className="w-full p-2 rounded bg-gray-600 text-white"
                  rows="4"
                  placeholder="Añadir comentarios..."
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                />
                <button
                  onClick={handleCommentSubmit}
                  className={`mt-2 px-4 py-2 rounded ${isUpdating ? 'bg-gray-500' : 'bg-blue-500'} text-white`}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Guardando...' : 'Guardar Comentarios'}
                </button>
              </>
            ) : (
              <p className="text-white">{comentarios || 'No hay comentarios disponibles.'}</p>
            )}
          </div>

          <div className="mt-6 w-full">
            <h2 className="text-xl font-bold mb-4">Incidencias de Personal</h2>
            <div className="bg-gray-700 p-4 rounded-lg">
              {['mando', 'jefe'].includes(user.type) ? (
                <>
                  <textarea
                    className="w-full p-2 rounded bg-gray-600 text-white"
                    rows="4"
                    placeholder="Añadir incidencias de personal..."
                    value={incidenciasPersonal}
                    onChange={(e) => setIncidenciasPersonal(e.target.value)}
                  />
                  <button
                    onClick={handlePersonalIncidentsSubmit}
                    className={`mt-2 px-4 py-2 rounded ${isUpdatingPersonal ? 'bg-gray-500' : 'bg-blue-500'
                      } text-white`}
                    disabled={isUpdatingPersonal}
                  >
                    {isUpdatingPersonal ? 'Guardando...' : 'Guardar Incidencias de Personal'}
                  </button>
                </>
              ) : (
                <p className="text-white">
                  {incidenciasPersonal || 'No hay incidencias de personal disponibles.'}
                </p>
              )}
            </div>
          </div>


          <div className="mt-6 w-full">
            <h2 className="text-xl font-bold mb-4">Intervenciones</h2>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddInterventionModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded"
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

          {/* Modal para añadir intervención */}
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
            onAdd={handleRefreshData}  // Se llama después de requerir el bombero
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
        </div>
      </div>
    </div>
  );
};

export default BrigadeDetail;
