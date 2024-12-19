import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import GuardsApiService from '../services/GuardsApiService';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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

  if (loading || !dataReady) return <div>Cargando...</div>; // Asegurar que los datos están listos
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="mt-2">
        <h3 className="text-lg font-semibold mb-2 text-center">Asignaciones en {currentMonth.format('MMMM YYYY')}</h3>
        <div className="flex justify-between mb-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400" onClick={handlePreviousMonth}>Anterior</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400" onClick={handleNextMonth}>Siguiente</button>
        </div>
        {assignments.length > 0 ? (
          <div className={`overflow-x-auto shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-sm text-center">
              <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                <tr>
                  <th className="py-3 px-6">Fecha Inicio</th>
                  <th className="py-3 px-6">Turno</th>
                  <th className="py-3 px-6">Brigada Origen</th>
                  <th className="py-3 px-6">Brigada Destino</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id_asignacion} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-b hover:bg-gray-50'}`}>
                    <td className="py-4 px-6">{assignment.fecha_ini}</td>
                    <td className="py-4 px-6">{assignment.turno}</td>
                    <td className="py-4 px-6">{assignment.brigade_origin ? assignment.brigade_origin.nombre : 'N/A'}</td>
                    <td className="py-4 px-6">{assignment.brigade_destination ? assignment.brigade_destination.nombre : 'N/A'}</td>
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
        <h3 className="text-lg font-semibold mb-2">Guardias para las Asignaciones</h3>
        {guards.length > 0 ? (
          <div className={`overflow-x-auto shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-sm text-center">
              <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                <tr>
                  <th className="py-3 px-6">Día</th>
                  <th className="py-3 px-6">Tipo de Día</th>
                  <th className="py-3 px-6">Brigada</th>
                </tr>
              </thead>
              <tbody>
                {guards.map(guard => (
                  <tr key={guard.date} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-b hover:bg-gray-50'}`}>
                    <td className="py-4 px-6">{guard.date}</td>
                    <td className="py-4 px-6">{guard.tipo}</td>
                    <td className="py-4 px-6">{guard.brigade ? guard.brigade.nombre : guard.id_brigada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay guardias para las asignaciones en este mes.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalary;
