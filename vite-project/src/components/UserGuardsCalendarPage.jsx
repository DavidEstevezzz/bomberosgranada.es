import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import RequestsApiService from '../services/RequestApiService'; // Servicio para solicitudes
import { useDarkMode } from '../contexts/DarkModeContext';
import PersonalCalendar from '../components/PersonalCalendar';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const turnPriority = ['Noche', 'Tarde', 'Mañana'];

const UserGuardsCalendarPage = ({ user }) => {
  const { darkMode } = useDarkMode();

  // Estados para eventos derivados de guardias y solicitudes
  const [guardEvents, setGuardEvents] = useState([]); // Eventos derivados de guardias
  const [requestEvents, setRequestEvents] = useState([]); // Eventos derivados de solicitudes confirmadas

  // Mes actual (inicia en el primer día del mes)
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!user || !user.id_empleado) {
      console.log('El usuario aún no está listo. Esperando...');
      return;
    }

    const fetchData = async () => {
      try {
        setDataReady(false);
        setLoading(true);

        // Definir el rango para el mes actual
        const monthStart = currentMonth.format('YYYY-MM-DD');
        const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');
        console.log(`--- CARGANDO DATOS PARA EL MES: ${currentMonth.format('MMMM YYYY')} ---`);
        console.log(`Rango de mes: ${monthStart} a ${monthEnd}`);

        // 1) Obtener todas las asignaciones
        const assignmentResponse = await AssignmentsApiService.getAssignments();
        const allAssignments = assignmentResponse.data;
        console.log(`Total asignaciones obtenidas: ${allAssignments.length}`);

        // Filtrar asignaciones del usuario en el mes actual
        const currentMonthAssignments = allAssignments.filter((assignment) => {
          const assignmentDate = dayjs(assignment.fecha_ini);
          return (
            assignment.id_empleado === user.id_empleado &&
            assignmentDate.isSameOrAfter(currentMonth) &&
            assignmentDate.isSameOrBefore(currentMonth.endOf('month'))
          );
        });
        console.log(`Asignaciones encontradas para el mes actual (${currentMonth.format('MMMM YYYY')}):`, currentMonthAssignments);

        // Obtener la última asignación previa buscando mes a mes hacia atrás
        let lastAssignmentPrevMonth = null;
        let searchMonth = currentMonth.subtract(1, 'month'); // Comenzamos con el mes anterior
        const lowerBound = dayjs('2000-01-01'); // Límite inferior para evitar bucles infinitos
        while (!lastAssignmentPrevMonth && searchMonth.isAfter(lowerBound)) {
          const assignmentsForSearch = allAssignments.filter(assignment =>
            assignment.id_empleado === user.id_empleado &&
            dayjs(assignment.fecha_ini).isSame(searchMonth, 'month')
          );
          if (assignmentsForSearch.length > 0) {
            const sorted = assignmentsForSearch.sort((a, b) => {
              const dateDiff = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
              if (dateDiff !== 0) return dateDiff;
              return turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno);
            });
            lastAssignmentPrevMonth = sorted[0];
            break;
          }
          searchMonth = searchMonth.subtract(1, 'month');
        }
        console.log("Última asignación encontrada del pasado:", lastAssignmentPrevMonth);

        // Combinamos: si existe asignación previa, la incluimos
        const effectiveAssignments = lastAssignmentPrevMonth
          ? [lastAssignmentPrevMonth, ...currentMonthAssignments]
          : currentMonthAssignments;
        console.log('Asignaciones efectivas (mes previo + actual):', effectiveAssignments);

        // 2) Determinar las brigadas involucradas
        const brigades = [...new Set(effectiveAssignments.map((a) => a.id_brigada_destino))];
        console.log('Brigadas únicas obtenidas de las asignaciones:', brigades);

        // 3) Si hay brigadas, obtener guardias en el rango del mes actual
        if (brigades.length > 0) {
          console.log(`Buscando guardias para las brigadas: ${brigades.join(', ')} en el mes de ${currentMonth.format('MMMM YYYY')}`);
          const guardResponse = await GuardsApiService.getGuardsByBrigades(brigades, monthStart, monthEnd);
          let allGuards = guardResponse.data;
          // Filtrar para que las guardias estén dentro del mes actual
          allGuards = allGuards.filter(g => {
            const d = dayjs(g.date);
            return d.isSameOrAfter(currentMonth) && d.isSameOrBefore(currentMonth.endOf('month'));
          });
          console.log('Guardias obtenidas para las brigadas (filtradas):', allGuards);

          // Función findLastAssignment:
          // Devuelve la última asignación válida para una fecha y, en caso de haber asignaciones en el mismo día,
          // si existen dos o más, se evalúan según las reglas indicadas.
          const findLastAssignment = (date, requiredBrigada) => {
            // Obtener todas las asignaciones del mismo día (sin filtrar por destino)
            const sameDayAssignments = effectiveAssignments.filter(a =>
              dayjs(a.fecha_ini).isSame(date, 'day')
            );
            if (sameDayAssignments.length === 1) {
              // Solo una asignación en ese día
              const single = sameDayAssignments[0];
              if (single.id_brigada_destino === requiredBrigada) {
                let suffix = "";
                if (single.turno === "Mañana") suffix = "Día completo";
                else if (single.turno === "Tarde") suffix = "Tarde y noche";
                else if (single.turno === "Noche") suffix = "Noche";
                return { assignment: single, suffix };
              }
              return { assignment: single, suffix: "" };
            } else if (sameDayAssignments.length === 2) {
              // Dos asignaciones en el mismo día
              const matching = sameDayAssignments.filter(a => a.id_brigada_destino === requiredBrigada);
              if (matching.length === 1) {
                const other = sameDayAssignments.find(a => a.id_brigada_destino !== requiredBrigada);
                const matchingTurn = matching[0].turno;
                const otherTurn = other.turno;
                let suffix = "";

                // Determinar el sufijo basado en los turnos específicos y el orden de las asignaciones
                // Si la brigada coincidente es el destino solo para el turno de mañana y luego cambia, mostrar "Mañana"
                if (matchingTurn === "Mañana" && otherTurn === "Tarde" &&
                    other.id_brigada_origen === requiredBrigada) {
                  suffix = "Mañana";
                }
                // Si la brigada coincidente es el destino solo para el turno de tarde y luego cambia, mostrar "Tarde"
                else if (matchingTurn === "Tarde" && otherTurn === "Noche" &&
                         other.id_brigada_origen === requiredBrigada) {
                  suffix = "Tarde";
                }
                // Si la brigada coincidente es el destino para mañana y el bombero tiene noche, pero no tarde
                else if (matchingTurn === "Mañana" && otherTurn === "Noche") {
                  suffix = "Mañana";
                }
                // En otros casos, usar la lógica genérica basada solo en el turno de la asignación coincidente
                else {
                  // Verificar si hay un cambio de brigada durante el día
                  const isTemporaryAssignment = other.id_brigada_origen === requiredBrigada ||
                                                other.id_brigada_destino === requiredBrigada;

                  if (isTemporaryAssignment) {
                    // Si la asignación es temporal (la brigada cambia durante el día)
                    if (matchingTurn === "Mañana") suffix = "Mañana";
                    else if (matchingTurn === "Tarde") suffix = "Tarde";
                    else if (matchingTurn === "Noche") suffix = "Noche";
                  } else {
                    // Si no hay cambio temporal, usar la asignación completa
                    if (matchingTurn === "Mañana") suffix = "Día completo";
                    else if (matchingTurn === "Tarde") suffix = "Tarde y noche";
                    else if (matchingTurn === "Noche") suffix = "Noche";
                  }
                }
                return { assignment: matching[0], suffix };
              } else if (matching.length === 2) {
                // Ambas asignaciones coinciden con la brigada requerida
                // Ordenar por prioridad de turno (Noche, Tarde, Mañana)
                const sorted = matching.sort((a, b) =>
                  turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno)
                );

                // Verificar si las asignaciones representan un cambio temporal
                const isSequential = sorted[0].id_brigada_origen === sorted[1].id_brigada_destino ||
                                     sorted[1].id_brigada_origen === sorted[0].id_brigada_destino;

                let suffix = "";
                if (isSequential) {
                  // Si hay un cambio secuencial de brigadas, mostrar solo los turnos aplicables
                  if (sorted[0].turno === "Mañana" && sorted[1].turno === "Tarde") suffix = "Mañana y tarde";
                  else if (sorted[0].turno === "Mañana" && sorted[1].turno === "Noche") suffix = "Mañana";
                  else if (sorted[0].turno === "Tarde" && sorted[1].turno === "Noche") suffix = "Tarde y noche";
                  else suffix = sorted[0].turno; // Caso por defecto
                } else {
                  // Si no hay cambio secuencial, usar la lógica original
                  if (sorted[0].turno === "Mañana") suffix = "Día completo";
                  else if (sorted[0].turno === "Tarde") suffix = "Tarde y noche";
                  else if (sorted[0].turno === "Noche") suffix = "Noche";
                }
                return { assignment: sorted[0], suffix };
              } else {
                // Si no hay ninguna asignación matching, usar la de menor prioridad del día
                const sorted = sameDayAssignments.sort((a, b) =>
                  turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno)
                );
                return { assignment: sorted[0], suffix: "" };
              }
            } else if (sameDayAssignments.length > 2) {
              // Más de dos asignaciones en el mismo día
              const matching = sameDayAssignments.filter(a => a.id_brigada_destino === requiredBrigada);
              if (matching.length > 0) {
                const sorted = matching.sort((a, b) =>
                  turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno)
                );
                let suffix = "";
                if (sorted[0].turno === "Mañana") suffix = "Día completo";
                else if (sorted[0].turno === "Tarde") suffix = "Tarde y noche";
                else if (sorted[0].turno === "Noche") suffix = "Noche";
                return { assignment: sorted[0], suffix };
              } else {
                const sorted = sameDayAssignments.sort((a, b) =>
                  turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno)
                );
                return { assignment: sorted[0], suffix: "" };
              }
            }
            // Si no hay asignaciones en el mismo día, buscar asignaciones anteriores
            const previousAssignments = effectiveAssignments.filter(a =>
              dayjs(a.fecha_ini).isBefore(date)
            );
            if (previousAssignments.length > 0) {
              const sorted = previousAssignments.sort((a, b) => {
                const diff = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
                if (diff !== 0) return diff;
                return turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno);
              });
              return { assignment: sorted[0], suffix: "" };
            }
            return { assignment: null, suffix: "" };
          };

          // Filtrar las guardias válidas: la última asignación (usando el criterio anterior)
          // debe coincidir en brigada con la guardia.
          const validGuardsWithData = allGuards.map((guard) => {
            const guardDate = dayjs(guard.date);
            const { assignment: lastAssignment, suffix } = findLastAssignment(guardDate, guard.id_brigada);
            const isValid = lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
            return { guard, isValid, lastAssignment, suffix };
          }).filter(item => item.isValid);
          console.log("Guardias filtradas con asignaciones coincidentes:", validGuardsWithData);

          // Mapear a eventos para el calendario
          const guardEvents = validGuardsWithData.map(item => {
            const baseLabel = item.guard.brigade?.nombre || 'Guardia';
            const finalLabel = item.suffix ? `${baseLabel} (${item.suffix})` : baseLabel;
            return {
              date: item.guard.date,
              color: item.lastAssignment?.requerimiento ? 'bg-green-500' : 'bg-blue-500',
              label: finalLabel,
              eventType: 'guard'
            };
          });
          console.log("Eventos de guardias:", guardEvents);
          setGuardEvents(guardEvents);
        } else {
          setGuardEvents([]);
        }

        // 4) Obtener solicitudes confirmadas del usuario
        const requestsResp = await RequestsApiService.getRequests();
        const allRequests = requestsResp.data;
        console.log("Total solicitudes obtenidas:", allRequests.length);

        const confirmedRequests = allRequests.filter((req) => {
          const sameUser = req.id_empleado === user.id_empleado;
          const confirmed = req.estado === 'Confirmada';
          const reqStart = dayjs(req.fecha_ini);
          const reqEnd = dayjs(req.fecha_fin);
          return sameUser && confirmed && reqEnd.isAfter(currentMonth) && reqStart.isBefore(currentMonth.endOf('month'));
        });
        console.log("Solicitudes confirmadas:", confirmedRequests);

        // Mapear solicitudes a eventos: vacaciones en rojo, otros en amarillo.
        // Se formatea el tipo a Title Case y se añade el turno entre paréntesis solo si existe.
        const requestEvents = confirmedRequests.flatMap((r) => {
          const start = dayjs(r.fecha_ini);
          const end = dayjs(r.fecha_fin);
          const events = [];
          let current = start.clone();
          while (current.isSameOrBefore(end)) {
            const formattedTipo = r.tipo
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            const label = r.turno ? `${formattedTipo} (${r.turno})` : formattedTipo;
            events.push({
              date: current.format('YYYY-MM-DD'),
              color: r.tipo === 'vacaciones' ? 'bg-red-500' : 'bg-yellow-300',
              label,
              eventType: 'request'
            });
            current = current.add(1, 'day');
          }
          return events;
        });
        console.log("Eventos de solicitudes:", requestEvents);
        setRequestEvents(requestEvents);

        // 5) Se envían los eventos de guardias y solicitudes como props separadas
        setError(null);
        setDataReady(true);
      } catch (err) {
        console.error('Error:', err);
        setError('Fallo cargando datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, 'month'));
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
  const calendarWrapperClass = `rounded-2xl border border-dashed px-4 py-4 transition-colors ${
    darkMode ? 'border-slate-700/60 bg-slate-900/40' : 'border-slate-200 bg-white'
  }`;

  if (loading || !dataReady) {
    return (
      <section className={cardClass}>
        <p className={`text-sm font-medium ${subtleTextClass}`}>Cargando calendario de guardias...</p>
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

  const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);
  const rawMonthString = currentMonth.format('MMMM YYYY'); // ej: "febrero 2025"
  const capitalizedMonthString = capitalizeFirstLetter(rawMonthString);

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
            Calendario de guardias
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {user.nombre} {user.apellido}
          </h3>
          <p className={`mt-1 text-xs ${subtleTextClass}`}>
            Visualiza las guardias asignadas y las solicitudes confirmadas para este periodo.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
              darkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {capitalizedMonthString}
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

      <div className={`${calendarWrapperClass} mt-6`}>
        <PersonalCalendar
          calendarDate={currentMonth.toDate()}
          guardEvents={guardEvents}
          requestEvents={requestEvents}
        />
      </div>
    </section>
  );
};

export default UserGuardsCalendarPage;