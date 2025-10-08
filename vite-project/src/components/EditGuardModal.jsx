import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import SalariesApiService from '../services/SalariesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditGuardModal = ({ isOpen, onClose, guard, setGuards, availableBrigades }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [salaryId, setSalaryId] = useState('');
  const [type, setType] = useState('');
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (guard && isOpen) {
      setBrigadeId(guard.id_brigada);
      setSalaryId(guard.id_salario);
      setType(guard.tipo);
      setErrorMessage(null);
    }
  }, [guard, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchSalaries = async () => {
      try {
        const response = await SalariesApiService.getSalaries();
        setSalaries(response.data ?? []);
      } catch (error) {
        console.error('Failed to fetch salaries:', error);
        setErrorMessage('No se pudieron cargar los tipos salariales.');
      }
    };

    fetchSalaries();
  }, [isOpen]);

  if (!isOpen || !guard) {
    return null;
  }

  const guardId = guard.id_guard || guard.id;

  const handleClose = () => {
    if (loading || deleteLoading) return;
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || deleteLoading || !guardId) return;

    setLoading(true);
    setErrorMessage(null);

    const updatedGuard = {
      date: guard.date,
      id_brigada: brigadeId,
      id_salario: salaryId,
      tipo: type,
    };

    try {
      const response = await GuardsApiService.updateGuard(guardId, updatedGuard);
      setGuards((prev) =>
        prev.map((g) => (g.id_guard === guardId || g.id === guardId ? response.data : g))
      );
      handleClose();
    } catch (error) {
      console.error('Failed to update the guard:', error);
      setErrorMessage(error?.response?.data?.message || 'No se pudo actualizar la guardia.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!guardId) {
      setErrorMessage('No se pudo determinar la guardia a eliminar.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta guardia?')) {
      return;
    }

    setDeleteLoading(true);
    setErrorMessage(null);

    try {
      await GuardsApiService.deleteGuard(guardId);
      setGuards((prev) => prev.filter((g) => g.id_guard !== guardId && g.id !== guardId));
      handleClose();
    } catch (error) {
      console.error('Failed to delete the guard:', error);
      setErrorMessage(error?.response?.data?.message || 'No se pudo eliminar la guardia.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-
300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const selectClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-
primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900'
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
  const deleteButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-red-500 hover:bg-red-400 focus:ring-red-400 focus:ring-offset-slate-900'
      : 'bg-red-500 hover:bg-red-400 focus:ring-red-300 focus:ring-offset-white'
  }`;

  return (
    <div className={overlayClass} onMouseDown={handleClose}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Guardias</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar guardia programada</h2>
            <p className="mt-3 text-sm text-white/90">
              Ajusta la brigada, el tipo de día y la referencia salarial para mantener la planificación al día.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={loading || deleteLoading}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          {errorMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {errorMessage}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Brigada asignada</span>
              <select
                id="brigadeId"
                className={selectClass}
                value={brigadeId}
                onChange={(event) => setBrigadeId(event.target.value)}
                required
              >
                <option value="">Selecciona una brigada</option>
                {availableBrigades.map((brigade) => (
                  <option key={brigade.id_brigada} value={brigade.id_brigada}>
                    {brigade.nombre}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Elige la dotación responsable de cubrir este servicio.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Tipo salarial</span>
              <select
                id="salaryId"
                className={selectClass}
                value={salaryId}
                onChange={(event) => setSalaryId(event.target.value)}
                required
              >
                <option value="">Selecciona un tipo salarial</option>
                {salaries.length > 0 ? (
                  salaries.map((salary) => (
                    <option key={salary.id_salario} value={salary.id_salario}>
                      {salary.tipo}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay tipos salariales disponibles
                  </option>
                )}
              </select>
              {!salaryId && salaries.length === 0 && (
                <p className={errorClass}>Añade tipos salariales para poder asignar la guardia.</p>
              )}
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Tipo de día</span>
              <select
                id="type"
                className={selectClass}
                value={type}
                onChange={(event) => setType(event.target.value)}
                required
              >
                <option value="Laborable">Laborable</option>
                <option value="Festivo">Festivo</option>
                <option value="Prefestivo">Prefestivo</option>
                <option value="Festivo víspera">Festivo víspera</option>
              </select>
              <p className={helperClass}>Este dato se usará para los cálculos económicos y de presencia.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className={deleteButtonClass}
              disabled={loading || deleteLoading}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar guardia'}
            </button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                className={cancelButtonClass}
                disabled={loading || deleteLoading}
              >
                Cancelar
              </button>
              <button type="submit" className={submitButtonClass} disabled={loading || deleteLoading}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGuardModal;
