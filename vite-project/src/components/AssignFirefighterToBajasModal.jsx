import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

 // Calcula los turnos de ida y vuelta según el turno seleccionado
  const computeAssignment = (turnoSeleccionado) => {
    let ida = '';
    let vuelta = '';
    switch (turnoSeleccionado) {
      case 'Mañana':
        ida = 'Mañana';
        vuelta = 'Tarde';
        break;
      case 'Tarde':
        ida = 'Tarde';
        vuelta = 'Noche';
        break;
      case 'Noche':
        ida = 'Noche';
        vuelta = 'Mañana';
        break;
      case 'Mañana y tarde':
        ida = 'Mañana';
        vuelta = 'Noche';
        break;
      case 'Tarde y noche':
        ida = 'Tarde';
        vuelta = 'Mañana';
        break;
      case 'Día Completo':
        ida = 'Mañana';
        vuelta = 'Mañana';
        break;
      default:
        break;
    }
    return { ida, vuelta };
  };

const AssignFirefighterToBajasModal = ({ isOpen, onClose, firefighters, guardDate, currentBrigade }) => {
  const { darkMode } = useDarkMode();
  const [selectedFirefighterId, setSelectedFirefighterId] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [assignmentDetails, setAssignmentDetails] = useState(() => computeAssignment('Mañana'));
  const [destinationBrigade, setDestinationBrigade] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brigadeSummary = useMemo(() => {
    const originName = currentBrigade?.nombre
      ? `${currentBrigade.nombre} · Parque ${currentBrigade?.park?.nombre ?? ''}`
      : '—';

    return {
      origin: originName,
      destination: 'Bajas · Brigada especial',
    };
  }, [currentBrigade]);

  const turnoOptions = [
    "Mañana",
    "Tarde",
    "Noche",
    "Día Completo",
    "Mañana y tarde",
    "Tarde y noche"
  ];

 

  // Al abrir el modal se reinician los estados y se carga la brigada destino "Bajas"
  useEffect(() => {
    if (isOpen) {
      setSelectedFirefighterId('');
      setTurno('Mañana');
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(false);
      fetchDestinationBrigade();
    }
  }, [isOpen, guardDate]);

  // Actualiza la asignación calculada al cambiar el turno
  useEffect(() => {
    setAssignmentDetails(computeAssignment(turno));
  }, [turno]);

  // Busca la brigada cuyo nombre sea "Bajas"
  const fetchDestinationBrigade = async () => {
    try {
      const response = await BrigadesApiService.getBrigades();
      const bajasBrigade = response.data.find(b => b.nombre === 'Bajas');
      if (bajasBrigade) {
        setDestinationBrigade(bajasBrigade.id_brigada);
      } else {
        setSubmitError('No se encontró la brigada "Bajas"');
      }
    } catch (err) {
      console.error('Error al obtener brigadas:', err);
      setSubmitError('No se pudo cargar la brigada destino');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!selectedFirefighterId) {
      setSubmitError('Selecciona un bombero para continuar.');
      return;
    }
    if (!destinationBrigade) {
      setSubmitError('No se encontró la brigada destino "Bajas"');
      return;
    }
    setIsSubmitting(true);

    // La fecha de ida es la fecha de la guardia y, para ciertos turnos, la asignación de vuelta se hace al día siguiente
    const fecha_ida = guardDate;
    let fecha_vuelta = guardDate;
    if (turno === "Noche" || turno === "Tarde y noche" || turno === "Día Completo") {
      fecha_vuelta = dayjs(guardDate).add(1, 'day').format('YYYY-MM-DD');
    }

    // Payload para asignación de ida: de la brigada actual a la brigada "Bajas"
    const payloadIda = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: currentBrigade.id_brigada,
      id_brigada_destino: destinationBrigade,
      fecha_ini: fecha_ida,
      turno: assignmentDetails.ida,
    };

    // Payload para asignación de vuelta: de la brigada "Bajas" de vuelta a la brigada actual
    const payloadVuelta = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: destinationBrigade,
      id_brigada_destino: currentBrigade.id_brigada,
      fecha_ini: fecha_vuelta,
      turno: assignmentDetails.vuelta,
    };

    try {
      await AssignmentsApiService.createAssignment(payloadIda);
      await AssignmentsApiService.createAssignment(payloadVuelta);
      setSubmitSuccess('Asignación creada con éxito.');
      setSelectedFirefighterId('');
      setTurno('Mañana');
      setAssignmentDetails(computeAssignment('Mañana'));
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data;
      setSubmitError(
        typeof backendMessage === 'string'
          ? backendMessage
          : backendMessage?.error || 'No se pudo crear la asignación. Inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    onClose();
  };

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors du
ration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
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
  const messageClass = (type) =>
    `rounded-2xl border px-4 py-3 text-sm font-medium ${
      type === 'error'
        ? darkMode
          ? 'border-red-500/40 bg-red-500/10 text-red-200'
          : 'border-red-200 bg-red-50 text-red-700'
        : darkMode
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Refuerzos</p>
            <h2 className="mt-2 text-2xl font-semibold">Asignar a brigada de bajas</h2>
            <p className="mt-3 text-sm text-white/90">
              Traslada temporalmente a un miembro al equipo de bajas asegurando la planificación de ida y vuelta.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          <div
            className={`grid gap-3 rounded-3xl border px-5 py-4 sm:grid-cols-2 ${
              darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500 dark:text-primary-200">
                Brigada origen
              </p>
              <p className="mt-1 text-sm font-medium">{brigadeSummary.origin}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500 dark:text-primary-200">
                Brigada destino
              </p>
              <p className="mt-1 text-sm font-medium">{brigadeSummary.destination}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500 dark:text-primary-200">
                Fecha programada
              </p>
              <p className="mt-1 text-sm font-medium">
                {dayjs(guardDate).format('DD [de] MMMM YYYY')}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500 dark:text-primary-200">
                Turnos vinculados
              </p>
              <p className="mt-1 text-sm font-medium">
                Ida: <span className="font-semibold text-primary-600 dark:text-primary-300">{assignmentDetails?.ida || '—'}</span>
                <span className="mx-2 text-xs uppercase tracking-[0.3em] text-slate-400">/</span>
                Vuelta: <span className="font-semibold text-primary-600 dark:text-primary-300">{assignmentDetails?.vuelta || '—'}</span>
              </p>
            </div>
          </div>

          {submitError && <div className={messageClass('error')}>{submitError}</div>}
          {submitSuccess && <div className={messageClass('success')}>{submitSuccess}</div>}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Turno</span>
              <select value={turno} onChange={(event) => setTurno(event.target.value)} className={inputClass} required>
                {turnoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Los turnos de regreso se calculan automáticamente.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Bombero</span>
              <select
                value={selectedFirefighterId}
                onChange={(event) => setSelectedFirefighterId(event.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecciona un miembro</option>
                {firefighters.map((firefighter) => (
                  <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                    {firefighter.nombre} {firefighter.apellido}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Se muestran los miembros operativos de la brigada origen.</p>
            </div>
          </div>

          <div
            className={`grid gap-4 rounded-3xl border px-5 py-4 sm:grid-cols-2 ${
              darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  darkMode ? 'bg-primary-500/10 text-primary-200' : 'bg-primary-500/10 text-primary-600'
                }`}
              >
                <FontAwesomeIcon icon={faUserShield} />
              </span>
              <div>
                <p className="text-sm font-semibold">Personal reforzado</p>
                <p className={helperClass}>1 miembro seleccionado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  darkMode ? 'bg-primary-500/10 text-primary-200' : 'bg-primary-500/10 text-primary-600'
                }`}
              >
                <FontAwesomeIcon icon={faExchangeAlt} />
              </span>
              <div>
                <p className="text-sm font-semibold">Transferencia automática</p>
                <p className={helperClass}>Se crea ida y vuelta en un solo paso.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Crear asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignFirefighterToBajasModal;
