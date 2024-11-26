import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import SettingsApiService from '../services/SettingsApiService';

const EditSettingModal = ({ isOpen, onClose, setting, onUpdate }) => {
    const [formValues, setFormValues] = useState({
        nombre: setting.nombre,
        valor: setting.valor,
        descripcion: setting.descripcion,
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await SettingsApiService.updateSetting(setting.id, formValues);
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    };

    return (
        <div className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50`}>
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${isOpen ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${isOpen ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${isOpen ? 'text-white' : 'text-gray-900'}`}>Editar Configuración</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${isOpen ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}>
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="nombre" className={`block mb-2 text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-900'}`}>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                id="nombre"
                                value={formValues.nombre}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${isOpen ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="valor" className={`block mb-2 text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-900'}`}>Valor</label>
                            <input
                                type="text"
                                name="valor"
                                id="valor"
                                value={formValues.valor}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${isOpen ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="descripcion" className={`block mb-2 text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-900'}`}>Descripción</label>
                            <textarea
                                name="descripcion"
                                id="descripcion"
                                value={formValues.descripcion}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${isOpen ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${isOpen ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`}>
                            Actualizar
                        </button>
                        <button type="button" onClick={onClose} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${isOpen ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSettingModal;
