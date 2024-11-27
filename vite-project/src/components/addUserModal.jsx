import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddUserModal = ({ isOpen, onClose, onAdd }) => {
    if (!isOpen) return null;

    const [formValues, setFormValues] = useState({
        nombre: '',
        apellido: '',
        email: '',
        email2: '',
        telefono: '',
        dni: '',
        puesto: '',
        type: '',
        AP: ''
    });

    const [errorMessages, setErrorMessages] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { darkMode } = useDarkMode();

    useEffect(() => {
        if (isOpen) {
            setFormValues({
                nombre: '',
                apellido: '',
                email: '',
                email2: '',
                password: '',
                telefono: '',
                dni: '',
                puesto: '',
                id_parque: '',
                type: '',
                AP: ''
            });
            setErrorMessages({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMessages({});

        try {
            const response = await UsuariosApiService.createUsuario(formValues);
            onAdd(response.data);
            onClose();
        } catch (error) {
            console.error('Failed to add user:', error);
            if (error.response && error.response.data) {
                setErrorMessages(error.response.data);
            } else {
                setErrorMessages({ general: 'An error occurred while adding the user.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Opciones de categoría según el tipo seleccionado
    const getPuestoOptions = () => {
        if (formValues.type === 'bombero') {
            return ['Conductor', 'Operador', 'Bombero'];
        } else if (formValues.type === 'mando') {
            return ['Subinspector', 'Oficial'];
        }
        return [];
    };

    return (
        <div className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50`}>
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Usuario</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="nombre" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                id="nombre"
                                value={formValues.nombre}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.nombre && <span className="text-red-500 text-sm">{errorMessages.nombre}</span>}
                        </div>
                        <div>
                            <label htmlFor="apellido" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Apellido</label>
                            <input
                                type="text"
                                name="apellido"
                                id="apellido"
                                value={formValues.apellido}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.apellido && <span className="text-red-500 text-sm">{errorMessages.apellido}</span>}
                        </div>
                        <div>
                            <label htmlFor="email" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formValues.email}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.email && <span className="text-red-500 text-sm">{errorMessages.email}</span>}
                        </div>
                        <div>
                            <label htmlFor="email2" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email Secundario</label>
                            <input
                                type="email"
                                name="email2"
                                id="email2"
                                value={formValues.email2 || ''}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                            />
                            {errorMessages.email2 && <span className="text-red-500 text-sm">{errorMessages.email2}</span>}
                        </div>

                        <div>
                            <label htmlFor="telefono" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Teléfono</label>
                            <input
                                type="text"
                                name="telefono"
                                id="telefono"
                                value={formValues.telefono}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.telefono && <span className="text-red-500 text-sm">{errorMessages.telefono}</span>}
                        </div>
                        <div>
                            <label htmlFor="dni" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>DNI</label>
                            <input
                                type="text"
                                name="dni"
                                id="dni"
                                value={formValues.dni}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.dni && <span className="text-red-500 text-sm">{errorMessages.dni}</span>}
                        </div>

                        <div>
                            <label htmlFor="type" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Puesto</label>
                            <select
                                name="type"
                                id="type"
                                value={formValues.type}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="jefe">Jefe</option>
                                <option value="mando">Mando</option>
                                <option value="bombero">Bombero</option>
                                <option value="empleado">Empleado</option>
                            </select>
                            {errorMessages.type && <span className="text-red-500 text-sm">{errorMessages.type}</span>}
                        </div>

                        {(formValues.type === 'mando' || formValues.type === 'bombero') && (
                            <div>
                                <label htmlFor="puesto" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Categoría</label>
                                <select
                                    name="puesto"
                                    id="puesto"
                                    value={formValues.puesto}
                                    onChange={handleChange}
                                    className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                    required
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {getPuestoOptions().map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                {errorMessages.puesto && <span className="text-red-500 text-sm">{errorMessages.puesto}</span>}
                            </div>
                        )}

                        <div>
                            <label htmlFor="AP" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Asuntos Propios (AP)</label>
                            <input
                                type="number"
                                name="AP"
                                id="AP"
                                value={formValues.AP}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-300 text-gray-900 focus:ring-primary-600 focus:border-primary-600'}`}
                                required
                            />
                            {errorMessages.AP && <span className="text-red-500 text-sm">{errorMessages.AP}</span>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-800' : 'bg-primary-700 hover:bg-primary-800 text-white focus:ring-primary-300'}`} disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Añadir Usuario'}
                        </button>
                        <button type="button" onClick={onClose} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
