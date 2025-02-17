import React, { useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const PersonalCalendar = ({ calendarDate, guards = [] }) => {
  useEffect(() => {
    console.log('PersonalCalendar - guards array:', guards);
  }, [guards]);

  // Extraemos año y mes de la prop calendarDate
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Genera un array de 42 celdas (6 semanas) para el calendario
  const generateCalendar = (year, month) => {
    const startOfMonth = new Date(year, month, 1);
    const firstDayIndex = (startOfMonth.getDay() + 6) % 7; // Ajuste para que lunes sea el primer día
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const result = [];
    // Días del mes anterior
    for (let i = 1; i <= firstDayIndex; i++) {
      const day = daysInPrevMonth - firstDayIndex + i;
      const date = new Date(year, month - 1, day);
      result.push({ day, monthOffset: -1, date });
    }
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      result.push({ day: i, monthOffset: 0, date });
    }
    // Días del mes siguiente (para completar 42 celdas)
    const totalCells = 42;
    const nextDays = totalCells - result.length;
    for (let i = 1; i <= nextDays; i++) {
      const date = new Date(year, month + 1, i);
      result.push({ day: i, monthOffset: 1, date });
    }
    return result;
  };

  const days = generateCalendar(year, month);

  // Función que devuelve, si existe, la información de guardia para una fecha
  const getGuardInfoForDate = (dateObj) => {
    const dateString = format(dateObj, 'yyyy-MM-dd');
    return guards.find((g) => g.date === dateString);
  };

  // Preparamos los nombres de los días de la semana
  const startOfCurrentWeek = startOfWeek(calendarDate, { locale: es, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    capitalizeFirstLetter(format(addDays(startOfCurrentWeek, i), 'EEEE', { locale: es }))
  );

  // Nombre del mes (ej. "Febrero 2025")
  const monthName = capitalizeFirstLetter(format(calendarDate, 'MMMM yyyy', { locale: es }));

  return (
    <div className="calendar w-full">
      {/* Encabezado (sin navegación, ya que se controla en el contenedor) */}
      <div className="text-center mb-4">
        <span className="text-xl font-bold">{monthName}</span>
      </div>

      {/* Encabezado de los días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="day-name text-center font-bold capitalize">
            {day}
          </div>
        ))}
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((item, index) => {
          const { date, day, monthOffset } = item;
          const guardInfo = getGuardInfoForDate(date);
          const hasGuard = Boolean(guardInfo);
          // Si hay guardia, si "requerimiento" es true se pinta de verde, si no se pinta de rojo
          const cellColor = hasGuard
            ? (guardInfo.requerimiento ? 'bg-green-300' : 'bg-red-300')
            : 'hover:bg-gray-200';

          return (
            <div
              key={index}
              className={`day h-24 p-4 text-center cursor-pointer rounded-lg border
                ${monthOffset !== 0 ? 'text-gray-400' : 'text-black'} ${cellColor}`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div>{day}</div>
                {hasGuard && (
                  <div className="brigade-name text-xs mt-1">
                    {guardInfo.brigadeName || 'Guardia'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalCalendar;
