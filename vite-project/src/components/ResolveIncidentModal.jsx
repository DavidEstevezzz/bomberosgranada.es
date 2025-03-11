import React from 'react';

const ResolveIncidentModal = ({ isOpen, onClose, resolutionText, setResolutionText, onSubmit }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Resolver Incidencia</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-2">
            Resolución:
          </label>
          <textarea
            id="resolution"
            className="w-full border border-gray-300 rounded p-2 mb-4"
            rows="4"
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="Escribe aquí la resolución..."
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveIncidentModal;
