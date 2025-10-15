import React, { useState, useEffect } from 'react';
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

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-
300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-p
rimary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const dateInputClass = `${inputClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;
  const textareaClass = `${inputClass} min-h-[140px] resize-y`;
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
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
  const alertClass = `rounded-2xl border px-4 py-3 text-sm font-medium ${
    darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
  }`;

  const handleOverlayClick = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className={overlayClass} onMouseDown={handleOverlayClick}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Incidencias</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar incidencia registrada</h2>
            <p className="mt-3 text-sm text-white/90">
              Revisa los datos vinculados a la incidencia para que el seguimiento sea ágil y preciso.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOverlayClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          {errorMessages.general && <div className={alertClass}>{errorMessages.general}</div>}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
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
                <option value="equipo">Equipos Personales</option>
                <option value="vestuario">Vestuario</option>
                <option value="equipos_comunes">Equipos Comunes</option>
              </select>
              {errorMessages.tipo && <p className={errorClass}>{errorMessages.tipo}</p>}

              {formValues.tipo === 'vehiculo' && (
                <div className="space-y-3">
                  <span className={labelClass}>Vehículo vinculado</span>
                  <input
                    type="text"
                    placeholder="Buscar vehículo..."
                    value={vehicleSearch}
                    onChange={(event) => setVehicleSearch(event.target.value)}
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
                    <option value="">Seleccione un vehículo</option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.matricula} value={vehicle.matricula}>
                        {vehicle.nombre}
                      </option>
                    ))}
                  </select>
                  {errorMessages.matricula && <p className={errorClass}>{errorMessages.matricula}</p>}
                </div>
              )}

              {formValues.tipo === 'personal' && (
                <div className="space-y-3">
                  <span className={labelClass}>Bombero implicado</span>
                  <input
                    type="text"
                    placeholder="Buscar empleado..."
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
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
                    <option value="">Seleccione un empleado</option>
                    {filteredUsers.map((employee) => (
                      <option key={employee.id_empleado} value={employee.id_empleado}>
                        {employee.nombre} {employee.apellido}
                      </option>
                    ))}
                  </select>
                  {errorMessages.id_empleado2 && <p className={errorClass}>{errorMessages.id_empleado2}</p>}
                </div>
              )}

              {formValues.tipo === 'vestuario' && (
                <div className="space-y-3">
                  <span className={labelClass}>Ítem de vestuario</span>
                  <input
                    type="text"
                    placeholder="Buscar ítem de vestuario..."
                    value={clothingSearch}
                    onChange={(event) => setClothingSearch(event.target.value)}
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
                    <option value="">Seleccione un ítem de vestuario</option>
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
                <div className="space-y-3">
                  <span className={labelClass}>Nombre del equipo</span>
                  <input
                    type="text"
                    name="nombre_equipo"
                    id="nombre_equipo"
                    value={formValues.nombre_equipo}
                    onChange={handleChange}
                    placeholder="Introduce el nombre del equipo..."
                    className={inputClass}
                    required
                  />
                  {errorMessages.nombre_equipo && <p className={errorClass}>{errorMessages.nombre_equipo}</p>}
                </div>
              )}

              {formValues.tipo === 'equipo' && (
                <div className="space-y-3">
                  <span className={labelClass}>Categoría del equipo</span>
                  <select
                    name="categoria_equipo"
                    id="categoria_equipo"
                    value={selectedCategory}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {equipmentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errorMessages.categoria_equipo && <p className={errorClass}>{errorMessages.categoria_equipo}</p>}

                  {selectedCategory && (
                    <div className="space-y-3">
                      <span className={labelClass}>Equipo asignado</span>
                      <input
                        type="text"
                        placeholder="Buscar equipo..."
                        value={equipmentSearch}
                        onChange={(event) => setEquipmentSearch(event.target.value)}
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
                        <option value="">Seleccione un equipo</option>
                        {filteredEquipments.map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.nombre}
                          </option>
                        ))}
                      </select>
                      {errorMessages.equipo && <p className={errorClass}>{errorMessages.equipo}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

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
                <option value="">Seleccione un parque</option>
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
                <option value="">Seleccione un nivel</option>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
              {errorMessages.nivel && <p className={errorClass}>{errorMessages.nivel}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Descripción</span>
              <textarea
                name="descripcion"
                id="descripcion"
                value={formValues.descripcion}
                onChange={handleChange}
                className={textareaClass}
                required
              />
              {errorMessages.descripcion && <p className={errorClass}>{errorMessages.descripcion}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <span className={labelClass}>Seguimiento</span>
              <textarea
                name="resolviendo"
                id="resolviendo"
                value={formValues.resolviendo}
                onChange={handleChange}
                className={`${textareaClass} min-h-[100px]`}
                placeholder="Añade notas sobre los siguientes pasos o alguna actualización de la incidencia."
              />
              <p className={helperClass}>Este campo es opcional y ayuda a compartir el estado actual.</p>
              {errorMessages.resolviendo && <p className={errorClass}>{errorMessages.resolviendo}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleOverlayClick}
              className={cancelButtonClass}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIncidentModal;
