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

  if (loading) return <div>Cargando vehículos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Vehículos
        </h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir vehículo</span>
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Buscar vehículos (matrícula, tipo, parque, etc.)"
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
                <th className="py-2 px-2">Matrícula</th>
                <th className="py-2 px-2">Nombre Vehículo</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2">Año</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2" style={{ width: '200px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.matricula} className="border-b border-gray-700">
                  <td className="py-2 px-2">{vehicle.matricula}</td>
                  <td className="py-2 px-2">{vehicle.nombre}</td>
                  <td className="py-2 px-2">{vehicle.park ? vehicle.park.nombre : vehicle.id_parque}</td>
                  <td className="py-2 px-2">{vehicle.año}</td>
                  <td className="py-2 px-2">{vehicle.tipo}</td>
                  <td className="py-2 px-2 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(vehicle)}
                      className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(vehicle)}
                      className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 text-center">
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
