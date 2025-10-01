import React, { useEffect, useMemo, useState } from 'react';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const INITIAL_VALUES = Object.freeze({
  nombre: '',
  categoria: '',
  disponible: true,
  parque: null,
});

const AddPersonalEquipmentModal = ({ isOpen, onClose, onAdd, parks = [] }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(INITIAL_VALUES);
  const [categories, setCategories] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await PersonalEquipmentApiService.getCategories();
        setCategories(response.data ?? []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    setFormValues(INITIAL_VALUES);
    setErrorMessages({});
    setSubmitError(null);
    setIsSubmitting(false);
    fetchCategories();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'disponible' ? value === 'true' : value,
    }));
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
    setErrorMessages({});
    setSubmitError(null);

    try {
      const payload = {
        ...formValues,
        parque: formValues.parque ? Number(formValues.parque) : null,
      };
      const response = await PersonalEquipmentApiService.createPersonalEquipment(payload);
      if (onAdd) {
        onAdd(response.data);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to add equipment:', error);
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          setErrorMessages(error.response.data);
          const general = error.response.data.general || error.response.data.error;
          if (general) {
            setSubmitError(general);
          }
        } else {
          setSubmitError(String(error.response.data));
        }
      } else {
        setSubmitError('No se pudo crear el equipo. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Equipamiento</p>
            <h2 className="mt-2 text-2xl font-semibold">Añadir equipo personal</h2>
            <p className="mt-3 text-sm text-white/90">
              Registra un nuevo recurso asignándolo a una categoría y, si procede, al parque responsable.
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Equipo respiratorio"
                required
              />
              {errorMessages.nombre && <p className={errorClass}>{errorMessages.nombre}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Categoría</span>
              <select
                name="categoria"
                value={formValues.categoria}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errorMessages.categoria && <p className={errorClass}>{errorMessages.categoria}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Disponibilidad</span>
              <select
                name="disponible"
                value={String(formValues.disponible)}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="true">Disponible</option>
                <option value="false">No disponible</option>
              </select>
              <p className={helperClass}>Controla si el equipo está listo para ser asignado a nuevas guardias.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Parque</span>
              <select
                name="parque"
                value={formValues.parque ?? ''}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Sin asignar</option>
                {parks.map((park) => (
                  <option key={park.id_parque} value={park.id_parque}>
                    {park.nombre}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Selecciona el parque responsable en caso de que el recurso esté asignado.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Añadir equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonalEquipmentModal;
