import React, { useState, useEffect } from 'react';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEllipsisH, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import EditPersonalEquipmentModal from '../components/EditPersonalEquipmentModal';
import AddPersonalEquipmentModal from '../components/AddPersonalEquipmentModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const PersonalEquipment = () => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const response = await PersonalEquipmentApiService.getPersonalEquipments();
      if (response.data) {
        setEquipments(response.data);
        setError(null);
      } else {
        throw new Error('No se retornaron equipos desde el API');
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const normalizeString = (str) => {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Filtra equipos por nombre o categoría
  const filteredEquipments = equipments.filter((equipment) => {
    const normalizedSearch = normalizeString(searchTerm);
    return (
      normalizeString(equipment.nombre).includes(normalizedSearch) ||
      normalizeString(equipment.categoria).includes(normalizedSearch)
    );
  });

  const handleEditClick = (equipment) => {
    setSelectedEquipment(equipment);
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (equipment) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el equipo ${equipment.nombre}?`);
    if (!confirmDelete) return;

    try {
      await PersonalEquipmentApiService.deletePersonalEquipment(equipment.id);
      setEquipments((prev) => prev.filter((eq) => eq.id !== equipment.id));
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert('Ocurrió un error al eliminar el equipo.');
    }
  };

  const handleUpdateEquipment = async (updatedEquipment) => {
    try {
      const response = await PersonalEquipmentApiService.updatePersonalEquipment(updatedEquipment.id, updatedEquipment);
      setEquipments((prev) =>
        prev.map((equipment) =>
          equipment.id === updatedEquipment.id ? response.data : equipment
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      alert('Ocurrió un error al actualizar el equipo.');
    }
  };

  const handleAddEquipment = async (newEquipment) => {
    try {
      await fetchEquipments();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar equipo:', error);
      alert('Ocurrió un error al agregar el equipo.');
    }
  };

  const handleToggleDisponibilidad = async (equipment) => {
    try {
      const response = await PersonalEquipmentApiService.toggleDisponibilidad(equipment.id);
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === equipment.id ? response.data : eq
        )
      );
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      alert('Ocurrió un error al cambiar el estado de disponibilidad.');
    }
  };

  if (loading) return <div>Cargando equipos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Equipos Personales
        </h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir equipo</span>
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Buscar equipos (nombre, categoría)"
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded w-full md:w-3/4`}
          />
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faEllipsisH} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Categoría</th>
                <th className="py-2 px-2">Disponible</th>
                <th className="py-2 px-2" style={{ width: '300px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id} className="border-b border-gray-700">
                  <td className="py-2 px-2">{equipment.nombre}</td>
                  <td className="py-2 px-2">{equipment.categoria}</td>
                  <td className="py-2 px-2">
                    {equipment.disponible ? (
                      <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                    ) : (
                      <FontAwesomeIcon icon={faTimes} className="text-red-500" />
                    )}
                  </td>
                  <td className="py-2 px-2 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(equipment)}
                      className="bg-blue-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleToggleDisponibilidad(equipment)}
                      className={`${
                        equipment.disponible
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      } text-white px-3 py-1 rounded flex items-center space-x-1`}
                    >
                      {equipment.disponible ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(equipment)}
                      className="bg-red-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center">
                    No se encontraron equipos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {selectedEquipment && (
        <EditPersonalEquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          equipment={selectedEquipment}
          onUpdate={handleUpdateEquipment}
        />
      )}
      <AddPersonalEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddEquipment}
      />
    </div>
  );
};

export default PersonalEquipment;