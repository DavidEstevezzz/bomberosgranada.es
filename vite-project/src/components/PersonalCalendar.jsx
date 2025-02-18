// PersonalCalendar.jsx
import React, { useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const PersonalCalendar = ({ calendarDate, guardEvents = [], requestEvents = [] }) => {
  useEffect(() => {
    console.log('PersonalCalendar - guardEvents array:', guardEvents);
    console.log('PersonalCalendar - requestEvents array:', requestEvents);
  }, [guardEvents, requestEvents]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Genera una grilla de 42 celdas (6 semanas)
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

  // Agrupar eventos de guardias y solicitudes por fecha (clave = 'YYYY-MM-DD')
  // Se priorizan los eventos de solicitudes sobre los de guardias
  const eventsByDate = [...guardEvents, ...requestEvents].reduce((acc, ev) => {
    const { date } = ev;
    if (!acc[date]) acc[date] = [];
    acc[date].push(ev);
    return acc;
  }, {});

  // Para cada día, si hay eventos de solicitud, priorizar esos.
  const getEventForDate = (dateString) => {
    const events = eventsByDate[dateString] || [];
    const requestEvent = events.find(e => e.eventType === 'request');
    if (requestEvent) return requestEvent;
    return events[0] || null;
  };

  // Nombres de los días de la semana
  const startOfCurrentWeek = startOfWeek(calendarDate, { locale: es, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startOfCurrentWeek, i), 'EEEE', { locale: es })
  );

  return (
    <div className="calendar w-full">
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
          const dateString = format(date, 'yyyy-MM-dd');
          const eventForDay = getEventForDate(dateString);
          let cellColor = 'hover:bg-gray-200';
          let label = null;
          if (eventForDay) {
            cellColor = eventForDay.color || 'bg-blue-500';
            label = eventForDay.label;
          }
          return (
            <div
              key={index}
              className={`day h-24 p-4 text-center cursor-pointer rounded-lg border ${
                monthOffset !== 0 ? 'text-gray-400' : 'text-black'
              } ${cellColor}`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div>{day}</div>
                {label && <div className="brigade-name text-xs mt-1">{label}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalCalendar;
