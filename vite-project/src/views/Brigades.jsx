import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faDownload,
  faEdit,
  faTrash,
  faEllipsisH,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import EditBrigadeModal from '../components/EditBrigadeModal';
import AddBrigadeModal from '../components/AddBrigadeModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const Brigades = () => {
  const [brigades, setBrigades] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBrigade, setSelectedBrigade] = useState(null);
  const { darkMode } = useDarkMode();

  const navigate = useNavigate();

  const fetchBrigadesAndParks = async () => {
    setLoading(true);
    try {
      const [brigadesResponse, parksResponse] = await Promise.all([
        BrigadesApiService.getBrigades(),
        BrigadesApiService.getParks(),
      ]);
      if (brigadesResponse.data && parksResponse.data) {
        setBrigades(brigadesResponse.data);
        setParks(parksResponse.data);
        setError(null);
      } else {
        throw new Error('No brigade or park data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch brigades and parks:', error);
      setError('Failed to load brigades and parks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrigadesAndParks();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (brigade) => {
    setSelectedBrigade(brigade);
    setIsEditModalOpen(true);
  };

  const handleAddBrigadeClick = () => {
    setIsAddModalOpen(true);
  };

  const handleUpdateBrigade = async (updatedBrigade) => {
    try {
      const response = await BrigadesApiService.updateBrigade(
        updatedBrigade.id_brigada,
        updatedBrigade,
      );
      setBrigades((prev) =>
        prev.map((brigade) =>
          brigade.id_brigada === updatedBrigade.id_brigada
            ? response.data
            : brigade,
        ),
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update brigade:', error);
      if (error.response && error.response.data) {
        alert('Error: ' + Object.values(error.response.data).join('\n'));
      }
    }
  };

  const handleAddBrigade = async () => {
    try {
      fetchBrigadesAndParks();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add brigade in handleAddBrigade:', error);
    }
  };

  const handleDeleteBrigade = async (id_brigada) => {
    if (window.confirm('Are you sure you want to delete this brigade?')) {
      try {
        await BrigadesApiService.deleteBrigade(id_brigada);
        setBrigades((prev) =>
          prev.filter((brigade) => brigade.id_brigada !== id_brigada),
        );
      } catch (error) {
        console.error('Failed to delete brigade:', error);
        alert('Failed to delete brigade');
      }
    }
  };

  const handleDetailClick = (brigade) => {
    navigate(`/brigades/${brigade.id_brigada}`);
  };

  useEffect(() => {}, [isAddModalOpen]);

  const getParkNameById = (id_parque) => {
    const park = parks.find((p) => p.id_parque === id_parque);
    return park ? park.nombre : 'Unknown';
  };

  const filteredBrigades = brigades.filter(
    (brigade) =>
      brigade.nombre &&
      brigade.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
          <p className="text-base font-medium">Cargando brigadas...</p>
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
            Gestión de brigadas
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">Brigadas</h1>
              <p className={`max-w-2xl text-base ${darkMode ? 'text-white/80' : 'text-white/90'}`}>
                Administra las brigadas disponibles y vincula cada una con su parque correspondiente de manera rápida y sencilla.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAddBrigadeClick}
                className={`${actionButtonBaseClass} ${
                  darkMode
                    ? 'bg-primary-500/90 text-white hover:bg-primary-400'
                    : 'bg-white/90 text-primary-600 hover:bg-white'
                }`}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Añadir brigada</span>
              </button>
              <button
                className={`${actionButtonBaseClass} ${
                  darkMode
                    ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className={sectionCardClass}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 space-y-3">
                <label htmlFor="brigade-search" className={`text-sm font-medium ${subtleTextClass}`}>
                  Buscar brigadas por nombre
                </label>
                <div className="relative">
                  <input
                    id="brigade-search"
                    type="text"
                    placeholder="Escribe para filtrar brigadas"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={inputBaseClass}
                  />
                  <FontAwesomeIcon
                    icon={faEllipsisH}
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
                  <span>Total de brigadas</span>
                  <span className="font-semibold text-primary-500">{brigades.length}</span>
                </div>
                <div className={`flex items-center justify-between text-base ${subtleTextClass}`}>
                  <span>Brigadas visibles</span>
                  <span className="font-semibold text-primary-500">{filteredBrigades.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            {filteredBrigades.length > 0 ? (
              <div
                className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                  darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-base dark:divide-slate-800">
                    <thead className={darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}>
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Brigada
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Parque asignado
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredBrigades.map((brigade) => (
                        <tr
                          key={brigade.id_brigada}
                          className={darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/80'}
                        >
                          <td className="px-6 py-5 text-base font-semibold">{brigade.nombre}</td>
                          <td className="px-6 py-5 text-base font-medium">{getParkNameById(brigade.id_parque)}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap items-center justify-end gap-3">
                              <button
                                onClick={() => handleDetailClick(brigade)}
                                className={`${actionButtonBaseClass} ${
                                  darkMode
                                    ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <FontAwesomeIcon icon={faInfoCircle} />
                                <span>Detalle</span>
                              </button>
                              <button
                                onClick={() => handleEditClick(brigade)}
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
                                onClick={() => handleDeleteBrigade(brigade.id_brigada)}
                                className={`${actionButtonBaseClass} ${
                                  darkMode
                                    ? 'bg-red-500/80 text-white hover:bg-red-400'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>Borrar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 text-center ${
                  darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-lg font-semibold">No se han encontrado brigadas</p>
                <p className={`max-w-md text-base ${subtleTextClass}`}>
                  Ajusta los criterios de búsqueda o crea una nueva brigada para empezar a organizar los equipos de trabajo.
                </p>
                <button
                  onClick={handleAddBrigadeClick}
                  className={`${actionButtonBaseClass} ${
                    darkMode
                      ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Crear brigada</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBrigade && (
        <EditBrigadeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          brigade={selectedBrigade}
          onUpdate={handleUpdateBrigade}
        />
      )}
      <AddBrigadeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
        }}
        onAdd={handleAddBrigade}
      />
    </>
  );
};

export default Brigades;
