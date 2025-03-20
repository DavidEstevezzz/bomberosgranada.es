import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const RequirementList = ({ title, fetchData, listType, orderColumn, orderColumn2 }) => {
    const { darkMode } = useDarkMode();
    const { user } = useStateContext();

    const [firefighters, setFirefighters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    // Mapeo de los incrementos introducidos para cada usuario (id_empleado)
    const [dayHours, setDayHours] = useState({});
    const [nightHours, setNightHours] = useState({});

    // Función para cargar la lista de bomberos
    const fetchFirefighters = async () => {
        setLoading(true);
        try {
            const response = await fetchData(selectedDate);
            const fetchedFirefighters = response.data.available_firefighters;
            // Ordenar de menor a mayor según orderColumn; en caso de empate, usar orderColumn2 si existe o por dni (descendente)
            const orderedFirefighters = fetchedFirefighters.sort((a, b) => {
                const diff = a[orderColumn] - b[orderColumn];
                if (diff === 0) {
                    if (orderColumn2) {
                        // Verificar si los valores son timestamps (cadenas de fecha/hora)
                        if (typeof a[orderColumn2] === 'string' && a[orderColumn2].includes('-')) {
                            // Convertir las cadenas de fecha a objetos Date para comparar
                            const dateA = new Date(a[orderColumn2]);
                            const dateB = new Date(b[orderColumn2]);
                            // Ordenar de más reciente a más antiguo
                            return dateA - dateB;
                        } else {
                            // Si no son timestamps, comparar numéricamente como antes
                            return a[orderColumn2] - b[orderColumn2];
                        }
                    }
                    return Number(b.dni) - Number(a.dni);
                }
                return diff;
            });
            setFirefighters(orderedFirefighters);
            setError(null);
        } catch (error) {
            console.error(`Failed to fetch ${listType}:`, error);
            setError(`Failed to load ${listType}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFirefighters();
    }, [selectedDate]);

    // Navegación de fechas
    const handlePreviousDay = () => {
        const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
        setSelectedDate(previousDay);
    };

    const handleNextDay = () => {
        const nextDay = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
        setSelectedDate(nextDay);
    };

    // Filtro de la lista por puesto
    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    // Cambiar el valor del input para horas diurnas
    const handleDayHoursChange = (id, value) => {
        setDayHours((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Cambiar el valor del input para horas nocturnas
    const handleNightHoursChange = (id, value) => {
        setNightHours((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Calcular el valor total del incremento
    const calculateTotalIncrement = (id) => {
        const dayValue = Number(dayHours[id] || 0);
        const nightValue = Number(nightHours[id] || 0);

        if (isNaN(dayValue) || isNaN(nightValue)) {
            alert("Por favor ingresa números válidos.");
            return null;
        }

        return dayValue + (nightValue * 1.4);
    };

    // Limpiar los inputs después de enviar
    const clearInputs = (id) => {
        setDayHours((prev) => ({ ...prev, [id]: '' }));
        setNightHours((prev) => ({ ...prev, [id]: '' }));
    };

    // Manejar el botón de "Rechazar" (solo incrementa orderColumn)
    const handleRejectSubmit = async (id) => {
        const totalIncrement = calculateTotalIncrement(id);
        if (totalIncrement === null) return;

        try {
            await AssignmentsApiService.incrementUserColumn(id, {
                column: orderColumn,
                increment: totalIncrement,
                orderColumn2: orderColumn2
            });
            // Recargar la lista tras la actualización
            await fetchFirefighters();
            clearInputs(id);
        } catch (error) {
            console.error(`Failed to increment column for user ${id}:`, error);
        }
    };

    // Manejar el botón de "Aceptar" (incrementa tanto orderColumn como horas_aceptadas)
    const handleAcceptSubmit = async (id) => {
        const totalIncrement = calculateTotalIncrement(id);
        if (totalIncrement === null) return;

        try {
            // Primero incrementamos la columna principal (horas_ofrecidas)
            await AssignmentsApiService.incrementUserColumn(id, {
                column: orderColumn,
                increment: totalIncrement,
                orderColumn2: orderColumn2
            });

            // Luego incrementamos la columna horas_aceptadas
            await AssignmentsApiService.incrementUserColumn(id, {
                column: 'horas_aceptadas',
                increment: totalIncrement
            });

            // Recargar la lista tras la actualización
            await fetchFirefighters();
            clearInputs(id);
        } catch (error) {
            console.error(`Failed to increment columns for user ${id}:`, error);
        }
    };

    // Filtrar la lista en base al puesto
    const filteredFirefighters = firefighters.filter((firefighter) =>
        firefighter.puesto.toLowerCase().includes(filter.toLowerCase())
    );

    // Función auxiliar para formatear la fecha
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        return dayjs(timestamp).format('DD/MM/YYYY HH:mm');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>

            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handlePreviousDay}
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
                >
                    <FontAwesomeIcon icon={faChevronLeft} /> Anterior
                </button>
                <span className="text-lg font-bold">{dayjs(selectedDate).format('DD/MM/YYYY')}</span>
                <button
                    onClick={handleNextDay}
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
                >
                    Siguiente <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={filter}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por puesto"
                    className={`px-4 py-2 rounded w-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-700'}`}
                />
            </div>

            <div className={`overflow-x-auto w-full shadow-md sm:rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <table className="w-full table-fixed text-sm text-center">
                    <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        <tr>
                            <th className="py-3 px-2 w-1/4">Nombre</th>
                            <th className="py-3 px-2 w-1/6">Teléfono</th>
                            <th className="py-3 px-2 w-1/6">Puesto</th>
                            <th className="py-3 px-2 w-1/12">Horas</th>
                            <th className="py-3 px-2 w-1/6">Última</th>
                            {user?.type === 'jefe' && <th className="py-3 px-2 w-1/3">Acción</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFirefighters.map((firefighter, index) => (
                            <tr
                                key={firefighter.id_empleado}
                                className={`${darkMode ? 'bg-gray-700 border-gray-800 hover:bg-gray-600' : 'bg-white border-b hover:bg-gray-50'}`}
                            >
                                <td className="py-4 px-2 truncate">{index + 1}. {firefighter.nombre} {firefighter.apellido}</td>
                                <td className="py-4 px-2 truncate">{firefighter.telefono}</td>
                                <td className="py-4 px-2 truncate">{firefighter.puesto}</td>
                                <td className="py-4 px-2 text-center">{firefighter[orderColumn]}</td>
                                <td className="py-4 px-2 truncate">{formatTimestamp(firefighter[orderColumn2])}</td>

                                {user?.type === 'jefe' && (
                                    <td className="py-4 px-2 flex justify-center items-center space-x-4">
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex items-center whitespace-nowrap">
                                                <span className="text-xs mr-2">Diurnas:&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                                <input
                                                    type="number"
                                                    value={dayHours[firefighter.id_empleado] || ''}
                                                    onChange={(e) => handleDayHoursChange(firefighter.id_empleado, e.target.value)}
                                                    className={`w-16 p-1 border rounded ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-300 text-gray-700'}`}
                                                />
                                            </div>
                                            <div className="flex items-center whitespace-nowrap">
                                                <span className="text-xs mr-2">Nocturnas:</span>
                                                <input
                                                    type="number"
                                                    value={nightHours[firefighter.id_empleado] || ''}
                                                    onChange={(e) => handleNightHoursChange(firefighter.id_empleado, e.target.value)}
                                                    className={`w-16 p-1 border rounded ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-300 text-gray-700'}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => handleAcceptSubmit(firefighter.id_empleado)}
                                                className={`px-3 py-1 rounded ${darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
                                                title="Aceptar horas"
                                            >
                                                <FontAwesomeIcon icon={faCheck} /> Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleRejectSubmit(firefighter.id_empleado)}
                                                className={`px-3 py-1 rounded ${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                                                title="Rechazar horas"
                                            >
                                                <FontAwesomeIcon icon={faTimes} /> Rechazar
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default RequirementList;