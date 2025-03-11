// src/components/EditInterventionModal.jsx
import React, { useState, useEffect } from 'react';
import InterventionApiService from '../services/InterventionApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const EditInterventionModal = ({ show, onClose, onEdited, intervention }) => {
  const [formData, setFormData] = useState({ ...intervention });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (show) {
      const fetchUsers = async () => {
        try {
          const response = await UsuariosApiService.getUsuarios();
          setUsers(response.data);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [show]);

  useEffect(() => {
    setFormData({ ...intervention });
  }, [intervention]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await InterventionApiService.updateIntervention(formData.parte, formData);
      onEdited();
      onClose();
    } catch (error) {
      console.error('Error actualizando intervención:', error);
      alert('Error al actualizar la intervención');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
      <div className="relative bg-gray-800 p-6 rounded-lg z-10 max-w-md w-full mx-4 my-8">
        <h2 className="text-2xl font-bold text-white mb-4">Editar Intervención</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white">Parte (no editable):</label>
            <input
              type="text"
              name="parte"
              value={formData.parte}
              readOnly
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <input
            type="text"
            name="tipo"
            placeholder="Tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <select
            name="mando"
            value={formData.mando}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            <option value="">Seleccione Mando</option>
            {users.map((user) => (
              <option key={user.id_empleado} value={user.id_empleado}>
                {user.nombre} {user.apellido}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Guardar
            </button>
            <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInterventionModal;
