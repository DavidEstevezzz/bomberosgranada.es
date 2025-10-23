// MarkResolvingModal.jsx
import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

const MarkResolvingModal = ({ isOpen, onClose, resolvingText, setResolvingText, onSubmit }) => {
  const { darkMode } = useDarkMode();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl ${
          darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Marcar como "Resolviendo"</h2>
        <p className="text-sm mb-6 opacity-75">
          Opcionalmente, describe las acciones que se están tomando para resolver esta incidencia.
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={resolvingText}
            onChange={(e) => setResolvingText(e.target.value)}
            className={`w-full rounded-xl border p-4 ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-100' 
                : 'bg-white border-slate-300 text-slate-900'
            }`}
            rows="6"
            placeholder="Describe cómo se está resolviendo la incidencia... (opcional)"
          />
          
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-xl font-medium ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl font-medium bg-amber-600 hover:bg-amber-500 text-white"
            >
              Marcar como Resolviendo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkResolvingModal;