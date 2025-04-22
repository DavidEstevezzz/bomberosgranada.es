import React, { useState, useEffect } from 'react';
import ClothingItemApiService from '../services/ClothingItemApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import EditClothingItemModal from '../components/EditClothingItemModal';
import AddClothingItemModal from '../components/AddClothingItemModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const ClothingItems = () => {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClothingItem, setSelectedClothingItem] = useState(null);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async () => {
    setLoading(true);
    try {
      const response = await ClothingItemApiService.getClothingItems();
      if (response.data) {
        setClothingItems(response.data);
        setError(null);
      } else {
        throw new Error('No se retornaron ítems de vestuario desde el API');
      }
    } catch (error) {
      console.error('Error al cargar ítems de vestuario:', error);
      setError('Error al cargar ítems de vestuario');
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

  // Filtrado de los ítems de vestuario por nombre
  const filteredClothingItems = clothingItems
    .filter((item) => {
      const normalizedSearch = normalizeString(searchTerm);
      return normalizeString(item.name).includes(normalizedSearch);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleEditClick = (item) => {
    setSelectedClothingItem(item);
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (item) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el ítem ${item.name}?`);
    if (!confirmDelete) return;

    try {
      await ClothingItemApiService.deleteClothingItem(item.id);
      setClothingItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error('Error al eliminar ítem de vestuario:', error);
      alert('Ocurrió un error al eliminar el ítem de vestuario.');
    }
  };

  const handleUpdateClothingItem = async (updatedItem) => {
    try {
      const response = await ClothingItemApiService.updateClothingItem(updatedItem.id, updatedItem);
      setClothingItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? response.data : item
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar ítem de vestuario:', error);
      alert('Ocurrió un error al actualizar el ítem de vestuario.');
    }
  };

  const handleAddClothingItem = async () => {
    try {
      await fetchClothingItems();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar ítem de vestuario:', error);
      alert('Ocurrió un error al agregar el ítem de vestuario');
    }
  };

  if (loading) return <div>Cargando ítems de vestuario...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
      {/* Cabecera y botón de añadir */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Gestión de Vestuario
        </h1>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Añadir ítem</span>
        </button>
      </div>

      {/* Panel de búsqueda */}
      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} px-4 py-2 rounded w-full`}
          />
        </div>
      </div>

      {/* Tabla de ítems de vestuario */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-400'}`}>
                <th className="py-2 px-4 text-left">Nombre</th>
                <th className="py-2 px-4 text-center" style={{ width: '200px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClothingItems.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-400'}`}
                >
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 flex justify-center space-x-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="bg-blue-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="bg-red-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClothingItems.length === 0 && (
                <tr>
                  <td colSpan="2" className="py-4 text-center">
                    No se encontraron ítems de vestuario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {selectedClothingItem && (
        <EditClothingItemModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          clothingItem={selectedClothingItem}
          onUpdate={handleUpdateClothingItem}
        />
      )}
      <AddClothingItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddClothingItem}
      />
    </div>
  );
};

export default ClothingItems;