import React, { useEffect, useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';

const TURN_OPTIONS = [
  'Mañana',
  'Tarde',
  'Noche',
  'Día Completo',
  'Mañana y tarde',
  'Tarde y noche',
];

const ManageTransfersModal = ({ isOpen, onClose, brigadeId, selectedDate, onTransferUpdated }) => {
  const { darkMode } = useDarkMode();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [editForm, setEditForm] = useState({ turno_seleccionado: '', horas_traslado: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isOpen && brigadeId && selectedDate) {
      loadTransfers();
    }
  }, [isOpen, brigadeId, selectedDate]);

  const loadTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AssignmentsApiService.getTransfersByBrigadeAndDate(brigadeId, selectedDate);
      setTransfers(response.data.transfers || []);
    } catch (err) {
      console.error('Error loading transfers:', err);
      setError('No se pudieron cargar los traslados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer.id_transfer);
    setEditForm({
      turno_seleccionado: transfer.turno_seleccionado,
      horas_traslado: transfer.horas_traslado.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingTransfer(null);
    setEditForm({ turno_seleccionado: '', horas_traslado: '' });
  };

  const handleSaveEdit = async (idTransfer) => {
    if (!editForm.horas_traslado || parseFloat(editForm.horas_traslado) <= 0) {
      alert('Las horas de traslado deben ser mayor a 0.');
      return;
    }

    setActionLoading(idTransfer);
    try {
      await AssignmentsApiService.updateTransfer(idTransfer, {
        turno_seleccionado: editForm.turno_seleccionado,
        horas_traslado: parseFloat(editForm.horas_traslado),
      });
      await loadTransfers();
      setEditingTransfer(null);
      if (onTransferUpdated) onTransferUpdated();
    } catch (err) {
      console.error('Error updating transfer:', err);
      alert('Error al actualizar el traslado.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (transfer) => {
    const confirmMsg = `¿Eliminar traslado de ${transfer.firefighter?.nombre} ${transfer.firefighter?.apellido}?\n\nSe revertirán ${transfer.horas_traslado} horas y se eliminarán las asignaciones asociadas.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(transfer.id_transfer);
    try {
      await AssignmentsApiService.deleteTransfer(transfer.id_transfer);
      await loadTransfers();
      if (onTransferUpdated) onTransferUpdated();
    } catch (err) {
      console.error('Error deleting transfer:', err);
      alert('Error al eliminar el traslado.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = () => {
    setEditingTransfer(null);
    setEditForm({ turno_seleccionado: '', horas_traslado: '' });
    onClose();
  };

  if (!isOpen) return null;

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-amber-900/90 via-amber-700/90 to-amber-600/80'
      : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700'
  }`;
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-800 text-slate-100'
      : 'border-slate-300 bg-white text-slate-900'
  }`;
  const buttonClass = (variant) => {
    const base = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2';
    if (variant === 'edit') {
      return `${base} ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
    }
    if (variant === 'delete') {
      return `${base} ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`;
    }
    if (variant === 'save') {
      return `${base} ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`;
    }
    if (variant === 'cancel') {
      return `${base} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-400 hover:bg-slate-500 text-white'}`;
    }
    return base;
  };

  return (
    <div className={overlayClass} onMouseDown={handleClose}>
      <div className={modalClass} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Gestión</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar Traslados</h2>
            <p className="mt-3 text-sm text-white/90">
              Visualiza, modifica o elimina los traslados registrados para el día {selectedDate}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {error && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <span className="ml-3">Cargando traslados...</span>
            </div>
          ) : transfers.length === 0 ? (
            <div
              className={`rounded-lg border px-4 py-8 text-center ${
                darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-sm">No hay traslados registrados para esta fecha y brigada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id_transfer}
                  className={`rounded-xl border p-4 ${
                    darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {transfer.firefighter?.nombre} {transfer.firefighter?.apellido}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {transfer.firefighter?.puesto}
                      </p>
                    </div>
                    {editingTransfer !== transfer.id_transfer && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transfer)}
                          className={buttonClass('edit')}
                          disabled={actionLoading !== null}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(transfer)}
                          className={buttonClass('delete')}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === transfer.id_transfer ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Origen
                      </p>
                      <p className="text-sm">{transfer.brigade_origin?.nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Destino
                      </p>
                      <p className="text-sm">{transfer.brigade_destination?.nombre || 'N/A'}</p>
                    </div>
                  </div>

                  {editingTransfer === transfer.id_transfer ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium">Turno</label>
                          <select
                            className={inputClass}
                            value={editForm.turno_seleccionado}
                            onChange={(e) => setEditForm({ ...editForm, turno_seleccionado: e.target.value })}
                          >
                            {TURN_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Horas</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.01"
                            className={inputClass}
                            value={editForm.horas_traslado}
                            onChange={(e) => setEditForm({ ...editForm, horas_traslado: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className={buttonClass('cancel')}
                          disabled={actionLoading !== null}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(transfer.id_transfer)}
                          className={buttonClass('save')}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === transfer.id_transfer ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Turno
                        </p>
                        <p className="text-sm font-medium">{transfer.turno_seleccionado}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Horas
                        </p>
                        <p className="text-sm font-medium">{transfer.horas_traslado} h</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex justify-end border-t px-6 py-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
        >
          <button
            onClick={handleClose}
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
              darkMode
                ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageTransfersModal;
