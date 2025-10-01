import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditGuardEspecialModal = ({ isOpen, onClose, guard, setGuards, availableBrigades }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (guard) {
      setBrigadeId(guard.id_brigada);
      setType(guard.especiales || '');
    }
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [guard, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!brigadeId || !type) {
      setErrorMessage('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    // ✅ CAMBIO PRINCIPAL: Enviar a 'especiales' en lugar de 'tipo'
    const updatedGuard = {
      ...guard,
      id_brigada: brigadeId,
      especiales: type  // 🎯 CORREGIDO: usar 'especiales' en lugar de 'tipo'
    };

    try {
      // Determinar qué ID usar para la actualización
      const guardId = guard.id_guard || guard.id;

      if (!guardId) {
        throw new Error('No se pudo determinar el ID de la guardia');
      }

      const response = await GuardsApiService.updateGuard(guardId, updatedGuard);

      // Actualizar el estado de guardias en la página padre
      setGuards(prevGuards =>
        prevGuards.map(g =>
          (g.id_guard === guardId || g.id === guardId) ? response.data : g
        )
      );

      onClose();
    } catch (error) {
      console.error('Error al actualizar la guardia:', error);
      setErrorMessage(error?.response?.data?.message || error.message || 'Error al actualizar la guardia.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta guardia?')) {
      return;
    }

    // Determinar qué ID usar para la eliminación
    const guardId = guard.id_guard || guard.id;

    if (!guardId) {
      console.error('ID de guardia no disponible. Objeto guard:', guard);
      setErrorMessage('No se puede eliminar la guardia: ID no disponible');
      return;
    }

    setDeleteLoading(true);

    try {
      await GuardsApiService.deleteGuard(guardId);

      // Eliminar la guardia del estado en la página padre
      setGuards(prevGuards =>
        prevGuards.filter(g => g.id_guard !== guardId && g.id !== guardId)
      );

      onClose();
    } catch (error) {
      console.error('Error al eliminar la guardia:', error);
      setErrorMessage(error?.response?.data?.message || error.message || 'Error al eliminar la guardia.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!guard || !isOpen) return null;

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-colors duración-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const selectClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900'
  }`;
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
  const deleteButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-red-500 hover:bg-red-400 focus:ring-red-400 focus:ring-offset-slate-900'
      : 'bg-red-500 hover:bg-red-400 focus:ring-red-300 focus:ring-offset-white'
  }`;

  return (
    <div className={overlayClass} onMouseDown={() => !(loading || deleteLoading) && onClose()}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Guardias especiales</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar guardia especial</h2>
            <p className="mt-3 text-sm text-white/90">
              Actualiza la brigada y el tipo asignado para mantener la cobertura operativa al día.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
          <div className="space-y-6">
            <div className="space-y-2">
              <span className={labelClass}>Brigada asignada</span>
              <select
                id="brigadeId"
                className={selectClass}
                value={brigadeId}
                onChange={(e) => setBrigadeId(e.target.value)}
                required
              >
                <option value="">Selecciona una brigada</option>
                {availableBrigades.map((brigade) => (
                  <option key={brigade.id_brigada} value={brigade.id_brigada}>
                    {brigade.nombre}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Escoge la brigada que asumirá la cobertura especial.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Tipo de guardia especial</span>
              <select
                id="type"
                className={selectClass}
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">Selecciona tipo</option>
                <option value="Guardia localizada">Guardia localizada</option>
                <option value="Prácticas">Prácticas</option>
              </select>
              <p className={helperClass}>Define la modalidad de la guardia especial asignada.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className={deleteButtonClass}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar guardia'}
            </button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className={cancelButtonClass}
                disabled={loading || deleteLoading}
              >
                Cancelar
              </button>
              <button type="submit" className={submitButtonClass} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGuardEspecialModal;
