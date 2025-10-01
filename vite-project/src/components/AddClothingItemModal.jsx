import React, { useEffect, useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import ClothingItemApiService from '../services/ClothingItemApiService';

const initialValues = { name: '' };

const AddClothingItemModal = ({ isOpen, onClose, onAdd }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues);
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formValues.name.trim();

    if (!trimmedName) {
      errors.name = 'Por favor, ingresa el nombre del ítem.';
    } else if (trimmedName.length > 255) {
      errors.name = 'El nombre no puede exceder los 255 caracteres.';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = { name: formValues.name.trim() };
      await ClothingItemApiService.createClothingItem(payload);
      setFormValues(initialValues);
      setFieldErrors({});
      if (onAdd) {
        await onAdd();
      }
    } catch (error) {
      console.error('Error al crear ítem de vestuario:', error);
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = Object.entries(backendErrors).reduce((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value.join(' ') : String(value);
          return acc;
        }, {});
        setFieldErrors((prev) => ({
          ...prev,
          ...formattedErrors,
        }));
      } else if (error.response?.data) {
        setSubmitError(
          typeof error.response.data === 'string'
            ? error.response.data
            : 'No se pudo crear el ítem. Inténtalo nuevamente.'
        );
      } else {
        setSubmitError('No se pudo crear el ítem. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200';
  const errorClass = 'text-xs font-medium text-red-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur"
      onMouseDown={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
          darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-start justify-between gap-4 px-6 py-5 text-white ${
            darkMode
              ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
              : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Vestuario</p>
            <h2 className="mt-2 text-2xl font-semibold">Añadir ítem de vestuario</h2>
            <p className="mt-3 text-sm text-white/90">
              Crea un nuevo ítem para llevar el control del inventario de vestuario.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {submitError && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <span className={labelClass}>Nombre del ítem</span>
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Chaqueta ignífuga"
              />
              {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
                    : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
                }`}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
                    : 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Crear ítem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClothingItemModal;
