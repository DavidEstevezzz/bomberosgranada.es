import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import IncidentApiService from '../services/IncidentApiService';
import UsersApiService from '../services/UsuariosApiService';
import VehiclesApiService from '../services/VehiclesApiService';
import ParksApiService from '../services/ParkApiService';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import ClothingItemApiService from '../services/ClothingItemApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const EditIncidentModal = ({ isOpen, onClose, incident, onUpdate }) => {
  if (!isOpen || !incident) return null;

  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formValues, setFormValues] = useState({
    tipo: incident.tipo || '',
    fecha: incident.fecha ? incident.fecha.split('T')[0] : getTodayDate(),
    descripcion: incident.descripcion || '',
    id_parque: incident.id_parque || '',
    matricula: incident.matricula || '',
    id_empleado2: incident.id_empleado2 || '',
    resolviendo: incident.resolviendo || '',
    id_empleado: incident.id_empleado || (user ? user.id_empleado : ''),
    estado: incident.estado
      ? incident.estado.charAt(0).toUpperCase() + incident.estado.slice(1).toLowerCase()
      : 'Pendiente',
    leido: incident.leido || false,
    nivel: incident.nivel || '',
    equipo: incident.equipo || '',
    id_vestuario: incident.id_vestuario || '',
    nombre_equipo: incident.nombre_equipo || ''
  });

  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdowns con buscador
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [parks, setParks] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [clothingItems, setClothingItems] = useState([]);
  const [filteredClothingItems, setFilteredClothingItems] = useState([]);
  const [clothingSearch, setClothingSearch] = useState('');

  // Equipos personales
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [allEquipments, setAllEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Cargar datos para dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, vehiclesResponse, parksResponse, categoriesResponse, equipmentsResponse, clothingItemsResponse] = await Promise.all([
          UsersApiService.getUsuarios(),
          VehiclesApiService.getVehicles(),
          ParksApiService.getParks(),
          PersonalEquipmentApiService.getCategories(),
          PersonalEquipmentApiService.getPersonalEquipments(),
          ClothingItemApiService.getClothingItems()
        ]);
        setUsers(usersResponse.data);
        setFilteredUsers(usersResponse.data);
        setVehicles(vehiclesResponse.data);
        setFilteredVehicles(vehiclesResponse.data);
        setParks(parksResponse.data);
        setEquipmentCategories(categoriesResponse.data);
        setAllEquipments(equipmentsResponse.data);

        // Si la incidencia es de tipo equipo, establecemos la categoría seleccionada
        if (incident.tipo === 'equipo' && incident.equipment) {
          const equipmentData = equipmentsResponse.data.find(e => e.id == incident.equipo);
          if (equipmentData) {
            setSelectedCategory(equipmentData.categoria);
            // Filtramos los equipos por la categoría
            setFilteredEquipments(equipmentsResponse.data.filter(e => e.categoria === equipmentData.categoria));
          }
        }
        if (clothingItemsResponse.data && clothingItemsResponse.data.data) {
          setClothingItems(clothingItemsResponse.data.data);
          setFilteredClothingItems(clothingItemsResponse.data.data);
        }
      } catch (error) {
        console.error('Error al cargar datos en el modal de edición:', error);
      }
    };
    fetchData();
  }, [incident]);

  // Actualizar el formulario cuando cambie la incidencia
  useEffect(() => {
    if (incident) {
      setFormValues({
        tipo: incident.tipo || '',
        fecha: incident.fecha ? incident.fecha.split('T')[0] : getTodayDate(),
        descripcion: incident.descripcion || '',
        id_parque: incident.id_parque || '',
        matricula: incident.matricula || '',
        id_empleado2: incident.id_empleado2 || '',
        resolviendo: incident.resolviendo || '',
        id_empleado: incident.id_empleado || (user ? user.id_empleado : ''),
        estado: incident.estado
          ? incident.estado.charAt(0).toUpperCase() + incident.estado.slice(1).toLowerCase()
          : 'Pendiente',
        leido: incident.leido || false,
        nivel: incident.nivel || '',
        equipo: incident.equipo || '',
        id_vestuario: incident.id_vestuario || '',
        nombre_equipo: incident.nombre_equipo || ''
      });
    }
  }, [incident, user]);

  // Filtrado de usuarios y vehículos según el texto de búsqueda
  useEffect(() => {
    const filtered = users.filter((u) => {
      const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
      return fullName.includes(userSearch.toLowerCase());
    });
    setFilteredUsers(filtered);
  }, [userSearch, users]);

  useEffect(() => {
    if (clothingItems.length > 0) {
      const filtered = clothingItems.filter((item) =>
        item.name.toLowerCase().includes(clothingSearch.toLowerCase())
      );
      setFilteredClothingItems(filtered);
    }
  }, [clothingSearch, clothingItems]);

  useEffect(() => {
    const filtered = vehicles.filter((v) =>
      v.nombre.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [vehicleSearch, vehicles]);

  // Filtrar equipos basados en la categoría seleccionada
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allEquipments.filter(
        (equipment) => equipment.categoria === selectedCategory
      );
      setFilteredEquipments(filtered);
    } else {
      setFilteredEquipments([]);
    }
  }, [selectedCategory, allEquipments]);

  // Filtrar equipos por búsqueda
  useEffect(() => {
    if (selectedCategory && equipmentSearch) {
      const filtered = allEquipments.filter(
        (equipment) =>
          equipment.categoria === selectedCategory &&
          equipment.nombre.toLowerCase().includes(equipmentSearch.toLowerCase())
      );
      setFilteredEquipments(filtered);
    }
  }, [equipmentSearch, selectedCategory, allEquipments]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la categoría, reseteamos el equipo seleccionado
    if (name === 'categoria_equipo') {
      setSelectedCategory(value);
      setFormValues(prev => ({ ...prev, equipo: '' }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessages({});

    try {
      // Se llama al update usando el id de la incidencia
      const response = await IncidentApiService.updateIncident(incident.id_incidencia, formValues);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error actualizando la incidencia:', error);
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: 'Ocurrió un error al actualizar la incidencia.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Editar Incidencia</h3>
          <button onClick={onClose} disabled={isSubmitting} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            {/* Tipo de Incidencia y selector condicional */}
            <div className="sm:col-span-1">
              <label htmlFor="tipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tipo de Incidencia</label>
              <select
                name="tipo"
                id="tipo"
                value={formValues.tipo}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="vehiculo">Vehículo</option>
                <option value="personal">Personal</option>
                <option value="instalacion">Instalación</option>
                <option value="equipo">Equipos Personales</option>
                <option value="vestuario">Vestuario</option>
                <option value="equipos_comunes">Equipos Comunes</option>
              </select>
              {errorMessages.tipo && <span className="text-red-500 text-sm">{errorMessages.tipo}</span>}

              {/* Selector condicional para vehículo o personal o equipo */}
              {formValues.tipo === 'vehiculo' && (
                <div className="mt-4">
                  <label htmlFor="matricula" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vehículo</label>
                  <input
                    type="text"
                    placeholder="Buscar vehículo..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className={`w-full px-4 py-2 rounded mb-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                  />
                  <select
                    name="matricula"
                    id="matricula"
                    value={formValues.matricula}
                    onChange={handleChange}
                    className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    required
                  >
                    <option value="">Seleccione un vehículo</option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.matricula} value={vehicle.matricula}>{vehicle.nombre}</option>
                    ))}
                  </select>
                  {errorMessages.matricula && <span className="text-red-500 text-sm">{errorMessages.matricula}</span>}
                </div>
              )}
              {formValues.tipo === 'personal' && (
                <div className="mt-4">
                  <label htmlFor="id_empleado2" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Empleado</label>
                  <input
                    type="text"
                    placeholder="Buscar empleado..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`w-full px-4 py-2 rounded mb-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                  />
                  <select
                    name="id_empleado2"
                    id="id_empleado2"
                    value={formValues.id_empleado2}
                    onChange={handleChange}
                    className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    required
                  >
                    <option value="">Seleccione un empleado</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id_empleado} value={user.id_empleado}>
                        {user.nombre} {user.apellido}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_empleado2 && <span className="text-red-500 text-sm">{errorMessages.id_empleado2}</span>}
                </div>
              )}
              {formValues.tipo === 'vestuario' && (
                <div className="mt-4">
                  <label htmlFor="id_vestuario" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Ítem de Vestuario
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar ítem de vestuario..."
                    value={clothingSearch}
                    onChange={(e) => setClothingSearch(e.target.value)}
                    className={`w-full px-4 py-2 rounded mb-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                  />
                  <select
                    name="id_vestuario"
                    id="id_vestuario"
                    value={formValues.id_vestuario}
                    onChange={handleChange}
                    className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    required
                  >
                    <option value="">Seleccione un ítem de vestuario</option>
                    {filteredClothingItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_vestuario && <span className="text-red-500 text-sm">{errorMessages.id_vestuario}</span>}
                </div>
              )}
               {formValues.tipo === 'equipos_comunes' && (
                <div className="mt-4">
                  <label htmlFor="nombre_equipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Nombre del equipo:
                  </label>
                  <input
                    type="text"
                    name="nombre_equipo"
                    id="nombre_equipo"
                    value={formValues.nombre_equipo}
                    onChange={handleChange}
                    placeholder="Introduce el nombre del equipo..."
                    className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    required
                  />
                  {errorMessages.nombre_equipo && <span className="text-red-500 text-sm">{errorMessages.nombre_equipo}</span>}
                </div>
              )}
              {formValues.tipo === 'equipo' && (
                <div className="mt-4">
                  {/* Selector de categoría de equipo */}
                  <label htmlFor="categoria_equipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Categoría de Equipo
                  </label>
                  <select
                    name="categoria_equipo"
                    id="categoria_equipo"
                    value={selectedCategory}
                    onChange={handleChange}
                    className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {equipmentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errorMessages.categoria_equipo && <span className="text-red-500 text-sm">{errorMessages.categoria_equipo}</span>}

                  {/* Selector de equipo específico (si hay categoría seleccionada) */}
                  {selectedCategory && (
                    <div className="mt-4">
                      <label htmlFor="equipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Nombre del Equipo
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar equipo..."
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                        className={`w-full px-4 py-2 rounded mb-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                      />
                      <select
                        name="equipo"
                        id="equipo"
                        value={formValues.equipo}
                        onChange={handleChange}
                        className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                        required
                      >
                        <option value="">Seleccione un equipo</option>
                        {filteredEquipments.map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.nombre}
                          </option>
                        ))}
                      </select>
                      {errorMessages.equipo && <span className="text-red-500 text-sm">{errorMessages.equipo}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fecha */}
            <div className="sm:col-span-1">
              <label htmlFor="fecha" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fecha</label>
              <input
                type="date"
                name="fecha"
                id="fecha"
                value={formValues.fecha}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              />
              {errorMessages.fecha && <span className="text-red-500 text-sm">{errorMessages.fecha}</span>}
            </div>

            {/* Parque */}
            <div className="sm:col-span-1">
              <label htmlFor="id_parque" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parque</label>
              <select
                name="id_parque"
                id="id_parque"
                value={formValues.id_parque}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un parque</option>
                {parks.map((park) => (
                  <option key={park.id_parque} value={park.id_parque}>{park.nombre}</option>
                ))}
              </select>
              {errorMessages.id_parque && <span className="text-red-500 text-sm">{errorMessages.id_parque}</span>}
            </div>

            {/* Nivel */}
            <div className="sm:col-span-1">
              <label htmlFor="nivel" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Nivel
              </label>
              <select
                name="nivel"
                id="nivel"
                value={formValues.nivel}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un nivel</option>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
              {errorMessages.nivel && <span className="text-red-500 text-sm">{errorMessages.nivel}</span>}
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label htmlFor="descripcion" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Descripción</label>
              <textarea
                name="descripcion"
                id="descripcion"
                value={formValues.descripcion}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required
              ></textarea>
              {errorMessages.descripcion && <span className="text-red-500 text-sm">{errorMessages.descripcion}</span>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="resolviendo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resolviendo (opcional)</label>
              <textarea
                name="resolviendo"
                id="resolviendo"
                value={formValues.resolviendo}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
              ></textarea>
              {errorMessages.resolviendo && <span className="text-red-500 text-sm">{errorMessages.resolviendo}</span>}
            </div>

          </div>


          {/* Mensaje de error general */}
          {errorMessages.general && (
            <div className="mb-4 text-center">
              <span className="text-red-500">{errorMessages.general}</span>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`}
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Incidencia'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIncidentModal;