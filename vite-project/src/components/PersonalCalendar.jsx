import React, { useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDarkMode } from '../contexts/DarkModeContext';

const PersonalCalendar = ({ calendarDate, guardEvents = [], requestEvents = [] }) => {
  const { darkMode } = useDarkMode();
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

  const weekDayClass = `text-center text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-slate-300' : 'text-slate-500'
    }`;
  const baseCellClass = darkMode
    ? 'border-slate-800/70 bg-slate-950/40 text-slate-200 hover:bg-slate-900/60'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50/80';

  return (
    <div className="calendar w-full">
      {/* Encabezado de los días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className={weekDayClass}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </div>
        ))}
      </div>
      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((item, index) => {
          const { date, day, monthOffset } = item;
          const dateString = format(date, 'yyyy-MM-dd');
          const eventForDay = getEventForDate(dateString);
          let label = null;
          let eventClasses = '';
          let eventLabelClass = darkMode ? 'text-slate-300' : 'text-slate-500';
          if (eventForDay) {
            eventClasses = `${eventForDay.color} hover:opacity-90`;
            const usesLightBg = eventForDay.color?.includes('yellow') || eventForDay.color?.includes('white');
            eventLabelClass = usesLightBg ? 'text-slate-900' : 'text-white';
            label = eventForDay.label;
          }
          return (
            <div
              key={index}
              className={`day flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border p-4 text-center text-xs transition-colors ${monthOffset !== 0 ? 'opacity-50' : ''
                } ${eventForDay ? eventClasses : baseCellClass}`}
            >
              <div className="text-sm font-semibold">{day}</div>
              {label && (
                <div className={`mt-2 text-[0.65rem] font-medium leading-tight ${eventLabelClass}`}>
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalCalendar;