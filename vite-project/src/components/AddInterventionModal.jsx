import React, { useEffect, useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import InterventionApiService from '../services/InterventionApiService';

const INITIAL_FORM = Object.freeze({
  id_guard: '',
  parte: '',
  tipo: '',
  mando: '',
});

const AddInterventionModal = ({ show, onClose, onAdded, idGuard, firefighters }) => {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({ ...INITIAL_FORM, id_guard: idGuard });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (show) {
      setFormData({ ...INITIAL_FORM, id_guard: idGuard });
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [show, idGuard]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await InterventionApiService.createIntervention(formData);
      if (onAdded) {
        onAdded();
      }
      handleClose();
    } catch (error) {
      console.error('Error creando intervención:', error);
      const backendError = error.response?.data;
      if (backendError) {
        setSubmitError(
          typeof backendError === 'string'
            ? backendError
            : backendError.error || 'No se pudo crear la intervención. Inténtalo nuevamente.'
        );
      } else {
        setSubmitError('No se pudo crear la intervención. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const errorClass = 'text-xs font-medium text-red-500';
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Intervenciones</p>
            <h2 className="mt-2 text-2xl font-semibold">Registrar intervención</h2>
            <p className="mt-3 text-sm text-white/90">
              Documenta las actuaciones realizadas durante la guardia y asigna al mando responsable.
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
          {submitError && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <span className={labelClass}>Número de parte</span>
            <input
              type="text"
              name="parte"
              value={formData.parte}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ej. Parte 123/24"
              required
            />
            <p className={helperClass}>Utiliza el formato habitual para facilitar la trazabilidad del informe.</p>
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Tipo de intervención</span>
            <input
              type="text"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Describe el tipo de salida"
              required
            />
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Mando responsable</span>
            <select
              name="mando"
              value={formData.mando}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Seleccione un mando</option>
              {firefighters?.map((f) => (
                <option key={f.id_empleado} value={f.id_empleado}>
                  {f.nombre} {f.apellido}
                </option>
              ))}
            </select>
            {!firefighters?.length && <p className={errorClass}>No hay mandos disponibles para seleccionar.</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Registrar intervención'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInterventionModal;
