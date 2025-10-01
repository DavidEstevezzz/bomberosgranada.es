import React, { useState, useEffect } from 'react';
import ClothingItemApiService from '../services/ClothingItemApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
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
      if (response && response.data && response.data.data) {
        // Accede al array dentro de response.data.data
        setClothingItems(response.data.data);
        setError(null);
      } else {
        throw new Error('No se retornaron ítems de vestuario desde el API');
      }
    } catch (error) {
      console.error('Error al cargar ítems de vestuario:', error);
      setError('Error al cargar ítems de vestuario');
      // Inicializa como array vacío para evitar errores
      setClothingItems([]);
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

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/80 text-slate-100'
      : 'border-slate-200 bg-white/90 text-slate-900'
  }`;
  const sectionCardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode
      ? 'border-slate-800 bg-slate-900/60'
      : 'border-slate-200 bg-slate-50/70'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const actionButtonBaseClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
    darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
  }`;

  if (loading) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-base font-medium">Cargando ítems de vestuario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-base font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-400 via-primary-500 to-primary-600'
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Gestión de vestuario
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">Ítems de vestuario</h1>
              <p className={`max-w-2xl text-base ${darkMode ? 'text-white/80' : 'text-white/90'}`}>
                Organiza los elementos disponibles para las brigadas y mantén su inventario siempre actualizado con acciones rápidas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAddClick}
                className={`${actionButtonBaseClass} ${
                  darkMode
                    ? 'bg-primary-500/90 text-white hover:bg-primary-400'
                    : 'bg-white/90 text-primary-600 hover:bg-white'
                }`}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Registrar ítem</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className={sectionCardClass}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 space-y-3">
                <label htmlFor="clothing-search" className={`text-sm font-medium ${subtleTextClass}`}>
                  Buscar ítems por nombre
                </label>
                <div className="relative">
                  <input
                    id="clothing-search"
                    type="text"
                    placeholder="Escribe para filtrar ítems"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={inputBaseClass}
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg ${subtleTextClass}`}
                  />
                </div>
              </div>
              <div
                className={`flex w-full flex-col gap-2 rounded-2xl border px-5 py-4 text-base ${
                  darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
                } lg:w-64`}
              >
                <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  Resumen rápido
                </p>
                <div className={`flex items-center justify-between text-base ${subtleTextClass}`}>
                  <span>Total de ítems</span>
                  <span className="font-semibold text-primary-500">{clothingItems.length}</span>
                </div>
                <div className={`flex items-center justify-between text-base ${subtleTextClass}`}>
                  <span>Ítems visibles</span>
                  <span className="font-semibold text-primary-500">{filteredClothingItems.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            {filteredClothingItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredClothingItems.map((item) => (
                  <article
                    key={item.id}
                    className={`flex flex-col justify-between gap-4 rounded-2xl border px-6 py-5 transition-colors duration-200 ${
                      darkMode
                        ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium uppercase tracking-wide text-primary-500">
                        Elemento de vestuario
                      </p>
                      <h2 className="text-xl font-semibold leading-tight">{item.name}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleEditClick(item)}
                        className={`${actionButtonBaseClass} ${
                          darkMode
                            ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className={`${actionButtonBaseClass} ${
                          darkMode
                            ? 'bg-red-500/80 text-white hover:bg-red-400'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 text-center ${
                  darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-lg font-semibold">No se han encontrado ítems de vestuario</p>
                <p className={`max-w-md text-base ${subtleTextClass}`}>
                  Ajusta tu búsqueda o añade un nuevo elemento para mantener actualizado el inventario de protección.
                </p>
                <button
                  onClick={handleAddClick}
                  className={`${actionButtonBaseClass} ${
                    darkMode
                      ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Crear ítem</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </>
  );
};

export default ClothingItems;
