import React, { useState, useEffect } from 'react';
import VehiclesApiService from '../services/VehiclesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import EditVehicleModal from '../components/EditVehicleModal';
import AddVehicleModal from '../components/AddVehicleModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      // Se asume que el controlador carga la relación 'park'
      const response = await VehiclesApiService.getVehicles();
      if (response.data) {
        setVehicles(response.data);
        setError(null);
      } else {
        throw new Error('No se retornaron vehículos desde el API');
      }
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      setError('Error al cargar vehículos');
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

  // Filtra vehículos por matrícula, tipo, parque (nombre) o año
  const filteredVehicles = vehicles.filter((vehicle) => {
    const normalizedSearch = normalizeString(searchTerm);
    const parkName = vehicle.park ? normalizeString(vehicle.park.nombre) : normalizeString(String(vehicle.id_parque));
    return (
      normalizeString(vehicle.nombre).includes(normalizedSearch) ||
      normalizeString(vehicle.matricula).includes(normalizedSearch) ||
      normalizeString(vehicle.tipo).includes(normalizedSearch) ||
      parkName.includes(normalizedSearch) ||
      normalizeString(String(vehicle.año)).includes(normalizedSearch)
    );
  });

  const handleEditClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (vehicle) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el vehículo ${vehicle.matricula}?`);
    if (!confirmDelete) return;

    try {
      await VehiclesApiService.deleteVehicle(vehicle.matricula);
      setVehicles((prev) => prev.filter((v) => v.matricula !== vehicle.matricula));
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      alert('Ocurrió un error al eliminar el vehículo.');
    }
  };

  const handleUpdateVehicle = async (updatedVehicle) => {
    try {
      const response = await VehiclesApiService.updateVehicle(updatedVehicle.matricula, updatedVehicle);
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.matricula === updatedVehicle.matricula ? response.data : vehicle
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      alert('Ocurrió un error al actualizar el vehículo.');
    }
  };

  const handleAddVehicle = async (newVehicle) => {
    try {
      await fetchVehicles();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar vehículo:', error);
      alert('Ocurrió un error al agregar el vehículo.');
    }
  };

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-7xl overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
  }`;

  const sectionBaseClass = `rounded-2xl border transition-colors ${
    darkMode ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50/70'
  }`;

  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;

  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';

  if (loading) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center`}>Cargando vehículos...</div>
    );
  }

  if (error) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center text-red-500`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={cardContainerClass}>
      <div
        className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
          darkMode
            ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
            : 'from-primary-400 via-primary-500 to-primary-600'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          Gestión de recursos
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Vehículos operativos</h1>
            <p className="mt-1 text-sm text-white/80">
              Consulta, filtra y gestiona los vehículos disponibles en los diferentes parques.
            </p>
          </div>
          <button
            onClick={handleAddClick}
            className="group flex items-center gap-2 self-start rounded-2xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-base transition-colors group-hover:bg-white/40">
              <FontAwesomeIcon icon={faPlus} />
            </span>
            Añadir vehículo
          </button>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-10">
        <section className={`${sectionBaseClass} px-6 py-6`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-semibold">Búsqueda rápida</h2>
              <p className={`text-xs ${subtleTextClass}`}>
                Filtra por matrícula, parque, tipo o año para encontrar el vehículo que necesitas.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 lg:max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar vehículos (matrícula, tipo, parque, etc.)"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={`${inputBaseClass} pl-11`}
                />
                <span
                  className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <FontAwesomeIcon icon={faEllipsisH} />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={`${sectionBaseClass} px-0 pb-0`}>
          <div className="px-6 pb-4 pt-6">
            <h2 className="text-lg font-semibold">Listado de vehículos</h2>
            <p className={`mt-1 text-xs ${subtleTextClass}`}>
              Gestiona la información de cada vehículo y mantén el inventario siempre actualizado.
            </p>
          </div>

          <div className="overflow-hidden">
            <div className="max-h-[60vh] overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead
                  className={
                    darkMode
                      ? 'bg-slate-900/70 text-slate-200'
                      : 'bg-slate-100/80 text-slate-600'
                  }
                >
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Matrícula</th>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Parque</th>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Año</th>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Tipo</th>
                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-sm ${
                    darkMode ? 'divide-slate-800 bg-slate-900/40' : 'divide-slate-200 bg-white'
                  }`}
                >
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.matricula} className="transition-colors hover:bg-primary-500/5">
                      <td className="px-6 py-4 font-medium">{vehicle.nombre}</td>
                      <td className="px-6 py-4 text-sm">{vehicle.matricula}</td>
                      <td className="px-6 py-4 text-sm">
                        {vehicle.park ? vehicle.park.nombre : vehicle.id_parque}
                      </td>
                      <td className="px-6 py-4 text-sm">{vehicle.año}</td>
                      <td className="px-6 py-4 text-sm">{vehicle.tipo}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditClick(vehicle)}
                            className="inline-flex items-center gap-2 rounded-xl border border-primary-400/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-600 transition-all hover:-translate-y-0.5 hover:bg-primary-500/20 dark:border-primary-300/40 dark:text-primary-200"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(vehicle)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-500/20 dark:border-red-400/50 dark:text-red-300"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-16 text-center text-sm font-medium text-slate-500 dark:text-slate-300"
                      >
                        No se encontraron vehículos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Modales */}
      {selectedVehicle && (
        <EditVehicleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          vehicle={selectedVehicle}
          onUpdate={handleUpdateVehicle}
        />
      )}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddVehicle}
      />
    </div>
  );
};

export default Vehicles;
