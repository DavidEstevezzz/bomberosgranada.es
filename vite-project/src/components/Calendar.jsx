import { useState, useEffect } from 'react';
import { addMonths, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Calendar = ({ onDateClick, onEditClick, guards, brigadeMap }) => {
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
      date.setHours(0, 0, 0, 0); // Normaliza la hora
      days.push({
        day: daysInPrevMonth - i + 1,
        monthOffset: -1,
        date,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0); // Normaliza la hora
      days.push({
        day: i,
        monthOffset: 0,
        date,
      });
    }

    for (let i = 1; i < 7 - (lastDayOfMonth + 6) % 7; i++) {
      const date = new Date(year, month + 1, i);
      date.setHours(0, 0, 0, 0); // Normaliza la hora
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
    { name: 'Brigada F', short: 'F', color: 'bg-gray-300' },
    { name: 'GREPS', short: 'GREPS', color: 'bg-orange-500' },
    { name: 'GRAFOR', short: 'GRAFOR', color: 'bg-green-500' },
    { name: 'UNIBUL', short: 'UNIBUL', color: 'bg-indigo-500' },
    { name: 'Riesgos Tecnológicos', short: 'RiTec', color: 'bg-teal-500' },
    { name: 'Rescate Accidentes Tráfico', short: 'RAT', color: 'bg-blue-500' },
  ];

  return (
    <div className="calendar w-full">
      <div className="header flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="text-gray-600 hover:text-gray-800">
          &lt; Anterior
        </button>
        <span className="text-xl font-bold mb-5">{monthName}</span>
        <button onClick={handleNextMonth} className="text-gray-600 hover:text-gray-800">
          Siguiente &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            className={`day-name text-center font-bold ${isMobile ? 'text-xs' : ''}`}
            key={day}
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const { date } = day;
          let brigadeName = getGuardForDate(date);

          // Define el color y la abreviación según el nombre de la brigada
          let brigadeColor = '';
          let nameColor = 'text-black';
          let brigadeShort = brigadeName;
          switch (brigadeName) {
            // Casos originales
            case 'Brigada A':
              brigadeColor = 'bg-green-500';
              nameColor = 'text-black';
              brigadeShort = 'A';
              break;
            case 'Brigada B':
              brigadeColor = 'bg-zinc-50';
              nameColor = 'text-black';
              brigadeShort = 'B';
              break;
            case 'Brigada C':
              brigadeColor = 'bg-blue-500';
              nameColor = 'text-black';
              brigadeShort = 'C';
              break;
            case 'Brigada D':
              brigadeColor = 'bg-red-600';
              nameColor = 'text-black';
              brigadeShort = 'D';
              break;
            case 'Brigada E':
              brigadeColor = 'bg-yellow-300';
              nameColor = 'text-black';
              brigadeShort = 'E';
              break;
            case 'Brigada F':
              brigadeColor = 'bg-gray-300';
              nameColor = 'text-gray-600';
              brigadeShort = 'F';
              break;
            // Nuevas brigadas
            case 'GREPS':
              brigadeColor = 'bg-orange-500';
              nameColor = 'text-white';
              break;
            case 'GRAFOR':
              brigadeColor = 'bg-green-500'; // Se mantiene el verde solicitado
              nameColor = 'text-white';
              brigadeShort = 'GREPS';
              break;
            case 'UNIBUL':
              brigadeColor = 'bg-indigo-500';
              nameColor = 'text-white';
              brigadeShort = 'UNIBUL';
              break;
            case 'Riesgos Tecnológicos':
              brigadeColor = 'bg-teal-500';
              brigadeName = 'RiTec'; // Abreviación para que quepa en el cuadro
              nameColor = 'text-white';
              brigadeShort = 'RiTec';
              break;
            case 'Rescate Accidentes Tráfico':
              brigadeColor = 'bg-blue-500';
              brigadeName = 'RAT'; // Abreviación para que quepa en el cuadro
              nameColor = 'text-white';
              brigadeShort = 'RAT';
              break;
            default:
              brigadeColor = '';
          }

          const displayName = isMobile ? brigadeShort : brigadeName;

          return (
            <div
              key={index}
              className={`day ${isMobile ? 'h-20 p-2' : 'h-24 p-4'} text-center cursor-pointer rounded-lg border ${day.monthOffset !== 0 ? 'text-gray-400' : 'text-black'
                } ${brigadeColor} hover:bg-gray-200`}
              onClick={() => {
                handleDateClick(date);
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className={isMobile ? 'text-lg' : undefined}>{day.day}</div>
                {displayName && (
                  <div className={`brigade-name ${isMobile ? 'text-xs' : 'text-sm'} ${nameColor} mt-1`}>
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