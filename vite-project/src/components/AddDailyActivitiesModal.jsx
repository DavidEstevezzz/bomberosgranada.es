import React, { useEffect, useMemo, useState } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const INITIAL_VALUES = Object.freeze({
  limpieza_vehiculos: '',
  limpieza_dependencias: '',
  callejero: '',
  ejercicios: '',
  repostaje: '',
  botellas: '',
});

const AddDailyActivitiesModal = ({ isOpen, onClose, onUpdate, id_brigada, selectedDate }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guardId, setGuardId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(INITIAL_VALUES);
    setIsSubmitting(false);
    setGuardId(null);

    const fetchGuardActivities = async () => {
      try {
        const response = await GuardsApiService.getGuard(id_brigada, selectedDate);
        const guard = response.data?.guard;

        if (guard) {
          setFormValues({
            limpieza_vehiculos: guard.limpieza_vehiculos || '',
            limpieza_dependencias: guard.limpieza_dependencias || '',
            callejero: guard.callejero || '',
            ejercicios: guard.ejercicios || '',
            repostaje: guard.repostaje || '',
            botellas: guard.botellas || '',
          });
          setGuardId(guard.id);
        }
      } catch (error) {
        console.error('Error al cargar las actividades diarias:', error);
      }
    };

    fetchGuardActivities();
  }, [id_brigada, isOpen, selectedDate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const fieldLabels = useMemo(
    () => ({
      limpieza_vehiculos: 'Limpieza de vehículos',
      limpieza_dependencias: 'Limpieza de dependencias',
      callejero: 'Callejero',
      ejercicios: 'Maniobras',
      repostaje: 'Repostaje',
      botellas: 'Botellas de aire',
    }),
    [],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !guardId) return;

    setIsSubmitting(true);
    try {
      const response = await GuardsApiService.updateDailyActivities(guardId, formValues);
      if (onUpdate) {
        onUpdate(response.data);
      }
      handleClose();
    } catch (error) {
      console.error('Error actualizando las actividades diarias:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const textareaClass = `min-h-[132px] w-full resize-y rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const helperTextClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
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
      <div className={modalClass} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Gestión diaria</p>
            <h2 className="mt-2 text-2xl font-semibold">Actividades diarias</h2>
            <p className="mt-3 text-sm text-white/90">
              Revisa y actualiza las tareas realizadas por la brigada para mantener el registro al día.
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

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(fieldLabels).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <span className={labelClass}>{label}</span>
                <textarea
                  name={field}
                  value={formValues[field]}
                  onChange={handleChange}
                  placeholder={`Describe ${label.toLowerCase()}`}
                  className={textareaClass}
                />
                <p className={helperTextClass}>Registra observaciones relevantes realizadas durante el turno.</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting || !guardId}>
              {isSubmitting ? 'Guardando…' : 'Guardar actividades'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDailyActivitiesModal;
