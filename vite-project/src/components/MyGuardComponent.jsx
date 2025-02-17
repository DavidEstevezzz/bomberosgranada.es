import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const MyGuardComponent = ({ user }) => {
  const { darkMode } = useDarkMode();
  const [assignments, setAssignments] = useState([]);
  const [guards, setGuards] = useState([]);
  const [futureGuards, setFutureGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el mes actual mostrado
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!user || !user.id_empleado) {
      console.log('El usuario aún no está listo. Esperando...');
      return;
    }

    const fetchAssignmentsAndGuards = async () => {
      try {
        console.log('Inicio de fetchAssignmentsAndGuards');
        setDataReady(false);
        const monthStart = currentMonth.format('YYYY-MM-DD');
        const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

        console.log('Rango del mes actual:', { monthStart, monthEnd });

        // 1) Obtener todas las asignaciones
        const assignmentResponse = await AssignmentsApiService.getAssignments();
        console.log('Asignaciones obtenidas:', assignmentResponse.data);

        // 2) Filtrar asignaciones del usuario en el rango del mes actual
        const currentMonthAssignments = assignmentResponse.data.filter((assignment) => {
          const assignmentDate = dayjs(assignment.fecha_ini).format('YYYY-MM-DD');
          const isCorrectUser = assignment.id_empleado === user.id_empleado;
          const isInCurrentMonth =
            dayjs(assignmentDate).isSameOrAfter(monthStart) &&
            dayjs(assignmentDate).isSameOrBefore(monthEnd);

          return isCorrectUser && isInCurrentMonth;
        });

        console.log('Asignaciones del usuario en el mes actual:', currentMonthAssignments);
        setAssignments(currentMonthAssignments);

        // 3) Determinar brigadas
        const brigades = [
          ...new Set(currentMonthAssignments.map((a) => a.id_brigada_destino)),
        ];
        console.log('Brigadas únicas obtenidas de las asignaciones:', brigades);

        // 4) Si hay brigadas, pedimos las guardias
        if (brigades.length > 0) {
          const guardResponse = await GuardsApiService.getGuardsByBrigades(
            brigades,
            monthStart,
            monthEnd
          );
          const allGuards = guardResponse.data;
          console.log('Guardias obtenidas para las brigadas:', allGuards);

          // Función para obtener última asignación a la fecha
          const findLastAssignment = (date) => {
            if (!currentMonthAssignments || currentMonthAssignments.length === 0) {
              console.warn('No hay asignaciones disponibles para calcular.');
              return null;
            }

            // Filtrar las asignaciones con fecha_ini <= date
            const filteredAssignments = currentMonthAssignments.filter((assignment) =>
              dayjs(assignment.fecha_ini).isSameOrBefore(date)
            );
            console.log(`Asignaciones filtradas para la fecha ${date}:`, filteredAssignments);

            // Ordenar desc por fecha_ini, luego por prioridad turnos (Noche > Tarde > Mañana)
            const sortedAssignments = filteredAssignments.sort((a, b) => {
              const dateComparison = dayjs(b.fecha_ini).diff(dayjs(a.fecha_ini));
              if (dateComparison !== 0) {
                return dateComparison;
              }
              const turnPriority = ['Noche', 'Tarde', 'Mañana'];
              return turnPriority.indexOf(a.turno) - turnPriority.indexOf(b.turno);
            });

            console.log('Asignaciones ordenadas por prioridad:', sortedAssignments);
            return sortedAssignments[0] || null;
          };

          // 5) Filtrar las guardias que coinciden con la asignación
          const guardsForAssignments = allGuards.filter((guard) => {
            const guardDate = dayjs(guard.date);
            const lastAssignment = findLastAssignment(guardDate);

            const isValid =
              lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
            console.log('Validación de guardia:', {
              guardDate,
              lastAssignment,
              isValid,
            });

            return isValid;
          });

          console.log('Guardias válidas para las asignaciones:', guardsForAssignments);

          // 6) Filtrar las guardias futuras (mismo criterio, pero guardDate >= hoy)
          const futureGuardsForAssignments = allGuards.filter((guard) => {
            const guardDate = dayjs(guard.date);
            if (!guardDate.isSameOrAfter(dayjs())) return false;
            const lastAssignment = findLastAssignment(guardDate);

            const isValidFuture =
              lastAssignment && lastAssignment.id_brigada_destino === guard.id_brigada;
            console.log('Validación de guardia futura:', {
              guardDate,
              lastAssignment,
              isValidFuture,
            });

            return isValidFuture;
          });

          console.log('Guardias futuras válidas:', futureGuardsForAssignments);

          // Actualizamos estado
          setGuards(guardsForAssignments);
          setFutureGuards(futureGuardsForAssignments);
        }

        setError(null);
        setDataReady(true);
      } catch (error) {
        console.error('Error fetching assignments and guards:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentsAndGuards();
  }, [user, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  if (loading || !dataReady) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div
      className={`max-w-4xl mx-auto p-6 rounded-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <div className="mt-2">
        <h3 className="text-lg font-semibold mb-2 text-center">
          Asignaciones en {currentMonth.format('MMMM YYYY')}
        </h3>
        <div className="flex justify-between mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400"
            onClick={handlePreviousMonth}
          >
            Anterior
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400"
            onClick={handleNextMonth}
          >
            Siguiente
          </button>
        </div>

        {/* Tabla asignaciones */}
        {assignments.length > 0 ? (
          <div
            className={`overflow-x-auto shadow-md sm:rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <table className="w-full text-sm text-center">
              <thead
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <tr>
                  <th className="py-3 px-6">Fecha Inicio</th>
                  <th className="py-3 px-6">Turno</th>
                  <th className="py-3 px-6">Brigada Origen</th>
                  <th className="py-3 px-6">Brigada Destino</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id_asignacion}
                    className={`${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-b hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-6">{assignment.fecha_ini}</td>
                    <td className="py-4 px-6">{assignment.turno}</td>
                    <td className="py-4 px-6">
                      {assignment.brigade_origin
                        ? assignment.brigade_origin.nombre
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      {assignment.brigade_destination
                        ? assignment.brigade_destination.nombre
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay asignaciones en este mes.</p>
        )}
      </div>

      {/* Tabla de guardias */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">
          Guardias para las Asignaciones
        </h3>
        {guards.length > 0 ? (
          <div
            className={`overflow-x-auto shadow-md sm:rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <table className="w-full text-sm text-center">
              <thead
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <tr>
                  <th className="py-3 px-6">Día</th>
                  <th className="py-3 px-6">Tipo de Día</th>
                  <th className="py-3 px-6">Brigada</th>
                </tr>
              </thead>
              <tbody>
                {guards.map((guard) => (
                  <tr
                    key={guard.date}
                    className={`${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-b hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-6">{guard.date}</td>
                    <td className="py-4 px-6">{guard.tipo}</td>
                    <td className="py-4 px-6">
                      {guard.brigade ? guard.brigade.nombre : guard.id_brigada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">
            No hay guardias para las asignaciones en este mes.
          </p>
        )}
      </div>

      {/* Tabla de guardias futuras (opcional) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Guardias Futuras</h3>
        {futureGuards.length > 0 ? (
          <div
            className={`overflow-x-auto shadow-md sm:rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <table className="w-full text-sm text-center">
              <thead
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <tr>
                  <th className="py-3 px-6">Día</th>
                  <th className="py-3 px-6">Tipo de Día</th>
                  <th className="py-3 px-6">Brigada</th>
                </tr>
              </thead>
              <tbody>
                {futureGuards.map((guard) => (
                  <tr
                    key={guard.date}
                    className={`${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-b hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-6">{guard.date}</td>
                    <td className="py-4 px-6">{guard.tipo}</td>
                    <td className="py-4 px-6">
                      {guard.brigade ? guard.brigade.nombre : guard.id_brigada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay guardias futuras en este mes.</p>
        )}
      </div>
    </div>
  );
};

export default MyGuardComponent;
