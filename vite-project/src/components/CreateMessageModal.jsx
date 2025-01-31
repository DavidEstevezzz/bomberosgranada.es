import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import UsersApiService from '../services/UsuariosApiService';
import MessagesApiService from '../services/MessagesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const CreateMessageModal = ({ isOpen, onClose }) => {
  const { darkMode } = useDarkMode();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    receiver_id: '',
    subject: '',
    body: '',
    attachment: null,
  });

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const response = await UsersApiService.getUsuarios();
          const allUsers = response.data;
          setUsers(allUsers);
          setFilteredUsers(allUsers); // Mostrar todos los usuarios inicialmente
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();

      // Resetear formulario al abrir modal
      setFormData({
        receiver_id: '',
        subject: '',
        body: '',
        attachment: null,
      });
    }
  }, [isOpen]);

  // Filtrar ignorando tildes
  useEffect(() => {
    const searchTermNormalized = removeDiacritics(searchTerm.toLowerCase());
    
    const filtered = users.filter(user => {
      const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
      const fullNameNormalized = removeDiacritics(fullName);
      return fullNameNormalized.includes(searchTermNormalized);
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        alert('Solo se permiten archivos PDF, JPG o PNG.');
        return;
      }
      if (file.size > 2048 * 1024) { // 2 MB
        alert('El archivo debe ser menor a 2 MB.');
        return;
      }
      setFormData({ ...formData, attachment: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('receiver_id', formData.receiver_id);
    data.append('subject', formData.subject);
    data.append('body', formData.body);
    if (formData.attachment) {
      data.append('attachment', formData.attachment);
    }

    try {
      await MessagesApiService.sendMessage(data);
      onClose(); // Cerrar modal al enviar
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`p-6 w-full max-w-2xl rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        <div
          className={`flex justify-between items-center pb-4 mb-4 border-b ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Crear Mensaje
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${
              darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className={`block mb-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Buscar Usuario
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'
              }`}
              placeholder="Escriba un nombre"
            />
          </div>

          <div className="mb-4">
            <label
              className={`block mb-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Destinatario
            </label>
            <select
              name="receiver_id"
              value={formData.receiver_id}
              onChange={handleChange}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'
              }`}
              required
            >
              <option value="">Seleccione un usuario</option>
              {filteredUsers.map((user) => (
                <option key={user.id_empleado} value={user.id_empleado}>
                  {user.nombre} {user.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className={`block mb-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Asunto
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'
              }`}
              required
            />
          </div>

          <div className="mb-4">
            <label
              className={`block mb-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Mensaje
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'
              }`}
              rows="4"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className={`block mb-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Archivo Adjunto
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className={`block w-full text-sm ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode
                  ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900'
                  : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800'
                  : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'
              }`}
            >
              Enviar Mensaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMessageModal;
