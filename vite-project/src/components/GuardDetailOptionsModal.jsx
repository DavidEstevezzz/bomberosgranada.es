import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardDetailOptionsModal = ({ isOpen, options, onSelectOption, onClose }) => {
  const { darkMode } = useDarkMode();
  
  if (!isOpen) return null;

  // Clases de estilo moderno
  const overlayClass = 'fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 pt-8 pb-8 backdrop-blur overflow-y-auto';
  
  const modalClass = `relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 max-h-[calc(100vh-4rem)] ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white flex-shrink-0 ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;

  const contentClass = 'flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-8';
  
  const emptyStateClass = `rounded-2xl border px-6 py-8 text-center ${
    darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
  }`;

  const buttonBaseClass = `group relative flex w-full items-center justify-between rounded-2xl border px-6 py-4 text-left font-medium shadow-sm transition-all duration-200 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 hover:border-primary-500 hover:bg-primary-500/10 hover:shadow-md'
      : 'border-slate-200 bg-white text-slate-900 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md'
  }`;

  const cancelButtonClass = `inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
      : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
  }`;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div className={modalClass} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Selección de guardia
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Detalles de guardia
            </h2>
            <p className="mt-3 text-sm text-white/90">
              Selecciona la brigada para ver sus detalles y gestionar el cuadrante de guardia.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={contentClass}>
          {options.length === 0 ? (
            <div className={emptyStateClass}>
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Sin guardias disponibles
              </h3>
              <p className="mt-2 text-sm">
                No hay guardias programadas para esta fecha. Selecciona otra fecha en el calendario.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${darkMode ? 'text-primary-200' : 'text-primary-500'}`}>
                Brigadas disponibles ({options.length})
              </p>
              
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onSelectOption(option)}
                  className={buttonBaseClass}
                  style={{
                    backgroundColor: darkMode 
                      ? `${option.brigadeColor}15` 
                      : `${option.brigadeColor}08`,
                    borderColor: darkMode
                      ? `${option.brigadeColor}40`
                      : `${option.brigadeColor}30`
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold">
                      {option.brigadeName}
                    </span>
                    {option.tipo && (
                      <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Tipo: {option.tipo}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Badge de color de brigada */}
                    <div
                      className="h-8 w-8 rounded-full border-2 shadow-sm"
                      style={{
                        backgroundColor: option.brigadeColor,
                        borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                      }}
                      aria-label={`Color de ${option.brigadeName}`}
                    />
                    
                    {/* Icono de flecha */}
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className={`h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t px-6 py-4 sm:px-8" 
          style={{ 
            borderColor: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' 
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className={cancelButtonClass}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardDetailOptionsModal;