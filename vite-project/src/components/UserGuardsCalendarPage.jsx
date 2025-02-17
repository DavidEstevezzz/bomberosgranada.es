import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import PersonalCalendar from '../components/PersonalCalendar';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const UserGuardsCalendarPage = ({ user }) => {
    const { darkMode } = useDarkMode();
    // currentMonth se inicia en el primer día del mes actual
    const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
    const [assignments, setAssignments] = useState([]);
    const [guardsForCalendar, setGuardsForCalendar] = useState([]); // Lo que se pasará al calendario
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataReady, setDataReady] = useState(false);

    useEffect(() => {
        if (!user || !user.id_empleado) {
            console.log('Esperando user...');
            return;
        }

        const fetchData = async () => {
            try {
                setDataReady(false);
                setLoading(true);

                // Rango del mes actual
                const monthStart = currentMonth.format('YYYY-MM-DD');
                const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

                // 1) Obtener todas las asignaciones
                const assignmentResponse = await AssignmentsApiService.getAssignments();
                const allAssignments = assignmentResponse.data;

                // Filtrar asignaciones del usuario en el mes actual
                const currentMonthAssignments = allAssignments.filter((assignment) => {
                    const assignmentDate = dayjs(assignment.fecha_ini);
                    const isCorrectUser = assignment.id_empleado === user.id_empleado;
                    const inRange =
                        assignmentDate.isSameOrAfter(currentMonth) &&
                        assignmentDate.isSameOrBefore(currentMonth.endOf('month'));
                    return isCorrectUser && inRange;
                });

                // Además, obtener la última asignación del mes anterior (si existe)
                const previousMonthAssignments = allAssignments.filter((assignment) => {
                    const assignmentDate = dayjs(assignment.fecha_ini);
                    const isCorrectUser = assignment.id_empleado === user.id_empleado;
                    return isCorrectUser && assignmentDate.isBefore(currentMonth);
                });
                const lastAssignmentPrevMonth =
                    previousMonthAssignments.sort((a, b) =>
                        dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini))
                    )[0] || null;

                // Combinamos: si existe asignación del mes previo, la incluimos
                const effectiveAssignments = lastAssignmentPrevMonth
                    ? [lastAssignmentPrevMonth, ...currentMonthAssignments]
                    : currentMonthAssignments;

                setAssignments(effectiveAssignments);
                console.log('Asignaciones efectivas (mes previo + actual):', effectiveAssignments);

                // 2) Determinar las brigadas involucradas
                const brigades = [
                    ...new Set(effectiveAssignments.map((a) => a.id_brigada_destino)),
                ];

                // 3) Si hay brigadas, obtener guardias en ese rango
                if (brigades.length > 0) {
                    const guardResponse = await GuardsApiService.getGuardsByBrigades(
                        brigades,
                        monthStart,
                        monthEnd
                    );
                    const allGuards = guardResponse.data;
                    console.log('Guardias obtenidas para las brigadas:', allGuards);

                    // Función findLastAssignment: busca la última asignación (de las efectivas)
                    // con fecha_ini <= la fecha de la guardia
                    const findLastAssignment = (date) => {
                        const filtered = effectiveAssignments.filter((assignment) =>
                            dayjs(assignment.fecha_ini).isSameOrBefore(date)
                        );
                        // Ordenar de forma descendente por fecha_ini y prioridad de turno
                        const sorted = filtered.sort((a, b) => {
                            const diff = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
                            if (diff !== 0) return diff;
                            const turnPriority = ['Noche', 'Tarde', 'Mañana'];
                            return turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno);
                        });
                        console.log(`findLastAssignment - Fecha: ${date} - Asignaciones ordenadas:`, sorted);
                        return sorted[0] || null;
                    };

                    // 4) Filtrar las guardias: consideramos válida la guardia si la última asignación
                    // (según effectiveAssignments) tiene la misma brigada que la guardia.
                    const validGuardsWithData = allGuards.map((guard) => {
                        const guardDate = dayjs(guard.date);
                        const lastAssignment = findLastAssignment(guardDate);
                        const isValid = lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
                        return { guard, isValid, lastAssignment };
                    }).filter(item => item.isValid);

                    // Transformar a la forma [{ date: "YYYY-MM-DD", brigadeName: "…", requerimiento: true/false }]
                    const guardsArray = validGuardsWithData.map(item => ({
                        date: item.guard.date, // asume formato "YYYY-MM-DD"
                        brigadeName: item.guard.brigade ? item.guard.brigade.nombre : item.guard.id_brigada,
                        // Aquí usamos el campo "requerimiento" de la última asignación (si se hizo a través de requerimiento)
                        requerimiento: !!item.lastAssignment.requerimiento
                    }));

                    setGuardsForCalendar(guardsArray);
                } else {
                    setGuardsForCalendar([]);
                }

                setError(null);
                setDataReady(true);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, currentMonth]);

    const handlePreviousMonth = () => {
        setCurrentMonth((prev) => prev.subtract(1, 'month'));
    };
    const handleNextMonth = () => {
        setCurrentMonth((prev) => prev.add(1, 'month'));
    };

    if (loading || !dataReady) {
        return <div>Cargando datos...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div
            className={`min-h-screen p-4 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                }`}
        >
            <h1 className="text-2xl font-bold mb-6 text-center">
                Guardias de {user.nombre} {user.apellido}
            </h1>
            <div className="flex justify-between items-center max-w-3xl mx-auto mb-4">
                <button
                    onClick={handlePreviousMonth}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Mes Anterior
                </button>
                <span className="text-xl font-semibold">
                    {currentMonth.format('MMMM YYYY')}
                </span>
                <button
                    onClick={handleNextMonth}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Mes Siguiente
                </button>
            </div>

            {/* Se pasa currentMonth convertido a Date mediante toDate() */}
            <div className="max-w-3xl mx-auto">
                <PersonalCalendar
                    calendarDate={currentMonth.toDate()}
                    guards={guardsForCalendar}
                />
            </div>
        </div>
    );
};

export default UserGuardsCalendarPage;
