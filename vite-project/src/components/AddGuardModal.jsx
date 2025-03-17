import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';

const AddGuardModal = ({ date, isOpen, onClose, onSave, brigades }) => {
    const [guard, setGuard] = useState({
        date: new Date(date),
        id_brigada: '',
        id_salario: null,
        tipo: 'Festivo víspera',
    });

    const { darkMode } = useDarkMode();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setGuard({
                date: new Date(date),
                id_brigada: '',
                id_salario: null,
                tipo: guard.tipo || 'Laborable',
            });
            setIsSubmitting(false);
        }
    }, [isOpen, date, brigades]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGuard({ ...guard, [name]: value });
    };

    const handleDateChange = (date) => {
        setGuard({ ...guard, date });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        onSave({
            ...guard,
            date: guard.date.toISOString().split('T')[0],
        });
    };

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
            <div className={`p-4 w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Agregar Guardia</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isSubmitting}>
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="date" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fecha</label>
                            <DatePicker
                                selected={guard.date}
                                onChange={handleDateChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="id_brigada" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>ID Brigada</label>
                            <select
                                name="id_brigada"
                                id="id_brigada"
                                value={guard.id_brigada}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            >
                                <option value="">Selecciona una brigada</option>
                                {brigades.map(brigade => (
                                    <option key={brigade.id_brigada} value={brigade.id_brigada}>
                                        {brigade.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tipo" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tipo</label>
                            <select
                                name="tipo"
                                id="tipo"
                                value={guard.tipo}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            >
                                <option value="Laborable">Laborable</option>
                                <option value="Festivo">Festivo</option>
                                <option value="Prefestivo">Prefestivo</option>
                                <option value="Festivo víspera">Festivo víspera</option>
                            </select>
                        </div>

                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-800' : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300'}`} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" onClick={onClose} className={`text-sm px-5 py-2.5 text-center font-medium rounded-lg focus:outline-none focus:ring-4 ${darkMode ? 'text-red-500 border border-red-500 hover:text-white hover:bg-red-600 focus:ring-red-900' : 'text-red-600 border border-red-600 hover:text-white hover:bg-red-600 focus:ring-red-300'}`}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGuardModal;
