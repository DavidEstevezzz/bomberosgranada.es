import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/es';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('es');

const EmployeeSalary = ({ user }) => {
  const { darkMode } = useDarkMode();
  const [assignments, setAssignments] = useState([]);
  const [guards, setGuards] = useState([]);
  const [futureGuards, setFutureGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el mes actual mostrado
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [dataReady, setDataReady] = useState(false); // Nuevo estado para controlar si los datos están listos

  useEffect(() => {

    if (!user || !user.id_empleado) {
      console.log('El usuario aún no está listo. Esperando...');
      return; // No ejecutar nada hasta que el usuario esté disponible
    }

    const fetchAssignmentsAndGuards = async () => {
      try {
        console.log('Inicio de fetchAssignmentsAndGuards');
        setDataReady(false); // Marcar como no listo
        const monthStart = currentMonth.format('YYYY-MM-DD');
        const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

        console.log('Rango del mes actual:', { monthStart, monthEnd });

        // Fetch all assignments
        const assignmentResponse = await AssignmentsApiService.getAssignments();
        console.log('Asignaciones obtenidas:', assignmentResponse.data);

        const currentMonthAssignments = assignmentResponse.data.filter(assignment => {
          const assignmentDate = dayjs(assignment.fecha_ini).format('YYYY-MM-DD');
          const isCorrectUser = assignment.id_empleado === user.id_empleado;
          const isInCurrentMonth = dayjs(assignmentDate).isSameOrAfter(monthStart) && dayjs(assignmentDate).isSameOrBefore(monthEnd);

          return isCorrectUser && isInCurrentMonth;
        });

        console.log('Asignaciones del usuario en el mes actual:', currentMonthAssignments);

        setAssignments(currentMonthAssignments);

        const brigades = [...new Set(currentMonthAssignments.map(a => a.id_brigada_destino))];
        console.log('Brigadas únicas obtenidas de las asignaciones:', brigades);

        if (brigades.length > 0) {
          const guardResponse = await GuardsApiService.getGuardsByBrigades(brigades, monthStart, monthEnd);
          const allGuards = guardResponse.data;

          console.log('Guardias obtenidas para las brigadas:', allGuards);

          const findLastAssignment = (date) => {
            if (!currentMonthAssignments || currentMonthAssignments.length === 0) {
              console.warn('No hay asignaciones disponibles para calcular.');
              return null;
            }

            const filteredAssignments = currentMonthAssignments.filter(assignment => dayjs(assignment.fecha_ini).isSameOrBefore(date));
            console.log(`Asignaciones filtradas para la fecha ${date}:`, filteredAssignments);

            const sortedAssignments = filteredAssignments.sort((a, b) => {
              const dateComparison = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
              if (dateComparison !== 0) {
                return dateComparison;
              }
              const turnPriority = ['Noche', 'Tarde', 'Mañana'];
              return turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno);
            });

            console.log('Asignaciones ordenadas por prioridad:', sortedAssignments);
            return sortedAssignments[0]; // Retorna la primera asignación en orden
          };

          const guardsForAssignments = allGuards.filter(guard => {
            const guardDate = dayjs(guard.date);
            const lastAssignment = findLastAssignment(guardDate);

            const isValid = lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
            console.log('Validación de guardia:', { guardDate, lastAssignment, isValid });

            return isValid;
          });

          console.log('Guardias válidas para las asignaciones:', guardsForAssignments);

          const futureGuardsForAssignments = allGuards.filter(guard => {
            const guardDate = dayjs(guard.date);
            if (!guardDate.isSameOrAfter(dayjs())) return false;
            const lastAssignment = findLastAssignment(guardDate);

            const isValidFuture = lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
            console.log('Validación de guardia futura:', { guardDate, lastAssignment, isValidFuture });

            return isValidFuture;
          });

          console.log('Guardias futuras válidas:', futureGuardsForAssignments);

          setGuards(guardsForAssignments);
          setFutureGuards(futureGuardsForAssignments);
        }

        setError(null);
        setDataReady(true); // Marcar como listo
      } catch (error) {
        console.error('Error fetching assignments and guards:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentsAndGuards();
  }, [user, currentMonth]);

  const calculateSalary = (guard) => {
    const { salary } = guard;
    if (!salary) {
      return 0;
    }
    const { precio_diurno, precio_nocturno, horas_diurnas, horas_nocturnas } = salary;
    return (precio_diurno * horas_diurnas) + (precio_nocturno * horas_nocturnas);
  };

  const totalSalary = guards.reduce((total, guard) => total + calculateSalary(guard), 0);

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
  const tableWrapperClass = `overflow-hidden rounded-2xl border transition-colors ${
    darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-white'
  }`;
  const tableHeadClass = darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-600';
  const tableRowClass = darkMode
    ? 'divide-y divide-slate-800/60 text-slate-100'
    : 'divide-y divide-slate-200 text-slate-700';
  const tableRowHoverClass = `transition-colors ${
    darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/80'
  }`;
  const summaryCardClass = `rounded-2xl border px-4 py-4 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
  }`;

  const monthLabel = currentMonth.locale('es').format('MMMM YYYY');
  const formattedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const totalSalaryFormatted = `${totalSalary.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

  const summaryStats = [
    { label: 'Guardias liquidadas', value: guards.length },
    { label: 'Guardias futuras', value: futureGuards.length },
  ];

  if (loading || !dataReady) {
    return (
      <section className={cardClass}>
        <p className={`text-sm font-medium ${subtleTextClass}`}>Cargando información de asignaciones y guardias...</p>
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

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
            Asignaciones y guardias
          </p>
          <h3 className="mt-2 text-xl font-semibold">Resumen mensual</h3>
          <p className={`mt-1 text-xs ${subtleTextClass}`}>
            Controla las asignaciones confirmadas y su impacto en el salario estimado del mes seleccionado.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${
              darkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {formattedMonthLabel}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summaryStats.map((stat) => (
          <div key={stat.label} className={summaryCardClass}>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
              {stat.label}
            </p>
            <p className="mt-2 text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200">
              Asignaciones registradas
            </h4>
          </div>
          {assignments.length > 0 ? (
            <div className={`${tableWrapperClass} mt-3`}>
              <table className="w-full text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha inicio</th>
                    <th className="px-4 py-3 text-left">Turno</th>
                    <th className="px-4 py-3 text-left">Brigada origen</th>
                    <th className="px-4 py-3 text-left">Brigada destino</th>
                  </tr>
                </thead>
                <tbody className={`${tableRowClass}`}>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id_asignacion} className={tableRowHoverClass}>
                      <td className="px-4 py-3">
                        {dayjs(assignment.fecha_ini).format('DD MMM YYYY')}
                      </td>
                      <td className="px-4 py-3">{assignment.turno}</td>
                      <td className="px-4 py-3">
                        {assignment.brigade_origin ? assignment.brigade_origin.nombre : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {assignment.brigade_destination ? assignment.brigade_destination.nombre : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`mt-3 rounded-2xl border border-dashed px-4 py-5 text-sm ${
                darkMode
                  ? 'border-slate-700/70 bg-slate-900/40 text-slate-300'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              No hay asignaciones registradas en este mes.
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200">
              Guardias vinculadas
            </h4>
          </div>
          {guards.length > 0 ? (
            <div className={`${tableWrapperClass} mt-3`}>
              <table className="w-full text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3 text-left">Día</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Brigada</th>
                  </tr>
                </thead>
                <tbody className={`${tableRowClass}`}>
                  {guards.map((guard) => (
                    <tr key={`${guard.date}-${guard.id_brigada}`} className={tableRowHoverClass}>
                      <td className="px-4 py-3">{dayjs(guard.date).format('DD MMM YYYY')}</td>
                      <td className="px-4 py-3">{guard.tipo || 'Guardia'}</td>
                      <td className="px-4 py-3">{guard.brigade ? guard.brigade.nombre : guard.id_brigada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`mt-3 rounded-2xl border border-dashed px-4 py-5 text-sm ${
                darkMode
                  ? 'border-slate-700/70 bg-slate-900/40 text-slate-300'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              No hay guardias asociadas a las asignaciones durante este periodo.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EmployeeSalary;
