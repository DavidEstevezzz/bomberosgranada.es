// vite-project/src/components/EditBrigadeModal.jsx
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const INITIAL_VALUES = Object.freeze({
  nombre: '',
  id_parque: '',
});

const EditBrigadeModal = ({ isOpen, onClose, brigade, onUpdate }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(INITIAL_VALUES);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues({
      nombre: brigade?.nombre ?? '',
      id_parque: brigade?.id_parque ? String(brigade.id_parque) : '',
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen, brigade]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const payload = {
        ...brigade,
        nombre: formValues.nombre,
        id_parque: formValues.id_parque,
      };
      const response = await BrigadesApiService.updateBrigade(brigade.id_brigada, payload);
      if (typeof onUpdate === 'function') {
        onUpdate(response.data);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to update brigade:', error);
      if (error.response?.data) {
        const backend = error.response.data;
        if (typeof backend === 'object') {
          setFieldErrors(backend);
          setSubmitError(backend.general || backend.error || 'No se pudo actualizar la brigada.');
        } else {
          setSubmitError(String(backend));
        }
      } else {
        setSubmitError('No se pudo actualizar la brigada. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
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
      <div className={modalClass} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Brigadas</p>
            <h2 className="mt-2 text-2xl font-semibold">Actualizar brigada</h2>
            <p className="mt-3 text-sm text-white/90">
              Modifica el nombre o el parque asignado para mantener la organización de equipos al día.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
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
            <span className={labelClass}>Nombre</span>
            <input
              type="text"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              className={inputClass}
              placeholder="Introduce el nombre de la brigada"
              required
              disabled={isSubmitting}
            />
            {fieldErrors.nombre && <p className={errorClass}>{fieldErrors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Parque</span>
            <select
              name="id_parque"
              value={formValues.id_parque}
              onChange={handleChange}
              className={inputClass}
              required
              disabled={isSubmitting}
            >
              <option value="">Selecciona un parque</option>
              <option value="1">Parque Norte</option>
              <option value="2">Parque Sur</option>
            </select>
            {fieldErrors.id_parque && <p className={errorClass}>{fieldErrors.id_parque}</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Actualizar brigada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBrigadeModal;
