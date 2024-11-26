import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import SalariesApiService from '../services/SalariesApiService';

const EditSalaryModal = ({ isOpen, onClose, salary, onUpdate }) => {
    if (!isOpen) return null;

    const [formValues, setFormValues] = useState({
        tipo: salary.tipo || '',
        fecha_ini: salary.fecha_ini || '',
        precio_diurno: salary.precio_diurno || '',
        precio_nocturno: salary.precio_nocturno || '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormValues({
                tipo: salary.tipo || '',
                fecha_ini: salary.fecha_ini || '',
                precio_diurno: salary.precio_diurno || '',
                precio_nocturno: salary.precio_nocturno || '',
            });
        }
    }, [isOpen, salary]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const updatedSalary = { ...formValues };

        try {
            const response = await SalariesApiService.updateSalary(salary.id, updatedSalary);
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error('Failed to update salary:', error);
        }
    };

    return (
        <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-4 w-full max-w-xl rounded-lg shadow-lg">
                <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Salario</h3>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-lg">
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4">
                        <div>
                            <label htmlFor="tipo" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
                            <input
                                type="text"
                                name="tipo"
                                id="tipo"
                                value={formValues.tipo}
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="fecha_ini" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha de Inicio</label>
                            <input
                                type="date"
                                name="fecha_ini"
                                id="fecha_ini"
                                value={formValues.fecha_ini}
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="precio_diurno" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Precio Diurno</label>
                            <input
                                type="number"
                                name="precio_diurno"
                                id="precio_diurno"
                                value={formValues.precio_diurno}
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="precio_nocturno" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Precio Nocturno</label>
                            <input
                                type="number"
                                name="precio_nocturno"
                                id="precio_nocturno"
                                value={formValues.precio_nocturno}
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Actualizar</button>
                        <button type="button" onClick={onClose} className="text-red-600 hover:text-white border border-red-600 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900">
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 mr-1" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSalaryModal;
