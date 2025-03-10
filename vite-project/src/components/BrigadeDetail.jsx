import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import GuardAssignmentApiService from '../services/GuardAssignmentApiService';
import AddGuardCommentsModal from './AddGuardCommentsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../assets/logo.png';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const BrigadeDetail = () => {
  const { user } = useStateContext();
  const { id_brigada } = useParams();
  const [brigade, setBrigade] = useState(null);
  const [guardDetails, setGuardDetails] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [comentarios, setComentarios] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const navigate = useNavigate();

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

  // Función para obtener las opciones del select según puesto y parque
  const getOptionsForPosition = (firefighter) => {
    const puesto = firefighter.puesto.toLowerCase();
    // Para puestos "subinspector" y "oficial"
    if (puesto === 'subinspector' || puesto === 'oficial') {
      if (brigade?.park?.nombre?.toLowerCase().includes('norte')) {
        return ['N1', 'N2', 'N3', 'N4'];
      } else if (brigade?.park?.nombre?.toLowerCase().includes('sur')) {
        return ['S1', 'S2', 'S3', 'S4'];
      } else {
        return [];
      }
    }
    // Para puesto "bombero"
    if (puesto === 'bombero') {
      return ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'];
    }
    // Para puesto "conductor"
    if (puesto === 'conductor') {
      return ['C1', 'C2', 'C3', 'C4', 'C5'];
    }
    // Para puesto "operador"
    if (puesto === 'operador') {
      return ['Operador 1', 'Operador 2', 'Operador 3'];
    }
    return [];
  };

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
        } else {
          setGuardDetails(null);
          setComentarios('');
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

  // Estados y funciones para asignaciones (actuales y previas)
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

  // Cargar asignaciones actuales y previas
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

  // Funciones de modal y actualización de comentarios...
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleUpdateComments = (updatedData) => {
    console.log('Comentarios actualizados:', updatedData);
    setComentarios(updatedData.comentarios);
    setGuardDetails(updatedData.guard ? updatedData.guard : updatedData);
  };

  // Guardar asignación en la BD
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

  // Manejar cambios en la asignación
  const handleAssignmentChange = (shift, employeeId, value) => {
    setAssignments(prev => {
      let newAssignments = { ...prev };
      newAssignments[shift] = { ...newAssignments[shift], [employeeId]: value };
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

  // Función auxiliar para obtener la asignación actual de un bombero
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

  // Función auxiliar para obtener la asignación previa
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

  // Función para filtrar bomberos por turno y ordenarlos:
  // Primero por prioridad del puesto y, en caso de empate, por dni de menor a mayor.
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
        const puestoDiff = puestoPriority[a.puesto] - puestoPriority[b.puesto];
        if (puestoDiff !== 0) return puestoDiff;
        const dniA = parseInt(a.dni, 10);
        const dniB = parseInt(b.dni, 10);
        const result = dniA - dniB;
        console.log('Ejemplo de objeto firefighter:', firefighters[0]);

        return result;
      });
  };

  // Función auxiliar para calcular el número de radio (sin cambios)
  const getRadioNumber = (assignment, parkId) => {
    if (!assignment || assignment === 'No asignado') return '';
    const cleanAssignment = assignment.trim();
    const letter = cleanAssignment.charAt(0).toUpperCase();
    const number = parseInt(cleanAssignment.slice(1), 10);
    if (isNaN(number)) return '';
  
    if (letter === 'N') {
      if (number === 1) return 1;
      if (number === 2) return 3;
      if (number === 3) return 5;
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
        return 16 + number * 2;
      } else {
        return 15 + number * 2;
      }
    }
    return '';
  };

  // Función para exportar a PDF (sin cambios en la lógica de asignaciones)
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
    const sortedFirefighters = [...firefighters].sort(
      (a, b) => {
        const diff = puestoPriority[a.puesto] - puestoPriority[b.puesto];
        if (diff !== 0) return diff;
        return a.dni - b.dni;
      }
    );
    const getNameCellBgColor = (assignment, puesto) => {
      if (puesto.toLowerCase() === 'operador') return [255, 255, 255];
      if (!assignment || assignment === 'No asignado') return [255, 255, 255];
      const cleanAssignment = assignment.trim().toUpperCase();
      const letter = cleanAssignment.charAt(0);
      if (letter === 'N' || letter === 'S') {
        if (cleanAssignment === 'N1' || cleanAssignment === 'S1') {
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
      const assignmentValue = getAssignmentValue(firefighter);
      const radio = assignmentValue !== 'No asignado'
        ? ` (${getRadioNumber(assignmentValue, brigade.park?.id_parque)})`
        : '';
      const fullName = `${firefighter.nombre} ${firefighter.apellido}${radio}`;
      const turnoLower = firefighter.turno.toLowerCase();
      const vehicleInfo =
        (turnoLower === 'mañana' ||
         turnoLower === 'día completo' ||
         turnoLower === 'mañana y tarde' ||
         turnoLower === 'mañana y noche')
          ? (vehicleMapping[assignmentValue] || '')
          : '';
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

  // Definimos los turnos para la tabla
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
                  {/** Aquí se muestran los conteos por categoría */}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mt-6 mb-6 text-center">Bomberos Asignados</h2>
        <div className="overflow-x-auto w-full rounded-lg">
          <table className="w-full text-center bg-gray-700 rounded-lg border-2 border-gray-700">
            <thead className={`${brigade?.nombre && brigade.nombre.includes('Brigada') ? '' : ''}`}>
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
                  <tr>
                    <td colSpan="4" className="py-1"></td>
                  </tr>
                  {filterFirefightersByShift(shift.key).length > 0 ? (
                    filterFirefightersByShift(shift.key).map((firefighter, index) => {
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
                                <option value="" disabled>Seleccione</option>
                                {getOptionsForPosition(firefighter).map((option) => (
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

          {['mando', 'jefe'].includes(user.type) && (
            <button
              onClick={handleOpenModal}
              className="mt-4 px-5 py-2.5 bg-green-500 text-white rounded-lg"
            >
              Añadir Comentarios Adicionales
            </button>
          )}

          <AddGuardCommentsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onUpdate={handleUpdateComments}
            id_brigada={id_brigada}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default BrigadeDetail;
