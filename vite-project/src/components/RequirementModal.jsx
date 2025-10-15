import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const RequirementModal = ({ isOpen, onClose, employee }) => {
  const { darkMode } = useDarkMode();

  const [fecha, setFecha] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [brigade, setBrigade] = useState('');
  const [brigades, setBrigades] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFecha('');
      setTurno('Mañana');
      setBrigade('');
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);

      const fetchBrigades = async () => {
        try {
          const response = await BrigadesApiService.getBrigades();
          const sortedBrigades = response.data.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
          );
          setBrigades(sortedBrigades);
        } catch (err) {
          console.error('Error fetching brigades:', err);
          setError('No se pudo cargar la lista de brigadas');
        }
      };

      fetchBrigades();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const { body } = document;
    const originalOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!employee) {
      setError('Falta el ID de empleado');
      setIsSubmitting(false);
      return;
    }

    if (!brigade) {
      setError('Falta seleccionar la brigada');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        id_empleado: employee.id_empleado,
        id_brigada_destino: brigade,
        fecha,
        turno,
        requerimiento: true
      };

      await AssignmentsApiService.requireFirefighter(payload);
      setSuccess('Requerimiento creado con éxito');
      setFecha('');
      setTurno('Mañana');
      setBrigade('');
    } catch (err) {
      console.error('Error creando requerimiento:', err);
      setError('Error creando el requerimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
  const selectClass = inputClass;
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const messageClass = (type) =>
    `rounded-2xl border px-4 py-3 text-sm font-medium ${
      type === 'error'
        ? darkMode
          ? 'border-red-500/40 bg-red-500/10 text-red-200'
          : 'border-red-200 bg-red-50 text-red-700'
        : darkMode
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }`;
  const actionsContainerClass = 'flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4';
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

const dateInputClass = `${inputClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;
  return createPortal(
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
            <h2 className="mt-2 text-2xl font-semibold">Requerir bombero</h2>
            <p className="mt-3 text-sm text-white/90">
              Asigna un refuerzo a otra brigada indicando fecha, turno y destino.
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

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className={dateInputClass}
                required
                disabled={isSubmitting}
              />
              <p className={helperClass}>Selecciona la fecha en la que el profesional prestará servicio.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Turno</span>
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className={selectClass}
                disabled={isSubmitting}
              >
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
                <option value="Día Completo">Día Completo</option>
                <option value="Mañana y tarde">Mañana y tarde</option>
                <option value="Tarde y noche">Tarde y noche</option>
              </select>
              <p className={helperClass}>Ajusta el tramo horario en el que realizará el requerimiento.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Brigada destino</span>
              <select
                value={brigade}
                onChange={(event) => setBrigade(event.target.value)}
                className={selectClass}
                required
                disabled={isSubmitting || brigades.length === 0}
              >
                <option value="">Selecciona una brigada</option>
                {brigades.map((b) => (
                  <option key={b.id_brigada} value={b.id_brigada}>
                    {b.nombre} ({b.id_parque})
                  </option>
                ))}
              </select>
              <p className={helperClass}>
                Las brigadas se muestran ordenadas alfabéticamente para facilitar la selección.
              </p>
            </div>
          </div>

          {error && <div className={messageClass('error')}>{error}</div>}
          {success && <div className={messageClass('success')}>{success}</div>}

          <div className={actionsContainerClass}>
            <button
              type="button"
              onClick={handleClose}
              className={cancelButtonClass}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Crear requerimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RequirementModal;
