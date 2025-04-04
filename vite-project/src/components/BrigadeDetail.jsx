import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import GuardAssignmentApiService from '../services/GuardAssignmentApiService';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
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
  const [assignedRadioNumbers, setAssignedRadioNumbers] = useState(new Set());


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

  const exportToPDF = async () => {
    try {
      // Iniciar el PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const parqueNombre = brigade?.park ? brigade.park.nombre : 'Parque no disponible';
      const brigadeNombre = brigade ? brigade.nombre : 'Brigada no disponible';
      const fechaCompleta = dayjs(selectedDate).format('[Día] D [de] MMMM [de] YYYY');
      
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
  
      // Separar las asignaciones por tipo
      const jAssignments = allAssignments.filter(a => a === 'J' || a === 'Jefe de Guardia');
      const nAssignments = allAssignments.filter(a => a.startsWith('N'));
      const sAssignments = allAssignments.filter(a => a.startsWith('S'));
      const cAssignments = allAssignments.filter(a => a.startsWith('C'));
      const bAssignments = allAssignments.filter(a => a.startsWith('B'));
  
      // Registros de números ya utilizados
      const usedRadioNumbers = new Set();
  
      // Rangos reservados
      const CONDUCTOR_RANGE_START = 7;
      const CONDUCTOR_RANGE_END = 14;
  
      // Mapa para almacenar las asignaciones de radio finales
      const radioNumberByAssignment = {};
  
      // Función para verificar la disponibilidad
      const isEquipmentAvailable = async (radioNumber) => {
        try {
          const response = await PersonalEquipmentApiService.checkEquipmentAvailability(radioNumber);
          return response.data.available;
        } catch (error) {
          return false; // En caso de error, asumimos que no está disponible por seguridad
        }
      };
  
      // Función para encontrar el siguiente número disponible con restricciones
      const findNextAvailableNumber = async (baseNumber, increment = 2, skipRange = null) => {
        let currentNumber = baseNumber;
  
        // Si skipRange es proporcionado y el número base está en el rango, saltarlo
        if (skipRange && currentNumber >= skipRange.start && currentNumber <= skipRange.end) {
          currentNumber = skipRange.end + 1;
          // Ajustar para mantener la paridad
          if (currentNumber % 2 !== baseNumber % 2) {
            currentNumber++;
          }
        }
  
        // Verificar si el número está disponible
        let isUsed = usedRadioNumbers.has(currentNumber);
        let isAvailable = !isUsed && await isEquipmentAvailable(currentNumber);
  
        while (isUsed || !isAvailable) {
          currentNumber += increment;
  
          // Si hay un rango a evitar, saltar sobre él
          if (skipRange && currentNumber >= skipRange.start && currentNumber <= skipRange.end) {
            currentNumber = skipRange.end + 1;
            // Ajustar para mantener la paridad
            if (currentNumber % 2 !== baseNumber % 2) {
              currentNumber++;
            }
          }
  
          isUsed = usedRadioNumbers.has(currentNumber);
          isAvailable = !isUsed && await isEquipmentAvailable(currentNumber);
        }
  
        // Marcar como utilizado
        usedRadioNumbers.add(currentNumber);
        return currentNumber;
      };
  
      // Asignar valores fijos para Jefe
      for (const assignment of jAssignments) {
        radioNumberByAssignment[assignment] = 1;
        usedRadioNumbers.add(1);
      }
  
      // Rangos para N y S (evitando los números 7-14)
      const nsSkipRange = { start: CONDUCTOR_RANGE_START, end: CONDUCTOR_RANGE_END };
  
      // Procesar secuencialmente las asignaciones N
      for (const assignment of nAssignments) {
        const number = parseInt(assignment.slice(1), 10);
        let baseNumber;
  
        if (number === 1) {
          baseNumber = 1;
        } else if (number === 2) {
          baseNumber = 3;
        } else {
          baseNumber = 5 + (number - 3) * 2;
        }
  
        // Encontrar el siguiente número disponible, evitando el rango de conductores
        const radioNumber = await findNextAvailableNumber(baseNumber, 2, nsSkipRange);
        radioNumberByAssignment[assignment] = radioNumber;
      }
  
      // Procesar secuencialmente las asignaciones S
      for (const assignment of sAssignments) {
        const number = parseInt(assignment.slice(1), 10);
        let baseNumber;
  
        if (number === 1) {
          baseNumber = 2;
        } else if (number === 2) {
          baseNumber = 4;
        } else {
          baseNumber = 6 + (number - 3) * 2;
        }
  
        // Encontrar el siguiente número disponible, evitando el rango de conductores
        const radioNumber = await findNextAvailableNumber(baseNumber, 2, nsSkipRange);
        radioNumberByAssignment[assignment] = radioNumber;
      }
  
      // Procesar secuencialmente las asignaciones C (los números 7-14 están reservados para ellos)
      for (const assignment of cAssignments) {
        const number = parseInt(assignment.slice(1), 10);
        let baseNumber;
  
        if (parkId === 2) {
          // Parque 2: C1 -> 8, C2 -> 10, C3 -> 12...
          baseNumber = 8 + (number - 1) * 2;
        } else {
          // Parque 1: C1 -> 7, C2 -> 9, C3 -> 11...
          baseNumber = 7 + (number - 1) * 2;
        }
  
        // Si el número base excede el rango reservado, adaptamos
        if (baseNumber > CONDUCTOR_RANGE_END) {
          baseNumber = CONDUCTOR_RANGE_START + ((baseNumber - CONDUCTOR_RANGE_START) % (CONDUCTOR_RANGE_END - CONDUCTOR_RANGE_START + 1));
        }
  
        // Encontrar el siguiente número disponible, preferiblemente dentro del rango de conductores
        let radioNumber;
        if (baseNumber <= CONDUCTOR_RANGE_END) {
          // Intentar primero en el rango reservado
          let tempNumber = baseNumber;
          let isUsed = usedRadioNumbers.has(tempNumber);
          let isAvailable = !isUsed && await isEquipmentAvailable(tempNumber);
  
          let hasTriedAllInRange = false;
          let attempts = 0;
  
          // Intentar con todos los números del rango manteniendo paridad
          while ((!isAvailable || isUsed) && !hasTriedAllInRange) {
            tempNumber += 2;
            attempts++;
  
            // Si excede el rango, reiniciar desde el inicio del rango
            if (tempNumber > CONDUCTOR_RANGE_END) {
              if (baseNumber % 2 === 0) { // par
                tempNumber = CONDUCTOR_RANGE_START;
                if (tempNumber % 2 !== 0) tempNumber++; // Asegurar que sea par
              } else { // impar
                tempNumber = CONDUCTOR_RANGE_START;
                if (tempNumber % 2 === 0) tempNumber++; // Asegurar que sea impar
              }
            }
  
            // Si hemos vuelto al número base o probado todos, salir
            if (tempNumber === baseNumber || attempts >= (CONDUCTOR_RANGE_END - CONDUCTOR_RANGE_START) / 2 + 1) {
              hasTriedAllInRange = true;
            }
  
            isUsed = usedRadioNumbers.has(tempNumber);
            isAvailable = !isUsed && await isEquipmentAvailable(tempNumber);
          }
  
          if (isAvailable && !isUsed) {
            radioNumber = tempNumber;
            usedRadioNumbers.add(radioNumber);
          } else {
            // Si no hay números disponibles en el rango, buscar fuera del rango
            radioNumber = await findNextAvailableNumber(CONDUCTOR_RANGE_END + 1, 2);
          }
        } else {
          // Si el número base ya está fuera del rango, simplemente buscar el siguiente disponible
          radioNumber = await findNextAvailableNumber(baseNumber, 2);
        }
  
        radioNumberByAssignment[assignment] = radioNumber;
      }
  
      // Procesar secuencialmente las asignaciones B
      for (const assignment of bAssignments) {
        const number = parseInt(assignment.slice(1), 10);
        let baseNumber;
  
        if (parkId === 2) {
          // Parque 2: B1 -> 16, B2 -> 18, B3 -> 20...
          baseNumber = 16 + (number - 1) * 2;
        } else {
          // Parque 1: B1 -> 15, B2 -> 17, B3 -> 19...
          baseNumber = 15 + (number - 1) * 2;
        }
  
        // Encontrar el siguiente número disponible
        const radioNumber = await findNextAvailableNumber(baseNumber, 2);
        radioNumberByAssignment[assignment] = radioNumber;
      }
  
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
  
        // Obtener número de radio para esta asignación
        let radioNumber = '';
        if (assignmentValue !== 'No asignado') {
          // Tomar la primera asignación para el número de radio
          const primaryAssignment = assignmentValue.split(',')[0].trim();
  
          if (radioNumberByAssignment[primaryAssignment]) {
            radioNumber = ` (${radioNumberByAssignment[primaryAssignment]})`;
          } else if (primaryAssignment === 'Jefe de Guardia') {
            radioNumber = ' (1)';
          }
        }
  
        const fullName = `${firefighter.nombre} ${firefighter.apellido}${radioNumber}`;
  
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
          fillColor: [52, 73, 94], 
          textColor: pdfHeaderTextColor, 
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
        startY: function(pageCount, doc) {
          if (pageCount > 1 && estimatedTableHeight > availableSpace) {
            return 10; // Empezar casi al principio de la nueva página
          }
          return startY;
        }
      });
  
      // Añadir comentarios y otros detalles - SECCIÓN MEJORADA
      if (guardDetails) {
        // Título para la sección de datos adicionales
        const finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : startY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('DATOS ADICIONALES DEL SERVICIO', pageWidth / 2, finalY, { align: 'center' });
  
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
        
        // Verificar espacio disponible para tablas de comentarios
        const remainingHeight = doc.internal.pageSize.getHeight() - finalY - 30; // 30 margen de seguridad
        const estimatedTablesHeight = 80; // Aproximado para dos tablas con sus encabezados
        
        // Si no hay suficiente espacio, empezar en nueva página
        let commentStartY = finalY + 5;
        if (remainingHeight < estimatedTablesHeight) {
          doc.addPage();
          commentStartY = 20; // Empezar cerca del inicio de la nueva página
          
          // Repetir el título en la nueva página
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text('DATOS ADICIONALES DEL SERVICIO', pageWidth / 2, 10, { align: 'center' });
        }
        
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
  
        // Segunda tabla de comentarios (mejorada)
        doc.autoTable({
          startY: doc.previousAutoTable.finalY + 8,
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
        
        // Añadir pie de página con fecha de generación
        const pageHeight = doc.internal.pageSize.getHeight();
        const generationDate = new Date().toLocaleString();
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Documento generado: ${generationDate}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
      }
  
      // Guardar el PDF con nombre más descriptivo
      doc.save(`Bomberos_${brigade?.nombre || ''}_${selectedDate}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Ha ocurrido un error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
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

        <button onClick={() => exportToPDF()} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
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


          {(['mando', 'jefe'].includes(user.type)) && (
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
          )}

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
