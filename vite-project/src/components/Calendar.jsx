import { useState, useEffect } from 'react';
import { addMonths, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDarkMode } from '../contexts/DarkModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Calendar = ({ onDateClick, onEditClick, guards, brigadeMap, title = null }) => {
  const { darkMode } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { }, [guards, brigadeMap]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const getGuardForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const guard = guards.find((guard) => guard.date === dateString);
    return guard ? brigadeMap[guard.id_brigada] : null;
  };

  const handleDateClick = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const existingGuard = guards.find((guard) => guard.date === dateString);
    if (existingGuard && onEditClick) {
      onEditClick(existingGuard);
    } else {
      onDateClick(date);
    }
  };

  const startOfWeekDate = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    capitalizeFirstLetter(
      format(addDays(startOfWeekDate, i), isMobile ? 'EEEEE' : 'EEEE', { locale: es })
    ));

  const monthName = capitalizeFirstLetter(format(currentDate, 'MMMM yyyy', { locale: es }));

  const legendItems = [
    { name: 'Brigada A', short: 'A', color: 'bg-green-500' },
    { name: 'Brigada B', short: 'B', color: 'bg-zinc-50 border border-gray-300' },
    { name: 'Brigada C', short: 'C', color: 'bg-blue-500' },
    { name: 'Brigada D', short: 'D', color: 'bg-red-600' },
    { name: 'Brigada E', short: 'E', color: 'bg-yellow-300' },
    { name: 'Brigada F', short: 'F', color: 'bg-gray-900' },
    { name: 'GREPS', short: 'GREPS', color: 'bg-orange-500' },
    { name: 'GRAFOR', short: 'GRAFOR', color: 'bg-green-500' },
    { name: 'UNIBUL', short: 'UNIBUL', color: 'bg-indigo-500' },
    { name: 'Riesgos Tecnológicos', short: 'RiTec', color: 'bg-teal-500' },
    { name: 'Rescate Accidentes Tráfico', short: 'RAT', color: 'bg-blue-500' },
  ];

  // Estilos modernos
  const containerClass = `w-full rounded-3xl border p-6 transition-colors duration-300 ${darkMode
    ? 'border-slate-800 bg-slate-900/60'
    : 'border-slate-200 bg-salte-100'
    }`;

  const headerClass = `flex items-center justify-between mb-6 pb-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'
    }`;

  const buttonClass = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${darkMode
    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
    }`;

  const monthTitleClass = `text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'
    }`;

  const weekDayClass = `text-center text-xs font-semibold uppercase tracking-wider py-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'
    }`;

  const getDayClasses = (day, brigadeColor) => {
    const baseClass = `group relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer ${isMobile ? 'h-20 p-2' : 'h-24 p-4'
      }`;

    const monthOffsetClass = day.monthOffset !== 0
      ? darkMode
        ? 'text-slate-600 border-slate-800/50 bg-slate-900/30'
        : 'text-slate-400 border-slate-200/50 bg-slate-50/50'
      : '';

    const hoverClass = darkMode
      ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10'
      : 'hover:border-primary-400 hover:shadow-lg hover:shadow-primary-200/50';

    const brigadeClass = brigadeColor
      ? `${brigadeColor} ${darkMode
        ? 'border-slate-700'
        : 'border-slate-300'
      }`
      : darkMode
        ? 'border-slate-800 bg-slate-900/80'
        : 'border-slate-200 bg-white';

    return `${baseClass} ${monthOffsetClass} ${brigadeClass} ${hoverClass}`;
  };

  return (
    <div className={containerClass}>
      {/* Título opcional - Ahora más destacado */}
      {title && (
        <div className={`mb-6 px-6 py-5 rounded-2xl text-center ${darkMode
          ? 'bg-gradient-to-r from-primary-900/50 via-primary-800/50 to-primary-700/50 border-b border-slate-800'
          : 'bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 border-b border-primary-200'
          }`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] mb-2 ${darkMode ? 'text-primary-300' : 'text-primary-600'
            }`}>
            Calendario de Guardias
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
          let brigadeName = getGuardForDate(date);

          // Define el color y la abreviación según el nombre de la brigada
          let brigadeColor = '';
          let nameColor = darkMode ? 'text-slate-100' : 'text-slate-900';
          let brigadeShort = brigadeName;

          // IMPORTANTE: Solo aplicar colores de brigada si el día pertenece al mes actual
          if (day.monthOffset === 0 && brigadeName) {
            switch (brigadeName) {
              case 'Brigada A':
                brigadeColor = 'bg-green-500';
                nameColor = 'text-white';
                brigadeShort = 'A';
                break;
              case 'Brigada B':
                brigadeColor = darkMode ? 'bg-zinc-50' : 'bg-zinc-50';
                nameColor = darkMode ? 'text-slate-700' : 'text-slate-700';
                brigadeShort = 'B';
                break;
              case 'Brigada C':
                brigadeColor = 'bg-blue-500';
                nameColor = 'text-white';
                brigadeShort = 'C';
                break;
              case 'Brigada D':
                brigadeColor = 'bg-red-600';
                nameColor = 'text-white';
                brigadeShort = 'D';
                break;
              case 'Brigada E':
                brigadeColor = 'bg-yellow-300';
                nameColor = darkMode ? 'text-slate-900' : 'text-slate-900';
                brigadeShort = 'E';
                break;
              case 'Brigada F':
                brigadeColor = 'bg-gray-900';
                nameColor = 'text-white';
                brigadeShort = 'F';
                break;
              case 'GREPS':
                brigadeColor = 'bg-orange-500';
                nameColor = 'text-white';
                break;
              case 'GRAFOR':
                brigadeColor = 'bg-green-600';
                nameColor = 'text-white';
                brigadeShort = 'GRAFOR';
                break;
              case 'UNIBUL':
                brigadeColor = 'bg-indigo-500';
                nameColor = 'text-white';
                brigadeShort = 'UNIBUL';
                break;
              case 'Riesgos Tecnológicos':
                brigadeColor = 'bg-teal-500';
                brigadeName = 'RiTec';
                nameColor = 'text-white';
                brigadeShort = 'RiTec';
                break;
              case 'Rescate Accidentes Tráfico':
                brigadeColor = 'bg-blue-600';
                brigadeName = 'RAT';
                nameColor = 'text-white';
                brigadeShort = 'RAT';
                break;
              default:
                brigadeColor = '';
            }
          }

          const displayName = isMobile ? brigadeShort : brigadeName;

          return (
            <div
              key={index}
              className={getDayClasses(day, brigadeColor)}
              onClick={() => handleDateClick(date)}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'} ${day.monthOffset === 0 ? nameColor : ''
                  }`}>
                  {day.day}
                </div>
                {displayName && day.monthOffset === 0 && (
                  <div className={`mt-1 font-medium ${isMobile ? 'text-xs' : 'text-sm'} ${nameColor}`}>
                    {displayName}
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

export default Calendar;