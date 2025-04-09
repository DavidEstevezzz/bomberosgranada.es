import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardDetailOptionsModal = ({ isOpen, options, onSelectOption, onClose }) => {
  const { darkMode } = useDarkMode();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Detalles de guardia</h2>
        
        {options.length === 0 ? (
          <p className="text-center mb-4">No hay guardias disponibles para esta fecha.</p>
        ) : (
          <div className="space-y-2">
            {options.map((option, index) => (
              <button
                key={index}
                className={`p-3 w-full rounded-md transition-colors flex items-center justify-between ${option.brigadeColor} ${option.textColor}`}
                onClick={() => onSelectOption(option)}
              >
                <span>Ver detalle: {option.brigadeName}</span>
                <span className="ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className={`w-full p-3 rounded-md transition-colors ${
              darkMode 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardDetailOptionsModal;