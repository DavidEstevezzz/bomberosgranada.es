import React, { useState, useEffect } from 'react';
import InterventionApiService from '../services/InterventionApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditInterventionModal = ({ show, onClose, onEdited, intervention, firefighters = [] }) => {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({ ...intervention });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setFormData({ ...intervention });
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [intervention, show]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await InterventionApiService.updateIntervention(formData.parte, formData);
      if (onEdited) {
        onEdited();
      }
      setIsSubmitting(false);
      handleClose();
    } catch (error) {
      console.error('Error actualizando intervención:', error);
      setErrorMessage(error?.response?.data?.message || 'No se pudo actualizar la intervención.');
      setIsSubmitting(false);
    }
  };

  if (!show || !intervention) {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-
300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-p
rimary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const errorClass = 'text-xs font-medium text-red-500';
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
      : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
  }`;
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
      : 'bg-primary-600 hover-bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
  }`;
  const alertClass = `rounded-2xl border px-4 py-3 text-sm font-medium ${
    darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
  }`;

  return (
    <div className={overlayClass} onMouseDown={handleClose}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Intervenciones</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar intervención</h2>
            <p className="mt-3 text-sm text-white/90">
              Actualiza los datos principales del parte para que la coordinación sea precisa.
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
          {errorMessage && <div className={alertClass}>{errorMessage}</div>}

          <div className="space-y-6">
            <div className="space-y-2">
              <span className={labelClass}>Número de parte</span>
              <input
                type="text"
                name="parte"
                value={formData.parte ?? ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Identificador del parte"
                required
              />
              <p className={helperClass}>Este identificador debe coincidir con el registro oficial.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Tipo de intervención</span>
              <input
                type="text"
                name="tipo"
                value={formData.tipo ?? ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Incendio urbano"
                required
              />
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Mando responsable</span>
              <select
                name="mando"
                value={formData.mando ?? ''}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Selecciona un mando</option>
                {firefighters.map((firefighter) => (
                  <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                    {firefighter.nombre} {firefighter.apellido}
                  </option>
                ))}
              </select>
              {!firefighters.length && <p className={errorClass}>No hay mandos disponibles para asignar.</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className={cancelButtonClass}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInterventionModal;
