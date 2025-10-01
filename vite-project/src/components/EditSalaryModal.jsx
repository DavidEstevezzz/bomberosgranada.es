import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import SalariesApiService from '../services/SalariesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditSalaryModal = ({ isOpen, onClose, salary, onUpdate }) => {
    if (!isOpen) return null;

    const [formValues, setFormValues] = useState({
        tipo: salary.tipo || '',
        fecha_ini: salary.fecha_ini || '',
        precio_diurno: salary.precio_diurno || '',
        precio_nocturno: salary.precio_nocturno || '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormValues({
                tipo: salary.tipo || '',
                fecha_ini: salary.fecha_ini || '',
                precio_diurno: salary.precio_diurno || '',
                precio_nocturno: salary.precio_nocturno || '',
            });
        }
    }, [isOpen, salary]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const updatedSalary = { ...formValues };

        try {
            const response = await SalariesApiService.updateSalary(salary.id, updatedSalary);
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error('Failed to update salary:', error);
        }
    };

    const { darkMode } = useDarkMode();

    const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm';
    const modalClass = `w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-colors ${
        darkMode ? 'border-slate-800 bg-slate-950/80 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'
    }`;
    const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
        darkMode
            ? 'bg-gradient-to-r from-primary-900 via-primary-700 to-primary-500'
            : 'bg-gradient-to-r from-primary-200 via-primary-300 to-primary-400 text-slate-900'
    }`;
    const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
        darkMode
            ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
    const labelClass = 'text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
    const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${
        darkMode ? 'bg-primary-500 hover:bg-primary-400 focus:ring-offset-slate-950' : 'bg-primary-500 hover:bg-primary-600 focus:ring-offset-white'
    }`;
    const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${
        darkMode
            ? 'border-slate-700 text-slate-200 hover:border-primary-400 hover:text-primary-200 focus:ring-offset-slate-950'
            : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 focus:ring-offset-white'
    }`;

    return (
        <div className={overlayClass}>
            <div className={modalClass}>
                <div className={headerClass}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80 dark:text-white/70">
                            Editar salario
                        </p>
                        <h3 className="mt-1 text-xl font-semibold">Actualiza las condiciones del tramo seleccionado</h3>
                        <p className="mt-2 text-xs text-white/80 dark:text-white/70">
                            Ajusta importes y vigencia para mantener la información salarial al día.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6">
                    <div className="grid gap-5">
                        <div className="space-y-2">
                            <label htmlFor="tipo" className={labelClass}>
                                Tipo
                            </label>
                            <input
                                type="text"
                                name="tipo"
                                id="tipo"
                                value={formValues.tipo}
                                onChange={handleChange}
                                className={inputBaseClass}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="fecha_ini" className={labelClass}>
                                Fecha de inicio
                            </label>
                            <input
                                type="date"
                                name="fecha_ini"
                                id="fecha_ini"
                                value={formValues.fecha_ini}
                                onChange={handleChange}
                                className={inputBaseClass}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="precio_diurno" className={labelClass}>
                                Precio diurno (€)
                            </label>
                            <input
                                type="number"
                                name="precio_diurno"
                                id="precio_diurno"
                                value={formValues.precio_diurno}
                                onChange={handleChange}
                                className={inputBaseClass}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="precio_nocturno" className={labelClass}>
                                Precio nocturno (€)
                            </label>
                            <input
                                type="number"
                                name="precio_nocturno"
                                id="precio_nocturno"
                                value={formValues.precio_nocturno}
                                onChange={handleChange}
                                className={inputBaseClass}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button type="submit" className={submitButtonClass}>
                            Guardar cambios
                        </button>
                        <button type="button" onClick={onClose} className={cancelButtonClass}>
                            <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSalaryModal;
