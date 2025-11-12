import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faCheck, faTimes, faFilter, faTrash } from '@fortawesome/free-solid-svg-icons';
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
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [dayHours, setDayHours] = useState({});
    const [nightHours, setNightHours] = useState({});
    
    // Estados para filtros múltiples
    const [filters, setFilters] = useState([{ id: 1, type: 'puesto', value: '' }]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [nextFilterId, setNextFilterId] = useState(2);

    const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
        darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
    }`;
    const sectionBaseClass = `rounded-2xl border px-5 py-6 transition-colors ${
        darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
    }`;
    const statCardClass = `rounded-2xl border px-4 py-4 transition-colors ${
        darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
    }`;
        const headerDateInputClass = `w-full rounded-2xl border px-3 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white/70 ${
        darkMode
            ? 'border-white/30 bg-white/10 placeholder-white/60'
            : 'border-white/60 bg-white/30 placeholder-white/60'
    }`;
    const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
    const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
        darkMode
            ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
    const compactInputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
        darkMode
            ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
    const buttonBaseClass = 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400';
    const secondaryButtonClass = `${buttonBaseClass} ${
        darkMode
            ? 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800/60'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
    }`;
    const acceptButtonClass = `${buttonBaseClass} ${
        darkMode
            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
            : 'border border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
    }`;
    const rejectButtonClass = `${buttonBaseClass} ${
        darkMode
            ? 'border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
            : 'border border-rose-200 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20'
    }`;
    const infoPillClass = `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        darkMode ? 'border-slate-700 bg-slate-900/60 text-slate-200' : 'border-slate-200 bg-white text-slate-600'
    }`;

    // Función para cargar la lista de bomberos
    const fetchFirefighters = async () => {
    setLoading(true);
    try {
        const response = await fetchData(selectedDate);
        const fetchedFirefighters = response.data.available_firefighters;
        
        const orderedFirefighters = fetchedFirefighters.sort((a, b) => {
            // 1. Ordenar por columna principal (horas)
            const diff = a[orderColumn] - b[orderColumn];
            
            if (diff === 0 && orderColumn2) {
                // 2. Empate en horas: ordenar por fecha/hora (más antiguo primero)
                const dateA = a[orderColumn2];
                const dateB = b[orderColumn2];
                
                if (!dateA && !dateB) return Number(b.dni) - Number(a.dni);
                if (!dateA) return 1;
                if (!dateB) return -1;
                
                if (typeof dateA === 'string' && dateA.includes('-')) {
                    // Comparar timestamp completo (fecha + hora automáticamente)
                    const timeA = new Date(dateA).getTime();
                    const timeB = new Date(dateB).getTime();
                    
                    if (timeA !== timeB) {
                        return timeA - timeB; // Antiguo primero (fecha→hora)
                    }
                } else {
                    // Si es numérico
                    return dateA - dateB;
                }
                
                // 3. Empate total: DNI descendente
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

    const handleDateSelect = (event) => {
        const value = event.target.value;

        if (!value) {
            return;
        }

        const parsed = dayjs(value);

        if (parsed.isValid()) {
            setSelectedDate(parsed.format('YYYY-MM-DD'));
        }
    };


    // Funciones para gestionar filtros múltiples
    const handleAddFilter = (filterType) => {
        setFilters([...filters, { id: nextFilterId, type: filterType, value: '' }]);
        setNextFilterId(nextFilterId + 1);
        setShowFilterMenu(false);
    };

    const handleFilterChange = (id, value) => {
        setFilters(filters.map(filter => 
            filter.id === id ? { ...filter, value } : filter
        ));
    };

    const handleRemoveFilter = (id) => {
        if (filters.length > 1) {
            setFilters(filters.filter(filter => filter.id !== id));
        }
    };

    const getFilterPlaceholder = (type) => {
        switch(type) {
            case 'puesto':
                return 'Buscar por puesto...';
            case 'nombre':
                return 'Buscar por nombre o apellido...';
            case 'dni':
                return 'Buscar por número de funcionario (DNI)...';
            default:
                return 'Buscar...';
        }
    };

    const getFilterLabel = (type) => {
        switch(type) {
            case 'puesto':
                return 'Puesto';
            case 'nombre':
                return 'Nombre/Apellido';
            case 'dni':
                return 'Nº Funcionario';
            default:
                return 'Filtro';
        }
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
            await AssignmentsApiService.incrementUserColumn(id, {
                column: orderColumn,
                increment: totalIncrement,
                orderColumn2: orderColumn2
            });

            await AssignmentsApiService.incrementUserColumn(id, {
                column: 'horas_aceptadas',
                increment: totalIncrement
            });

            await fetchFirefighters();
            clearInputs(id);
        } catch (error) {
            console.error(`Failed to increment columns for user ${id}:`, error);
        }
    };

    // Filtrar la lista aplicando todos los filtros activos
    const filteredFirefighters = firefighters.filter((firefighter) => {
        return filters.every(filter => {
            if (!filter.value) return true; // Si el filtro está vacío, no filtrar
            
            const searchValue = filter.value.toLowerCase();
            
            switch(filter.type) {
                case 'puesto':
                    return firefighter.puesto.toLowerCase().includes(searchValue);
                case 'nombre':
                    const nombreCompleto = `${firefighter.nombre} ${firefighter.apellido}`.toLowerCase();
                    return nombreCompleto.includes(searchValue);
                case 'dni':
                    return firefighter.dni.toString().includes(searchValue);
                default:
                    return true;
            }
        });
    });

    // Función auxiliar para formatear la fecha
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        return dayjs(timestamp).format('DD/MM/YYYY HH:mm');
    };

    const stats = [
        { label: 'Registrados', value: firefighters.length },
        { label: 'Coinciden con el filtro', value: filteredFirefighters.length },
        { label: 'Fecha consultada', value: dayjs(selectedDate).format('DD/MM/YYYY') },
    ];

    // Obtener tipos de filtro disponibles (excluyendo los ya añadidos)
    const availableFilterTypes = ['puesto', 'nombre', 'dni'].filter(
        type => !filters.some(filter => filter.type === type)
    );

    if (loading) {
        return (
            <div className={cardContainerClass}>
                <div className="flex min-h-[280px] items-center justify-center px-6 py-10">
                    <p className={`text-sm font-medium ${subtleTextClass}`}>Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cardContainerClass}>
                <div className="flex min-h-[280px] items-center justify-center px-6 py-10">
                    <p className="text-sm font-semibold text-rose-500">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cardContainerClass}>
            <div
                className={`bg-gradient-to-r px-6 py-8 text-white transition-colors duration-300 sm:px-10 ${
                    darkMode
                        ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
                        : 'from-primary-400 via-primary-500 to-primary-600'
                }`}
            >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                            Gestión de disponibilidad
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
                        <p className="mt-3 max-w-3xl text-sm text-white/90">
                            Consulta la disponibilidad del personal y gestiona rápidamente las horas ofrecidas y aceptadas en cada turno.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="flex items-center justify-end gap-2">
                                <button onClick={handlePreviousDay} className={secondaryButtonClass}>
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                    <span>Anterior</span>
                                </button>
                                <span className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold uppercase tracking-wide">
                                    {dayjs(selectedDate).format('DD/MM/YYYY')}
                                </span>
                                <button onClick={handleNextDay} className={secondaryButtonClass}>
                                    <span>Siguiente</span>
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                            <label className="flex flex-col items-end gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-white/70 sm:text-[0.65rem]">
                                Seleccionar fecha
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateSelect}
                                    className={`${headerDateInputClass} min-w-[180px] text-center sm:text-left`}
                                />
                            </label>
                        </div>
                        <span className="self-end text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                            Actualizado al último cambio
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-8 px-6 py-8 sm:px-10">
                <section className={sectionBaseClass}>
                    <div className="flex flex-col gap-4">
                        {/* Filtros dinámicos */}
                        <div className="space-y-3">
                            {filters.map((filter, index) => (
                                <div key={filter.id} className="flex items-end gap-3">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200">
                                            {getFilterLabel(filter.type)}
                                        </label>
                                        <input
                                            type="text"
                                            value={filter.value}
                                            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                            placeholder={getFilterPlaceholder(filter.type)}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    {filters.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveFilter(filter.id)}
                                            className={`${secondaryButtonClass} shrink-0`}
                                            title="Eliminar filtro"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botón para añadir filtros */}
                        {availableFilterTypes.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`${infoPillClass} cursor-pointer transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/20`}
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                    Añadir filtro
                                </button>

                                {/* Menú desplegable de filtros */}
                                {showFilterMenu && (
                                    <div className={`absolute left-0 top-full mt-2 z-10 rounded-xl border shadow-lg ${
                                        darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                                    }`}>
                                        <div className="p-2">
                                            {availableFilterTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleAddFilter(type)}
                                                    className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-colors ${
                                                        darkMode
                                                            ? 'hover:bg-slate-800 text-slate-200'
                                                            : 'hover:bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={faFilter} className="mr-2 text-xs" />
                                                    {getFilterLabel(type)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {stats.map((stat) => (
                            <div key={stat.label} className={statCardClass}>
                                <p className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}>
                                    {stat.label}
                                </p>
                                <p className="mt-2 text-base font-semibold">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={sectionBaseClass}>
                    <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800 md:block">
                        <table className="min-w-full table-auto text-sm">
                            <thead className={darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                                <tr className="text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nombre</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Teléfono</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Puesto</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-center">Horas</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Última actualización</th>
                                    {user?.type === 'jefe' && (
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-center">Gestión</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className={darkMode ? 'divide-slate-800' : 'divide-slate-200'}>
                                {filteredFirefighters.map((firefighter, index) => (
                                    <tr
                                        key={firefighter.id_empleado}
                                        className={`${
                                            darkMode
                                                ? 'divide-slate-800 bg-slate-900/40 text-slate-100 hover:bg-slate-900/60'
                                                : 'divide-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-4 py-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{index + 1}. {firefighter.nombre} {firefighter.apellido}</span>
                                                <span className={`text-xs ${subtleTextClass}`}>DNI: {firefighter.dni}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <span className="text-sm font-medium">{firefighter.telefono || '—'}</span>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <span className="text-sm font-medium">{firefighter.puesto}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center align-middle">
                                            <span className="text-base font-semibold text-primary-600 dark:text-primary-300">{firefighter[orderColumn]}</span>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <span className="text-sm font-medium">{formatTimestamp(firefighter[orderColumn2]) || 'Sin registros'}</span>
                                        </td>
                                        {user?.type === 'jefe' && (
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}>
                                                                Diurnas
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={dayHours[firefighter.id_empleado] || ''}
                                                                onChange={(e) => handleDayHoursChange(firefighter.id_empleado, e.target.value)}
                                                                className={`${compactInputClass} max-w-[6rem]`}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-semibold uppercase tracking-wide ${subtleTextClass}`}>
                                                                Nocturnas
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={nightHours[firefighter.id_empleado] || ''}
                                                                onChange={(e) => handleNightHoursChange(firefighter.id_empleado, e.target.value)}
                                                                className={`${compactInputClass} max-w-[6rem]`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <button
                                                            onClick={() => handleAcceptSubmit(firefighter.id_empleado)}
                                                            className={acceptButtonClass}
                                                            title="Aceptar horas"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} /> Aceptar
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectSubmit(firefighter.id_empleado)}
                                                            className={rejectButtonClass}
                                                            title="Rechazar horas"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} /> Rechazar
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-4 md:hidden">
                        {filteredFirefighters.map((firefighter, index) => (
                            <div
                                key={firefighter.id_empleado}
                                className={`rounded-2xl border px-4 py-4 transition-colors ${
                                    darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                                }`}
                            >
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="text-base font-semibold">
                                            {index + 1}. {firefighter.nombre} {firefighter.apellido}
                                        </p>
                                        <p className={`text-xs ${subtleTextClass}`}>DNI: {firefighter.dni}</p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <span className={infoPillClass}>Teléfono: {firefighter.telefono || '—'}</span>
                                        <span className={infoPillClass}>Puesto: {firefighter.puesto}</span>
                                    </div>
                                    <div
                                        className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                                            darkMode
                                                ? 'border-primary-500/30 bg-primary-500/10 text-primary-200'
                                                : 'border-primary-200 bg-primary-50 text-primary-700'
                                        }`}
                                    >
                                        <span>Horas registradas</span>
                                        <span>{firefighter[orderColumn]}</span>
                                    </div>
                                    <p className={`text-xs ${subtleTextClass}`}>
                                        Última actualización: {formatTimestamp(firefighter[orderColumn2]) || 'Sin registros'}
                                    </p>
                                </div>

                                {user?.type === 'jefe' && (
                                    <div className="mt-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide">
                                                <span className={subtleTextClass}>Diurnas</span>
                                                <input
                                                    type="number"
                                                    value={dayHours[firefighter.id_empleado] || ''}
                                                    onChange={(e) => handleDayHoursChange(firefighter.id_empleado, e.target.value)}
                                                    className={compactInputClass}
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide">
                                                <span className={subtleTextClass}>Nocturnas</span>
                                                <input
                                                    type="number"
                                                    value={nightHours[firefighter.id_empleado] || ''}
                                                    onChange={(e) => handleNightHoursChange(firefighter.id_empleado, e.target.value)}
                                                    className={compactInputClass}
                                                />
                                            </label>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <button
                                                onClick={() => handleAcceptSubmit(firefighter.id_empleado)}
                                                className={acceptButtonClass}
                                                title="Aceptar horas"
                                            >
                                                <FontAwesomeIcon icon={faCheck} /> Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleRejectSubmit(firefighter.id_empleado)}
                                                className={rejectButtonClass}
                                                title="Rechazar horas"
                                            >
                                                <FontAwesomeIcon icon={faTimes} /> Rechazar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default RequirementList;