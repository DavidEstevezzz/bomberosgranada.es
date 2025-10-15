// vite-project/src/components/EditAssignmentModal.jsx
import React, { useEffect, useState } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const turnoOptions = ['Mañana', 'Tarde', 'Noche'];
const tipoAsignacionOptions = ['ida', 'vuelta'];

const EditAssignmentModal = ({ assignment, show, onClose, onEdit }) => {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({ ...assignment });
  const [usuarios, setUsuarios] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setFormData({ ...assignment });
  }, [assignment]);

  useEffect(() => {
    if (!show) return;

    const fetchUsuarios = async () => {
      try {
        const response = await UsuariosApiService.getUsuarios();
        const bomberos = response.data.filter(
          (usuario) => usuario.type === 'bombero' || usuario.type === 'mando'
        );
        setUsuarios(bomberos);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    const fetchBrigades = async () => {
      try {
        const response = await BrigadesApiService.getBrigades();
        setBrigades(response.data);
      } catch (error) {
        console.error('Failed to fetch brigades:', error);
      }
    };

    fetchUsuarios();
    fetchBrigades();
    setSubmitError(null);
    setIsSubmitting(false);
  }, [show]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNullableChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value === '' ? null : value }));
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

    try {
      await AssignmentsApiService.updateAssignment(formData.id_asignacion, formData);
      if (typeof onEdit === 'function') {
        onEdit();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to update assignment:', error);
      if (error.response?.data) {
        const backendMessage = error.response.data;
        setSubmitError(
          typeof backendMessage === 'string'
            ? backendMessage
            : Object.values(backendMessage)
                .flat()
                .join(' ') || 'No se pudo actualizar la asignación. Inténtalo nuevamente.'
        );
      } else {
        setSubmitError('No se pudo actualizar la asignación. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur';
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Gestión de brigadas</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar asignación</h2>
            <p className="mt-3 text-sm text-white/90">
              Actualiza la información del traslado, ajusta brigadas implicadas y confirma el turno correspondiente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {submitError && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {submitError}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>ID asignación</span>
              <input
                type="text"
                name="id_asignacion"
                value={formData.id_asignacion || ''}
                onChange={handleChange}
                className={dateInputClass}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Fecha</span>
              <input
                type="date"
                name="fecha_ini"
                value={formData.fecha_ini || ''}
                onChange={handleChange}
                className={dateInputClass}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Empleado</span>
              <select
                name="id_empleado"
                value={formData.id_empleado || ''}
                onChange={handleChange}
                className={inputClass}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecciona un empleado</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id_empleado} value={usuario.id_empleado}>
                    {usuario.nombre} {usuario.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Turno</span>
              <select
                name="turno"
                value={formData.turno || ''}
                onChange={handleChange}
                className={inputClass}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecciona un turno</option>
                {turnoOptions.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className={labelClass}>Tipo de asignación</span>
            <select
              name="tipo_asignacion"
              value={formData.tipo_asignacion || ''}
              onChange={handleChange}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="">Selecciona un tipo de asignación</option>
              {tipoAsignacionOptions.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
            <p className={helperClass}>Ida: traslado a la brigada destino · Vuelta: retorno a la brigada origen.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Brigada origen</span>
              <select
                name="id_brigada_origen"
                value={formData.id_brigada_origen ?? ''}
                onChange={handleNullableChange}
                className={inputClass}
                disabled={isSubmitting}
              >
                <option value="">Sin brigada asignada</option>
                {brigades.map((brigada) => (
                  <option key={brigada.id_brigada} value={brigada.id_brigada}>
                    {brigada.nombre} ({brigada.id_parque})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Brigada destino</span>
              <select
                name="id_brigada_destino"
                value={formData.id_brigada_destino || ''}
                onChange={handleChange}
                className={inputClass}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecciona una brigada destino</option>
                {brigades.map((brigada) => (
                  <option key={brigada.id_brigada} value={brigada.id_brigada}>
                    {brigada.nombre} ({brigada.id_parque})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={cancelButtonClass} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssignmentModal;
