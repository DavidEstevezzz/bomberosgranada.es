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
  faChevronDown,
  faTruck,
  faExclamationTriangle,
  faLightbulb,
  faExchangeAlt,
  faFilePdf,
  faRadio,
  faCalendarCheck,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import MessagesApiService from '../services/MessagesApiService';
import IncidentApiService from '../services/IncidentApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import PdfDocumentApiService from '../services/PdfDocumentApiService';

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
  const [hasNewPdf, setHasNewPdf] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (user) {
      fetchUnreadMessages();
      fetchPendingIncidentsCount();
      checkMandoEspecial();
      fetchLatestPdfStatus();

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

  const fetchLatestPdfStatus = async () => {
    if (!user || (user.type !== 'jefe' && user.type !== 'mando')) {
      setHasNewPdf(false);
      return;
    }

    try {
      const response = await PdfDocumentApiService.getLatestStatus();
      setHasNewPdf(response.data?.has_new ?? false);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setHasNewPdf(false);
      } else {
        console.error('Error al obtener el estado del PDF más reciente:', error);
      }
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
      <aside className={`w-64 ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-200'} ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Cargando menú...</p>
        </div>
      </aside>
    );
  }

  const userType = user.type;

  // Estilos base
  const asideBaseClass = `w-64 h-screen overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-200'
    }`;

  const linkClass = `group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mx-2 ${darkMode
    ? 'text-slate-300 hover:bg-slate-900 hover:text-primary-400'
    : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'
    }`;

  const dropdownButtonClass = `group flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-xl mx-2 ${darkMode
    ? 'text-slate-300 hover:bg-slate-900 hover:text-primary-400'
    : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'
    }`;

  const dropdownItemClass = `block px-4 py-2.5 text-sm transition-all duration-200 rounded-lg mx-6 my-1 ${darkMode
    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const iconClass = `w-5 h-5 mr-3 transition-colors ${darkMode ? 'text-slate-400 group-hover:text-primary-400' : 'text-slate-500 group-hover:text-primary-600'
    }`;

  const badgeClass = `ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-200 ${darkMode
    ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
    : 'bg-primary-500 text-white shadow-sm'
    }`;

  const badgeRedClass = `ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-200 ${darkMode
    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
    : 'bg-red-500 text-white shadow-sm'
    }`;

  return (
    <aside className={`${asideBaseClass} ${className}`}>
      <nav className="py-6 space-y-1">
        {/* Inicio */}
        <a href="/dashboard" className={linkClass}>
          <FontAwesomeIcon icon={faTachometerAlt} className={iconClass} />
          <span>Inicio</span>
        </a>

        {/* Mensajes */}
        <a href="/messages" className={linkClass}>
          <FontAwesomeIcon icon={faInbox} className={iconClass} />
          <span>Mensajes</span>
          {unreadCount > 0 && (
            <span className={badgeClass}>{unreadCount}</span>
          )}
        </a>

        {/* Vehículos - Solo Jefe */}
        {userType === 'jefe' && (
          <a href="/vehicles" className={linkClass}>
            <FontAwesomeIcon icon={faTruck} className={iconClass} />
            <span>Vehículos</span>
          </a>
        )}

        {/* Inventario - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <div className="relative">
            <button onClick={() => toggleDropdown('equipment')} className={dropdownButtonClass}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faRadio} className={iconClass} />
                <span>Inventario</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.equipment ? 'rotate-180' : ''
                  } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.equipment && (
              <div className="py-2">
                <a href="/personal-equipment" className={dropdownItemClass}>
                  Equipos Personales
                </a>
                <a href="/clothing-items" className={dropdownItemClass}>
                  Vestuario
                </a>
              </div>
            )}
          </div>
        )}

        {/* Usuarios - Solo Jefe */}
        {userType === 'jefe' && (
          <a href="/users" className={linkClass}>
            <FontAwesomeIcon icon={faUser} className={iconClass} />
            <span>Usuarios</span>
          </a>
        )}

        {/* Brigadas - Jefe y Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <div className="relative">
            <button onClick={() => toggleDropdown('brigades')} className={dropdownButtonClass}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faPeopleGroup} className={iconClass} />
                <span>Brigadas</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.brigades ? 'rotate-180' : ''
                  } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.brigades && (
              <div className="py-2">
                {/* Solo Jefes */}
                {userType === 'jefe' && (
                  <>
                    <a href="/brigades" className={dropdownItemClass}>
                      Ver Brigadas
                    </a>
                    <a href="/firefighter-assignments" className={dropdownItemClass}>
                      Asignar Brigada
                    </a>
                  </>
                )}
                {/* Jefes y Mandos */}
                <a href="/composicion-brigadas" className={dropdownItemClass}>
                  Composición de Brigadas
                </a>
              </div>
            )}
          </div>
        )}

        {/* Configuración - Solo Jefe */}
        {userType === 'jefe' && (
          <div className="relative">
            <button onClick={() => toggleDropdown('settings')} className={dropdownButtonClass}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faGear} className={iconClass} />
                <span>Configuración</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.settings ? 'rotate-180' : ''
                  } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.settings && (
              <div className="py-2">
                <a href="/settings" className={dropdownItemClass}>
                  Preferencias
                </a>
              </div>
            )}
          </div>
        )}

        {/* Horas Extra */}
        <div className="relative">
          <button onClick={() => toggleDropdown('extraHours')} className={dropdownButtonClass}>
            <span className="flex items-center">
              <FontAwesomeIcon icon={faClock} className={iconClass} />
              <span>Horas Extra</span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.extraHours ? 'rotate-180' : ''
                } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
            />
          </button>
          {dropdownOpen.extraHours && (
            <div className="py-2">
              {userType === 'jefe' && (
                <>
                  <a href="/horas-extra" className={dropdownItemClass}>
                    Horas Extra
                  </a>
                  <a href="/total-horas-extra" className={dropdownItemClass}>
                    Total Horas Extra
                  </a>
                </>
              )}
              <a href="/horas-requerimientos" className={dropdownItemClass}>
                Horas Ofrecidas
              </a>
              <a href="/requerimientos" className={dropdownItemClass}>
                Requerimientos 24h
              </a>
              <a href="/requerimientos-10-horas" className={dropdownItemClass}>
                Requerimientos 10h
              </a>
              <a href="/requerimientos-operadores-mañana" className={dropdownItemClass}>
                Requerimientos Operadores Mañana
              </a>
              <a href="/requerimientos-operadores-noche" className={dropdownItemClass}>
                Requerimientos Operadores Noche
              </a>
            </div>
          )}
        </div>

        {/* Solicitudes */}
        <div className="relative">
          <button onClick={() => toggleDropdown('solicitudes')} className={dropdownButtonClass}>
            <span className="flex items-center">
              <FontAwesomeIcon icon={faFile} className={iconClass} />
              <span>Solicitudes</span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.solicitudes ? 'rotate-180' : ''
                } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
            />
          </button>
          {dropdownOpen.solicitudes && (
            <div className="py-2">
              <a href="/solicitud" className={dropdownItemClass}>
                Crear Solicitud
              </a>
              <a href="/cambio-guardia" className={dropdownItemClass}>
                Crear Cambio de Guardia
              </a>
              <a href="/lista-solicitudes" className={dropdownItemClass}>
                Mis solicitudes
              </a>
              {userType !== 'bombero' && (
                <>
                  <a href="/solicitudes" className={dropdownItemClass}>
                    Lista de Solicitudes
                  </a>
                  <a href="/solicitudes-guardia" className={dropdownItemClass}>
                    Solicitudes de Guardia
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* Incidencias - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/incidents" className={linkClass}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={iconClass} />
            <span>Incidencias</span>
            {pendingIncidentsCount > 0 && (
              <span className={badgeRedClass}>{pendingIncidentsCount}</span>
            )}
          </a>
        )}

        {/* Calendarios - Jefe o Mando Especial */}
        {(userType === 'jefe' || isMandoEspecial) && (
          <div className="relative">
            <button onClick={() => toggleDropdown('calendars')} className={dropdownButtonClass}>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faCalendar} className={iconClass} />
                <span>Calendarios</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.calendars ? 'rotate-180' : ''
                  } ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.calendars && (
              <div className="py-2">
                {userType === 'jefe' && (
                  <a href="/calendario-norte" className={dropdownItemClass}>
                    Calendario Guardias
                  </a>
                )}
                {isMandoEspecial && (
                  <>
                    <a href="/calendario-especial" className={dropdownItemClass}>
                      Gestionar Guardias Especiales
                    </a>
                    <a href="/detalle-guardia-calendario" className={dropdownItemClass}>
                      Ver Detalles de Guardias
                    </a>
                    <a href="/brigade-practices" className={dropdownItemClass}>
                      Registro de Prácticas
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sugerencias */}
        <a href="/sugerencias" className={linkClass}>
          <FontAwesomeIcon icon={faLightbulb} className={iconClass} />
          <span>Sugerencias</span>
        </a>

        {/* Traslados - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/transfers" className={linkClass}>
            <FontAwesomeIcon icon={faExchangeAlt} className={iconClass} />
            <span>Traslados</span>
          </a>
        )}

        {/* Parte Jefatura - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <a href="/pdf" className={linkClass}>
            <FontAwesomeIcon icon={faFilePdf} className={iconClass} />
            <span>Parte Jefatura</span>
            {hasNewPdf && <span className={badgeClass}>Nuevo</span>}

          </a>
        )}
      </nav>
    </aside>
  );
};

export default Aside;