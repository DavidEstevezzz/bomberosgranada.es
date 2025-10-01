import React, { useEffect, useMemo, useState } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const INITIAL_VALUES = Object.freeze({
  nombre: '',
  apellido: '',
  email: '',
  email2: '',
  telefono: '',
  dni: '',
  puesto: '',
  type: '',
  AP: '',
  vacaciones: '',
  modulo: '',
  id_parque: '',
  password: '',
});

const TYPE_OPTIONS = [
  { value: 'jefe', label: 'Jefe' },
  { value: 'mando', label: 'Mando' },
  { value: 'bombero', label: 'Bombero' },
  { value: 'empleado', label: 'Empleado' },
];

const PUESTO_BY_TYPE = {
  bombero: ['Conductor', 'Operador', 'Bombero'],
  mando: ['Subinspector', 'Oficial'],
};

const AddUserModal = ({ isOpen, onClose, onAdd }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(INITIAL_VALUES);
  const [errorMessages, setErrorMessages] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(INITIAL_VALUES);
    setErrorMessages({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const puestoOptions = useMemo(() => PUESTO_BY_TYPE[formValues.type] ?? [], [formValues.type]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { puesto: '' } : null),
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
      const response = await UsuariosApiService.createUsuario(formValues);
      if (onAdd) {
        onAdd(response.data);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to add user:', error);
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
        setSubmitError('No se pudo crear el usuario. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Equipo</p>
            <h2 className="mt-2 text-2xl font-semibold">Registrar usuario</h2>
            <p className="mt-3 text-sm text-white/90">
              Completa la información de contacto y disponibilidad para incorporar a la persona en el sistema.
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                className={inputClass}
                placeholder="Introduce el nombre"
                required
              />
              {errorMessages.nombre && <p className={errorClass}>{errorMessages.nombre}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Apellido</span>
              <input
                type="text"
                name="apellido"
                value={formValues.apellido}
                onChange={handleChange}
                className={inputClass}
                placeholder="Introduce el apellido"
                required
              />
              {errorMessages.apellido && <p className={errorClass}>{errorMessages.apellido}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Email principal</span>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="nombre@correo.es"
                required
              />
              {errorMessages.email && <p className={errorClass}>{errorMessages.email}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Email alternativo</span>
              <input
                type="email"
                name="email2"
                value={formValues.email2}
                onChange={handleChange}
                className={inputClass}
                placeholder="correo alternativo (opcional)"
              />
              {errorMessages.email2 && <p className={errorClass}>{errorMessages.email2}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Teléfono</span>
              <input
                type="tel"
                name="telefono"
                value={formValues.telefono}
                onChange={handleChange}
                className={inputClass}
                placeholder="Número de contacto"
                required
              />
              {errorMessages.telefono && <p className={errorClass}>{errorMessages.telefono}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Nº funcionario</span>
              <input
                type="text"
                name="dni"
                value={formValues.dni}
                onChange={handleChange}
                className={inputClass}
                placeholder="Identificador interno"
                required
              />
              {errorMessages.dni && <p className={errorClass}>{errorMessages.dni}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Puesto</span>
              <select
                name="type"
                value={formValues.type}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Selecciona una opción</option>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errorMessages.type && <p className={errorClass}>{errorMessages.type}</p>}
            </div>

            {(formValues.type === 'mando' || formValues.type === 'bombero') && (
              <div className="space-y-2">
                <span className={labelClass}>Categoría</span>
                <select
                  name="puesto"
                  value={formValues.puesto}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {puestoOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errorMessages.puesto && <p className={errorClass}>{errorMessages.puesto}</p>}
              </div>
            )}

            <div className="space-y-2">
              <span className={labelClass}>Asuntos propios</span>
              <input
                type="number"
                name="AP"
                value={formValues.AP}
                onChange={handleChange}
                className={inputClass}
                placeholder="Días disponibles"
                min="0"
                required
              />
              {errorMessages.AP && <p className={errorClass}>{errorMessages.AP}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Vacaciones</span>
              <input
                type="number"
                name="vacaciones"
                value={formValues.vacaciones}
                onChange={handleChange}
                className={inputClass}
                placeholder="Días restantes"
                min="0"
                required
              />
              {errorMessages.vacaciones && <p className={errorClass}>{errorMessages.vacaciones}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>Módulo</span>
              <input
                type="text"
                name="modulo"
                value={formValues.modulo}
                onChange={handleChange}
                className={inputClass}
                placeholder="Introduce el módulo asignado"
                required
              />
              <p className={helperClass}>Este dato se usa para coordinar formaciones y asignaciones específicas.</p>
              {errorMessages.modulo && <p className={errorClass}>{errorMessages.modulo}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Añadir usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
