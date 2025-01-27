import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faInbox, faUser, faPeopleGroup, faGear, faFile, faClock, faCalendar, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import MessagesApiService from '../services/MessagesApiService';

const Aside = ({ className }) => {
  const { user } = useStateContext(); // Obtén el usuario del contexto
  const [dropdownOpen, setDropdownOpen] = useState({
    users: false,
    pages: false,
    settings: false,
    extraHours: false,
    solicitudes: false,
  });
  const [unreadCount, setUnreadCount] = useState(0); // Contador de mensajes no leídos

  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (user) {
      fetchUnreadMessages();
    }
  }, [user]);

  const fetchUnreadMessages = async () => {
    try {
      const response = await MessagesApiService.getInbox();
      const unreadMessages = response.data.filter((message) => !message.is_read);
      setUnreadCount(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen((prevState) => ({
      ...prevState,
      [dropdown]: !prevState[dropdown],
    }));
  };

  if (!user) {
    return (
      <aside className={`w-64 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-300 text-black'} ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <p>Cargando menú...</p>
        </div>
      </aside>
    );
  }

  const userType = user.type; // Asume que el campo `type` contiene el rol del usuario

  return (
<aside
  className={`w-64 h-full overflow-y-scroll ${
    darkMode ? 'bg-gray-900 text-white' : 'bg-gray-300 text-black'
  } ${className}`}
  style={{
    WebkitOverflowScrolling: 'touch', // Habilita scroll suave en dispositivos iOS
    overflowY: 'scroll', // Forzar scroll vertical
  }}
>
  <nav className="mt-6">
        {/* Inicio */}
        <a href="/dashboard" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
          <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5 mr-2" />
          Inicio
        </a>

        {/* Notificaciones */}
        <a href="/messages" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
          <FontAwesomeIcon icon={faInbox} className="w-5 h-5 mr-2" />
          Mensajes
          {unreadCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </a>

        {/* Usuarios */}
        {userType === 'jefe' && (
          <a href="/users" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
            <FontAwesomeIcon icon={faUser} className="w-5 h-5 mr-2" />
            Usuarios
          </a>
        )}

        {/* Brigadas */}
        {userType === 'jefe' && (
          <div className="relative">
            <button onClick={() => toggleDropdown('pages')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faPeopleGroup} className="w-5 h-5 mr-2" />
                Brigadas
              </span>
              <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.pages ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen.pages && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <a href="/brigades" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Ver Brigadas</a>
                <a href="/firefighter-assignments" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Asignar Brigada</a>
              </div>
            )}
          </div>
        )}

        {/* Configuración */}
        {userType === 'jefe' && (
          <div className="relative">
            <button onClick={() => toggleDropdown('settings')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faGear} className="w-5 h-5 mr-2" />
                Configuración
              </span>
              <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.settings ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen.settings && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <a href="/settings" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Preferencias</a>
              </div>
            )}
          </div>
        )}

        {/* Horas Extra */}
        <div className="relative">
          <button onClick={() => toggleDropdown('extraHours')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
            <span className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="w-5 h-5 mr-2" />
              Horas Extra
            </span>
            <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.extraHours ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen.extraHours && (
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              {userType !== 'bombero' && (
                <a href="/horas-extra" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Horas Extra</a>
              )}
              {userType === 'bombero' && (
                <a href="/total-horas-extra" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Total Horas Extra</a>
              )}
              <a href="/requerimientos" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos 24h</a>
              <a href="/requerimientos-10-horas" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos 10h</a>
              <a href="/requerimientos-sur" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos Parque Sur</a>

            </div>
          )}
        </div>

        {/* Solicitudes */}
        <div className="relative">
          <button onClick={() => toggleDropdown('solicitudes')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
            <span className="flex items-center">
              <FontAwesomeIcon icon={faFile} className="w-5 h-5 mr-2" />
              Solicitudes
            </span>
            <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.solicitudes ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen.solicitudes && (
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <a href="/solicitud" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Crear Solicitud</a>
              <a href="/cambio-guardia" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Crear Cambio de Guardia</a>
              <a href="/lista-solicitudes" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Mis solicitudes</a>
              {userType !== 'bombero' && <a href="/solicitudes" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Lista de Solicitudes</a>}
              {userType !== 'bombero' && <a href="/solicitudes-guardia" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Solicitudes de Guardia</a>}
            </div>
          )}
        </div>

        {/* Calendario */}
        {userType === 'jefe' &&
        <a href="/calendario-norte" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
          <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 mr-2" />
          Calendario
        </a>
  }
      </nav>
    </aside>
  );
};

export default Aside;
