import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';

const ExtendWorkingDayModal = ({
    isOpen,
    onClose,
    firefighters,
    guardDate, // Fecha de la guardia en formato "YYYY-MM-DD"
    onSuccess // Callback para refrescar datos
}) => {
    const { darkMode } = useDarkMode();
    const [selectedFirefighterId, setSelectedFirefighterId] = useState('');
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedTurno, setSelectedTurno] = useState('Mañana');
    const [direccion, setDireccion] = useState('adelante');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const turnoOptions = ['Mañana', 'Tarde', 'Noche'];

    // Calcular fechas
    const today = guardDate;
    const tomorrow = dayjs(guardDate).add(1, 'day').format('YYYY-MM-DD');

    useEffect(() => {
        if (isOpen) {
            // Reiniciar estados al abrir el modal
            setSelectedFirefighterId('');
            setSelectedDate('today');
            setSelectedTurno('Mañana');
            setDireccion('adelante');
            setError(null);
            setSuccess(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // La dirección se establece manualmente por el usuario

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError(null);
        setSuccess(null);

        if (!selectedFirefighterId) {
            setError('Seleccione un bombero');
            return;
        }

        setIsSubmitting(true);

        // Determinar las fechas según la selección
        const fechaActual = today; // Siempre usamos la fecha de guardia como fecha actual
        const nuevaFecha = selectedDate === 'today' ? today : tomorrow;

        const payload = {
            id_empleado: selectedFirefighterId,
            fecha_actual: fechaActual,
            nueva_fecha: nuevaFecha,
            nuevo_turno: selectedTurno,
            direccion: direccion
        };

        try {
            console.log("Enviando payload de prolongación:", payload);
            const response = await AssignmentsApiService.extendWorkingDay(payload);
            
            setSuccess(response.data.message || 'Jornada prolongada exitosamente');
            
            // Reiniciar campos
            setSelectedFirefighterId('');
            setSelectedDate('today');
            setSelectedTurno('Mañana');
            
            // Llamar callback para refrescar datos si existe
            if (onSuccess) {
                onSuccess();
            }

        } catch (err) {
            console.error('Error prolongando jornada:', err);
            const errorMessage = err.response?.data?.message || 'Error prolongando la jornada';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Encabezado */}
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Prolongar Jornada de Trabajo
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}
                        disabled={isSubmitting}
                    >
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        {/* Bombero */}
                        <div className="sm:col-span-2">
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Seleccione Bombero
                            </label>
                            <select
                                value={selectedFirefighterId}
                                onChange={(e) => setSelectedFirefighterId(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                <option value="">-- Seleccione un bombero --</option>
                                {firefighters.map((firefighter) => (
                                    <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                                        {firefighter.nombre} {firefighter.apellido} - {firefighter.puesto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Fecha hasta prolongar
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                <option value="today">Hoy ({dayjs(today).format('DD/MM/YYYY')})</option>
                                <option value="tomorrow">Mañana ({dayjs(tomorrow).format('DD/MM/YYYY')})</option>
                            </select>
                        </div>

                        {/* Turno */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Turno
                            </label>
                            <select
                                value={selectedTurno}
                                onChange={(e) => setSelectedTurno(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                {turnoOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dirección - Selector manual */}
                        <div className="sm:col-span-2">
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Tipo de Prolongación
                            </label>
                            <select
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                <option value="adelante">Prolongar hacia adelante (extender la jornada)</option>
                                <option value="atras">Prolongar hacia atrás (empezar antes)</option>
                            </select>
                            <div className={`text-xs mt-2 p-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {direccion === 'adelante' ? (
                                    <div>
                                        <strong>Prolongar hacia adelante:</strong> Modifica la asignación de vuelta para que termine más tarde.
                                    </div>
                                ) : (
                                    <div>
                                        <strong>Prolongar hacia atrás:</strong> Modifica la asignación de ida para que empiece más temprano.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mensajes de error o éxito */}
                    {error && (
                        <div className="text-red-500 mb-4 text-sm bg-red-100 p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500 mb-4 text-sm bg-green-100 p-3 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex items-center space-x-4">
                        <button
                            type="submit"
                            className={`text-sm px-5 py-2.5 font-medium rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Procesando...' : 'Prolongar Jornada'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`text-sm px-5 py-2.5 font-medium rounded-lg ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600'}`}
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExtendWorkingDayModal;