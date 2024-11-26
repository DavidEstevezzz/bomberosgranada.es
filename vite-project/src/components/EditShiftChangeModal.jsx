import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

const EditShiftChangeModal = ({ isOpen, onClose, shiftChangeRequest, onUpdate }) => {
  const [estado, setEstado] = useState(shiftChangeRequest.estado);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...shiftChangeRequest, estado });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg max-w-md mx-auto p-6">
          <Dialog.Title className="text-lg font-bold mb-4">Editar Estado del Cambio de Guardia</Dialog.Title>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="estado">
                Estado
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="rechazado">Rechazado</option>
                <option value="aceptado_por_empleados">Aceptado por Empleados</option>
                <option value="en_tramite">En Trámite</option>
                <option value="aceptado">Aceptado</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditShiftChangeModal;
