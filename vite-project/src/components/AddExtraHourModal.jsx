import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ExtraHourApiService from '../services/ExtraHourApiService';
import SalariesApiService from '../services/SalariesApiService';
import UsersApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';

const AddExtraHourModal = ({ isOpen, onClose, onAdd }) => {
  const [formValues, setFormValues] = useState({});
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setFormValues({
        id_empleado: '',
        date: '',
        horas_diurnas: 0,
        horas_nocturnas: 0,
        id_salario: '',
      });
      setSearchTerm('');
      setErrorMessages({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = employees.filter((employee) => {
      const fullName = `${employee.nombre} ${employee.apellido}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessages({});
    try {
      const formattedDate = dayjs(formValues.date).format('YYYY-MM-DD');
      const dataToSend = { ...formValues, date: formattedDate };
      const response = await ExtraHourApiService.createExtraHour(dataToSend);

      onAdd(response.data);
      onClose();
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: 'Ocurrió un error.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm';
  const modalClass = `w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl transition-colors ${darkMode ? 'border-slate-800 bg-slate-950/80 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'
    }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${darkMode
    ? 'bg-gradient-to-r from-primary-900 via-primary-700 to-primary-500'
    : 'bg-gradient-to-r from-primary-200 via-primary-300 to-primary-400 text-slate-900'
    }`;
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${darkMode
    ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
    }`;
  const labelClass = 'text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${darkMode ? 'bg-primary-500 hover:bg-primary-400 focus:ring-offset-slate-950' : 'bg-primary-500 hover:bg-primary-600 focus:ring-offset-white'
    }`;
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${darkMode
    ? 'border-slate-700 text-slate-200 hover:border-primary-400 hover:text-primary-200 focus:ring-offset-slate-950'
    : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 focus:ring-offset-white'
    }`;

  return (
    <div className={overlayClass}>
      <div className={modalClass}>
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80 dark:text-white/70">
              Registrar horas extra
            </p>
            <h3 className="mt-1 text-xl font-semibold">Añade el detalle del servicio adicional</h3>
            <p className="mt-2 text-xs text-white/80 dark:text-white/70">
              Selecciona al empleado, la fecha y las horas realizadas para actualizar el registro mensual.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 pt-6">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
            Buscar empleado
          </label>
          <input
            type="text"
            placeholder="Introduce nombre o apellido"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBaseClass} mt-2`}
          />
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
              )}            </div>
            <div className="space-y-2">
              <label htmlFor="date" className={labelClass}>
                Fecha
              </label><input
                type="date"
                name="date"
                id="date"
                value={formValues.date}
                onChange={handleChange}
                className={inputBaseClass}
                required
              />
              {errorMessages.date && (
                <p className="text-xs font-medium text-red-500">{errorMessages.date}</p>
              )}            </div>
            <div className="space-y-2">
              <label htmlFor="horas_diurnas" className={labelClass}>
                Horas diurnas
              </label>
              <input
                type="number"
                name="horas_diurnas"
                id="horas_diurnas"
                value={formValues.horas_diurnas}
                onChange={handleChange}
                className={inputBaseClass}
                required
              />
              {errorMessages.horas_diurnas && (
                <p className="text-xs font-medium text-red-500">{errorMessages.horas_diurnas}</p>
              )}            </div>
            <div>
              <label htmlFor="horas_nocturnas" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Horas Nocturnas</label>
              <input
                type="number"
                name="horas_nocturnas"
                id="horas_nocturnas"
                value={formValues.horas_nocturnas}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              />
              {errorMessages.horas_nocturnas && <span className="text-red-500 text-sm">{errorMessages.horas_nocturnas}</span>}
            </div>
            <div>
              <label htmlFor="id_salario" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salario</label>
              <select
                name="id_salario"
                id="id_salario"
                value={formValues.id_salario}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un salario</option>
                {salaries.map(salary => (
                  <option key={salary.id_salario} value={salary.id_salario}>
                    {salary.tipo}
                  </option>
                ))}
              </select>
              {errorMessages.id_salario && <span className="text-red-500 text-sm">{errorMessages.id_salario}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Añadir Hora Extra'}
            </button>
            <button type="button" onClick={onClose} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExtraHourModal;
