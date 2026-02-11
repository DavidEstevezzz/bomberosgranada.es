import React, { useEffect, useState } from 'react';
import IncidentApiService from '../services/IncidentApiService';
import UsersApiService from '../services/UsuariosApiService';
import VehiclesApiService from '../services/VehiclesApiService';
import ParksApiService from '../services/ParkApiService';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import ClothingItemApiService from '../services/ClothingItemApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

const AddIncidentModal = ({ isOpen, onClose, onAdd }) => {
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
    nivel: '',
    equipo: '',
    id_vestuario: '',
    nombre_equipo: ''
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

  // Equipos personales
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [allEquipments, setAllEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Vestuario
  const [clothingItems, setClothingItems] = useState([]);
  const [filteredClothingItems, setFilteredClothingItems] = useState([]);
  const [clothingSearch, setClothingSearch] = useState('');

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
        nivel: '',
        equipo: '',
        id_vestuario: '',
        nombre_equipo: ''
      });
      setErrorMessages({});
      setIsSubmitting(false);
      setUserSearch('');
      setVehicleSearch('');
      setEquipmentSearch('');
      setClothingSearch('');
      setSelectedCategory('');
    }
  }, [isOpen, user]);

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

        // Manejar la respuesta de los ítems de vestuario
        if (clothingItemsResponse.data && clothingItemsResponse.data.data) {
          setClothingItems(clothingItemsResponse.data.data);
          setFilteredClothingItems(clothingItemsResponse.data.data);
        }
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

  // Filtrar ítems de vestuario por búsqueda
  useEffect(() => {
    if (clothingItems.length > 0) {
      const filtered = clothingItems.filter((item) =>
        item.name.toLowerCase().includes(clothingSearch.toLowerCase())
      );
      setFilteredClothingItems(filtered);
    }
  }, [clothingSearch, clothingItems]);

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

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
  event.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);
  setErrorMessages({});

  try {
    // Normalizar el estado a minúsculas antes de enviar
    const dataToSend = {
      ...formValues,
      estado: formValues.estado.toLowerCase(),
      nivel: formValues.nivel.toLowerCase()  
    };
    
    const response = await IncidentApiService.createIncident(dataToSend);
    onAdd(response.data);
    handleClose();
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

  if (!isOpen) return null;

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/95 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const dateInputClass = `${inputClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;
  const textareaClass = `min-h-[132px] w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const errorClass = 'text-xs font-medium text-red-500';
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
      : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
  }`;
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
      : 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
  }`;

  return (
    <div className={overlayClass} onMouseDown={handleClose}>
      <div
        className={modalClass}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Incidencias</p>
            <h2 className="mt-2 text-2xl font-semibold">Registrar incidencia</h2>
            <p className="mt-3 text-sm text-white/90">
              Documenta el suceso indicando ubicación, personal implicado y nivel para mantener el seguimiento actualizado.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {errorMessages.general && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {errorMessages.general}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className={labelClass}>Tipo de incidencia</span>
                <select
                  name="tipo"
                  id="tipo"
                  value={formValues.tipo}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="vehiculo">Vehículo</option>
                  <option value="personal">Personal</option>
                  <option value="instalacion">Instalación</option>
                  <option value="equipo">Equipos personales</option>
                  <option value="vestuario">Vestuario</option>
                  <option value="equipos_comunes">Equipos comunes</option>
                </select>
                {errorMessages.tipo && <p className={errorClass}>{errorMessages.tipo}</p>}
              </div>

              {formValues.tipo === 'vehiculo' && (
                <div className="space-y-2 rounded-2xl border px-4 py-4 transition-colors lg:px-5">
                  <span className={labelClass}>Vehículo implicado</span>
                  <input
                    type="text"
                    placeholder="Buscar vehículo por nombre"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className={inputClass}
                  />
                  <select
                    name="matricula"
                    id="matricula"
                    value={formValues.matricula}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona un vehículo</option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.matricula} value={vehicle.matricula}>
                        {vehicle.nombre}
                      </option>
                    ))}
                  </select>
                  {errorMessages.matricula && <p className={errorClass}>{errorMessages.matricula}</p>}
                  <p className={helperClass}>Se vinculará la incidencia con el vehículo seleccionado.</p>
                </div>
              )}

              {formValues.tipo === 'personal' && (
                <div className="space-y-2 rounded-2xl border px-4 py-4 transition-colors lg:px-5">
                  <span className={labelClass}>Empleado implicado</span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o apellido"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={inputClass}
                  />
                  <select
                    name="id_empleado2"
                    id="id_empleado2"
                    value={formValues.id_empleado2}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona un empleado</option>
                    {filteredUsers.map((item) => (
                      <option key={item.id_empleado} value={item.id_empleado}>
                        {item.nombre} {item.apellido}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_empleado2 && <p className={errorClass}>{errorMessages.id_empleado2}</p>}
                  <p className={helperClass}>Solo aparecerán miembros activos del cuerpo.</p>
                </div>
              )}

              {formValues.tipo === 'equipo' && (
                <div className="space-y-2 rounded-2xl border px-4 py-4 transition-colors lg:px-5">
                  <span className={labelClass}>Equipo personal</span>
                  <select
                    name="categoria_equipo"
                    id="categoria_equipo"
                    value={selectedCategory}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {equipmentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errorMessages.categoria_equipo && <p className={errorClass}>{errorMessages.categoria_equipo}</p>}

                  {selectedCategory && (
                    <>
                      <input
                        type="text"
                        placeholder="Buscar equipo por nombre"
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                        className={inputClass}
                      />
                      <select
                        name="equipo"
                        id="equipo"
                        value={formValues.equipo}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      >
                        <option value="">Selecciona un equipo</option>
                        {filteredEquipments.map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.nombre}
                          </option>
                        ))}
                      </select>
                      {errorMessages.equipo && <p className={errorClass}>{errorMessages.equipo}</p>}
                    </>
                  )}
                </div>
              )}

              {formValues.tipo === 'vestuario' && (
                <div className="space-y-2 rounded-2xl border px-4 py-4 transition-colors lg:px-5">
                  <span className={labelClass}>Ítem de vestuario</span>
                  <input
                    type="text"
                    placeholder="Buscar prenda por nombre"
                    value={clothingSearch}
                    onChange={(e) => setClothingSearch(e.target.value)}
                    className={inputClass}
                  />
                  <select
                    name="id_vestuario"
                    id="id_vestuario"
                    value={formValues.id_vestuario}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona una prenda</option>
                    {filteredClothingItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_vestuario && <p className={errorClass}>{errorMessages.id_vestuario}</p>}
                </div>
              )}

              {formValues.tipo === 'equipos_comunes' && (
                <div className="space-y-2 rounded-2xl border px-4 py-4 transition-colors lg:px-5">
                  <span className={labelClass}>Equipo común</span>
                  <input
                    type="text"
                    name="nombre_equipo"
                    id="nombre_equipo"
                    value={formValues.nombre_equipo}
                    onChange={handleChange}
                    placeholder="Introduce el nombre del equipo"
                    className={inputClass}
                    required
                  />
                  {errorMessages.nombre_equipo && <p className={errorClass}>{errorMessages.nombre_equipo}</p>}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <span className={labelClass}>Fecha</span>
                  <input
                    type="date"
                    name="fecha"
                    id="fecha"
                    value={formValues.fecha}
                    onChange={handleChange}
                    className={dateInputClass}
                    required
                  />
                  {errorMessages.fecha && <p className={errorClass}>{errorMessages.fecha}</p>}
                </div>

                <div className="space-y-2">
                  <span className={labelClass}>Parque</span>
                  <select
                    name="id_parque"
                    id="id_parque"
                    value={formValues.id_parque}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona un parque</option>
                    {parks.map((park) => (
                      <option key={park.id_parque} value={park.id_parque}>
                        {park.nombre}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_parque && <p className={errorClass}>{errorMessages.id_parque}</p>}
                </div>

                <div className="space-y-2">
                  <span className={labelClass}>Nivel</span>
                  <select
                    name="nivel"
                    id="nivel"
                    value={formValues.nivel}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona un nivel</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                  {errorMessages.nivel && <p className={errorClass}>{errorMessages.nivel}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <span className={labelClass}>Descripción</span>
                <textarea
                  name="descripcion"
                  id="descripcion"
                  value={formValues.descripcion}
                  onChange={handleChange}
                  className={textareaClass}
                  required
                />
                <p className={helperClass}>Detalla lo sucedido y las acciones realizadas.</p>
                {errorMessages.descripcion && <p className={errorClass}>{errorMessages.descripcion}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Añadir incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncidentModal;
