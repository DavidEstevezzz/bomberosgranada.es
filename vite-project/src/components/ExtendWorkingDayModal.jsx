import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
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

    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') {
            return undefined;
        }

        const { body } = document;
        const originalOverflow = body.style.overflow;
        body.style.overflow = 'hidden';

        return () => {
            body.style.overflow = originalOverflow;
        };
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

    if (!isOpen || typeof document === 'undefined') return null;

    const overlayClass =
        'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
    const modalClass = `relative my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
        darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
    }`;
    const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
        darkMode
            ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
            : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
    }`;
    const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
    const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
        darkMode
            ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
    const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
    const messageClass = (type) =>
        `rounded-2xl border px-4 py-3 text-sm font-medium ${
            type === 'error'
                ? darkMode
                    ? 'border-red-500/40 bg-red-500/10 text-red-200'
                    : 'border-red-200 bg-red-50 text-red-700'
                : darkMode
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`;
    const actionsContainerClass = 'flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4';
    const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        darkMode
            ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
            : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
    }`;
    const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        darkMode
            ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
            : 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
    }`;

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    return createPortal(
        <div className={overlayClass} onMouseDown={handleClose}>
            <div
                className={modalClass}
                onMouseDown={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={headerClass}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Planificación</p>
                        <h2 className="mt-2 text-2xl font-semibold">Prolongar jornada de trabajo</h2>
                        <p className="mt-3 text-sm text-white/90">
                            Ajusta la jornada de un bombero en base a las necesidades de servicio de la guardia seleccionada.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
                        aria-label="Cerrar"
                        disabled={isSubmitting}
                    >
                        <span className="text-2xl leading-none">×</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <span className={labelClass}>Selecciona bombero</span>
                            <select
                                value={selectedFirefighterId}
                                onChange={(e) => setSelectedFirefighterId(e.target.value)}
                                className={inputClass}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">-- Seleccione un bombero --</option>
                                {firefighters.map((firefighter) => (
                                    <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                                        {firefighter.nombre} {firefighter.apellido} · {firefighter.puesto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <span className={labelClass}>Fecha hasta prolongar</span>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={inputClass}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="today">Hoy ({dayjs(today).format('DD/MM/YYYY')})</option>
                                <option value="tomorrow">Mañana ({dayjs(tomorrow).format('DD/MM/YYYY')})</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <span className={labelClass}>Turno</span>
                            <select
                                value={selectedTurno}
                                onChange={(e) => setSelectedTurno(e.target.value)}
                                className={inputClass}
                                required
                                disabled={isSubmitting}
                            >
                                {turnoOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <span className={labelClass}>Tipo de prolongación</span>
                            <select
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className={inputClass}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="adelante">Prolongar hacia adelante (extender la jornada)</option>
                                <option value="atras">Prolongar hacia atrás (empezar antes)</option>
                            </select>
                            <p className={`${helperClass} mt-2 rounded-2xl border border-dashed px-4 py-3 ${
                                darkMode ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
                            }`}>
                                {direccion === 'adelante' ? (
                                    <>
                                        <strong>Prolongar hacia adelante:</strong> ajusta la vuelta para que termine más tarde.
                                    </>
                                ) : (
                                    <>
                                        <strong>Prolongar hacia atrás:</strong> adelanta la salida para cubrir antes el servicio.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {error && <div className={messageClass('error')}>{error}</div>}
                    {success && <div className={messageClass('success')}>{success}</div>}

                    <div className={actionsContainerClass}>
                        <button
                            type="button"
                            onClick={handleClose}
                            className={cancelButtonClass}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
                            {isSubmitting ? 'Procesando…' : 'Prolongar jornada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ExtendWorkingDayModal;
