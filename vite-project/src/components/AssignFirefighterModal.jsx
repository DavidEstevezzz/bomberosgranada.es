import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const AssignFirefighterModal = ({
    isOpen,
    onClose,
    firefighters,
    currentBrigade,
    guardDate // Fecha de la guardia en formato "YYYY-MM-DD"
}) => {
    const { darkMode } = useDarkMode();
    const [selectedFirefighterId, setSelectedFirefighterId] = useState('');
    const [turno, setTurno] = useState('Mañana');
    const [fecha, setFecha] = useState(guardDate);
    const [assignmentDetails, setAssignmentDetails] = useState(null);
    const [brigades, setBrigades] = useState([]);
    const [destinationBrigade, setDestinationBrigade] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const turnoOptions = [
        "Mañana",
        "Tarde",
        "Noche",
        "Día Completo",
        "Mañana y tarde",
        "Tarde y noche"
    ];

    // Calcula los turnos de ida y vuelta según el turno seleccionado
    const computeAssignment = (turnoSeleccionado) => {
        let ida = '';
        let vuelta = '';
        switch (turnoSeleccionado) {
            case 'Mañana':
                ida = 'Mañana';
                vuelta = 'Tarde';
                break;
            case 'Tarde':
                ida = 'Tarde';
                vuelta = 'Noche';
                break;
            case 'Noche':
                ida = 'Noche';
                vuelta = 'Mañana';
                break;
            case 'Mañana y tarde':
                ida = 'Mañana';
                vuelta = 'Noche';
                break;
            case 'Tarde y noche':
                ida = 'Tarde';
                vuelta = 'Mañana';
                break;
            case 'Día Completo':
                ida = 'Mañana';
                vuelta = 'Mañana';
                break;
            default:
                break;
        }
        return { ida, vuelta };
    };

    useEffect(() => {
        if (isOpen) {
            // Al abrir el modal reiniciamos estados
            console.log("Modal abierto. currentBrigade:", currentBrigade);
            setSelectedFirefighterId('');
            setTurno('Mañana');
            setFecha(guardDate);
            setError(null);
            setSuccess(null);
            setIsSubmitting(false);
            setAssignmentDetails(computeAssignment('Mañana'));
            // Cargar brigadas para destino
            fetchBrigades();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, guardDate]);

    // Actualiza la asignación calculada al cambiar el turno
    useEffect(() => {
        setAssignmentDetails(computeAssignment(turno));
    }, [turno]);

    // Obtiene la brigada destino que corresponda (misma nombre, parque opuesto)
    const fetchBrigades = async () => {
        try {
            if (!currentBrigade || !currentBrigade.nombre || !currentBrigade.park) {
                console.log("currentBrigade no está definido correctamente");
                setBrigades([]);
                return;
            }
            console.log("currentBrigade:", currentBrigade);
            const response = await BrigadesApiService.getBrigades();
            console.log("Respuesta de getBrigades:", response.data);

            const currentParkId = currentBrigade.park.id_parque;
            const oppositeParkId = currentParkId === 1 ? 2 : 1;
            console.log("Lista completa de brigadas:", response.data);
            const matchingBrigades = response.data.filter(b => {
                console.log("Evaluando brigada:", b);
                return b.nombre === currentBrigade.nombre && b.id_parque === oppositeParkId;
            });
            console.log("Brigadas que coinciden:", matchingBrigades);


            const sortedBrigades = matchingBrigades.sort((a, b) =>
                a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
            );
            console.log("Brigadas ordenadas:", sortedBrigades);

            setBrigades(sortedBrigades);
            if (sortedBrigades.length > 0) {
                setDestinationBrigade(sortedBrigades[0].id_brigada);
                console.log("Brigada destino establecida:", sortedBrigades[0].id_brigada);
            } else {
                setDestinationBrigade('');
                console.log("No se encontró brigada destino");
            }
        } catch (err) {
            console.error('Error fetching brigades:', err);
            setError('No se pudo cargar la lista de brigadas');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError(null);
        setSuccess(null);
        if (!selectedFirefighterId) {
            setError('Seleccione un bombero');
            return;
        }
        if (!destinationBrigade) {
            setError('Seleccione una brigada destino');
            return;
        }
        if (!fecha) {
            setError('Seleccione la fecha');
            return;
        }
        setIsSubmitting(true);

        // La fecha de ida es la fecha ingresada
        const fecha_ida = fecha;
        // Para ciertos turnos, la vuelta se realiza el día siguiente
        let fecha_vuelta = fecha;
        if (
            turno === "Noche" ||
            turno === "Tarde y noche" ||
            turno === "Día Completo"
        ) {
            fecha_vuelta = dayjs(fecha).add(1, 'day').format('YYYY-MM-DD');
        }

        // Payload para asignación de ida: de la brigada actual a la destino
        const payloadIda = {
            id_empleado: selectedFirefighterId,
            id_brigada_origen: currentBrigade.id_brigada,
            id_brigada_destino: destinationBrigade,
            fecha_ini: fecha_ida,
            turno: assignmentDetails.ida,
            tipo_asignacion: 'ida',
        };

        // Payload para asignación de vuelta: de la brigada destino de vuelta a la actual
        const payloadVuelta = {
            id_empleado: selectedFirefighterId,
            id_brigada_origen: destinationBrigade,
            id_brigada_destino: currentBrigade.id_brigada,
            fecha_ini: fecha_vuelta,
            turno: assignmentDetails.vuelta,
            tipo_asignacion: 'ida',
        };

        try {
            console.log("Creando asignación de ida:", payloadIda);
            console.log("Creando asignación de vuelta:", payloadVuelta);
            await AssignmentsApiService.createAssignment(payloadIda);
            await AssignmentsApiService.createAssignment(payloadVuelta);
            setSuccess('Asignación creada con éxito');
            // Reiniciamos campos (o puedes cerrar el modal si así lo prefieres)
            setSelectedFirefighterId('');
            setTurno('Mañana');
            setFecha(guardDate);
            setAssignmentDetails(computeAssignment('Mañana'));
        } catch (err) {
            console.error(err);
            setError('Error creando la asignación');
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
                        Asignar Bombero a Brigada Alterna
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
                        {/* Fecha */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            />
                        </div>
                        {/* Turno */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Turno
                            </label>
                            <select
                                value={turno}
                                onChange={(e) => setTurno(e.target.value)}
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
                        {/* Bombero */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Seleccione Bombero
                            </label>
                            <select
                                value={selectedFirefighterId}
                                onChange={(e) => setSelectedFirefighterId(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                <option value="">-- Seleccione --</option>
                                {firefighters.map((firefighter) => (
                                    <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                                        {firefighter.nombre} {firefighter.apellido}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Brigada Destino */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Brigada Destino
                            </label>
                            <select
                                value={destinationBrigade}
                                onChange={(e) => setDestinationBrigade(e.target.value)}
                                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                required
                            >
                                {brigades.length > 0 ? (
                                    brigades.map((b) => (
                                        <option key={b.id_brigada} value={b.id_brigada}>
                                            {b.nombre} ({b.id_parque})
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No hay brigadas disponibles</option>
                                )}
                            </select>
                        </div>
                    </div>
                    
                    {/* Mensajes de error o éxito */}
                    {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
                    {success && <div className="text-green-500 mb-4 text-sm">{success}</div>}
                    {/* Botones */}
                    <div className="flex items-center space-x-4">
                        <button
                            type="submit"
                            className={`text-sm px-5 py-2.5 font-medium rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar'}
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

export default AssignFirefighterModal;
