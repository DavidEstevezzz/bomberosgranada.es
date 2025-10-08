import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  // Estado para formulario (se añade "horas_sindicales")
  const [formValues, setFormValues] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || '',
    email2: user.email2 || '',
    telefono: user.telefono || '',
    dni: user.dni || '',
    type: user.type || '',
    puesto: user.puesto || '',
    id_parque: user.id_parque || '',
    AP: user.AP || '',
    vacaciones: user.vacaciones || '',
    modulo: user.modulo || '',
    compensacion_grupos: user.compensacion_grupos || '',
    horas_sindicales: user.horas_sindicales || '',
    SP: user.SP || ''

  });

  // Estado para indicar si se está enviando (loader)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode } = useDarkMode();

  // Cada vez que abrimos el modal, cargamos datos y detectamos si es "móvil"
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        email2: user.email2 || '',
        telefono: user.telefono || '',
        dni: user.dni || '',
        type: user.type || '',
        puesto: user.puesto || '',
        id_parque: user.id_parque || '',
        AP: user.AP || '',
        vacaciones: user.vacaciones || '',
        modulo: user.modulo || '',
        compensacion_grupos: user.compensacion_grupos || '',
        horas_sindicales: user.horas_sindicales || '',
        SP: user.SP || ''

      });

      setIsSubmitting(false); // reiniciamos loader
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const { body } = document;
    const originalOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); // iniciamos loader

    const updatedUser = {
      ...formValues,
      // Solo incluimos password si existe en formValues (según tu lógica anterior)
      ...(formValues.password && { password: formValues.password })
    };

    try {
      const response = await UsuariosApiService.updateUsuario(user.id_empleado, updatedUser);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsSubmitting(false); // terminamos loader
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const actionsContainerClass = 'flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4';
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

  return createPortal(
    <div className={overlayClass} onMouseDown={handleClose}>
      <div
        className={modalClass}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Usuarios</p>
            <h2 className="mt-2 text-2xl font-semibold">Actualizar información del empleado</h2>
            <p className="mt-3 text-sm text-white/90">
              Edita los datos de contacto y disponibilidad para mantener la información del personal al día.
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

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={formValues.nombre}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Juan"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Apellido</span>
              <input
                type="text"
                name="apellido"
                value={formValues.apellido}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Pérez"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Email principal</span>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="nombre@ayto.es"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Email secundario</span>
              <input
                type="email"
                name="email2"
                value={formValues.email2 || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Opcional"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Teléfono</span>
              <input
                type="text"
                name="telefono"
                value={formValues.telefono}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. 600 000 000"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Nº funcionario</span>
              <input
                type="text"
                name="dni"
                value={formValues.dni}
                onChange={handleChange}
                className={inputClass}
                placeholder="Identificador interno"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Rol dentro del servicio</span>
              <select
                name="type"
                value={formValues.type}
                onChange={handleChange}
                className={inputClass}
                disabled={isSubmitting}
              >
                <option value="">Selecciona un rol</option>
                <option value="jefe">Jefe</option>
                <option value="mando">Mando</option>
                <option value="bombero">Bombero</option>
                <option value="empleado">Empleado</option>
              </select>
              <p className={helperClass}>Determina el acceso a la plataforma y los turnos disponibles.</p>
            </div>

            {(formValues.type === 'bombero' || formValues.type === 'mando') && (
              <div className="space-y-2">
                <span className={labelClass}>Categoría</span>
                <select
                  name="puesto"
                  value={formValues.puesto}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona una categoría</option>
                  {formValues.type === 'bombero' ? (
                    <>
                      <option value="Conductor">Conductor</option>
                      <option value="Operador">Operador</option>
                      <option value="Bombero">Bombero</option>
                    </>
                  ) : (
                    <>
                      <option value="Subinspector">Subinspector</option>
                      <option value="Oficial">Oficial</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={labelClass}>Asuntos propios (AP)</span>
              <input
                type="number"
                name="AP"
                value={formValues.AP}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Vacaciones</span>
              <input
                type="number"
                name="vacaciones"
                value={formValues.vacaciones}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Módulo</span>
              <input
                type="number"
                name="modulo"
                value={formValues.modulo}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Compensación por grupos</span>
              <input
                type="number"
                name="compensacion_grupos"
                value={formValues.compensacion_grupos}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Horas sindicales</span>
              <input
                type="number"
                name="horas_sindicales"
                value={formValues.horas_sindicales}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Salidas personales (SP)</span>
              <input
                type="number"
                name="SP"
                value={formValues.SP}
                onChange={handleChange}
                className={inputClass}
                min="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={actionsContainerClass}>
            <button
              type="button"
              onClick={handleClose}
              className={cancelButtonClass}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando cambios…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditUserModal;
