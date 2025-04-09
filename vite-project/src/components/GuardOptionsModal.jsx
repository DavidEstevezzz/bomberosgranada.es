import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardOptionsModal = ({ isOpen, options, onSelectOption, onClose }) => {
  const { darkMode } = useDarkMode();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Opciones de guardia</h2>
        
        <div className="space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              className={`p-3 w-full rounded-md transition-colors flex items-center justify-between ${
                option.type === 'add'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              onClick={() => onSelectOption(option)}
            >
              <span>{option.label}</span>
              <span className="ml-2">
                {option.type === 'add' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
        
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

export default GuardOptionsModal;