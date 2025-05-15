import React, { useState, useEffect } from 'react';
import GuardsApiService from '../services/GuardsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditGuardEspecialModal = ({ isOpen, onClose, guard, setGuards, availableBrigades }) => {
  const [brigadeId, setBrigadeId] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (guard) {
      console.log('Datos de guardia recibidos:', guard);
      setBrigadeId(guard.id_brigada);
      setType(guard.tipo);
    }
  }, [guard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!brigadeId || !type) {
      alert('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    const updatedGuard = {
      ...guard,
      id_brigada: brigadeId,
      tipo: type
    };

    try {
      // Determinar qué ID usar para la actualización
      const guardId = guard.id_guard || guard.id;
      
      if (!guardId) {
        throw new Error('No se pudo determinar el ID de la guardia');
      }
      
      console.log('Actualizando guardia con ID:', guardId);
      const response = await GuardsApiService.updateGuard(guardId, updatedGuard);
      
      // Actualizar el estado de guardias en la página padre
      setGuards(prevGuards => 
        prevGuards.map(g => 
          (g.id_guard === guardId || g.id === guardId) ? response.data : g
        )
      );
      
      onClose();
    } catch (error) {
      console.error('Error al actualizar la guardia:', error);
      alert(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta guardia?')) {
      return;
    }
    
    // Determinar qué ID usar para la eliminación
    const guardId = guard.id_guard || guard.id;
    
    if (!guardId) {
      console.error('ID de guardia no disponible. Objeto guard:', guard);
      alert('No se puede eliminar la guardia: ID no disponible');
      return;
    }
    
    console.log('Eliminando guardia con ID:', guardId);
    setDeleteLoading(true);

    try {
      await GuardsApiService.deleteGuard(guardId);
      
      // Eliminar la guardia del estado en la página padre
      setGuards(prevGuards => 
        prevGuards.filter(g => g.id_guard !== guardId && g.id !== guardId)
      );
      
      onClose();
    } catch (error) {
      console.error('Error al eliminar la guardia:', error);
      alert(`Error al eliminar: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!guard) return null;

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mt-3 text-center">
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Editar Guardia Especial
            </h3>
            <div className="mt-4">
              <form onSubmit={handleSubmit}>
                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="brigadeId">
                  Brigada
                </label>
                <select
                  id="brigadeId"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={brigadeId}
                  onChange={e => setBrigadeId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una brigada</option>
                  {availableBrigades.map(brigade => (
                    <option key={brigade.id_brigada} value={brigade.id_brigada}>
                      {brigade.nombre}
                    </option>
                  ))}
                </select>

                <label className={`${darkMode ? 'text-white' : 'text-gray-900'}`} htmlFor="type">
                  Tipo de guardia especial
                </label>
                <select
                  id="type"
                  className="mt-1 mb-4 p-2 border rounded w-full"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  required
                >
                  <option value="Guardia localizada">Guardia localizada</option>
                  <option value="Prácticas">Prácticas</option>
                </select>

                <div className="mt-4 flex space-x-2">
                  <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-400 flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-400 flex-1"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </form>
            </div>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white active:bg-gray-600 w-full px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditGuardEspecialModal;