import React, { useState, useEffect } from 'react';
import ExtraHourApiService from '../services/ExtraHourApiService';
import UsersApiService from '../services/UsuariosApiService';
import SalariesApiService from '../services/SalariesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditExtraHourModal = ({ isOpen, onClose, extraHour, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    id_empleado: extraHour.id_empleado || '',
    date: extraHour.date || '',
    horas_diurnas: extraHour.horas_diurnas || 0,
    horas_nocturnas: extraHour.horas_nocturnas || 0,
    id_salario: extraHour.id_salario || '',
  });

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if(isOpen){
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (extraHour) {
      setFormValues({
        id_empleado: extraHour.id_empleado,
        date: extraHour.date,
        horas_diurnas: extraHour.horas_diurnas,
        horas_nocturnas: extraHour.horas_nocturnas,
        id_salario: extraHour.id_salario,
      });
    }
  }, [extraHour]);

  if (!isOpen) return null;

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
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

  const fetchData = async () => {
    try {
      const employeeResponse = await UsersApiService.getUsuarios();
      const salaryResponse = await SalariesApiService.getSalaries();

      setEmployees(employeeResponse.data);
      setSalaries(salaryResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessages({});
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Actualizar utilizando el `id` único
      const response = await ExtraHourApiService.updateExtraHour(extraHour.id, formValues);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update extra hour:', error);
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: 'An error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={overlayClass} onMouseDown={() => !isSubmitting && onClose()}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Horas extra</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar registro de horas extra</h2>
            <p className="mt-3 text-sm text-white/90">
              Ajusta los datos del parte para que la retribución se calcule correctamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          {errorMessages.general && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {errorMessages.general}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Empleado</span>
              <select
                name="id_empleado"
                id="id_empleado"
                value={formValues.id_empleado}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Seleccione un empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id_empleado} value={employee.id_empleado}>
                    {employee.nombre} {employee.apellido}
                  </option>
                ))}
              </select>
              {errorMessages.id_empleado && <p className={errorClass}>{errorMessages.id_empleado}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Fecha del servicio</span>
              <input
                type="date"
                name="date"
                id="date"
                value={formValues.date}
                onChange={handleChange}
                className={inputClass}
                required
              />
              {errorMessages.date && <p className={errorClass}>{errorMessages.date}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Horas diurnas</span>
              <input
                type="number"
                name="horas_diurnas"
                id="horas_diurnas"
                value={formValues.horas_diurnas}
                onChange={handleChange}
                className={inputClass}
                min={0}
                step="0.5"
                required
              />
              <p className={helperClass}>Introduce el total de horas realizadas en horario diurno.</p>
              {errorMessages.horas_diurnas && <p className={errorClass}>{errorMessages.horas_diurnas}</p>}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Horas nocturnas</span>
              <input
                type="number"
                name="horas_nocturnas"
                id="horas_nocturnas"
                value={formValues.horas_nocturnas}
                onChange={handleChange}
                className={inputClass}
                min={0}
                step="0.5"
                required
              />
              <p className={helperClass}>Añade las horas entre las 22:00 y las 06:00.</p>
              {errorMessages.horas_nocturnas && <p className={errorClass}>{errorMessages.horas_nocturnas}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Tipo salarial</span>
              <select
                name="id_salario"
                id="id_salario"
                value={formValues.id_salario}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Seleccione un salario</option>
                {salaries.map((salary) => (
                  <option key={salary.id_salario} value={salary.id_salario}>
                    {salary.tipo}
                  </option>
                ))}
              </select>
              {errorMessages.id_salario && <p className={errorClass}>{errorMessages.id_salario}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={cancelButtonClass}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Actualizar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExtraHourModal;
