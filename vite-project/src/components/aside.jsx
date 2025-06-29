import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faInbox,
  faUser,
  faPeopleGroup,
  faGear,
  faClock,
  faChartBar,
  faFile,
  faCalendar,
  faCaretDown,
  faTruck,
  faExclamationTriangle,
  faLightbulb,
  faExchangeAlt,
  faFilePdf,
  faRadio,
  faCalendarCheck,
  faClipboardList // Nuevo icono para ver detalles
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import MessagesApiService from '../services/MessagesApiService';
import IncidentApiService from '../services/IncidentApiService';
import UsuariosApiService from '../services/UsuariosApiService';

const Aside = ({ className }) => {
  const { user } = useStateContext();
  const [dropdownOpen, setDropdownOpen] = useState({
    users: false,
    brigades: false,
    settings: false,
    extraHours: false,
    solicitudes: false,
    organization: false,
    equipment: false,
    calendars: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState(0);
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (user) {
      fetchUnreadMessages();
      fetchPendingIncidentsCount();
      checkMandoEspecial();
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

  const fetchPendingIncidentsCount = async () => {
    try {
      const response = await IncidentApiService.countPending();
      setPendingIncidentsCount(response.data.pending);
    } catch (error) {
      console.error('Error fetching pending incidents count:', error);
    }
  };

  const checkMandoEspecial = async () => {
    try {
      const response = await UsuariosApiService.checkMandoEspecial(user.id_empleado);
      setIsMandoEspecial(response.data.mando_especial);
    } catch (error) {
      console.error('Error al verificar si el usuario es mando especial:', error);
      setIsMandoEspecial(false);
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

  const userType = user.type;

  return (
    <aside
      className={`w-64 h-screen overflow-y-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-300 text-black'} ${className}`}
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
            <span className="ml-auto bg-blue-600 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </a>

        {/* Nuevo menú: Vehículos */}
        {userType === 'jefe' && (
          <a href="/vehicles" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
            <FontAwesomeIcon icon={faTruck} className="w-5 h-5 mr-2" />
            Vehículos
          </a>
        )}

        {/* Equipos */}
        {(userType === 'jefe' || userType === 'mando') && (
          <div className="relative">
            <button onClick={() => toggleDropdown('equipment')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faRadio} className="w-5 h-5 mr-2" />
                Inventario
              </span>
              <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.equipment ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen.equipment && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <a href="/personal-equipment" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Equipos Personales</a>
                <a href="/clothing-items" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Vestuario</a>
              </div>
            )}
          </div>
        )}

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
            <button onClick={() => toggleDropdown('brigades')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faPeopleGroup} className="w-5 h-5 mr-2" />
                Brigadas
              </span>
              <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.brigades ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen.brigades && (
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
              {userType === 'jefe' && (
                <a href="/horas-extra" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Horas Extra</a>
              )}
              {userType === 'jefe' && (
                <a href="/total-horas-extra" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Total Horas Extra</a>
              )}

              <a href="/horas-requerimientos" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Horas Ofrecidas</a>

              <a href="/requerimientos" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos 24h</a>
              <a href="/requerimientos-10-horas" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos 10h</a>
              <a href="/requerimientos-operadores-mañana" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos Operadores Mañana</a>
              <a href="/requerimientos-operadores-noche" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>Requerimientos Operadores Noche</a>
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

        {/* Incidencias */}
        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/incidents" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2" />
            Incidencias
            {pendingIncidentsCount > 0 && (
              <span className="ml-auto bg-red-600 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {pendingIncidentsCount}
              </span>
            )}
          </a>
        )}

        {/* Menú desplegable para Calendarios - Solo visible para jefes o mandos especiales */}
        {(userType === 'jefe' || isMandoEspecial) && (
          <div className="relative">
            <button onClick={() => toggleDropdown('calendars')} className={`flex items-center justify-between w-full py-2.5 px-4 text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 mr-2" />
                Calendarios
              </span>
              <FontAwesomeIcon icon={faCaretDown} className={`w-5 h-5 transition-transform ${dropdownOpen.calendars ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen.calendars && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {userType === 'jefe' && (
                  <a href="/calendario-norte" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-2" />
                    Calendario Guardias
                  </a>
                )}

                {/* Solo mostrar los enlaces relacionados con guardias especiales si el usuario es mando especial */}
                {isMandoEspecial && (
                  <>
                    <a href="/calendario-especial" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
                      <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4 mr-2" />
                      Gestionar Guardias Especiales
                    </a>

                    <a href="/detalle-guardia-calendario" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
                      <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4 mr-2" />
                      Ver Detalles de Guardias
                    </a>
                    <a href="/brigade-practices" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
                      <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 mr-2" />
                      Registro de Prácticas
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sugerencias */}
        <a href="/sugerencias" className={`flex items-center py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-black'}`}>
          <FontAwesomeIcon icon={faLightbulb} className="w-5 h-5 mr-2" />
          Sugerencias
        </a>

        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/transfers" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
            <FontAwesomeIcon icon={faExchangeAlt} className="w-5 h-5 mr-2" />
            Traslados
          </a>
        )}

        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/pdf" className={`block py-2.5 px-4 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'}`}>
            <FontAwesomeIcon icon={faFilePdf} className="w-5 h-5 mr-2" />
            Parte Jefatura
          </a>
        )}
      </nav>
    </aside>
  );
};

export default Aside;