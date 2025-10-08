import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import VehiclesApiService from '../services/VehiclesApiService';
import ParksApiService from '../services/ParkApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditVehicleModal = ({ isOpen, onClose, vehicle, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    matricula: vehicle.matricula || '',
    nombre: vehicle.nombre || '', // Nuevo campo
    id_parque: vehicle.id_parque || '',
    año: vehicle.año || '',
    tipo: vehicle.tipo || ''
  });
  const [parks, setParks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        matricula: vehicle.matricula || '',
        nombre: vehicle.nombre || '',
        id_parque: vehicle.id_parque || '',
        año: vehicle.año || '',
        tipo: vehicle.tipo || ''
      });
      setIsSubmitting(false);
    }
  }, [isOpen, vehicle]);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const response = await ParksApiService.getParks();
        setParks(response.data);
      } catch (error) {
        console.error('Error fetching parks:', error);
      }
    };
    fetchParks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await VehiclesApiService.updateVehicle(vehicle.matricula, formValues);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Flota</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar vehículo operativo</h2>
            <p className="mt-3 text-sm text-white/90">
              Actualiza los datos de matrícula, parque asignado y capacidades para mantener la flota al día.
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
              <span className={labelClass}>Matrícula</span>
              <input
                type="text"
                name="matricula"
                value={formValues.matricula}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. 1234 ABC"
                readOnly
                disabled={isSubmitting}
              />
              <p className={helperClass}>El identificador único del vehículo no puede modificarse.</p>
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Nombre del vehículo</span>
              <input
                type="text"
                name="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Autoescala 01"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Parque asignado</span>
              <select
                name="id_parque"
                value={formValues.id_parque}
                onChange={handleChange}
                className={inputClass}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecciona un parque</option>
                {parks.map((park) => (
                  <option key={park.id_parque} value={park.id_parque}>
                    {park.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Año</span>
              <input
                type="number"
                name="año"
                value={formValues.año}
                onChange={handleChange}
                className={inputClass}
                min="1950"
                max={new Date().getFullYear() + 1}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Tipo o función</span>
              <input
                type="text"
                name="tipo"
                value={formValues.tipo}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Autobomba, autoescala, vehículo ligero…"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

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
              {isSubmitting ? 'Guardando cambios…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditVehicleModal;
