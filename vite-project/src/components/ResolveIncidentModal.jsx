import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const ResolveIncidentModal = ({ isOpen, onClose, resolutionText, setResolutionText, onSubmit }) => {
  const { darkMode } = useDarkMode();
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Resolver Incidencia
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="resolution"
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Resolución:
            </label>
            <textarea
              id="resolution"
              className={`w-full border rounded-lg p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              rows="4"
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Escribe aquí la resolución..."
              required
            />
          </div>
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode
                  ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900'
                  : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800'
                  : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'
              }`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveIncidentModal;
