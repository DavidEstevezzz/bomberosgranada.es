import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const RequireFirefighterModal = ({ show, onClose, onAdd, brigade, fecha }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    id_empleado: '',
    turno: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
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
        }
      };
      fetchUsuarios();
    }
  }, [show]);

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
    if (!formData.id_empleado || !formData.turno) {
      setError("Por favor, complete todos los campos.");
      return;
    }
    try {
      const payload = {
        id_empleado: formData.id_empleado,
        id_brigada_destino: brigade.id_brigada, // Se usa la brigada de la guardia
        fecha: fecha, // La fecha de la guardia
        turno: formData.turno,
        requerimiento: true, // Marcamos que es una asignación de requerimiento (ida)
      };
      await AssignmentsApiService.requireFirefighter(payload);
      setSuccess('Requerimiento creado con éxito');
      if (onAdd) onAdd();
      onClose();
    } catch (err) {
      console.error('Error al crear el requerimiento:', err);
      setError('Error al crear el requerimiento.');
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
            >
              <option value="">Seleccione Turno</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Requerir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded"
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
