import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import SettingsApiService from '../services/SettingsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddSettingModal = ({ isOpen, onClose, onAdd }) => {
    const [formValues, setFormValues] = useState({
        nombre: '',
        valor: '',
        descripcion: ''
    });

    const [errorMessages, setErrorMessages] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { darkMode } = useDarkMode();

    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened, resetting form values');
            setFormValues({
                nombre: '',
                valor: '',
                descripcion: ''
            });
            setErrorMessages({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return; // Prevent multiple submissions
        console.log('Submitting form');
        setIsSubmitting(true);
        setErrorMessages({});

        try {
            const response = await SettingsApiService.createSetting(formValues);
            console.log('Setting added:', response.data);
            onAdd(response.data);
            onClose();
        } catch (error) {
            console.error('Failed to add setting:', error);
            if (error.response && error.response.data) {
                setErrorMessages(error.response.data);
            } else {
                setErrorMessages({ general: 'An error occurred while adding the setting.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50`}>
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir Configuración</h3>
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
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                            {errorMessages.nombre && <span className="text-red-500 text-sm">{errorMessages.nombre}</span>}
                        </div>
                        <div>
                            <label htmlFor="valor" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Valor</label>
                            <input
                                type="text"
                                name="valor"
                                id="valor"
                                value={formValues.valor}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                            {errorMessages.valor && <span className="text-red-500 text-sm">{errorMessages.valor}</span>}
                        </div>
                        <div>
                            <label htmlFor="descripcion" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Descripción</label>
                            <textarea
                                name="descripcion"
                                id="descripcion"
                                value={formValues.descripcion}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`} disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Añadir Configuración'}
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

export default AddSettingModal;
