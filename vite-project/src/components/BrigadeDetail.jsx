import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'react-router-dom';

const BrigadeDetail = () => {
  const { id_brigada } = useParams();
  const [brigade, setBrigade] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const navigate = useNavigate();

  const minimums = {
    1: { Subinspector: 1, Oficial: 1, Operador: 2, Conductor: 3, Bombero: 6 },
    2: { Subinspector: 1, Oficial: 1, Operador: 0, Conductor: 3, Bombero: 6 },
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
        setError(null);
      } catch (error) {
        setError('Failed to load brigade details');
      } finally {
        setLoading(false);
      }
    };

    fetchBrigadeDetails();
  }, [id_brigada, selectedDate]);

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
    return categories.map(category => {
      const count = firefighters.filter(firefighter => {
        const isCategory = firefighter.puesto === category;
        const hasShift = [shift, 'Día completo'].includes(firefighter.turno);
        const isCombinedShift = firefighter.turno === 'Mañana y tarde' && (shift === 'Mañana' || shift === 'Tarde')
          || firefighter.turno === 'Tarde y noche' && (shift === 'Tarde' || shift === 'Noche');
        return isCategory && (hasShift || isCombinedShift);
      }).length;
      return { category, count };
    });
  };

  const checkMinimums = (category, count) => {
    const parkId = brigade?.park?.id_parque;
    const minimumCount = minimums[parkId]?.[category] || 0;
    return { isBelowMinimum: count < minimumCount, minimumCount };
  };

  const filterFirefightersByShift = (shift) => {
    return firefighters.filter(firefighter =>
      firefighter.turno === shift ||
      firefighter.turno === 'Día completo' ||
      (shift === 'Mañana' && firefighter.turno === 'Mañana y tarde') ||
      (shift === 'Tarde' && ['Mañana y tarde', 'Tarde y noche'].includes(firefighter.turno)) ||
      (shift === 'Noche' && firefighter.turno === 'Tarde y noche')
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
  
    // Usar la fuente Helvetica
    doc.setFont('helvetica', 'bold');
  
    // Título principal del documento
    const pageWidth = doc.internal.pageSize.getWidth(); // Ancho de la página
    doc.setFontSize(16);
    doc.text('BOMBEROS POR TURNO', pageWidth / 2, 20, { align: 'center' });
  
    shifts.forEach((shift, index) => {
      const previousY = doc.previousAutoTable?.finalY || 20;
  
      // Títulos de turnos
      doc.setFontSize(14);
      doc.text(`${shift.label}`, pageWidth / 2, previousY + 15, { align: 'center' });
  
      // Generar tabla
      doc.autoTable({
        startY: previousY + 20,
        head: [['Nombre', 'Puesto', 'Teléfono', 'Turno asignado']], // Encabezados
        body: filterFirefightersByShift(shift.key).map(firefighter => [
          `${firefighter.nombre} ${firefighter.apellido}`,
          firefighter.puesto,
          firefighter.telefono,
          firefighter.turno,
        ]),
        theme: 'striped',
        styles: { halign: 'center' }, // Centrar contenido de las tablas
        headStyles: { fillColor: [22, 160, 133], halign: 'center' }, // Encabezado centrado
        bodyStyles: { textColor: [44, 62, 80], halign: 'center' }, // Cuerpo centrado
        alternateRowStyles: { fillColor: [240, 240, 240] }, // Colores alternados para filas
      });
    });
  
    // Guardar el archivo PDF
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

        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePreviousDay} className="bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FontAwesomeIcon icon={faChevronLeft} />
            <span>Anterior</span>
          </button>
          <span className="text-xl font-bold">{dayjs(selectedDate).format('DD/MM/YYYY')}</span>
          <button onClick={handleNextDay} className="bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2">
            <span>Siguiente</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

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
      <th className="py-2 px-2">Teléfono</th>
      <th className="py-2 px-2">Turno Asignado</th>
    </tr>
  </thead>
  <tbody>
    {shifts.map(shift => (
      <>
        <tr key={`header-${shift.key}`} className="bg-gray-800 text-white">
          <td colSpan="4" className="py-4 px-4 text-center font-bold">{shift.label}</td>
        </tr>
        {filterFirefightersByShift(shift.key).length > 0 ? (
          filterFirefightersByShift(shift.key).map((firefighter, index) => (
            <tr key={`${firefighter.id_empleado}-${index}`} className="border-b border-gray-700">
              <td className="py-2 px-2">{firefighter.nombre} {firefighter.apellido}</td>
              <td className="py-2 px-2">{firefighter.puesto}</td>
              <td className="py-2 px-2">{firefighter.telefono}</td>
              <td className="py-2 px-2">{firefighter.turno}</td>
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
      </div>
    </div>
  );
};

export default BrigadeDetail;
