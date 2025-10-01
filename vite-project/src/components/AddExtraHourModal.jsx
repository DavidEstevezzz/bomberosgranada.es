import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import ExtraHourApiService from '../services/ExtraHourApiService';
import SalariesApiService from '../services/SalariesApiService';
import UsersApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const INITIAL_VALUES = Object.freeze({
  id_empleado: '',
  date: '',
  horas_diurnas: 0,
  horas_nocturnas: 0,
  id_salario: '',
});

const AddExtraHourModal = ({ isOpen, onClose, onAdd }) => {
  const { darkMode } = useDarkMode();
  const [formValues, setFormValues] = useState(INITIAL_VALUES);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessages, setErrorMessages] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericFields = useMemo(
    () => [
      { name: 'horas_diurnas', label: 'Horas diurnas' },
      { name: 'horas_nocturnas', label: 'Horas nocturnas' },
    ],
    [],
  );
  
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchData = async () => {
      try {
        const [employeeResponse, salaryResponse] = await Promise.all([
          UsersApiService.getUsuarios(),
          SalariesApiService.getSalaries(),
        ]);

        setEmployees(employeeResponse.data);
        setFilteredEmployees(employeeResponse.data);
        setSalaries(salaryResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    setFormValues(INITIAL_VALUES);
    setSearchTerm('');
    setErrorMessages({});
    setSubmitError(null);
    setIsSubmitting(false);
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    const filtered = employees.filter((employee) => {
      const fullName = `${employee.nombre ?? ''} ${employee.apellido ?? ''}`.trim().toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
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
        date: dayjs(formValues.date).format('YYYY-MM-DD'),
      };
      const response = await ExtraHourApiService.createExtraHour(payload);
      if (onAdd) {
        onAdd(response.data);
      }
      handleClose();
    } catch (error) {
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
        setSubmitError('No se pudieron registrar las horas extra. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const helperTextClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
      : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
  }`;
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
      : 'bg-primary-600 hover-bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
  }`.replace('hover-bg', 'hover:bg'); // ensures consistent string without mutation

  

  return (
    <div className={overlayClass} onMouseDown={handleClose}>
      <div className={modalClass} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Horas extra</p>
            <h2 className="mt-2 text-2xl font-semibold">Registrar servicio adicional</h2>
            <p className="mt-3 text-sm text-white/90">
              Selecciona al empleado y detalla las horas realizadas para actualizar el registro mensual.
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

        <div className="space-y-6 px-6 py-6 sm:px-8">
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
            <span className={labelClass}>Buscar empleado</span>
            <input
              type="text"
              placeholder="Introduce nombre o apellido"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={inputBaseClass}
            />
            <p className={helperTextClass}>El listado se filtrará automáticamente según escribas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="id_empleado" className={labelClass}>
                  Empleado
                </label>
                <select
                  name="id_empleado"
                  id="id_empleado"
                  value={formValues.id_empleado}
                  onChange={handleChange}
                  className={inputBaseClass}
                  required
                >
                  <option value="">Seleccione un empleado</option>
                  {filteredEmployees.map((employee) => (
                    <option key={employee.id_empleado} value={employee.id_empleado}>
                      {employee.nombre} {employee.apellido}
                    </option>
                  ))}
                </select>
                {errorMessages.id_empleado && (
                  <p className="text-xs font-medium text-red-500">{errorMessages.id_empleado}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className={labelClass}>
                  Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formValues.date}
                  onChange={handleChange}
                  className={inputBaseClass}
                  required
                />
                {errorMessages.date && <p className="text-xs font-medium text-red-500">{errorMessages.date}</p>}
              </div>

              {numericFields.map(({ name, label }) => (
                <div key={name} className="space-y-2">
                  <label htmlFor={name} className={labelClass}>
                    {label}
                  </label>
                  <input
                    type="number"
                    name={name}
                    id={name}
                    min="0"
                    step="0.25"
                    value={formValues[name]}
                    onChange={handleChange}
                    className={inputBaseClass}
                    required
                  />
                  {errorMessages[name] && <p className="text-xs font-medium text-red-500">{errorMessages[name]}</p>}
                </div>
              ))}

              <div className="space-y-2">
                <label htmlFor="id_salario" className={labelClass}>
                  Salario
                </label>
                <select
                  name="id_salario"
                  id="id_salario"
                  value={formValues.id_salario}
                  onChange={handleChange}
                  className={inputBaseClass}
                  required
                >
                  <option value="">Seleccione un salario</option>
                  {salaries.map((salary) => (
                    <option key={salary.id_salario} value={salary.id_salario}>
                      {salary.tipo}
                    </option>
                  ))}
                </select>
                {errorMessages.id_salario && (
                  <p className="text-xs font-medium text-red-500">{errorMessages.id_salario}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Añadir hora extra'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExtraHourModal;
