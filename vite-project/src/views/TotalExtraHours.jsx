import React, { useState, useEffect } from 'react';
import ExtraHourApiService from '../services/ExtraHourApiService';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TotalExtraHours = () => {
  const [groupedExtraHours, setGroupedExtraHours] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Se obtiene la data filtrada por mes directamente del backend
  useEffect(() => {
    const fetchExtraHoursByMonth = async () => {
      setLoading(true);
      try {
        const response = await ExtraHourApiService.getExtraHoursByMonth(currentMonth);
        if (response.data) {
          setGroupedExtraHours(response.data);
          setError(null);
        } else {
          throw new Error('No extra hours data returned from the API');
        }
      } catch (error) {
        console.error('Failed to fetch extra hours by month:', error);
        setError('Failed to load extra hours');
      } finally {
        setLoading(false);
      }
    };

    fetchExtraHoursByMonth();
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    const newMonth = dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = dayjs(currentMonth).add(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Horas Extras - ${dayjs(currentMonth).format('MMMM YYYY')}`, 10, 10);

    doc.autoTable({
      head: [['Nombre', 'Apellido', 'Horas Diurnas', 'Horas Nocturnas', 'Total Salario']],
      body: groupedExtraHours.map((extraHour) => [
        extraHour.nombre,
        extraHour.apellido,
        extraHour.horas_diurnas,
        extraHour.horas_nocturnas,
        `${extraHour.total_salary.toFixed(2)} €`
      ]),
      startY: 20,
    });

    doc.save(`Horas_Extras_${currentMonth}.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">
          Horas Extras - {dayjs(currentMonth).format('MMMM YYYY')}
        </h1>
        <div className="flex items-center space-x-2">
          <button onClick={handlePreviousMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Anterior
          </button>
          <button onClick={handleNextMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Siguiente
          </button>
          <button onClick={exportToPDF} className="bg-green-500 text-white px-4 py-2 rounded">
            Exportar a PDF
          </button>
        </div>
      </div>
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Apellido</th>
                <th className="py-2 px-2">Horas Diurnas</th>
                <th className="py-2 px-2">Horas Nocturnas</th>
                <th className="py-2 px-2">Total Salario</th>
              </tr>
            </thead>
            <tbody>
              {groupedExtraHours.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No hay horas extras para este mes
                  </td>
                </tr>
              ) : (
                groupedExtraHours.map((extraHour) => (
                  <tr key={extraHour.id_empleado} className="border-b border-gray-700">
                    <td className="py-2 px-2">{extraHour.nombre}</td>
                    <td className="py-2 px-2">{extraHour.apellido}</td>
                    <td className="py-2 px-2">{extraHour.horas_diurnas}</td>
                    <td className="py-2 px-2">{extraHour.horas_nocturnas}</td>
                    <td className="py-2 px-2">{extraHour.total_salary.toFixed(2)} €</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TotalExtraHours;
