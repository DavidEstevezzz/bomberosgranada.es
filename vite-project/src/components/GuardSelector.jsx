import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import RequestApiService from '../services/RequestApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

dayjs.locale('es');

/**
 * GuardSelector
 * 
 * Componente genérico para seleccionar guardias al crear solicitudes.
 * Soporta selección única (asuntos propios, módulo, etc.) o múltiple (vacaciones).
 * 
 * Props:
 * - idEmpleado: ID del bombero
 * - darkMode: boolean
 * - onSelectionChange: callback con array de fechas seleccionadas (siempre array, aunque sea 1)
 * - tipoSolicitud: string - tipo de solicitud para filtrar requests existentes
 * - multiple: boolean - si permite selección múltiple (default: false)
 * - infoText: string - texto informativo que se muestra abajo
 * - counterLabel: string - etiqueta para el contador (ej: "Jornadas" o "Días")
 * - daysPerGuard: number - multiplicador para el contador (ej: 6 para vacaciones, null para AP)
 * - availableBalance: number - saldo disponible del usuario para este tipo
 * - balanceLabel: string - etiqueta del saldo (ej: "Vacaciones disponibles" o "AP disponibles")
 */
const GuardSelector = ({
  idEmpleado,
  darkMode,
  onSelectionChange,
  tipoSolicitud = 'asuntos propios',
  multiple = false,
  infoText = 'Selecciona la guardia para tu solicitud.',
  counterLabel = 'Seleccionada',
  daysPerGuard = null,
  availableBalance = 0,
  balanceLabel = 'Disponibles',
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [guards, setGuards] = useState([]);
  const [selectedGuards, setSelectedGuards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar guardias cuando cambia el mes o el empleado
  useEffect(() => {
    if (idEmpleado && currentMonth) {
      loadGuards();
    }
  }, [currentMonth, idEmpleado]);

  // Limpiar selección cuando cambia el empleado
  useEffect(() => {
    setSelectedGuards([]);
  }, [idEmpleado]);

  // Notificar al padre cuando cambia la selección
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedGuards);
    }
  }, [selectedGuards]);

  const loadGuards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await RequestApiService.getMyGuardsForRequest(currentMonth, idEmpleado, tipoSolicitud);
      setGuards(response.data.guards || []);
    } catch (err) {
      console.error('Error cargando guardias:', err);
      setError('Error al cargar las guardias del mes.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    const newMonth = dayjs(currentMonth + '-01').add(direction, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  const toggleGuard = (date) => {
    setSelectedGuards(prev => {
      const isSelected = prev.includes(date);

      if (isSelected) {
        // Deseleccionar
        return prev.filter(d => d !== date);
      } else {
        if (multiple) {
          // Selección múltiple
          setError(null);
          return [...prev, date].sort();
        } else {
          // Selección única: reemplazar la selección anterior
          setError(null);
          return [date];
        }
      }
    });
  };

  const monthLabel = dayjs(currentMonth + '-01').format('MMMM YYYY');

  // Estilos base
  const cardBg = darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = darkMode ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-slate-500';
  const textMuted = darkMode ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="space-y-5">
      {/* Header: Selector de mes */}
      <div className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${cardBg}`}>
        <button
          type="button"
          onClick={() => handleMonthChange(-1)}
          className={`rounded-xl p-2.5 transition-colors hover:bg-primary-500/10 ${textSecondary}`}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="text-center">
          <p className={`text-lg font-bold capitalize ${textPrimary}`}>
            {monthLabel}
          </p>
          <p className={`text-xs ${textMuted}`}>
            Selecciona {multiple ? 'las guardias' : 'la guardia'} para tu solicitud
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleMonthChange(1)}
          className={`rounded-xl p-2.5 transition-colors hover:bg-primary-500/10 ${textSecondary}`}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Resumen de selección */}
      <div className={`grid gap-3 ${daysPerGuard ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className={`rounded-2xl border px-4 py-3 text-center ${cardBg}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${textMuted}`}>{counterLabel}</p>
          <p className={`mt-1 text-xl font-bold ${selectedGuards.length > 0 ? 'text-primary-500' : textPrimary}`}>
            {selectedGuards.length}
          </p>
        </div>

        {daysPerGuard && (
          <div className={`rounded-2xl border px-4 py-3 text-center ${cardBg}`}>
            <p className={`text-xs font-medium uppercase tracking-wide ${textMuted}`}>Días usados</p>
            <p className={`mt-1 text-xl font-bold ${selectedGuards.length * daysPerGuard > 0 ? 'text-amber-500' : textPrimary}`}>
              {selectedGuards.length * daysPerGuard}
            </p>
          </div>
        )}

        <div className={`rounded-2xl border px-4 py-3 text-center ${cardBg}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${textMuted}`}>{balanceLabel}</p>
          <p className={`mt-1 text-xl font-bold ${availableBalance <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {availableBalance}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`flex items-center justify-center py-12 ${textSecondary}`}>
          <FontAwesomeIcon icon={faSpinner} spin className="mr-3 text-lg" />
          <span className="text-sm">Cargando guardias...</span>
        </div>
      )}

      {/* Sin guardias */}
      {!loading && guards.length === 0 && (
        <div className={`rounded-2xl border px-5 py-8 text-center ${cardBg}`}>
          <FontAwesomeIcon icon={faCalendarCheck} className={`text-3xl ${textMuted}`} />
          <p className={`mt-3 text-sm ${textSecondary}`}>
            No se encontraron guardias para este mes.
          </p>
        </div>
      )}

      {/* Guardias */}
      {!loading && guards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-primary-500 text-sm" />
            <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${textSecondary}`}>
              Tus guardias este mes
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {guards.map((guard) => (
              <GuardCard
                key={guard.date}
                guard={guard}
                isSelected={selectedGuards.includes(guard.date)}
                onToggle={toggleGuard}
                darkMode={darkMode}
                tipoSolicitud={tipoSolicitud}
                multiple={multiple}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className={`rounded-2xl border px-4 py-3 text-xs ${
        darkMode ? 'border-blue-500/20 bg-blue-500/5 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'
      }`}>
        <p className="font-medium">{infoText}</p>
      </div>
    </div>
  );
};


/**
 * GuardCard - Tarjeta individual de guardia seleccionable
 */
const GuardCard = ({ guard, isSelected, onToggle, darkMode, tipoSolicitud, multiple }) => {
  const dayFormatted = dayjs(guard.date).format('DD');
  const dayName = dayjs(guard.date).format('ddd').toUpperCase();
  const monthName = dayjs(guard.date).format('MMM');

  const hasExistingRequest = guard.has_existing_request;

  let cardClasses = '';
  let borderClasses = '';

  if (hasExistingRequest) {
    cardClasses = darkMode
      ? 'bg-slate-800/40 border-slate-700/50 opacity-60'
      : 'bg-slate-50 border-slate-200 opacity-60';
    borderClasses = 'cursor-not-allowed';
  } else if (isSelected) {
    cardClasses = darkMode
      ? 'bg-primary-500/15 border-primary-500/60 ring-1 ring-primary-500/30'
      : 'bg-primary-50 border-primary-400 ring-1 ring-primary-200';
    borderClasses = 'cursor-pointer';
  } else {
    cardClasses = darkMode
      ? 'bg-slate-800/60 border-slate-700 hover:border-primary-500/50 hover:bg-slate-800/80'
      : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-primary-50/30';
    borderClasses = 'cursor-pointer';
  }

  const handleClick = () => {
    if (hasExistingRequest) return;
    onToggle(guard.date);
  };

  // Determinar badge de solicitud existente
  const getExistingBadge = () => {
    if (!hasExistingRequest) return null;
    
    const statusLabel = guard.existing_request_status === 'Confirmada' ? 'Confirmada' : 'Pendiente';
    const statusColors = guard.existing_request_status === 'Confirmada'
      ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
      : (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700');

    return (
      <span className={`absolute -top-1.5 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors}`}>
        {statusLabel}
      </span>
    );
  };

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-2xl border px-4 py-3.5 transition-all duration-200 ${cardClasses} ${borderClasses}`}
    >
      {getExistingBadge()}

      <div className="flex items-center gap-3">
        {/* Fecha */}
        <div className="text-center">
          <p className={`text-2xl font-black leading-none ${
            isSelected ? 'text-primary-500' : (darkMode ? 'text-slate-100' : 'text-slate-800')
          }`}>
            {dayFormatted}
          </p>
          <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {dayName}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${
            darkMode ? 'text-slate-200' : 'text-slate-700'
          }`}>
            Brigada {guard.brigade_name}
          </p>
          <p className={`text-[11px] ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {monthName} {dayjs(guard.date).format('YYYY')}
          </p>
        </div>

        {/* Checkbox/Radio visual */}
        {!hasExistingRequest && (
          <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center ${multiple ? 'rounded-lg' : 'rounded-full'} border-2 transition-all duration-200 ${
            isSelected
              ? 'border-primary-500 bg-primary-500'
              : (darkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white')
          }`}>
            {isSelected && (
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardSelector;