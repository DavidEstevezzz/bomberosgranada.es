// vite-project/src/components/ActiveTransfersList.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faUndo, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import dayjs from 'dayjs';

const ActiveTransfersList = ({ brigadeId, selectedDate, onTransferUndone }) => {
  const { darkMode } = useDarkMode();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoingId, setUndoingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (brigadeId && selectedDate) {
      loadTransfers();
    }
  }, [brigadeId, selectedDate]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const response = await AssignmentsApiService.getActiveTransfers(brigadeId, selectedDate);
      setTransfers(response.data.transfers || []);
    } catch (error) {
      console.error('Error cargando traslados activos:', error);
      setMessage({ type: 'error', text: 'Error al cargar traslados activos' });
    } finally {
      setLoading(false);
    }
  };

  const handleUndoTransfer = async (transfer) => {
    if (undoingId) return;

    const confirmMsg = `¿Deshacer traslado de ${transfer.firefighter?.nombre} ${transfer.firefighter?.apellido}?\n` +
      `Se revertirán ${transfer.horas_traslado || 0} horas.`;
    
    if (!window.confirm(confirmMsg)) return;

    setUndoingId(transfer.id_asignacion);
    setMessage(null);

    try {
      const response = await AssignmentsApiService.undoTransfer(transfer.id_asignacion);
      setMessage({ 
        type: 'success', 
        text: `Traslado deshecho: ${response.data.horas_revertidas}h revertidas` 
      });
      
      // Recargar lista
      await loadTransfers();
      
      // Notificar al componente padre
      if (onTransferUndone) {
        onTransferUndone();
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deshaciendo traslado:', error);
      const errorMsg = error.response?.data?.error || 'Error al deshacer el traslado';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUndoingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border p-6 ${
        darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center justify-center gap-2 text-sm">
          <FontAwesomeIcon icon={faSpinner} spin className="text-primary-500" />
          <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
            Cargando traslados...
          </span>
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return null; // No mostrar nada si no hay traslados
  }

  return (
    <div className={`rounded-2xl border ${
      darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 border-b px-6 py-4 ${
        darkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <FontAwesomeIcon 
          icon={faExchangeAlt} 
          className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
        />
        <h3 className={`text-lg font-semibold ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Traslados Activos del Día
        </h3>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
          darkMode 
            ? 'bg-purple-500/20 text-purple-300' 
            : 'bg-purple-100 text-purple-700'
        }`}>
          {transfers.length}
        </span>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`mx-6 mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
          message.type === 'success'
            ? darkMode
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : darkMode
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <FontAwesomeIcon 
            icon={message.type === 'success' ? faCheckCircle : faExclamationTriangle} 
            className="mr-2"
          />
          {message.text}
        </div>
      )}

      {/* Lista de traslados */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {transfers.map((transfer) => (
          <div
            key={transfer.id_asignacion}
            className={`flex items-center gap-4 px-6 py-4 transition-colors ${
              darkMode 
                ? 'hover:bg-slate-800/50' 
                : 'hover:bg-slate-50'
            }`}
          >
            {/* Información del bombero */}
            <div className="flex-1">
              <div className={`font-semibold ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {transfer.firefighter?.nombre} {transfer.firefighter?.apellido}
              </div>
              <div className={`mt-1 flex flex-wrap items-center gap-3 text-sm ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Turno:</span> {transfer.turno}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Horas:</span> {transfer.horas_traslado || 0}h
                </span>
              </div>
            </div>

            {/* Ruta del traslado */}
            <div className={`hidden md:flex items-center gap-2 text-sm ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span className="font-medium">{transfer.brigadeOrigin?.nombre}</span>
              <FontAwesomeIcon icon={faExchangeAlt} className="text-xs" />
              <span className="font-medium">{transfer.brigadeDestination?.nombre}</span>
            </div>

            {/* Botón deshacer */}
            <button
              onClick={() => handleUndoTransfer(transfer)}
              disabled={undoingId !== null}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                undoingId === transfer.id_asignacion
                  ? darkMode
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : darkMode
                    ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {undoingId === transfer.id_asignacion ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Deshaciendo...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUndo} />
                  Deshacer
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveTransfersList;