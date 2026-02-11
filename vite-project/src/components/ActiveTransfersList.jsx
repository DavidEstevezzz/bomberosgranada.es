// vite-project/src/components/ActiveTransfersList.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faArrowRight, faUndo, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import dayjs from 'dayjs';

const ActiveTransfersList = ({ brigadeId, selectedDate, onTransferUndone }) => {
  const { darkMode } = useDarkMode();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (brigadeId && selectedDate) {
      loadTransfers();
    }
  }, [brigadeId, selectedDate]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      // Cambiado: usar getTransfersByBrigadeAndDate en lugar de getActiveTransfers
      const response = await AssignmentsApiService.getTransfersByBrigadeAndDate(brigadeId, selectedDate);
      setTransfers(response.data.transfers || []);
    } catch (error) {
      console.error('Error cargando traslados activos:', error);
      setMessage({ type: 'error', text: 'Error al cargar traslados activos' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransfer = async (transfer) => {
    if (deletingId) return;

    const confirmMsg = `¿Eliminar traslado de ${transfer.firefighter?.nombre} ${transfer.firefighter?.apellido}?\n` +
      `Se revertirán ${transfer.horas_traslado || 0} horas.`;
    
    if (!window.confirm(confirmMsg)) return;

    // Cambiado: usar id_transfer en lugar de id_asignacion
    setDeletingId(transfer.id_transfer);
    setMessage(null);

    try {
      // Cambiado: usar deleteTransfer en lugar de undoTransfer
      const response = await AssignmentsApiService.deleteTransfer(transfer.id_transfer);
      setMessage({ 
        type: 'success', 
        text: `Traslado eliminado: ${response.data.horas_revertidas}h revertidas` 
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
      console.error('Error eliminando traslado:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar el traslado';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeletingId(null);
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
    <div className={`rounded-2xl border p-6 ${
      darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <FontAwesomeIcon 
          icon={faExchangeAlt} 
          className={darkMode ? 'text-amber-400' : 'text-amber-600'} 
        />
        <h3 className={`font-semibold ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Traslados Activos
        </h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
          darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
        }`}>
          {transfers.length}
        </span>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
          message.type === 'success'
            ? darkMode
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-emerald-100 text-emerald-700'
            : darkMode
              ? 'bg-red-500/20 text-red-300'
              : 'bg-red-100 text-red-700'
        }`}>
          <FontAwesomeIcon 
            icon={message.type === 'success' ? faCheckCircle : faExclamationTriangle} 
          />
          {message.text}
        </div>
      )}

      {/* Lista de traslados */}
      <div className="space-y-3">
        {transfers.map((transfer) => (
          <div
            key={transfer.id_transfer}
            className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors ${
              darkMode 
                ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800/70' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
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
                  {/* Cambiado: usar turno_seleccionado en lugar de turno */}
                  <span className="font-medium">Turno:</span> {transfer.turno_seleccionado}
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
              {(() => {
                const origin = transfer.brigade_origin || transfer.brigadeOrigin;
                const destination = transfer.brigade_destination || transfer.brigadeDestination;
                
                // Si las brigadas tienen el mismo nombre, mostrar el parque
                const sameBrigade = origin?.nombre === destination?.nombre;
                
                const getParqueName = (parqueId) => {
                  if (parqueId === 1) return 'Parque Norte';
                  if (parqueId === 2) return 'Parque Sur';
                  return `Parque ${parqueId}`;
                };
                
                const originLabel = sameBrigade 
                  ? getParqueName(origin?.id_parque) 
                  : origin?.nombre;
                const destinationLabel = sameBrigade 
                  ? getParqueName(destination?.id_parque) 
                  : destination?.nombre;
                
                return (
                  <>
                    <span className="font-medium">{originLabel}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    <span className="font-medium">{destinationLabel}</span>
                  </>
                );
              })()}
            </div>

            {/* Botón eliminar */}
            <button
              onClick={() => handleDeleteTransfer(transfer)}
              disabled={deletingId !== null}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                deletingId === transfer.id_transfer
                  ? darkMode
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : darkMode
                    ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {deletingId === transfer.id_transfer ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Eliminando...
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