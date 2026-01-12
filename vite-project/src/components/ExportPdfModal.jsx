import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowUp, faArrowDown, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const ExportPdfModal = ({ isOpen, onClose, onExport }) => {
  const { darkMode } = useDarkMode();

  if (!isOpen) return null;

  const handleExport = (order) => {
    onExport(order);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl transform transition-all duration-300 ${
          darkMode
            ? 'border-slate-700 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b ${
            darkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                darkMode ? 'bg-primary-900/50' : 'bg-primary-50'
              }`}
            >
              <FontAwesomeIcon
                icon={faFilePdf}
                className={`w-5 h-5 ${
                  darkMode ? 'text-primary-400' : 'text-primary-600'
                }`}
              />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Exportar a PDF
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Selecciona el orden de las incidencias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Opción: Más recientes primero */}
          <button
            onClick={() => handleExport('desc')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
              darkMode
                ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-primary-500'
                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-500 hover:shadow-md'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-green-900/50' : 'bg-green-100'
              }`}
            >
              <FontAwesomeIcon
                icon={faArrowDown}
                className={`w-5 h-5 ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                }`}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`font-semibold ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Más recientes primero
              </p>
              <p
                className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ordenar de más reciente a más antigua
              </p>
            </div>
          </button>

          {/* Opción: Más antiguas primero */}
          <button
            onClick={() => handleExport('asc')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
              darkMode
                ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-primary-500'
                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-primary-500 hover:shadow-md'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-amber-900/50' : 'bg-amber-100'
              }`}
            >
              <FontAwesomeIcon
                icon={faArrowUp}
                className={`w-5 h-5 ${
                  darkMode ? 'text-amber-400' : 'text-amber-600'
                }`}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`font-semibold ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Más antiguas primero
              </p>
              <p
                className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ordenar de más antigua a más reciente
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t ${
            darkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPdfModal;