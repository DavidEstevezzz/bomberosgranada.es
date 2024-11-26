import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ExtraHourApiService from '../services/ExtraHourApiService';
import SalariesApiService from '../services/SalariesApiService';
import UsersApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';

const AddExtraHourModal = ({ isOpen, onClose, onAdd }) => {
  const [formValues, setFormValues] = useState({});

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  // Resetear el estado del formulario y los errores cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      fetchData();

      setFormValues({
        id_empleado: '',
        date: '',
        horas_diurnas: 0,
        horas_nocturnas: 0,
        id_salario: '',
      });
      setErrorMessages({});
      setIsSubmitting(false);  // Asegurarse de resetear el estado de envío
    }
  }, [isOpen]);
      
  const fetchData = async () => {
    try {
      const employeeResponse = await UsersApiService.getUsuarios();
      const salaryResponse = await SalariesApiService.getSalaries();

      setEmployees(employeeResponse.data);
      setSalaries(salaryResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  // Verificar si el modal está abierto
  if (!isOpen) return null;

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  // Manejar el envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();  // Prevenir comportamiento por defecto

    // Bloquear el envío si ya está en proceso
    if (isSubmitting) {
      console.log("El formulario ya se está enviando.");
      return;
    }

    setIsSubmitting(true);  // Bloquear el botón de envío
    setErrorMessages({});  // Limpiar mensajes de error

    try {
      // Formatear la fecha
      const formattedDate = dayjs(formValues.date).format('YYYY-MM-DD');

      const dataToSend = {
        ...formValues,
        date: formattedDate,
      };

      console.log("Datos que se enviarán a la API:", dataToSend);

      // Esperar la respuesta de la API
      const response = await ExtraHourApiService.createExtraHour(dataToSend);

      console.log('Respuesta de la API:', response.data);

      // Esperar el resultado de onAdd antes de cerrar el modal
      onAdd();  // Una vez creado el nuevo item mando un evento para que la tabla recargue el listado
      // Si quisiera enviar la informacion del objeto creado pasaria al evento response.data

      // Cerrar el modal solo después de que todo el proceso esté completo
      onClose();
    } catch (error) {
      console.error('Error al añadir horas extras:', error);
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);  // Establecer mensajes de error de la respuesta
      } else {
        setErrorMessages({ general: 'Ocurrió un error.' });
      }
    } finally {
      console.log("Finalizando el proceso de envío.");
      setIsSubmitting(false);  // Desbloquear el botón de envío al final de la operación
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold`}>Añadir Hora Extra</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="id_empleado" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Empleado</label>
              <select
                name="id_empleado"
                id="id_empleado"
                value={formValues.id_empleado}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un empleado</option>
                {employees.map(employee => (
                  <option key={employee.id_empleado} value={employee.id_empleado}>
                    {employee.nombre} {employee.apellido}
                  </option>
                ))}
              </select>
              {errorMessages.id_empleado && <span className="text-red-500 text-sm">{errorMessages.id_empleado}</span>}
            </div>
            <div>
              <label htmlFor="date" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fecha</label>
              <input
                type="date"
                name="date"
                id="date"
                value={formValues.date}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              />
              {errorMessages.date && <span className="text-red-500 text-sm">{errorMessages.date}</span>}
            </div>
            <div>
              <label htmlFor="horas_diurnas" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Horas Diurnas</label>
              <input
                type="number"
                name="horas_diurnas"
                id="horas_diurnas"
                value={formValues.horas_diurnas}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              />
              {errorMessages.horas_diurnas && <span className="text-red-500 text-sm">{errorMessages.horas_diurnas}</span>}
            </div>
            <div>
              <label htmlFor="horas_nocturnas" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Horas Nocturnas</label>
              <input
                type="number"
                name="horas_nocturnas"
                id="horas_nocturnas"
                value={formValues.horas_nocturnas}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              />
              {errorMessages.horas_nocturnas && <span className="text-red-500 text-sm">{errorMessages.horas_nocturnas}</span>}
            </div>
            <div>
              <label htmlFor="id_salario" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salario</label>
              <select
                name="id_salario"
                id="id_salario"
                value={formValues.id_salario}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                required
              >
                <option value="">Seleccione un salario</option>
                {salaries.map(salary => (
                  <option key={salary.id_salario} value={salary.id_salario}>
                    {salary.tipo}
                  </option>
                ))}
              </select>
              {errorMessages.id_salario && <span className="text-red-500 text-sm">{errorMessages.id_salario}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Añadir Hora Extra'}
            </button>
            <button type="button" onClick={onClose} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExtraHourModal;
