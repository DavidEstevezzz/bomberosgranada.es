import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import GuardsApiService from '../services/GuardsApiService';
import AddGuardCommentsModal from './AddGuardCommentsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const BrigadeDetail = () => {
  const { user } = useStateContext();
  const { id_brigada } = useParams();
  const [brigade, setBrigade] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [comentarios, setComentarios] = useState(''); // Estado para los comentarios
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const navigate = useNavigate();

  const minimums = {
    1: { Subinspector: 1, Oficial: 1, Operador: 2, Conductor: 3, Bombero: 6 },
    2: { Subinspector: 1, Oficial: 1, Operador: 0, Conductor: 3, Bombero: 6 },
  };
  const puestoPriority = {
    Operador: 1,
    Subinspector: 2,
    Oficial: 3,
    Conductor: 4,
    Bombero: 5,
  };

  const vehicleMapping = { // Mapeo para vehículos
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
        if (commentsResponse.data.comentarios) {
          setComentarios(commentsResponse.data.comentarios);
        } else {
          setComentarios(''); // Resetear comentarios si no hay ninguno
        }

        setError(null);
      } catch (error) {
        console.error('Error en fetchBrigadeDetails:', error); // Log completo del error
        setError('Failed to load brigade details');
      } finally {
        setLoading(false);
      }
    };

    fetchBrigadeDetails();
  }, [id_brigada, selectedDate]);

  const [assignments, setAssignments] = useState({
    Mañana: {},
    Tarde: {},
    Noche: {},
  });
  const options = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'C1', 'C2', 'C3', 'C4', 'C5', 'Operador 1', 'Operador 2'];

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleUpdateComments = (updatedData) => {
    setComentarios(updatedData.comentarios);
  };

  const handleAssignmentChange = (shift, employeeId, value) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      updated[shift] = { ...updated[shift], [employeeId]: value };
      return updated;
    });
  };

  const getAvailableOptions = (shift) => {
    const usedOptions = Object.values(assignments[shift]);
    return options.filter((option) => !usedOptions.includes(option));
  };

  const handleCommentSubmit = async () => {
    if (!user || user.type !== 'jefe') return;

    setIsUpdating(true);
    try {
      const response = await GuardsApiService.updateGuardComments(
        id_brigada, // ID de la brigada
        selectedDate, // Fecha seleccionada
        comentarios // Comentarios a guardar
      );
      setComentarios(response.data.comentarios);
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
        const isCombinedShift = firefighter.turno === 'Mañana y tarde' && (shift === 'Mañana' || shift === 'Tarde')
          || firefighter.turno === 'Tarde y noche' && (shift === 'Tarde' || shift === 'Noche');
        return isCategory && (hasShift || isCombinedShift);
      }).length;
      return { category, count };
    });

    // Añadir categoría "Tropa" si el parque es 2
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

    // Definir mínimo para "Tropa" en el parque 2
    if (category === 'Tropa' && parkId === 2) {
      minimumCount = 10; // Mínimo específico para "Tropa"
    }

    return { isBelowMinimum: count < minimumCount, minimumCount };
  };

  const filterFirefightersByShift = (shift) => {
    return firefighters
      .filter(firefighter =>
        firefighter.turno === shift || // Turno exacto
        firefighter.turno === 'Día completo' || // Día completo aplica a todos los turnos
        (shift === 'Mañana' && ['Mañana y tarde', 'Mañana y noche'].includes(firefighter.turno)) || // Turno combinado que incluye la mañana
        (shift === 'Tarde' && ['Mañana y tarde', 'Tarde y noche'].includes(firefighter.turno)) || // Turno combinado que incluye la tarde
        (shift === 'Noche' && ['Tarde y noche', 'Mañana y noche'].includes(firefighter.turno)) // Turno combinado que incluye la noche
      )
      .sort((a, b) => puestoPriority[a.puesto] - puestoPriority[b.puesto]); // Ordenar por prioridad
  };



  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text('BOMBEROS POR TURNO', pageWidth / 2, 20, { align: 'center' });

    shifts.forEach((shift) => {
      const previousY = doc.previousAutoTable?.finalY || 20;
      doc.setFontSize(14);
      doc.text(`${shift.label}`, pageWidth / 2, previousY + 15, { align: 'center' });

      let headers = ['Nombre', 'Puesto', 'Teléfono', 'Turno asignado', 'Asignación'];
      if (shift.key === 'Mañana') {
        headers.push('Vehículos'); // Añade la columna de vehículos solo para el turno de mañana
      }

      const body = filterFirefightersByShift(shift.key).map((firefighter) => {
        let row = [
          `${firefighter.nombre} ${firefighter.apellido}`,
          firefighter.puesto,
          firefighter.telefono,
          firefighter.turno,
          assignments[shift.key][firefighter.id_empleado] || 'No asignado',
        ];

        if (shift.key === 'Mañana') {
          let assignedVehicle = vehicleMapping[assignments[shift.key][firefighter.id_empleado]] || '';
          row.push(assignedVehicle); // Añade información de vehículos o deja en blanco
        }
        return row;
      });

      doc.autoTable({
        startY: previousY + 20,
        head: [headers],
        body: body,
        theme: 'striped',
        styles: { halign: 'center' },
        headStyles: { fillColor: [22, 160, 133], halign: 'center' },
        bodyStyles: { textColor: [44, 62, 80], halign: 'center' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
    });
    doc.save('Bomberos_Por_Turno.pdf');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!brigade) return <div>No brigade data available.</div>;

  const { nombre, park } = brigade;

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
        <h1 className="text-2xl font-bold mb-4 text-center">{nombre}</h1>
        <p className="text-center"><strong>Parque:</strong> {park ? park.nombre : 'No disponible'}</p>
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
            <thead className='bg-gray-600'>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Puesto</th>
                <th className="py-2 px-2">Turno Asignado</th>
                {['mando', 'jefe'].includes(user.type) && (
                  <th className="py-2 px-2">Puesto</th>
                )}    </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <>
                  <tr key={`header-${shift.key}`} className="bg-gray-800 text-white">
                    <td colSpan="5" className="py-4 px-4 text-center font-bold">{shift.label}</td>
                  </tr>
                  {filterFirefightersByShift(shift.key).length > 0 ? (
                    filterFirefightersByShift(shift.key).map((firefighter, index) => (
                      <tr key={`${firefighter.id_empleado}-${index}`} className="border-b border-gray-700">
                        <td className="py-2 px-2">{firefighter.nombre} {firefighter.apellido}</td>
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
                              {options.map((option) => (
                                <option
                                  key={option}
                                  value={option}
                                  disabled={
                                    Object.entries(assignments[shift.key]).some(
                                      ([_, selectedOption]) => selectedOption === option
                                    )
                                  }
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr key={`no-firefighters-${shift.key}`}>
                      <td colSpan="4" className="text-center py-4">No hay bomberos asignados para este turno.</td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

        </div>

        <button onClick={exportToPDF} className="bg-green-500 text-white px-4 py-2 rounded mt-4">Exportar a PDF</button>

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
