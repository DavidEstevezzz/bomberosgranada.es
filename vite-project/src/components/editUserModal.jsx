import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import UsuariosApiService from '../services/UsuariosApiService';

const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  if (!isOpen) return null;

  const [formValues, setFormValues] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || '',
    email2: user.email2 || '',
    telefono: user.telefono || '',
    dni: user.dni || '',
    type: user.type || '',
    puesto: user.puesto || '',
    AP: user.AP || '',
    vacaciones: user.vacaciones || '',
    modulo: user.modulo || '',
    compensacion_grupos: user.compensacion_grupos || ''
  });

  // Update form values when modal opens with existing user data
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
        compensacion_grupos: user.compensacion_grupos || ''
      });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const updatedUser = {
      ...formValues,
      ...(formValues.password && { password: formValues.password }) // Only include password if provided
    };


    try {
      const response = await UsuariosApiService.updateUsuario(user.id_empleado, updatedUser);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-4 w-full max-w-2xl rounded-lg shadow-lg">
        <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actualizar usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-lg">
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
              <input type="text" name="nombre" id="nombre" value={formValues.nombre} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="apellido" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Apellido</label>
              <input type="text" name="apellido" id="apellido" value={formValues.apellido} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
              <input type="email" name="email" id="email" value={formValues.email} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="email2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email Secundario</label>
              <input
                type="email"
                name="email2"
                id="email2"
                value={formValues.email2 || ''}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Teléfono</label>
              <input type="text" name="telefono" id="telefono" value={formValues.telefono} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="dni" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nº Funcionario</label>
              <input type="text" name="dni" id="dni" value={formValues.dni} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Puesto</label>
              <select name="type" id="type" value={formValues.type} onChange={handleChange} className="bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 border-gray-600 text-gray-900 dark:text-white">
                <option value="">Selecciona un tipo</option>
                <option value="jefe">Jefe</option>
                <option value="mando">Mando</option>
                <option value="bombero">Bombero</option>
                <option value="empleado">Empleado</option>
              </select>
            </div>
            {formValues.type === 'bombero' || formValues.type === 'mando' ? (
              <div>
                <label htmlFor="puesto" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Categoría</label>
                <select name="puesto" id="puesto" value={formValues.puesto} onChange={handleChange} className="bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 border-gray-600 text-gray-900 dark:text-white">
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
            ) : null}

            <div>
              <label htmlFor="AP" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Asuntos Propios (AP)</label>
              <input type="number" name="AP" id="AP" value={formValues.AP} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
            </div>
            <div>
              <label htmlFor="vacaciones" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Vacaciones</label>
              <input type="number" name="vacaciones" id="vacaciones" value={formValues.vacaciones} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="modulo" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Módulo</label>
            <input type="number" name="modulo" id="modulo" value={formValues.modulo} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="compensacion_grupos" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Compensación Grupos</label>
            <input type="number" name="compensacion_grupos" id="compensacion_grupos" value={formValues.compensacion_grupos} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
          </div>
        </div>
          <div className="flex items-center space-x-4">
            <button type="submit" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Actualizar usuario</button>
            <button type="button" onClick={onClose} className="text-red-600 hover:text-white border border-red-600 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900">
              <FontAwesomeIcon icon={faTrash} className="w-5 h-5 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
