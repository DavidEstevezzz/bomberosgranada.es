import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const RequireFirefighterModal = ({ show, onClose, onAdd, brigade, fecha }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    id_empleado: '',
    turno: 'Mañana',
  });
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define todas las opciones de turno como en el primer archivo
  const turnoOptions = [
    "Mañana",
    "Tarde",
    "Noche",
    "Día Completo",
    "Mañana y tarde",
    "Tarde y noche"
  ];

  // Función para calcular los turnos de ida y vuelta según el turno seleccionado
  const computeAssignment = (turnoSeleccionado) => {
    let ida = '';
    let vuelta = '';
    switch (turnoSeleccionado) {
      case 'Mañana':
        ida = 'Mañana';
        vuelta = 'Tarde';
        break;
      case 'Tarde':
        ida = 'Tarde';
        vuelta = 'Noche';
        break;
      case 'Noche':
        ida = 'Noche';
        vuelta = 'Mañana';
        break;
      case 'Mañana y tarde':
        ida = 'Mañana';
        vuelta = 'Noche';
        break;
      case 'Tarde y noche':
        ida = 'Tarde';
        vuelta = 'Mañana';
        break;
      case 'Día Completo':
        ida = 'Mañana';
        vuelta = 'Mañana';
        break;
      default:
        break;
    }
    return { ida, vuelta };
  };

  useEffect(() => {
    if (show) {
      // Reiniciar estados
      setFormData({
        id_empleado: '',
        turno: 'Mañana',
      });
      setSuccess('');
      setError('');
      setIsSubmitting(false);
      setAssignmentDetails(computeAssignment('Mañana'));

      // Cargar usuarios
      const fetchUsuarios = async () => {
        try {
          const response = await UsuariosApiService.getUsuarios();
          // Filtramos solo bomberos (y opcionalmente mando, según tu lógica)
          const bomberos = response.data.filter(
            usuario => usuario.type === 'bombero' || usuario.type === 'mando'
          );
          setUsuarios(bomberos);
        } catch (err) {
          console.error('Error al obtener usuarios:', err);
          setError('Error al cargar la lista de bomberos');
        }
      };
      fetchUsuarios();
    }
  }, [show]);

  // Actualizar assignmentDetails cuando cambia el turno
  useEffect(() => {
    setAssignmentDetails(computeAssignment(formData.turno));
  }, [formData.turno]);

  useEffect(() => {
    const filtered = usuarios.filter(usuario =>
      `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formData.id_empleado || !formData.turno) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Calcular las fechas de ida y vuelta según el turno seleccionado
    const fecha_ida = fecha;
    let fecha_vuelta = fecha;
    
    // Para ciertos turnos, la asignación de vuelta se hace al día siguiente
    if (formData.turno === "Noche" || formData.turno === "Tarde y noche" || formData.turno === "Día Completo") {
      fecha_vuelta = dayjs(fecha).add(1, 'day').format('YYYY-MM-DD');
    }

    try {
      // Payload para asignación de ida (requerimiento)
      const payloadIda = {
        id_empleado: formData.id_empleado,
        id_brigada_destino: brigade.id_brigada,
        fecha_ini: fecha_ida,
        turno: assignmentDetails.ida,
        requerimiento: true,
      };

      // Payload para asignación de vuelta
      const payloadVuelta = {
        id_empleado: formData.id_empleado,
        id_brigada_destino: formData.id_brigada_origen || null, // Brigada de origen si está disponible
        fecha_ini: fecha_vuelta,
        turno: assignmentDetails.vuelta,
        requerimiento: false, // La vuelta no es un requerimiento
      };

      // Crear la asignación de ida
      await AssignmentsApiService.requireFirefighter(payloadIda);
      
      // Crear la asignación de vuelta
      // Nota: Es posible que necesites crear un endpoint específico para esto o modificar el existente
      // dependiendo de cómo esté implementado tu API
      await AssignmentsApiService.requireFirefighter(payloadVuelta);

      setSuccess('Requerimiento creado con éxito');
      if (onAdd) onAdd();
      onClose();
    } catch (err) {
      console.error('Error al crear el requerimiento:', err);
      setError('Error al crear el requerimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
      <div className="relative bg-gray-800 p-6 rounded-lg z-10 max-w-md w-full mx-4 my-8">
        <h2 className="text-2xl font-bold text-white mb-4">Requerir Bombero</h2>
        {success && <div className="bg-green-500 text-white p-2 mb-4 rounded">{success}</div>}
        {error && <div className="bg-red-500 text-white p-2 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Buscar bombero por nombre y apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <select
              name="id_empleado"
              onChange={handleChange}
              value={formData.id_empleado}
              required
              className="w-full p-2 rounded bg-gray-700 text-white"
              disabled={isSubmitting}
            >
              <option value="">Seleccione un Bombero</option>
              {filteredUsuarios.map(usuario => (
                <option key={usuario.id_empleado} value={usuario.id_empleado}>
                  {usuario.nombre} {usuario.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              name="turno"
              onChange={handleChange}
              value={formData.turno}
              required
              className="w-full p-2 rounded bg-gray-700 text-white"
              disabled={isSubmitting}
            >
              <option value="">Seleccione Turno</option>
              {turnoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Requerir'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequireFirefighterModal;