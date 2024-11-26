import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddSalaryModal = ({ isOpen, onClose, onAdd }) => {
    if (!isOpen) return null;

    const [formValues, setFormValues] = useState({
        tipo: '',
        fecha_ini: '',
        precio_diurno: '',
        precio_nocturno: '',
        horas_diurnas: '',
        horas_nocturnas: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessages, setErrorMessages] = useState({});
    const { darkMode } = useDarkMode();

    useEffect(() => {
        if (!isOpen) {
            setFormValues({
                tipo: '',
                fecha_ini: '',
                precio_diurno: '',
                precio_nocturno: '',
                horas_diurnas: '',
                horas_nocturnas: ''
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
        if (isSubmitting) {
            console.log('Submit already in progress.');
            return; // Prevent multiple submissions
        }
        setIsSubmitting(true);
        setErrorMessages({});

        try {
            await onAdd(formValues); // Use the onAdd prop passed from the parent component
        } catch (error) {
            console.error('Failed to add salary:', error);
            if (error.response && error.response.data) {
                setErrorMessages(error.response.data);
            } else {
                setErrorMessages({ general: 'An error occurred while adding the salary.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50`}>
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Añadir salario</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="tipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tipo</label>
                            <select
                                name="tipo"
                                id="tipo"
                                value={formValues.tipo}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="laborable">Laborable</option>
                                <option value="festivo">Festivo</option>
                                <option value="prefestivo">Prefestivo</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fecha_ini" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Día de comienzo</label>
                            <input
                                type="date"
                                name="fecha_ini"
                                id="fecha_ini"
                                value={formValues.fecha_ini}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="precio_diurno" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tarifa diurna</label>
                            <input
                                type="number"
                                name="precio_diurno"
                                id="precio_diurno"
                                value={formValues.precio_diurno}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="precio_nocturno" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tarifa diurna</label>
                            <input
                                type="number"
                                name="precio_nocturno"
                                id="precio_nocturno"
                                value={formValues.precio_nocturno}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="horas_diurnas" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Horas diurnas</label>
                            <input
                                type="number"
                                name="horas_diurnas"
                                id="horas_diurnas"
                                value={formValues.horas_diurnas}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="horas_nocturnas" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Horas nocturnas</label>
                            <input
                                type="number"
                                name="horas_nocturnas"
                                id="horas_nocturnas"
                                value={formValues.horas_nocturnas}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`} disabled={isSubmitting}>
                            {isSubmitting ? 'Añadiendo...' : 'Añadir Salario'}
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

export default AddSalaryModal;
