import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import IncidentApiService from '../services/IncidentApiService';
import UsersApiService from '../services/UsuariosApiService';
import VehiclesApiService from '../services/VehiclesApiService';
import ParksApiService from '../services/ParkApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const AddIncidentModal = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formValues, setFormValues] = useState({
    tipo: '',
    fecha: getTodayDate(),
    descripcion: '',
    id_parque: '',
    matricula: '',
    id_empleado2: '',
    id_empleado: user ? user.id_empleado : '',
    estado: 'Pendiente',
    leido: false,
    nivel: ''
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

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        tipo: '',
        fecha: getTodayDate(),
        descripcion: '',
        id_parque: '',
        matricula: '',
        id_empleado2: '',
        id_empleado: user ? user.id_empleado : '',
        estado: 'Pendiente',
        leido: false,
        nivel: ''
      });
      setErrorMessages({});
      setIsSubmitting(false);
      setUserSearch('');
      setVehicleSearch('');
    }
  }, [isOpen, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, vehiclesResponse, parksResponse] = await Promise.all([
          UsersApiService.getUsuarios(),
          VehiclesApiService.getVehicles(),
          ParksApiService.getParks()
        ]);
        setUsers(usersResponse.data);
        setFilteredUsers(usersResponse.data);
        setVehicles(vehiclesResponse.data);
        setFilteredVehicles(vehiclesResponse.data);
        setParks(parksResponse.data);
      } catch (error) {
        console.error('Error fetching data for incident modal:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
      return fullName.includes(userSearch.toLowerCase());
    });
    setFilteredUsers(filtered);
  }, [userSearch, users]);

  useEffect(() => {
    const filtered = vehicles.filter((vehicle) =>
      vehicle.nombre.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [vehicleSearch, vehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessages({});

    console.log('Form values a enviar:', formValues);
    try {
      const response = await IncidentApiService.createIncident(formValues);
      onAdd(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating incident:', error);
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: 'Ocurrió un error al crear la incidencia.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Incidencia</h3>
          <button onClick={onClose} disabled={isSubmitting} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            {/* Tipo de Incidencia y selector condicional */}
            <div className="sm:col-span-1">
              <label htmlFor="tipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tipo de Incidencia
              </label>
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
              </select>
              {errorMessages.tipo && <span className="text-red-500 text-sm">{errorMessages.tipo}</span>}

              {/* Selector condicional para vehículo o personal justo debajo del tipo */}
              {formValues.tipo === 'vehiculo' && (
                <div className="mt-4">
                  <label htmlFor="matricula" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Vehículo
                  </label>
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
                      <option key={vehicle.matricula} value={vehicle.matricula}>
                        {vehicle.nombre}
                      </option>
                    ))}
                  </select>
                  {errorMessages.matricula && <span className="text-red-500 text-sm">{errorMessages.matricula}</span>}
                </div>
              )}
              {formValues.tipo === 'personal' && (
                <div className="mt-4">
                  <label htmlFor="id_empleado2" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Empleado
                  </label>
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
            </div>

            {/* Fecha */}
            <div className="sm:col-span-1">
              <label htmlFor="fecha" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Fecha
              </label>
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
              <label htmlFor="id_parque" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Parque
              </label>
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
                  <option key={park.id_parque} value={park.id_parque}>
                    {park.nombre}
                  </option>
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
          </div>

          {/* Descripción */}
          <div className="sm:col-span-2 mb-4">
            <label htmlFor="descripcion" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Descripción
            </label>
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

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`}
            >
              {isSubmitting ? 'Enviando...' : 'Añadir Incidencia'}
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

export default AddIncidentModal;
