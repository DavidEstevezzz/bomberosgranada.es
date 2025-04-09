import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarEspeciales = ({ onDateClick, guards, brigadeMap }) => {
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

  // Función para obtener todas las guardias para una fecha específica
  const getGuardsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const guardsOnDate = guards.filter((guard) => guard.date === dateString);
    
    // Transforma las guardias para incluir información de visualización
    return guardsOnDate.map(guard => {
      const brigadeName = brigadeMap[guard.id_brigada] || 'Sin Brigada';
      
      // Obtener información de visualización para esta brigada
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
    let nameColor = 'text-black';
    let displayName = brigadeName;

    switch (brigadeName) {
      // Casos originales
      case 'Brigada A':
        brigadeColor = 'bg-green-500';
        nameColor = 'text-black';
        break;
      case 'Brigada B':
        brigadeColor = 'bg-zinc-50';
        nameColor = 'text-black';
        break;
      case 'Brigada C':
        brigadeColor = 'bg-blue-500';
        nameColor = 'text-black';
        break;
      case 'Brigada D':
        brigadeColor = 'bg-red-600';
        nameColor = 'text-black';
        break;
      case 'Brigada E':
        brigadeColor = 'bg-yellow-300';
        nameColor = 'text-black';
        break;
      case 'Brigada F':
        brigadeColor = 'bg-gray-300';
        nameColor = 'text-gray-600';
        break;
      // Nuevas brigadas
      case 'GREPS':
        brigadeColor = 'bg-orange-500';
        nameColor = 'text-white';
        break;
      case 'GRAFOR':
        brigadeColor = 'bg-green-500';
        nameColor = 'text-white';
        break;
      case 'UNIBUL':
        brigadeColor = 'bg-indigo-500';
        nameColor = 'text-white';
        break;
      case 'Riesgos Tecnológicos':
        brigadeColor = 'bg-teal-500';
        displayName = 'RiTec'; // Abreviación para que quepa en el cuadro
        nameColor = 'text-white';
        break;
      case 'Rescate Accidentes Tráfico':
        brigadeColor = 'bg-blue-500';
        displayName = 'RAT'; // Abreviación para que quepa en el cuadro
        nameColor = 'text-white';
        break;
      default:
        brigadeColor = 'bg-gray-200';
        nameColor = 'text-gray-800';
    }

    return { brigadeColor, nameColor, displayName };
  };

  // Siempre usamos onDateClick para permitir que el componente padre maneje la lógica
  const handleDateClick = (date) => {
    onDateClick(date);
  };

  const startOfWeekDate = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    capitalizeFirstLetter(format(addDays(startOfWeekDate, i), 'EEEE', { locale: es }))
  );

  const monthName = capitalizeFirstLetter(format(currentDate, 'MMMM yyyy', { locale: es }));

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
          <div className="day-name text-center font-bold" key={day}>
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const { date } = day;
          const guardsOnDate = getGuardsForDate(date);
          const hasGuards = guardsOnDate.length > 0;

          return (
            <div
              key={index}
              className={`day min-h-24 p-2 text-center cursor-pointer rounded-lg border ${
                day.monthOffset !== 0 ? 'text-gray-400' : 'text-black'
              } hover:bg-gray-200`}
              onClick={() => {
                handleDateClick(date);
              }}
            >
              <div className="flex flex-col h-full">
                <div className="day-number mb-1">{day.day}</div>
                
                {/* Contenedor de guardias - Muestra múltiples badges */}
                {hasGuards && (
                  <div className="brigades-container space-y-1 mt-1">
                    {guardsOnDate.map((guard, guardIndex) => (
                      <div 
                        key={guardIndex} 
                        className={`${guard.brigadeColor} rounded p-1 text-xs ${guard.nameColor}`}
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