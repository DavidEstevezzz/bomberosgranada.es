import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddGuardModal = ({ date, isOpen, onClose, onSave, brigades }) => {
    const [guard, setGuard] = useState({
        date: new Date(date),
        id_brigada: '',
        id_salario: null,
        tipo: 'Festivo víspera',
    });

    const { darkMode } = useDarkMode();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setGuard({
                date: new Date(date),
                id_brigada: '',
                id_salario: null,
                tipo: guard.tipo || 'Laborable',
            });
            setIsSubmitting(false);
        }
    }, [isOpen, date, brigades]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGuard({ ...guard, [name]: value });
    };

    const handleDateChange = (date) => {
        setGuard({ ...guard, date });
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        onSave({
            ...guard,
            date: guard.date.toISOString().split('T')[0],
        });
    };

    const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
    const modalClass = `relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
        darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
    }`;
    const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
        darkMode
            ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
            : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
    }`;
    const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
    const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
        darkMode
            ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
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

    return (
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
                        <h2 className="mt-2 text-2xl font-semibold">Agregar guardia</h2>
                        <p className="mt-3 text-sm text-white/90">
                            Asigna una brigada y tipo de guardia asegurando que la fecha y la información estén actualizadas.
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

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className={labelClass}>Fecha</span>
                            <DatePicker
                                selected={guard.date}
                                onChange={handleDateChange}
                                className={inputBaseClass}
                                calendarClassName={darkMode ? 'bg-slate-900 text-slate-100' : undefined}
                                required
                            />
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Selecciona el día en que se registrará la guardia.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <span className={labelClass}>Brigada</span>
                            <select
                                name="id_brigada"
                                id="id_brigada"
                                value={guard.id_brigada}
                                onChange={handleChange}
                                className={inputBaseClass}
                                required
                            >
                                <option value="">Selecciona una brigada</option>
                                {brigades.map((brigade) => (
                                    <option key={brigade.id_brigada} value={brigade.id_brigada}>
                                        {brigade.nombre}
                                    </option>
                                ))}
                            </select>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                La guardia se vinculará con la brigada seleccionada.
                            </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <span className={labelClass}>Tipo de guardia</span>
                            <select
                                name="tipo"
                                id="tipo"
                                value={guard.tipo}
                                onChange={handleChange}
                                className={inputBaseClass}
                                required
                            >
                                <option value="Laborable">Laborable</option>
                                <option value="Festivo">Festivo</option>
                                <option value="Prefestivo">Prefestivo</option>
                                <option value="Festivo víspera">Festivo víspera</option>
                            </select>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Determina si la jornada corresponde a un día laborable o festivo.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando…' : 'Guardar guardia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGuardModal;
