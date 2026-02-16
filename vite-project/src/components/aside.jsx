import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faInbox,
  faUser,
  faPeopleGroup,
  faGear,
  faClock,
  faFile,
  faCalendar,
  faChevronDown,
  faTruck,
  faExclamationTriangle,
  faLightbulb,
  faExchangeAlt,
  faFilePdf,
  faRadio,
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import { useSidebar } from '../contexts/SidebarContext';

const Aside = ({ className }) => {
  const { user } = useStateContext();
  const { unreadCount, pendingIncidentsCount, isMandoEspecial, hasNewPdf } = useSidebar();
  const { darkMode } = useDarkMode();
  
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

  const asideBaseClass = `w-64 h-screen overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-200'}`;

  const linkClass = `group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mx-2 ${darkMode
    ? 'text-slate-300 hover:bg-slate-900 hover:text-primary-400'
    : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'}`;

  const dropdownButtonClass = `group flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left transition-all duration-200 rounded-xl mx-2 ${darkMode
    ? 'text-slate-300 hover:bg-slate-900 hover:text-primary-400'
    : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'}`;

  const dropdownItemClass = `block px-4 py-2.5 text-sm transition-all duration-200 rounded-lg mx-6 my-1 ${darkMode
    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  const iconClass = `w-5 h-5 mr-3 transition-colors ${darkMode ? 'text-slate-400 group-hover:text-primary-400' : 'text-slate-500 group-hover:text-primary-600'}`;

  const badgeClass = `ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-200 ${darkMode
    ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
    : 'bg-primary-500 text-white shadow-sm'}`;

  const badgeRedClass = `ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-200 ${darkMode
    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
    : 'bg-red-500 text-white shadow-sm'}`;

  return (
    <aside className={`${asideBaseClass} ${className}`}>
      <nav className="py-6 space-y-1">
        {/* Inicio */}
        <NavLink to="/dashboard" className={linkClass}>
          <FontAwesomeIcon icon={faTachometerAlt} className={iconClass} />
          <span>Inicio</span>
        </NavLink>

        {/* Mensajes */}
        <NavLink to="/messages" className={linkClass}>
          <FontAwesomeIcon icon={faInbox} className={iconClass} />
          <span>Mensajes</span>
          {unreadCount > 0 && (
            <span className={badgeClass}>{unreadCount}</span>
          )}
        </NavLink>

        {/* Vehículos - Solo Jefe */}
        {userType === 'jefe' && (
          <NavLink to="/vehicles" className={linkClass}>
            <FontAwesomeIcon icon={faTruck} className={iconClass} />
            <span>Vehículos</span>
          </NavLink>
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
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.equipment ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.equipment && (
              <div className="py-2">
                <NavLink to="/personal-equipment" className={dropdownItemClass}>
                  Equipos Personales
                </NavLink>
                <NavLink to="/clothing-items" className={dropdownItemClass}>
                  Vestuario
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Usuarios - Solo Jefe */}
        {userType === 'jefe' && (
          <NavLink to="/users" className={linkClass}>
            <FontAwesomeIcon icon={faUser} className={iconClass} />
            <span>Usuarios</span>
          </NavLink>
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
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.brigades ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.brigades && (
              <div className="py-2">
                {userType === 'jefe' && (
                  <>
                    <NavLink to="/brigades" className={dropdownItemClass}>
                      Ver Brigadas
                    </NavLink>
                    <NavLink to="/firefighter-assignments" className={dropdownItemClass}>
                      Asignar Brigada
                    </NavLink>
                  </>
                )}
                <NavLink to="/composicion-brigadas" className={dropdownItemClass}>
                  Composición de Brigadas
                </NavLink>
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
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.settings ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.settings && (
              <div className="py-2">
                <NavLink to="/settings" className={dropdownItemClass}>
                  Preferencias
                </NavLink>
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
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.extraHours ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
            />
          </button>
          {dropdownOpen.extraHours && (
            <div className="py-2">
              {userType === 'jefe' && (
                <>
                  <NavLink to="/horas-extra" className={dropdownItemClass}>
                    Horas Extra
                  </NavLink>
                  <NavLink to="/total-horas-extra" className={dropdownItemClass}>
                    Total Horas Extra
                  </NavLink>
                </>
              )}
              <NavLink to="/horas-requerimientos" className={dropdownItemClass}>
                Horas Ofrecidas
              </NavLink>
              <NavLink to="/requerimientos" className={dropdownItemClass}>
                Requerimientos 24h
              </NavLink>
              <NavLink to="/requerimientos-10-horas" className={dropdownItemClass}>
                Requerimientos 10h
              </NavLink>
              <NavLink to="/requerimientos-operadores-mañana" className={dropdownItemClass}>
                Requerimientos Operadores Mañana
              </NavLink>
              <NavLink to="/requerimientos-operadores-noche" className={dropdownItemClass}>
                Requerimientos Operadores Noche
              </NavLink>
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
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.solicitudes ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
            />
          </button>
          {dropdownOpen.solicitudes && (
            <div className="py-2">
              <NavLink to="/solicitud" className={dropdownItemClass}>
                Crear Solicitud
              </NavLink>
              <NavLink to="/cambio-guardia" className={dropdownItemClass}>
                Crear Cambio de Guardia
              </NavLink>
              <NavLink to="/lista-solicitudes" className={dropdownItemClass}>
                Mis solicitudes
              </NavLink>
              {userType !== 'bombero' && (
                <>
                  <NavLink to="/solicitudes" className={dropdownItemClass}>
                    Lista de Solicitudes
                  </NavLink>
                  <NavLink to="/solicitudes-guardia" className={dropdownItemClass}>
                    Solicitudes de Guardia
                  </NavLink>
                </>
              )}
            </div>
          )}
        </div>

        {/* Incidencias - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <NavLink to="/incidents" className={linkClass}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={iconClass} />
            <span>Incidencias</span>
            {pendingIncidentsCount > 0 && (
              <span className={badgeRedClass}>{pendingIncidentsCount}</span>
            )}
          </NavLink>
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
                className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen.calendars ? 'rotate-180' : ''} ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              />
            </button>
            {dropdownOpen.calendars && (
              <div className="py-2">
                {userType === 'jefe' && (
                  <NavLink to="/calendario-norte" className={dropdownItemClass}>
                    Calendario Guardias
                  </NavLink>
                )}
                {isMandoEspecial && (
                  <>
                    <NavLink to="/calendario-especial" className={dropdownItemClass}>
                      Gestionar Guardias Especiales
                    </NavLink>
                    <NavLink to="/detalle-guardia-calendario" className={dropdownItemClass}>
                      Ver Detalles de Guardias
                    </NavLink>
                    <NavLink to="/brigade-practices" className={dropdownItemClass}>
                      Registro de Prácticas
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sugerencias */}
        <NavLink to="/sugerencias" className={linkClass}>
          <FontAwesomeIcon icon={faLightbulb} className={iconClass} />
          <span>Sugerencias</span>
        </NavLink>

        {/* Traslados - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <NavLink to="/transfers" className={linkClass}>
            <FontAwesomeIcon icon={faExchangeAlt} className={iconClass} />
            <span>Traslados</span>
          </NavLink>
        )}

        {/* Parte Jefatura - Jefe o Mando */}
        {(userType === 'jefe' || userType === 'mando') && (
          <NavLink to="/pdf" className={linkClass}>
            <FontAwesomeIcon icon={faFilePdf} className={iconClass} />
            <span>Parte Jefatura</span>
            {hasNewPdf && <span className={badgeClass}>Nuevo</span>}
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Aside;