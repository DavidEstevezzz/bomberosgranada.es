import React, { useState, useEffect } from 'react';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const initialValues = {
  id_parque: '',
  nombre: '',
};

const AddBrigadeModal = ({ isOpen, onClose, onAdd }) => {
  const [formValues, setFormValues] = useState(initialValues);
  const [errorMessages, setErrorMessages] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues);
      setErrorMessages({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
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
    setErrorMessages({});

    try {
      const response = await BrigadesApiService.createBrigade(formValues);
      onAdd(response.data);
      handleClose();
    } catch (error) {
      console.error('Failed to add brigade:', error);
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          setErrorMessages(error.response.data);
          const generalError = error.response.data.general || error.response.data.error;
          if (generalError) {
            setSubmitError(generalError);
          }
        } else {
          setSubmitError(String(error.response.data));
        }
      } else {
        setSubmitError('No se pudo crear la brigada. Inténtalo de nuevo.');
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
  const selectClass = `w-full appearance-none rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode ? 'border-slate-800 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
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
        className={`relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Nueva brigada</p>
            <h2 className="mt-2 text-2xl font-semibold">Añadir brigada</h2>
            <p className="mt-3 text-sm text-white/90">
              Define el nombre y el parque asignado para incorporar una nueva brigada al sistema.
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
              <span className={labelClass}>Nombre de la brigada</span>
              <input
                type="text"
                name="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Ej. Brigada Alfa"
              />
              {errorMessages.nombre && <p className={errorClass}>{errorMessages.nombre}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Parque</span>
              <select
                name="id_parque"
                value={formValues.id_parque}
                onChange={handleChange}
                required
                className={selectClass}
              >
                <option value="">Selecciona un parque</option>
                <option value="1">Parque Norte</option>
                <option value="2">Parque Sur</option>
              </select>
              {errorMessages.id_parque && <p className={errorClass}>{errorMessages.id_parque}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
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
                {isSubmitting ? 'Guardando...' : 'Añadir brigada'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrigadeModal;
