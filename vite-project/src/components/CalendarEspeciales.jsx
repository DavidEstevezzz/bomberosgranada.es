import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDarkMode } from '../contexts/DarkModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const CalendarEspeciales = ({ onDateClick, guards, brigadeMap, title = null }) => {
  const { darkMode } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {}, [guards, brigadeMap]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const generateCalendar = (year, month) => {
    const startOfMonth = startOfWeek(new Date(year, month, 1), { weekStartsOn: 1 });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDay();

    let days = [];

    for (let i = (firstDayOfMonth + 6) % 7; i > 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i + 1);
      date.setHours(0, 0, 0, 0);
      days.push({
        day: daysInPrevMonth - i + 1,
        monthOffset: -1,
        date,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        day: i,
        monthOffset: 0,
        date,
      });
    }

    for (let i = 1; i < 7 - (lastDayOfMonth + 6) % 7; i++) {
      const date = new Date(year, month + 1, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        day: i,
        monthOffset: 1,
        date,
      });
    }

    return days;
  };

  const days = generateCalendar(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Función para obtener todas las guardias para una fecha específica
  const getGuardsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const guardsOnDate = guards.filter((guard) => guard.date === dateString);
    
    return guardsOnDate.map(guard => {
      const brigadeName = brigadeMap[guard.id_brigada] || 'Sin Brigada';
      const displayInfo = getBrigadeDisplayInfo(brigadeName);
      
      return {
        ...guard,
        brigadeName: displayInfo.displayName || brigadeName,
        brigadeColor: displayInfo.brigadeColor,
        nameColor: displayInfo.nameColor
      };
    });
  };

  // Función auxiliar para obtener información de visualización de la brigada
  const getBrigadeDisplayInfo = (brigadeName) => {
    let brigadeColor = '';
    let nameColor = darkMode ? 'text-slate-100' : 'text-slate-900';
    let displayName = brigadeName;

    switch (brigadeName) {
      case 'Brigada A':
        brigadeColor = 'bg-green-500';
        nameColor = 'text-white';
        break;
      case 'Brigada B':
        brigadeColor = darkMode ? 'bg-slate-700' : 'bg-zinc-50';
        nameColor = darkMode ? 'text-slate-200' : 'text-slate-700';
        break;
      case 'Brigada C':
        brigadeColor = 'bg-blue-500';
        nameColor = 'text-white';
        break;
      case 'Brigada D':
        brigadeColor = 'bg-red-600';
        nameColor = 'text-white';
        break;
      case 'Brigada E':
        brigadeColor = 'bg-yellow-300';
        nameColor = darkMode ? 'text-slate-900' : 'text-slate-900';
        break;
      case 'Brigada F':
        brigadeColor = 'bg-gray-300';
        nameColor = 'text-gray-700';
        break;
      case 'GREPS':
        brigadeColor = 'bg-orange-500';
        nameColor = 'text-white';
        break;
      case 'GRAFOR':
        brigadeColor = 'bg-green-600';
        nameColor = 'text-white';
        break;
      case 'UNIBUL':
        brigadeColor = 'bg-indigo-500';
        nameColor = 'text-white';
        break;
      case 'Riesgos Tecnológicos':
        brigadeColor = 'bg-teal-500';
        displayName = 'RiTec';
        nameColor = 'text-white';
        break;
      case 'Rescate Accidentes Tráfico':
        brigadeColor = 'bg-blue-600';
        displayName = 'RAT';
        nameColor = 'text-white';
        break;
      default:
        brigadeColor = darkMode ? 'bg-slate-800' : 'bg-gray-200';
        nameColor = darkMode ? 'text-slate-300' : 'text-gray-800';
    }

    return { brigadeColor, nameColor, displayName };
  };

  const handleDateClick = (date) => {
    onDateClick(date);
  };

  const startOfWeekDate = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    capitalizeFirstLetter(format(addDays(startOfWeekDate, i), 'EEEE', { locale: es }))
  );

  const monthName = capitalizeFirstLetter(format(currentDate, 'MMMM yyyy', { locale: es }));

  // Estilos modernos
  const containerClass = `w-full rounded-3xl border p-6 transition-colors duration-300 ${
    darkMode 
      ? 'border-slate-800 bg-slate-900/60' 
      : 'border-slate-200 bg-white'
  }`;

  const headerClass = `flex items-center justify-between mb-6 pb-4 border-b ${
    darkMode ? 'border-slate-800' : 'border-slate-200'
  }`;

  const buttonClass = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
    darkMode
      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
  }`;

  const monthTitleClass = `text-xl font-bold ${
    darkMode ? 'text-slate-100' : 'text-slate-900'
  }`;

  const weekDayClass = `text-center text-xs font-semibold uppercase tracking-wider py-3 ${
    darkMode ? 'text-slate-400' : 'text-slate-600'
  }`;

  const getDayClasses = (day, hasGuards) => {
    const baseClass = `group relative flex flex-col p-2 rounded-2xl border transition-all duration-200 cursor-pointer min-h-24`;

    const monthOffsetClass = day.monthOffset !== 0 
      ? darkMode 
        ? 'text-slate-600 border-slate-800/50 bg-slate-900/30' 
        : 'text-slate-400 border-slate-200/50 bg-slate-50/50'
      : '';

    const hoverClass = darkMode
      ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10'
      : 'hover:border-primary-400 hover:shadow-lg hover:shadow-primary-200/50';

    const defaultBgClass = !hasGuards && day.monthOffset === 0
      ? darkMode
        ? 'border-slate-800 bg-slate-900/80'
        : 'border-slate-200 bg-white'
      : '';

    return `${baseClass} ${monthOffsetClass} ${hoverClass} ${defaultBgClass}`;
  };

  return (
    <div className={containerClass}>
      {/* Título opcional */}
      {title && (
        <div className={`mb-6 px-6 py-5 rounded-2xl text-center ${
          darkMode
            ? 'bg-gradient-to-r from-primary-900/50 via-primary-800/50 to-primary-700/50 border-b border-slate-800'
            : 'bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 border-b border-primary-200'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] mb-2 ${
            darkMode ? 'text-primary-300' : 'text-primary-600'
          }`}>
            Calendario de Guardias Especiales
          </p>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {title}
          </h2>
        </div>
      )}

      {/* Header con navegación */}
      <div className={headerClass}>
        <button 
          onClick={handlePrevMonth} 
          className={buttonClass}
          aria-label="Mes anterior"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        
        <h2 className={monthTitleClass}>
          {monthName}
        </h2>
        
        <button 
          onClick={handleNextMonth} 
          className={buttonClass}
          aria-label="Mes siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
        </button>
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 gap-2">
        {/* Días de la semana */}
        {weekDays.map((day) => (
          <div className={weekDayClass} key={day}>
            {day}
          </div>
        ))}

        {/* Días del mes */}
        {days.map((day, index) => {
          const { date } = day;
          const guardsOnDate = getGuardsForDate(date);
          const hasGuards = guardsOnDate.length > 0 && day.monthOffset === 0;

          return (
            <div
              key={index}
              className={getDayClasses(day, hasGuards)}
              onClick={() => handleDateClick(date)}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-semibold mb-1 ${
                  day.monthOffset !== 0 
                    ? darkMode ? 'text-slate-600' : 'text-slate-400'
                    : darkMode ? 'text-slate-200' : 'text-slate-900'
                }`}>
                  {day.day}
                </div>
                
                {/* Contenedor de guardias - Muestra múltiples badges */}
                {hasGuards && (
                  <div className="brigades-container space-y-1 mt-1 flex-1">
                    {guardsOnDate.map((guard, guardIndex) => (
                      <div 
                        key={guardIndex} 
                        className={`${guard.brigadeColor} rounded-xl px-2 py-1.5 text-xs font-medium ${guard.nameColor} shadow-sm transition-transform duration-200 hover:scale-105`}
                      >
                        {guard.brigadeName}
                      </div>
                    ))}
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

export default CalendarEspeciales;