import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Calendar = ({ onDateClick, onEditClick, guards, brigadeMap }) => {
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
      days.push({
        day: daysInPrevMonth - i + 1,
        monthOffset: -1,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        monthOffset: 0,
      });
    }

    for (let i = 1; i < 7 - (lastDayOfMonth + 6) % 7; i++) {
      days.push({
        day: i,
        monthOffset: 1,
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
    if (existingGuard) {
      onEditClick(existingGuard);
    } else {
      onDateClick(date);
    }
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
          const date = new Date(year, month + day.monthOffset, day.day);
          const brigadeName = getGuardForDate(date);
          const isBrigadeA = brigadeName === 'Brigada A';
          const isBrigadeB = brigadeName === 'Brigada B';
          const isBrigadeC = brigadeName === 'Brigada C';

          return (
            <div
              key={index}
              className={`day h-24 p-4 text-center cursor-pointer rounded-lg border ${
                day.monthOffset !== 0 ? 'text-gray-400' : 'text-black'
              } ${isBrigadeA ? 'bg-green-200' : isBrigadeB ? 'bg-red-200' : isBrigadeC ? 'bg-blue-200' : ''} hover:bg-gray-200`}
              onClick={() => {
                handleDateClick(date);
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div>{day.day}</div>
                {brigadeName && <div className="brigade-name text-sm text-blue-600 mt-1">{brigadeName}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
