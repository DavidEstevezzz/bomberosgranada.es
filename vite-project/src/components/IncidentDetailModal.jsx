// IncidentDetailModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faTruck, faUser, faBuilding, faTools,
  faShirt, faExclamationTriangle, faCalendar, faMapMarkerAlt,
  faCheckCircle, faClock, faHammer, faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const IncidentDetailModal = ({ incident, isOpen, onClose }) => {
  const { darkMode } = useDarkMode();

  if (!isOpen || !incident) return null;

  // Helper functions
  const normalizeTypeName = (tipo) => {
    const types = {
      vehiculo: 'Vehículo',
      personal: 'Personal',
      instalacion: 'Instalación',
      equipo: 'Equipos Personales',
      vestuario: 'Vestuario',
      equipos_comunes: 'Equipos Comunes'
    };
    return types[tipo?.toLowerCase()] || tipo;
  };

  const getTypeIcon = () => {
    const icons = {
      vehiculo: faTruck,
      personal: faUser,
      instalacion: faBuilding,
      equipo: faTools,
      vestuario: faShirt,
      equipos_comunes: faTools
    };
    return icons[incident.tipo?.toLowerCase()] || faTools;
  };

  const getLevelBadge = () => {
    const levels = {
      alto: { bg: 'bg-red-500', text: 'CRÍTICO', icon: faExclamationTriangle },
      medio: { bg: 'bg-amber-500', text: 'MODERADO', icon: faExclamationTriangle },
      bajo: { bg: 'bg-yellow-500', text: 'BAJO', icon: faExclamationTriangle }
    };
    return levels[incident.nivel?.toLowerCase()] || levels.medio;
  };

  const getStatusBadge = () => {
    const estadoNormalizado = incident.estado?.toLowerCase().trim();

    const estados = {
      'pendiente': { bg: darkMode ? 'bg-slate-600' : 'bg-slate-500', text: 'Pendiente', icon: faClock },
      'en proceso': { bg: darkMode ? 'bg-blue-600' : 'bg-blue-500', text: 'En Proceso', icon: faHammer },
      'resuelta': { bg: darkMode ? 'bg-emerald-600' : 'bg-emerald-500', text: 'Resuelta', icon: faCheckCircle }
    };

    return estados[estadoNormalizado] || estados['pendiente'];
  };

  const getAffectedResource = () => {
    switch (incident.tipo?.toLowerCase()) {
      case 'vehiculo':
        return incident.vehicle?.nombre || incident.matricula || 'Sin especificar';
      case 'personal':
        return incident.employee2
          ? `${incident.employee2.nombre} ${incident.employee2.apellido}`
          : 'Sin especificar';
      case 'equipo':
        return incident.equipment?.nombre || 'Sin especificar';
      case 'vestuario':
        return incident.clothing_item?.name || 'Sin especificar';
      case 'equipos_comunes':
        return incident.nombre_equipo || 'Sin especificar';
      case 'instalacion':
        return 'Infraestructura del parque';
      default:
        return 'Sin especificar';
    }
  };

  const levelBadge = getLevelBadge();
  const statusBadge = getStatusBadge();
  const isResolved = incident.estado?.toLowerCase().trim() === 'resuelta';
  const hasResolvingInfo = incident.resolviendo && incident.resolviendo.trim() !== '';

  // Classes
  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';

  const modalClass = `relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${darkMode ? 'border-slate-800 bg-slate-950/95 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
    }`;

  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
    }`;

  const sectionClass = `rounded-2xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
    }`;

  const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] opacity-60';
  const valueClass = 'text-sm font-medium mt-1';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div className={modalClass}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${levelBadge.bg}`}>
              <FontAwesomeIcon icon={getTypeIcon()} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                Incidencia #{incident.id_incidencia}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Detalles de la incidencia</h2>
              <p className="mt-1 text-sm text-white/90">
                {normalizeTypeName(incident.tipo)} · {incident.park?.nombre || 'Parque'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">

          {/* Estado y Nivel */}
          <div className="flex flex-wrap gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full ${statusBadge.bg} px-4 py-2 text-sm font-semibold text-white`}>
              <FontAwesomeIcon icon={statusBadge.icon} />
              {statusBadge.text}
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full ${levelBadge.bg} px-4 py-2 text-sm font-semibold text-white`}>
              <FontAwesomeIcon icon={levelBadge.icon} />
              {levelBadge.text}
            </div>
          </div>

          {/* Grid de información principal */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Información general */}
            <div className={sectionClass}>
              <p className={labelClass}>Fecha de registro</p>
              <p className={valueClass}>
                <FontAwesomeIcon icon={faCalendar} className="mr-2 opacity-50" />
                {dayjs(incident.fecha).format('DD [de] MMMM [de] YYYY')}
              </p>
            </div>

            <div className={sectionClass}>
              <p className={labelClass}>Reportado por</p>
              <p className={valueClass}>
                <FontAwesomeIcon icon={faUser} className="mr-2 opacity-50" />
                {incident.creator ? `${incident.creator.nombre} ${incident.creator.apellido}` : 'Usuario desconocido'}
              </p>
            </div>

            <div className={sectionClass}>
              <p className={labelClass}>Ubicación</p>
              <p className={valueClass}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 opacity-50" />
                {incident.park?.nombre || 'Sin especificar'}
              </p>
            </div>

            <div className={sectionClass}>
              <p className={labelClass}>Recurso afectado</p>
              <p className={valueClass}>
                <FontAwesomeIcon icon={getTypeIcon()} className="mr-2 opacity-50" />
                {getAffectedResource()}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className={sectionClass}>
            <p className={labelClass}>Descripción del problema</p>
            <p className={`${valueClass} whitespace-pre-line leading-relaxed`}>
              {incident.descripcion || 'Sin descripción proporcionada.'}
            </p>
          </div>

          {/* Seguimiento de resolución - Solo si existe */}
          {hasResolvingInfo && (
            <div className={`rounded-2xl border p-5 ${darkMode ? 'border-blue-500/40 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
              }`}>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faHammer} className={`mt-1 h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <p className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Seguimiento de resolución
                  </p>
                  <p className={`text-xs uppercase tracking-wider mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Acciones en curso
                  </p>
                  <div className={`mt-3 rounded-xl border p-4 ${darkMode ? 'border-blue-700 bg-blue-900/30' : 'border-blue-300 bg-white'
                    }`}>
                    <p className={`whitespace-pre-line text-sm leading-relaxed ${darkMode ? 'text-blue-100' : 'text-blue-900'
                      }`}>
                      {incident.resolviendo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resolución final - Solo si está resuelto */}
          {isResolved && (
            <div className={`rounded-2xl border p-5 ${darkMode ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
              }`}>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faCheckCircle} className={`mt-1 h-5 w-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Incidencia resuelta
                    </p>
                    <p className={`text-xs uppercase tracking-wider mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Resolución completada
                    </p>
                  </div>

                  {/* Quien resolvió */}
                  {incident.resolver && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUserCheck} className={`h-4 w-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <p className={`text-sm ${darkMode ? 'text-emerald-200' : 'text-emerald-700'}`}>
                        Resuelto por: <span className="font-semibold">{incident.resolver.nombre} {incident.resolver.apellido}</span>
                      </p>
                    </div>
                  )}

                  {/* Descripción de la resolución */}
                  {incident.resolucion && incident.resolucion.trim() !== '' && (
                    <div className={`rounded-xl border p-4 ${darkMode ? 'border-emerald-700 bg-emerald-900/30' : 'border-emerald-300 bg-white'
                      }`}>
                      <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'
                        }`}>
                        Detalles de la resolución
                      </p>
                      <p className={`whitespace-pre-line text-sm leading-relaxed ${darkMode ? 'text-emerald-100' : 'text-emerald-900'
                        }`}>
                        {incident.resolucion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t px-6 py-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-primary-500 focus:ring-offset-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-primary-500 focus:ring-offset-white'
              }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailModal;