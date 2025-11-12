// vite-project/src/components/CreateMessageModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import UsersApiService from '../services/UsuariosApiService';
import MessagesApiService from '../services/MessagesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const CreateMessageModal = ({ isOpen, onClose, currentUserRole, replyMessage }) => {
  const { darkMode } = useDarkMode();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageScope, setMessageScope] = useState('individual');
  const [formData, setFormData] = useState({
    receiver_id: '',
    subject: '',
    body: '',
    attachment: null,
    parent_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Obtener nombre del usuario al que se está respondiendo
  const replyToUserName = useMemo(() => {
    if (!replyMessage || !users.length) return '';
    const user = users.find(u => u.id_empleado === replyMessage.receiver_id);
    return user ? `${user.nombre} ${user.apellido}` : 'Usuario';
  }, [replyMessage, users]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await UsersApiService.getUsuarios();
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    setFormData({
      receiver_id: replyMessage ? replyMessage.receiver_id : '',
      subject: replyMessage
        ? replyMessage.subject.startsWith('Re:')
          ? replyMessage.subject
          : `Re: ${replyMessage.subject}`
        : '',
      body: '',
      attachment: null,
      parent_id: replyMessage ? replyMessage.parent_id || replyMessage.id : '',
    });
    setSearchTerm('');
    setMessageScope('individual');
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen, replyMessage]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const normalizedTerm = removeDiacritics(searchTerm.toLowerCase());
    const filtered = users.filter((candidate) => {
      const fullName = `${candidate.nombre} ${candidate.apellido}`.toLowerCase();
      return removeDiacritics(fullName).includes(normalizedTerm);
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  useEffect(() => {
    if (messageScope !== 'individual') {
      setFormData((prev) => ({ ...prev, receiver_id: '' }));
    }
  }, [messageScope]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      alert('Solo se permiten archivos PDF, JPG o PNG.');
      return;
    }
    if (file.size > 2048 * 1024) {
      alert('El archivo debe ser menor a 2 MB.');
      return;
    }

    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const data = new FormData();
    const normalizedRole = currentUserRole?.toLowerCase();

    if (!(normalizedRole === 'jefe' && messageScope !== 'individual')) {
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

    if (normalizedRole === 'jefe' && messageScope !== 'individual') {
      data.append('massive', messageScope);
    } else {
      data.append('massive', 'false');
    }

    try {
      await MessagesApiService.sendMessage(data);
      handleClose();
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      const backendMessage = error.response?.data;
      setSubmitError(
        typeof backendMessage === 'string'
          ? backendMessage
          : backendMessage?.error || 'No se pudo enviar el mensaje. Inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isChief = currentUserRole?.toLowerCase() === 'jefe';
  const messageScopeOptions = useMemo(
    () => [
      { value: 'individual', label: 'Mensaje individual' },
      { value: 'toda', label: 'Toda la plantilla' },
      { value: 'mandos', label: 'Mandos' },
      { value: 'bomberos', label: 'Bomberos' },
    ],
    []
  );

  // MEJORADO: Mejor posicionamiento en móvil, scroll desde arriba
  const overlayClass = 'fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 px-4 py-4 sm:py-8 backdrop-blur overflow-y-auto';
  
  // MEJORADO: Modal se ajusta mejor en móvil
  const modalClass = `relative my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white flex-shrink-0 ${
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
  const textareaClass = `min-h-[132px] w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
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
      <div className={modalClass} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Comunicaciones</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {replyMessage ? 'Responder mensaje' : 'Crear mensaje'}
            </h2>
            <p className="mt-3 text-sm text-white/90">
              {replyMessage
                ? 'Da seguimiento a la conversación manteniendo el historial de la bandeja.'
                : 'Envía un aviso al equipo seleccionando el destinatario o el alcance del mensaje masivo.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {submitError && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {submitError}
            </div>
          )}

          {/* NUEVO: Mostrar a quién se está respondiendo si es una respuesta */}
          {replyMessage && (
            <div
              className={`space-y-3 rounded-3xl border px-5 py-4 ${
                darkMode ? 'border-primary-500/30 bg-primary-500/5' : 'border-primary-200 bg-primary-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-primary-200' : 'text-primary-700'}`}>
                    Respondiendo a
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {replyToUserName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de alcance: SOLO si NO es respuesta Y el usuario es jefe */}
          {isChief && !replyMessage && (
            <div
              className={`space-y-3 rounded-3xl border px-5 py-4 ${
                darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className={labelClass}>Alcance del mensaje</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {messageScopeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                      messageScope === option.value
                        ? darkMode
                          ? 'border-primary-500 bg-primary-500/10 text-primary-200'
                          : 'border-primary-500 bg-primary-500/5 text-primary-700'
                        : darkMode
                          ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-primary-500/60'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={messageScope === option.value}
                      onChange={(event) => setMessageScope(event.target.value)}
                      disabled={isSubmitting}
                      className="h-4 w-4 accent-primary-500"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <p className={helperClass}>
                Los mensajes masivos se envían según el rol seleccionado y no requieren destinatario individual.
              </p>
            </div>
          )}

          {/* Selector de usuario: SOLO si es individual Y NO es respuesta */}
          {(!isChief || messageScope === 'individual') && !replyMessage && (
            <div className={`space-y-5 rounded-3xl border px-5 py-4 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
              <div className="space-y-2">
                <span className={labelClass}>Buscar usuario</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={inputClass}
                  placeholder="Introduce un nombre o apellido"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <span className={labelClass}>Destinatario</span>
                <select
                  name="receiver_id"
                  value={formData.receiver_id}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona un usuario</option>
                  {filteredUsers.map((candidate) => (
                    <option key={candidate.id_empleado} value={candidate.id_empleado}>
                      {candidate.nombre} {candidate.apellido}
                    </option>
                  ))}
                </select>
                <p className={helperClass}>Solo aparecerán usuarios con acceso activo en la plataforma.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className={labelClass}>Asunto</span>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={inputClass}
              placeholder="Añade un asunto descriptivo"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Mensaje</span>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              className={textareaClass}
              placeholder="Escribe el contenido del mensaje"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Archivo adjunto</span>
            <input type="file" onChange={handleFileChange} className={inputClass} disabled={isSubmitting} />
            <p className={helperClass}>Formatos permitidos: PDF, JPG, PNG (máx. 2&nbsp;MB).</p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMessageModal;