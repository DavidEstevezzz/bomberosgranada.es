import React, { useState, useEffect } from 'react';
import MessagesApiService from '../services/MessagesApiService';
import UsersApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import CreateMessageModal from '../components/CreateMessageModal';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilePdf, faCheckDouble, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useStateContext } from '../contexts/ContextProvider';

// Componente recursivo para mostrar el hilo de conversación (estilo chat)
const MessageThread = ({ message, onReply, users }) => {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();

  const getUserName = (userId) => {
    const id = Number(userId);
    const foundUser = users.find((u) => Number(u.id_empleado) === id);
    return foundUser ? `${foundUser.nombre} ${foundUser.apellido}` : 'Desconocido';
  };

  const isOwnMessage = Number(message.sender_id) === Number(user.id_empleado);
  const isLastMessage = !message.replies || message.replies.length === 0;

  const handleDownloadAttachment = async () => {
    try {
      const response = await MessagesApiService.downloadAttachment(message.id);

      let filename = 'attachment';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error al descargar el adjunto:", error);
      alert("Error al descargar el archivo adjunto. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className={`flex w-full my-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`relative max-w-[75%] p-3 rounded-xl shadow-md text-sm transition-all ${
            isOwnMessage
              ? `bg-green-500 text-white ${darkMode ? 'dark:bg-green-600' : ''}`
              : `bg-gray-200 text-gray-800 ${darkMode ? 'dark:bg-gray-700 dark:text-white' : ''}`
          }`}
          style={{ alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }}
        >
          {!isOwnMessage && (
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              {getUserName(message.sender_id)}
            </p>
          )}
          <p>{message.body}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-right">
            {dayjs(message.created_at).format('HH:mm')}
          </p>
          {message.attachment && (
            <button
              onClick={handleDownloadAttachment}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4 inline-block mr-1" />
              Descargar Adjunto
            </button>
          )}
          {isLastMessage && (
            <button
              onClick={() => onReply(message)}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-all"
            >
              Responder
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full">
        {message.replies && message.replies.length > 0 && (
          message.replies.map((reply) => (
            <MessageThread
              key={reply.id}
              message={reply}
              onReply={onReply}
              users={users}
            />
          ))
        )}
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // Verificar si el usuario es jefe
  const isJefe = user?.type === 'jefe';

  // Función para verificar si un mensaje es masivo
  const isMassiveMessage = (message) => {
    return message.massive && message.massive !== 'false';
  };

  // Función para verificar si se puede eliminar un mensaje
  const canDeleteMessage = (message) => {
    // Los jefes pueden eliminar cualquier mensaje
    if (isJefe) return true;
    
    // Los usuarios normales solo pueden eliminar mensajes no masivos
    return !isMassiveMessage(message);
  };

  const getUserName = (userId) => {
    const id = Number(userId);
    const found = users.find((u) => Number(u.id_empleado) === id);
    return found ? `${found.nombre} ${found.apellido}` : 'Desconocido';
  };

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, [view, currentMonth]);

  const fetchUsers = async () => {
    try {
      const response = await UsersApiService.getUsuarios();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const messages =
        view === 'inbox'
          ? await MessagesApiService.getInbox()
          : await MessagesApiService.getSent();
      const filteredMessages = messages.data.filter((message) =>
        dayjs(message.created_at).isSame(currentMonth, 'month')
      );
      if (view === 'inbox') setInbox(filteredMessages);
      else setSent(filteredMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRootMessage = async (message) => {
    if (!message.parent_id) return message;

    const response = await MessagesApiService.getMessageThread(message.parent_id);
    const parentMessage = response.data.message ? response.data.message : response.data;

    return fetchRootMessage(parentMessage);
  };

  const handleOpenMessage = async (message) => {
    if (!message.is_read && message.receiver_id === user.id_empleado) {
      try {
        await MessagesApiService.markAsRead(message.id);
        setInbox((prevInbox) =>
          prevInbox.map((msg) =>
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );
        setSent((prevSent) =>
          prevSent.map((msg) =>
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );
      } catch (error) {
        console.error("Error al marcar mensaje como leído:", error);
      }
    }

    try {
      const fullMessage = await fetchRootMessage(message);

      if (!fullMessage.replies) {
        fullMessage.replies = [];
      }

      setSelectedMessage(fullMessage);
    } catch (error) {
      console.error('Error fetching message thread:', error);
    }
  };

  const handleReply = (message) => {
    setSelectedMessage(null);

    const subject = message.subject || (message.message && message.message.subject);
    if (!subject) {
      console.error("El mensaje o su asunto es undefined:", message);
      return;
    }
    const replySubject = subject.startsWith('Re:') ? subject : 'Re: ' + subject;
    const replyData = {
      receiver_id: message.sender_id || (message.message && message.message.sender_id),
      subject: replySubject,
      parent_id: message.id || (message.message && message.message.id),
      body: ''
    };
    setReplyMessage(replyData);
    setShowModal(true);
  };

  // NUEVA FUNCIÓN: Marcar mensaje masivo como leído
  const handleMarkMassiveAsRead = async (messageId) => {
    try {
      await MessagesApiService.markMassiveAsRead(messageId);
      
      // Actualizar la UI localmente
      setInbox((prevInbox) =>
        prevInbox.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_by_admin: true } : msg
        )
      );
      
      alert('Mensaje masivo marcado como leído para todos los usuarios correspondientes.');
    } catch (error) {
      console.error('Error al marcar mensaje masivo como leído:', error);
      alert('Error al marcar el mensaje como leído. Verifique que tenga permisos de jefe.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este mensaje?')) {
      return;
    }

    try {
      await MessagesApiService.deleteMessage(id);
      fetchMessages();
      alert('Mensaje eliminado correctamente.');
    } catch (error) {
      console.error('Error deleting message:', error);
      if (error.response?.status === 403) {
        alert(error.response.data.error || 'No tiene permisos para eliminar este mensaje.');
      } else {
        alert('Error al eliminar el mensaje.');
      }
    }
  };

  const handleDownloadAttachment = async (id, filename) => {
    try {
      const response = await MessagesApiService.downloadAttachment(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  const closeModal = () => {
    setShowModal(false);
    setReplyMessage(null);
    fetchMessages();
  };

  if (loading) return <div className="text-center py-4">Cargando...</div>;

  const messages = view === 'inbox' ? inbox : sent;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <button
          onClick={() => { setReplyMessage(null); setShowModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Crear Mensaje
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setView('inbox')}
            className={`px-4 py-2 rounded ${view === 'inbox' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}
          >
            Bandeja de Entrada
          </button>
          <button
            onClick={() => setView('sent')}
            className={`px-4 py-2 rounded ${view === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}
          >
            Bandeja de Salida
          </button>
        </div>
        <div className="flex space-x-4">
          <button onClick={handlePreviousMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Anterior
          </button>
          <span className="text-lg mt-2 font-semibold">
            {currentMonth.format('MMMM YYYY').charAt(0).toUpperCase() +
              currentMonth.format('MMMM YYYY').slice(1)}
          </span>
          <button onClick={handleNextMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Siguiente
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto text-center">
          <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
            <tr>
              <th className="py-2 px-4">Fecha</th>
              <th className="py-2 px-4">Asunto</th>
              <th className="py-2 px-4">Remitente/Destinatario</th>
              <th className="py-2 px-4">Tipo</th>
              <th className="py-2 px-4">Estado</th>
              <th className="py-2 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {messages.length > 0 ? (
              messages.map((message) => (
                console.log(`Mensaje ${message.id}:`, {
                  isJefe: user?.type === 'jefe',
                  isMassive: isMassiveMessage(message),
                  isRead: message.is_read,
                  massive: message.massive,
                  view: view
                }),
                <tr
                  key={message.id}
                  className={`border-b ${message.is_read ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  <td className="py-2 px-4">
                    {new Date(message.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">{message.subject || 'Sin asunto'}</td>
                  <td className="py-2 px-4">
                    {view === 'inbox'
                      ? getUserName(message.sender_id)
                      : getUserName(message.receiver_id)}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isMassiveMessage(message) 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {isMassiveMessage(message) ? `Masivo (${message.massive})` : 'Individual'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      message.is_read 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {message.is_read ? 'Leído' : 'No leído'}
                      {message.read_by_admin && ' (Admin)'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex space-x-2 justify-center items-center">
                      <button
                        onClick={() => handleOpenMessage(message)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Abrir
                      </button>
                      
                      {/* Botón para marcar mensaje masivo como leído (solo para jefes y mensajes masivos no leídos) */}
                      {isJefe && isMassiveMessage(message) && !message.is_read && view === 'inbox' && (
                        <button
                          onClick={() => handleMarkMassiveAsRead(message.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          title="Marcar como leído para todos"
                        >
                          <FontAwesomeIcon icon={faCheckDouble} className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Botón de eliminar con lógica condicional */}
                      {canDeleteMessage(message) && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          title={isJefe ? "Eliminar mensaje (Admin)" : "Eliminar mensaje"}
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No hay mensajes en esta bandeja.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateMessageModal
          isOpen={showModal}
          onClose={closeModal}
          currentUserRole={user?.type}
          replyMessage={replyMessage}
        />
      )}

      {selectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity">
          <div
            className={`p-6 w-full max-w-2xl rounded-lg shadow-lg transition-all ${
              darkMode ? 'bg-gray-900 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            {/* Encabezado de la modal */}
            <div className={`flex justify-between items-center pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <h2 className="text-lg font-bold">Chat</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className={`p-2 rounded-full focus:outline-none focus:ring-2 ${
                  darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Contenido del chat con scrollbar y mayor ancho */}
            <div className="overflow-y-auto max-h-[500px] p-4 space-y-2">
              <MessageThread message={selectedMessage} onReply={handleReply} users={users} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;