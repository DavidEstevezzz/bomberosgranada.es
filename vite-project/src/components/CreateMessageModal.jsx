import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import UsersApiService from '../services/UsuariosApiService';
import MessagesApiService from '../services/MessagesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const isMobileDevice = () => window.innerWidth <= 768;

const CreateMessageModal = ({ isOpen, onClose, currentUserRole, replyMessage }) => {
  const { darkMode } = useDarkMode();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    receiver_id: '',
    subject: '',
    body: '',
    attachment: null,
    parent_id: '',
  });
  const [isMassive, setIsMassive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user } = useStateContext();

  useEffect(() => {
    if (isOpen) {
      setIsMobile(isMobileDevice());
      fetchUsers();

      setFormData({
        // Si es respuesta, asignamos receiver_id del objeto replyMessage
        receiver_id: replyMessage ? replyMessage.receiver_id : '',
        subject: replyMessage
          ? replyMessage.subject.startsWith('Re:')
            ? replyMessage.subject
            : 'Re: ' + replyMessage.subject
          : '',
        body: '',
        attachment: null,
        parent_id: replyMessage ? replyMessage.parent_id || replyMessage.id : '',
      });

      setSearchTerm('');
      setIsMassive(false);
      setIsSubmitting(false);
    }
  }, [isOpen, replyMessage]);

  const fetchUsers = async () => {
    try {
      const response = await UsersApiService.getUsuarios();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const normalizedTerm = removeDiacritics(searchTerm.toLowerCase());
    const filtered = users.filter((user) => {
      const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
      return removeDiacritics(fullName).includes(normalizedTerm);
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        alert('Solo se permiten archivos PDF, JPG o PNG.');
        return;
      }
      if (file.size > 2048 * 1024) {
        alert('El archivo debe ser menor a 2 MB.');
        return;
      }
      setFormData((prev) => ({ ...prev, attachment: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    if (!isMassive) {
      data.append('receiver_id', formData.receiver_id);
    }
    data.append('subject', formData.subject);
    data.append('body', formData.body);
    if (formData.parent_id) {
      data.append('parent_id', formData.parent_id);
    }
    if (formData.attachment) {
      data.append('attachment', formData.attachment);
    }
    if (isMassive) {
      data.append('massive', '1');
    }

    try {
      await MessagesApiService.sendMessage(data);
      onClose();
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContentClass = isMobile ? 'overflow-y-auto h-screen' : '';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className={`p-6 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} ${modalContentClass}`}>
        <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {replyMessage ? 'Responder Mensaje' : 'Crear Mensaje'}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {currentUserRole === 'Jefe' && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isMassive}
                onChange={(e) => setIsMassive(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Mensaje masivo (para todos los usuarios)</span>
            </label>
          </div>
        )}

        {/* Si no es masivo ni respuesta, se muestra el buscador y selector */}
        {!isMassive && !replyMessage && (
          <>
            <div className="mb-4">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Buscar Usuario
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
                placeholder="Escriba un nombre"
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-4">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Destinatario
              </label>
              <select
                name="receiver_id"
                value={formData.receiver_id}
                onChange={handleChange}
                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                required={!isMassive}
                disabled={isSubmitting}
              >
                <option value="">Seleccione un usuario</option>
                {filteredUsers.map((u) => (
                  <option key={u.id_empleado} value={u.id_empleado}>
                    {u.nombre} {u.apellido}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Asunto
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Mensaje
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
              rows="4"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Archivo Adjunto
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className={`block w-full text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode
                  ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600'
                  : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600'
              }`}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-4 ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMessageModal;
