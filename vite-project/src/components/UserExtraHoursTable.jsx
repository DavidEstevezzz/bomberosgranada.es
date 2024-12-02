import React, { useState, useEffect } from 'react';
import ExtraHourApiService from '../services/ExtraHourApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const UserExtraHoursTable = ({ user }) => {
  const [extraHours, setExtraHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [totalDiurnas, setTotalDiurnas] = useState(0);
  const [totalNocturnas, setTotalNocturnas] = useState(0);
  const [totalDinero, setTotalDinero] = useState(0);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchUserExtraHours();
  }, [currentMonth]);

  const fetchUserExtraHours = async () => {
    setLoading(true);
    try {
      const response = await ExtraHourApiService.getExtraHours();
      if (response.data) {
        const userHours = response.data.filter(
          (extraHour) =>
            extraHour.id_empleado === user.id_empleado &&
            dayjs(extraHour.date).format('YYYY-MM') === currentMonth
        );

        const totalDiurnas = userHours.reduce((sum, hour) => sum + hour.horas_diurnas, 0);
        const totalNocturnas = userHours.reduce((sum, hour) => sum + hour.horas_nocturnas, 0);

        const totalDinero = userHours.reduce(
          (sum, hour) =>
            sum +
            hour.horas_diurnas * parseFloat(hour.salarie.precio_diurno) +
            hour.horas_nocturnas * parseFloat(hour.salarie.precio_nocturno),
          0
        );

        setExtraHours(userHours);
        setTotalDiurnas(totalDiurnas);
        setTotalNocturnas(totalNocturnas);
        setTotalDinero(totalDinero.toFixed(2)); // Redondear a dos decimales
        setError(null);
      } else {
        throw new Error('No extra hours data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch user extra hours:', error);
      setError('Failed to load user extra hours');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    const newMonth = dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = dayjs(currentMonth).add(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div
      className={`p-4 mt-4 max-w-4xl mx-auto rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <h1 className="text-2xl font-bold mb-4">Horas Extra</h1>
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePreviousMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
          Mes Anterior
        </button>
        <span className="text-lg font-semibold">{dayjs(currentMonth).format('MMMM YYYY').charAt(0).toUpperCase() + dayjs(currentMonth).format('MMMM YYYY').slice(1)}</span>
        <button onClick={handleNextMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
          Mes Siguiente
        </button>
      </div>

      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2">Horas Diurnas</th>
                <th className="py-2 px-2">Horas Nocturnas</th>
                <th className="py-2 px-2">Total Salario</th>
              </tr>
            </thead>
            <tbody>
              {extraHours.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No hay horas extras para este mes
                  </td>
                </tr>
              ) : (
                extraHours.map((extraHour) => {
                  const totalSalary =
                    extraHour.horas_diurnas * parseFloat(extraHour.salarie.precio_diurno) +
                    extraHour.horas_nocturnas * parseFloat(extraHour.salarie.precio_nocturno);

                  return (
                    <tr key={extraHour.id} className="border-b border-gray-700">
                      <td className="py-2 px-2">{dayjs(extraHour.date).format('DD-MM-YYYY')}</td>
                      <td className="py-2 px-2">{extraHour.horas_diurnas}</td>
                      <td className="py-2 px-2">{extraHour.horas_nocturnas}</td>
                      <td className="py-2 px-2">{totalSalary.toFixed(2)} €</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-gray-700 text-white">
        <h2 className="text-lg font-bold">Resumen</h2>
        <p>Total Horas Diurnas: {totalDiurnas}</p>
        <p>Total Horas Nocturnas: {totalNocturnas}</p>
        <p>Total Dinero Generado: {totalDinero} €</p>
      </div>
    </div>
  );
};

export default UserExtraHoursTable;
