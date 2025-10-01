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

  const cardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-100' : 'border-slate-200 bg-white/80 text-slate-900'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const pillButtonClass = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
    darkMode
      ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-primary-400 hover:text-primary-200'
      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600'
  }`;
  const tableWrapperClass = `overflow-hidden rounded-2xl border transition-colors ${
    darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-white'
  }`;
  const tableHeadClass = darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-600';
  const tableBodyClass = darkMode
    ? 'divide-y divide-slate-800/60 text-slate-100'
    : 'divide-y divide-slate-200 text-slate-700';
  const tableRowHoverClass = `transition-colors ${
    darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/80'
  }`;

  const monthLabel = dayjs(currentMonth).format('MMMM YYYY');
  const formattedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const totalDineroNumber = Number(totalDinero);
  const totalDineroFormatted = `${totalDineroNumber.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

  const summaryStats = [
    { label: 'Horas diurnas', value: totalDiurnas },
    { label: 'Horas nocturnas', value: totalNocturnas },
    { label: 'Total generado', value: totalDineroFormatted },
  ];

  if (loading) {
    return (
      <section className={cardClass}>
        <p className={`text-sm font-medium ${subtleTextClass}`}>Cargando horas extra del mes...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cardClass}>
        <p className="text-sm font-semibold text-red-500">{error}</p>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
            Horas extra
          </p>
          <h3 className="mt-2 text-xl font-semibold">Resumen mensual de servicios adicionales</h3>
          <p className={`mt-1 text-xs ${subtleTextClass}`}>
            Consulta las horas realizadas fuera de turno y su retribución estimada.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
              darkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {formattedMonthLabel}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={handlePreviousMonth} className={pillButtonClass}>
              Mes anterior
            </button>
            <button type="button" onClick={handleNextMonth} className={pillButtonClass}>
              Mes siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 transition-colors ${
              darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
              {stat.label}
            </p>
            <p className="mt-2 text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {extraHours.length > 0 ? (
          <div className={tableWrapperClass}>
            <table className="w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Horas diurnas</th>
                  <th className="px-4 py-3 text-left">Horas nocturnas</th>
                  <th className="px-4 py-3 text-left">Retribución</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {extraHours.map((extraHour) => {
                  const totalSalary =
                    extraHour.horas_diurnas * parseFloat(extraHour.salarie.precio_diurno) +
                    extraHour.horas_nocturnas * parseFloat(extraHour.salarie.precio_nocturno);

                  return (
                    <tr key={extraHour.id} className={tableRowHoverClass}>
                      <td className="px-4 py-3">{dayjs(extraHour.date).format('DD MMM YYYY')}</td>
                      <td className="px-4 py-3">{extraHour.horas_diurnas}</td>
                      <td className="px-4 py-3">{extraHour.horas_nocturnas}</td>
                      <td className="px-4 py-3">{totalSalary.toFixed(2)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed px-4 py-5 text-sm ${
              darkMode
                ? 'border-slate-700/70 bg-slate-900/40 text-slate-300'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            No hay horas extra registradas en este mes.
          </div>
        )}
      </div>
    </section>
  );
};

export default UserExtraHoursTable;