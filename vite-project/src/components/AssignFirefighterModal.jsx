import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useDarkMode } from '../contexts/DarkModeContext';
import AssignmentsApiService from '../services/AssignmentsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const TURN_OPTIONS = [
  'Mañana',
  'Tarde',
  'Noche',
  'Día Completo',
  'Mañana y tarde',
  'Tarde y noche',
];

const computeAssignment = (turnoSeleccionado) => {
  switch (turnoSeleccionado) {
    case 'Mañana':
      return { ida: 'Mañana', vuelta: 'Tarde' };
    case 'Tarde':
      return { ida: 'Tarde', vuelta: 'Noche' };
    case 'Noche':
      return { ida: 'Noche', vuelta: 'Mañana' };
    case 'Mañana y tarde':
      return { ida: 'Mañana', vuelta: 'Noche' };
    case 'Tarde y noche':
      return { ida: 'Tarde', vuelta: 'Mañana' };
    case 'Día Completo':
      return { ida: 'Mañana', vuelta: 'Mañana' };
    default:
      return { ida: '', vuelta: '' };
  }
};

const AssignFirefighterModal = ({
  isOpen,
  onClose,
  firefighters = [],
  currentBrigade,
  guardDate,
}) => {
  const { darkMode } = useDarkMode();
  const [selectedFirefighterId, setSelectedFirefighterId] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [fecha, setFecha] = useState(guardDate);
  const [assignmentDetails, setAssignmentDetails] = useState(() => computeAssignment('Mañana'));
  const [brigades, setBrigades] = useState([]);
  const [destinationBrigade, setDestinationBrigade] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

   const brigadeSummary = useMemo(() => {
    const originName = currentBrigade?.nombre ? `${currentBrigade.nombre} · Parque ${currentBrigade.park?.nombre ?? ''}` : '—';
    const destinationName = brigades.find((brigade) => brigade.id_brigada === destinationBrigade)?.nombre;

    return {
      origin: originName,
      destination: destinationName ? `${destinationName} · Parque alterno` : 'Pendiente',
    };
  }, [brigades, currentBrigade, destinationBrigade]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedFirefighterId('');
    setTurno('Mañana');
    setFecha(guardDate);
    setAssignmentDetails(computeAssignment('Mañana'));
    setDestinationBrigade('');
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(false);

    fetchDestinationBrigades();
  }, [isOpen, guardDate, currentBrigade]);

  useEffect(() => {
    setAssignmentDetails(computeAssignment(turno));
  }, [turno]);

  const fetchDestinationBrigades = async () => {
    try {
      if (!currentBrigade?.nombre || !currentBrigade?.park) {
        setBrigades([]);
        setDestinationBrigade('');
        return;
      }

      const response = await BrigadesApiService.getBrigades();
      const currentParkId = currentBrigade.park.id_parque;
      const oppositeParkId = currentParkId === 1 ? 2 : 1;

      const matchingBrigades = (response.data ?? []).filter(
        (brigade) => brigade.nombre === currentBrigade.nombre && brigade.id_parque === oppositeParkId,
      );

      const sortedBrigades = matchingBrigades.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
      );

      setBrigades(sortedBrigades);
      setDestinationBrigade(sortedBrigades[0]?.id_brigada ?? '');
    } catch (error) {
      console.error('Error fetching brigades:', error);
      setSubmitError('No se pudo cargar la brigada de destino. Inténtalo nuevamente.');
      setBrigades([]);
      setDestinationBrigade('');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!selectedFirefighterId) {
      setSubmitError('Selecciona un bombero para continuar.');
      return;
    }

    if (!destinationBrigade) {
      setSubmitError('No hay una brigada destino disponible para esta operación.');
      return;
    }

    if (!fecha) {
      setSubmitError('Selecciona la fecha de la guardia.');
      return;
    }

    setIsSubmitting(true);

    const fechaIda = fecha;
    let fechaVuelta = fecha;
    if (turno === 'Noche' || turno === 'Tarde y noche' || turno === 'Día Completo') {
      fechaVuelta = dayjs(fecha).add(1, 'day').format('YYYY-MM-DD');
    }

    const payloadIda = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: currentBrigade?.id_brigada,
      id_brigada_destino: destinationBrigade,
      fecha_ini: fechaIda,
      turno: assignmentDetails.ida,
      tipo_asignacion: 'ida',
    };

    const payloadVuelta = {
      id_empleado: selectedFirefighterId,
      id_brigada_origen: destinationBrigade,
      id_brigada_destino: currentBrigade?.id_brigada,
      fecha_ini: fechaVuelta,
      turno: assignmentDetails.vuelta,
      tipo_asignacion: 'ida',
    };

    try {
      await AssignmentsApiService.createAssignment(payloadIda);
      await AssignmentsApiService.createAssignment(payloadVuelta);
      setSubmitSuccess('Asignación creada con éxito.');
      setSelectedFirefighterId('');
      setTurno('Mañana');
      setFecha(guardDate);
      setAssignmentDetails(computeAssignment('Mañana'));
    } catch (error) {
      console.error('Error creando la asignación:', error);
      if (error.response?.data) {
        const backendMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data.error || 'No se pudo crear la asignación. Inténtalo nuevamente.';
        setSubmitError(backendMessage);
      } else {
        setSubmitError('No se pudo crear la asignación. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
  const modalClass = `relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
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
  const dateInputClass = `${inputClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;
  const selectClass = inputClass;
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
      <div className={modalClass} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Recurso humano</p>
            <h2 className="mt-2 text-2xl font-semibold">Asignar refuerzo temporal</h2>
            <p className="mt-3 text-sm text-white/90">
              Planifica el traslado temporal del personal entre parques asegurando turnos de ida y vuelta equilibrados.
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
                Turnos vinculados
              </p>
              <p className="mt-1 text-sm font-medium">
                Ida: <span className="font-semibold text-primary-600 dark:text-primary-300">{assignmentDetails.ida || '—'}</span>
                <span className="mx-2 text-xs uppercase tracking-[0.3em] text-slate-400">/</span>
                Vuelta: <span className="font-semibold text-primary-600 dark:text-primary-300">{assignmentDetails.vuelta || '—'}</span>
              </p>
            </div>
          </div>

          {submitError && <div className={messageClass('error')}>{submitError}</div>}
          {submitSuccess && <div className={messageClass('success')}>{submitSuccess}</div>}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className={dateInputClass}
                required
              />
              <p className={helperClass}>La fecha inicial determina cuándo comienza la asignación de ida.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Turno</span>
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className={selectClass}
                required
              >
                {TURN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Se calcularán automáticamente los turnos de regreso según la selección.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Bombero</span>
              <select
                value={selectedFirefighterId}
                onChange={(event) => setSelectedFirefighterId(event.target.value)}
                className={selectClass}
                required
              >
                <option value="">Selecciona un miembro</option>
                {firefighters.map((firefighter) => (
                  <option key={firefighter.id_empleado} value={firefighter.id_empleado}>
                    {firefighter.nombre} {firefighter.apellido}
                  </option>
                ))}
              </select>
              <p className={helperClass}>Solo aparecen miembros disponibles del parque de origen.</p>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Brigada destino</span>
              <select
                value={destinationBrigade}
                onChange={(event) => setDestinationBrigade(event.target.value)}
                className={selectClass}
                required
              >
                {brigades.length > 0 ? (
                  brigades.map((brigade) => (
                    <option key={brigade.id_brigada} value={brigade.id_brigada}>
                      {brigade.nombre} (Parque {brigade.id_parque})
                    </option>
                  ))
                ) : (
                  <option value="">Sin brigada disponible</option>
                )}
              </select>
              <p className={helperClass}>Selecciona el parque alterno que recibirá el apoyo temporal.</p>
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

export default AssignFirefighterModal;
