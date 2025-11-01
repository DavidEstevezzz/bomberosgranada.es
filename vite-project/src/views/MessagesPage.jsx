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
        const filenameMatch = contentDisposition.match(/filename=\"(.+)\"/);
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

  const baseBubbleClass =
    'relative max-w-[75%] rounded-3xl px-5 py-4 text-[15px] leading-7 shadow-lg ring-1 transition-all duration-300';
  const ownMessageClass = darkMode
    ? 'bg-primary-500/15 text-primary-100 ring-primary-400/40 ml-auto'
    : 'bg-primary-500 text-white ring-primary-500/40 ml-auto shadow-primary-300/40';
  const incomingMessageClass = darkMode
    ? 'bg-slate-900/80 text-slate-100 ring-slate-700'
    : 'bg-white text-slate-700 ring-slate-200';
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-500';
  const actionButtonClass = `mt-3 inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${darkMode
    ? 'bg-primary-500/20 text-primary-100 hover:bg-primary-500/30 focus:ring-primary-400/50 focus:ring-offset-slate-900'
    : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500/50 focus:ring-offset-white'
    }`;

  return (
    <div className="flex flex-col w-full">
      <div className={`flex w-full py-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`${baseBubbleClass} ${isOwnMessage ? ownMessageClass : incomingMessageClass
            }`}
          style={{ alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }}
        >
          {!isOwnMessage && (
            <p className="mb-1 text-xs font-semibold text-primary-600 dark:text-primary-200">
              {getUserName(message.sender_id)}
            </p>
          )}
          <p className="leading-relaxed">{message.body}</p>
          <p className={`mt-2 text-[10px] text-right font-medium ${subtleTextClass}`}>
            {dayjs(message.created_at).format('DD MMM YYYY · HH:mm')}
          </p>
          {message.attachment && (
            <button
              onClick={handleDownloadAttachment}
              className={`mt-3 inline-flex items-center gap-2 text-[11px] font-semibold transition-colors ${darkMode
                ? 'text-primary-200 hover:text-primary-100'
                : 'text-primary-600 hover:text-primary-700'
                }`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="h-3.5 w-3.5" />
              Descargar adjunto
            </button>
          )}
          {isLastMessage && (
            <button onClick={() => onReply(message)} className={actionButtonClass}>
              Responder
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full pl-6">
        {message.replies && message.replies.length > 0 &&
          message.replies.map((reply) => (
            <MessageThread key={reply.id} message={reply} onReply={onReply} users={users} />
          ))}
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

  const pageWrapperClass = `min-h-[calc(100vh-6rem)] w-full px-4 py-10 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`;
  const cardContainerClass = `mx-auto max-w-6xl overflow-hidden rounded-3xl border shadow-xl backdrop-blur ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
    }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const statsCardClass = `rounded-2xl border px-5 py-4 transition-colors duration-200 ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white/80'
    }`;
  const statsLabelClass =
    'text-sm font-semibold uppercase tracking-[0.28em] text-primary-600 dark:text-primary-100';
  const statsValueClass = 'mt-2 text-3xl font-semibold';
  const toggleWrapperClass = `inline-flex flex-wrap gap-2 rounded-full border px-3 py-3 transition-colors duration-200 ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
    }`;
  const toggleButtonClass = (isActive) =>
    `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isActive
      ? darkMode
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 focus:ring-primary-500/60 focus:ring-offset-slate-900'
        : 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 focus:ring-primary-500/50 focus:ring-offset-slate-50'
      : darkMode
        ? 'border border-slate-700 bg-transparent text-slate-300 hover:border-primary-400 hover:text-primary-100 focus:ring-primary-400/40 focus:ring-offset-slate-900'
        : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600 focus:ring-primary-400/40 focus:ring-offset-slate-50'
    }`;
  const baseButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const primaryButtonClass = `${baseButtonClass} ${darkMode
    ? 'bg-primary-500 text-white hover:bg-primary-400 focus:ring-primary-500/60 focus:ring-offset-slate-900'
    : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500/50 focus:ring-offset-slate-50'
    }`;
  const monthButtonClass = `${baseButtonClass} ${darkMode
    ? 'border border-slate-700 bg-slate-900/70 text-slate-100 hover:border-primary-400 hover:text-primary-100 focus:ring-primary-500/50 focus:ring-offset-slate-900'
    : 'border border-slate-200 bg-white text-slate-700 hover:border-primary-400 hover:text-primary-600 focus:ring-primary-400/40 focus:ring-offset-slate-50'
    }`;
  const actionPillClass = (variant) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
    if (variant === 'primary') {
      return `${base} ${darkMode
        ? 'bg-primary-500/25 text-primary-50 hover:bg-primary-500/35 focus:ring-primary-300/40 focus:ring-offset-slate-900'
        : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500/40 focus:ring-offset-white'
        }`;
    }
    if (variant === 'success') {
      return `${base} ${darkMode
        ? 'bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35 focus:ring-emerald-400/40 focus:ring-offset-slate-900'
        : 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/40 focus:ring-offset-white'
        }`;
    }
    if (variant === 'danger') {
      return `${base} ${darkMode
        ? 'bg-red-500/25 text-red-100 hover:bg-red-500/35 focus:ring-red-400/40 focus:ring-offset-slate-900'
        : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/40 focus:ring-offset-white'
        }`;
    }
    return base;
  };
  const badgeClass = (variant) =>
    `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${variant === 'unread'
      ? darkMode
        ? 'bg-primary-500/30 text-primary-50'
        : 'bg-primary-100 text-primary-600'
      : variant === 'attachment'
        ? darkMode
          ? 'bg-amber-500/25 text-amber-100'
          : 'bg-amber-100 text-amber-600'
        : darkMode
          ? 'bg-slate-800 text-slate-100'
          : 'bg-slate-100 text-slate-600'
    }`;

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
    const userId = user.id_empleado;
    const isMassive = message.massive && message.massive !== 'false';

    // Marcar como leído si el usuario actual no lo ha leído aún
    if (!message.is_read) {
      try {
        await MessagesApiService.markAsRead(message.id);

        // Actualizar estado local en la bandeja de entrada
        setInbox((prevInbox) =>
          prevInbox.map((msg) =>
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );

        // Si es masivo y estamos en bandeja de salida, actualizar el contador
        if (isMassive) {
          setSent((prevSent) =>
            prevSent.map((msg) =>
              msg.id === message.id
                ? {
                  ...msg,
                  read_count: (msg.read_count || 0) + 1
                }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("Error al marcar mensaje como leído:", error);
      }
    }

    // Cargar el hilo completo del mensaje
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
  // FUNCIÓN: Marcar mensaje masivo como leído
  const handleMarkMassiveAsRead = async (messageId) => {
    try {
      const response = await MessagesApiService.markMassiveAsRead(messageId);

      // Actualizar la UI localmente en ambas bandejas
      setInbox((prevInbox) =>
        prevInbox.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_by_admin: true } : msg
        )
      );

      setSent((prevSent) =>
        prevSent.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_by_admin: true } : msg
        )
      );

      const markedFrom = response.data.marked_from === 'sent' ? 'enviado' : 'recibido';
      alert(`Mensaje masivo ${markedFrom} marcado como leído para todos los usuarios correspondientes.`);
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

  if (loading) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-semibold">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  const messages = view === 'inbox' ? inbox : sent;
  const unreadCount = messages.filter((message) => !message.is_read).length;
  const capitalizedMonth =
    currentMonth.format('MMMM YYYY').charAt(0).toUpperCase() +
    currentMonth.format('MMMM YYYY').slice(1);
  const messageStats = [
    { label: 'Bandeja actual', value: view === 'inbox' ? 'Entrada' : 'Salida' },
    { label: 'Mensajes del mes', value: messages.length },
    { label: 'Sin leer', value: unreadCount },
  ];

  return (
    <div className={pageWrapperClass}>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 transition-colors duration-300 ${darkMode
            ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80 text-white'
            : 'from-primary-200 via-primary-300 to-primary-400 text-slate-900'
            }`}
        >
          <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${darkMode ? 'text-white/90' : 'text-slate-800/90'
            }`}>
            Centro de comunicaciones
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Mensajes internos</h1>
          <p className={`mt-3 max-w-3xl text-sm ${darkMode ? 'text-white/90' : 'text-slate-700/90'
            }`}>
            Consulta, responde y gestiona los mensajes de tu equipo.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className="grid gap-5 sm:grid-cols-3">
            {messageStats.map((stat) => (
              <div key={stat.label} className={statsCardClass}>
                <p className={statsLabelClass}>{stat.label}</p>
                <p className={statsValueClass}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className={toggleWrapperClass}>
              <button onClick={() => setView('inbox')} className={toggleButtonClass(view === 'inbox')}>
                Bandeja de entrada
              </button>
              <button onClick={() => setView('sent')} className={toggleButtonClass(view === 'sent')}>
                Bandeja de salida
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex items-center gap-2">
                <button onClick={handlePreviousMonth} className={monthButtonClass}>
                  Mes anterior
                </button>
                <span className={`text-base font-semibold ${subtleTextClass}`}>{capitalizedMonth}</span>
                <button onClick={handleNextMonth} className={monthButtonClass}>
                  Mes siguiente
                </button>
              </div>
              <button
                onClick={() => {
                  setReplyMessage(null);
                  setShowModal(true);
                }}
                className={primaryButtonClass}
              >
                Crear mensaje
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border shadow-lg transition-colors duration-200 ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white/90'
              }`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-base dark:divide-slate-800">
                <thead
                  className={`${darkMode
                    ? 'bg-slate-900/90 text-slate-100'
                    : 'bg-slate-50 text-slate-700'
                    } text-sm font-semibold uppercase tracking-[0.18em]`}
                >
                  <tr>
                    <th className="px-6 py-5">Fecha</th>
                    <th className="px-6 py-5">Asunto</th>
                    <th className="px-6 py-5">Remitente/Destinatario</th>
                    <th className="px-6 py-5">Tipo</th>
                    <th className="px-6 py-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {messages.length > 0 ? (
                    messages.map((message) => {
                      const isMassive = isMassiveMessage(message);
                      const isUnread = !message.is_read;
                      return (
                        <tr
                          key={message.id}
                          className={`transition-colors duration-200 ${isUnread
                            ? darkMode
                              ? 'bg-primary-500/10 hover:bg-primary-500/20'
                              : 'bg-primary-50 hover:bg-primary-100/60'
                            : darkMode
                              ? 'hover:bg-slate-900/50'
                              : 'hover:bg-slate-50'
                            }`}
                        >
                          <td className={`px-6 py-4 align-top text-base font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'
                            }`}>
                            {new Date(message.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              <p className={`text-base font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'
                                }`}>
                                {message.subject || 'Sin asunto'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {isUnread && <span className={badgeClass('unread')}>Nuevo</span>}
                                {message.attachment && (
                                  <span className={badgeClass('attachment')}>Adjunto</span>
                                )}
                              </div>
                              {view === 'sent' && isMassive && (
                                <div className="mt-2 text-xs">
                                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                                    📊 Leído por: {message.read_count || 0} de {message.total_recipients || 0} usuarios
                                    {message.read_percentage && ` (${message.read_percentage}%)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <p className={`text-base font-medium ${darkMode ? 'text-slate-100' : 'text-slate-700'
                              }`}>
                              {view === 'inbox'
                                ? getUserName(message.sender_id)
                                : getUserName(message.receiver_id)}
                            </p>
                            <p className={`mt-1 text-sm ${subtleTextClass}`}>
                              {isMassive
                                ? 'Mensaje enviado a múltiples destinatarios'
                                : 'Comunicación individual'}
                            </p>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span
                              className={badgeClass(isMassive ? 'massive' : 'individual')}
                            >
                              {isMassive ? `Masivo (${message.massive})` : 'Individual'}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap items-center justify-center gap-2 text-base">
                              <button
                                onClick={() => handleOpenMessage(message)}
                                className={actionPillClass('primary')}
                              >
                                Abrir
                              </button>

                              {/* Mostrar botón de marcar como leído si:
        - El usuario es jefe
        - El mensaje es masivo
        - El mensaje NO está marcado como leído
        - Están en bandeja de entrada O en bandeja de salida */}
                              {isJefe && isMassive && !message.is_read && (
                                <button
                                  onClick={() => handleMarkMassiveAsRead(message.id)}
                                  className={actionPillClass('success')}
                                  title="Marcar como leído para todos los destinatarios"
                                >
                                  <FontAwesomeIcon icon={faCheckDouble} className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {canDeleteMessage(message) && (
                                <button
                                  onClick={() => handleDelete(message.id)}
                                  className={actionPillClass('danger')}
                                  title={isJefe ? 'Eliminar mensaje (admin)' : 'Eliminar mensaje'}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-base font-medium">
                        No hay mensajes en esta bandeja durante el mes seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showModal && (
            <CreateMessageModal
              isOpen={showModal}
              onClose={closeModal}
              currentUserRole={user?.type}
              replyMessage={replyMessage}
            />
          )}
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur">
          <div
            className={`w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 ${darkMode
              ? 'border-slate-800 bg-slate-950/95'
              : 'border-slate-200 bg-white/95'
              }`}
          >
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-100'
                }`}
            >
              <h2 className="text-lg font-semibold">Conversación</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className={`rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode
                  ? 'text-slate-300 hover:bg-slate-800 focus:ring-slate-700 focus:ring-offset-slate-900'
                  : 'text-slate-500 hover:bg-slate-200 focus:ring-slate-200 focus:ring-offset-white'
                  }`}
                aria-label="Cerrar conversación"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-6">
              <MessageThread message={selectedMessage} onReply={handleReply} users={users} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;