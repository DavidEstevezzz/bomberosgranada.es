import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddAssignmentModal = ({ show, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    fecha_ini: '',
    id_empleado: '',
    id_brigada_origen: '',
    id_brigada_destino: '',
    turno: '',
    tipo_asignacion: '',
  });
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brigades, setBrigades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { darkMode } = useDarkMode();

  const turnoOptions = ['Mañana', 'Tarde', 'Noche'];
  const tipoAsignacionOptions = ['ida', 'vuelta'];

  useEffect(() => {
    if (show) {
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
    }
  }, [show]);

  useEffect(() => {
    const filtered = usuarios.filter((usuario) =>
      `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const { id_asignacion, ...dataToSend } = formData;
      await AssignmentsApiService.createAssignment(dataToSend);
      onAdd();
      setFormData({
        fecha_ini: '',
        id_empleado: '',
        id_brigada_origen: '',
        id_brigada_destino: '',
        turno: '',
        tipo_asignacion: '',
      });
      setSearchTerm('');
      handleClose();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      if (error.response && error.response.data) {
        const { data } = error.response;
        const serverError = (() => {
          if (typeof data === 'string') return data;
          if (Array.isArray(data)) return data.join(' ');
          return Object.values(data)
            .map((value) => (Array.isArray(value) ? value.join(' ') : String(value)))
            .join(' ');
        })();
        setSubmitError(serverError || 'Ha ocurrido un error al crear la asignación.');
      } else {
        setSubmitError('Ha ocurrido un error al crear la asignación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const selectBaseClass = `w-full appearance-none rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode ? 'border-slate-800 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200';

  const dateInputClass = `${inputBaseClass} ${
  darkMode ? '[color-scheme:dark]' : ''
}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10 backdrop-blur"
      onMouseDown={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
          darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-start justify-between gap-4 px-6 py-5 text-white ${
            darkMode
              ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
              : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Gestión de brigadas</p>
            <h2 className="mt-2 text-2xl font-semibold">Añadir asignación</h2>
            <p className="mt-3 text-sm text-white/90">
              Registra un nuevo movimiento de personal indicando brigadas, turnos y tipo de asignación.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {submitError && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                darkMode ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className={labelClass}>Fecha</span>
                <input
                  type="date"
                  name="fecha_ini"
                  value={formData.fecha_ini}
                  onChange={handleChange}
                  required
                  className={dateInputClass}
                />
              </div>

              <div className="space-y-2">
                <span className={labelClass}>Turno</span>
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  required
                  className={selectBaseClass}
                >
                  <option value="">Seleccione turno</option>
                  {turnoOptions.map((turno) => (
                    <option key={turno} value={turno}>
                      {turno}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Empleado</span>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Buscar empleado por nombre o apellido"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={inputBaseClass}
                />
                <select
                  name="id_empleado"
                  value={formData.id_empleado}
                  onChange={handleChange}
                  required
                  className={selectBaseClass}
                >
                  <option value="">Seleccione un empleado</option>
                  {filteredUsuarios.map((usuario) => (
                    <option key={usuario.id_empleado} value={usuario.id_empleado}>
                      {usuario.nombre} {usuario.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <span className={labelClass}>Brigada origen</span>
                <select
                  name="id_brigada_origen"
                  value={formData.id_brigada_origen}
                  onChange={handleChange}
                  className={selectBaseClass}
                >
                  <option value="">Seleccione brigada origen</option>
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
                  value={formData.id_brigada_destino}
                  onChange={handleChange}
                  className={selectBaseClass}
                >
                  <option value="">Seleccione brigada destino</option>
                  {brigades.map((brigada) => (
                    <option key={brigada.id_brigada} value={brigada.id_brigada}>
                      {brigada.nombre} ({brigada.id_parque})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Tipo de asignación</span>
              <select
                name="tipo_asignacion"
                value={formData.tipo_asignacion}
                onChange={handleChange}
                className={selectBaseClass}
              >
                <option value="">Seleccione tipo de asignación</option>
                {tipoAsignacionOptions.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
              </select>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ida: movimiento hacia la brigada destino · Vuelta: regreso a la brigada de origen.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
                    : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
                }`}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
                    : 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar asignación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
