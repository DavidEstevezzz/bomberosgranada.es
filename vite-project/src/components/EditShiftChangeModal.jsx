import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditShiftChangeModal = ({ isOpen, onClose, shiftChangeRequest, onUpdate }) => {
  const { darkMode } = useDarkMode();
  const [estado, setEstado] = useState(shiftChangeRequest.estado);

  useEffect(() => {
    setEstado(shiftChangeRequest.estado);
  }, [shiftChangeRequest]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...shiftChangeRequest, estado });
    onClose();
  };

  const panelClass = `w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/80 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'
  }`;
  const headerClass = `px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900 via-primary-700 to-primary-500'
      : 'bg-gradient-to-r from-primary-200 via-primary-300 to-primary-400 text-slate-900'
  }`;
  const labelClass = 'text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const selectClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900'
  }`;
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-primary-400 hover:text-primary-200 focus:ring-offset-slate-950'
      : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 focus:ring-offset-white'
  }`;
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${
    darkMode ? 'bg-primary-500 hover:bg-primary-400 focus:ring-offset-slate-950' : 'bg-primary-500 hover:bg-primary-600 focus:ring-offset-white'
  }`;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
        <Dialog.Panel className={panelClass}>
          <div className={headerClass}>
            <Dialog.Title className="text-xl font-semibold">
              Actualizar cambio de guardia
            </Dialog.Title>
            <p className="mt-2 text-xs text-white/80 dark:text-white/70">
              Selecciona el estado apropiado para notificar al personal implicado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-3">
              <label htmlFor="estado" className={labelClass}>
                Estado
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={selectClass}
              >
                <option value="rechazado">Rechazado</option>
                <option value="aceptado_por_empleados">Aceptado por empleados</option>
                <option value="en_tramite">En trámite</option>
                <option value="aceptado">Aceptado</option>
              </select>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" className={cancelButtonClass} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={submitButtonClass}>
                Guardar cambios
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditShiftChangeModal;
