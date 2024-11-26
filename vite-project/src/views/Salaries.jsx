import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import SalariesApiService from '../services/SalariesApiService';
import AddSalaryModal from '../components/AddSalaryModal';
import EditSalaryModal from '../components/EditSalaryModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const Salaries = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { darkMode } = useDarkMode();

    useEffect(() => {
        const fetchSalaries = async () => {
            setLoading(true);
            try {
                const response = await SalariesApiService.getSalaries();
                setSalaries(response.data);
                setError(null);
            } catch (error) {
                console.error('Failed to fetch salaries:', error);
                setError('Error al cargar los salarios');
            } finally {
                setLoading(false);
            }
        };

        fetchSalaries();
    }, []);

    const handleAddSalary = async (newSalary) => {
        try {
            const response = await SalariesApiService.createSalary(newSalary);
            setSalaries([...salaries, response.data]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Error al añadir salario:', error);
        }
    };

    const handleEditSalary = async (updatedSalary) => {
        try {
            const response = await SalariesApiService.updateSalary(updatedSalary.id_salario, updatedSalary);
            setSalaries(salaries.map(salary => salary.id_salario === updatedSalary.id_salario ? response.data : salary));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error al actualizar salario:', error);
        }
    };

    const handleDeleteSalary = async (id_salario) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este salario?")) {
            try {
                await SalariesApiService.deleteSalary(id_salario);
                setSalaries(salaries.filter(salary => salary.id_salario !== id_salario));
            } catch (error) {
                console.error('Error al eliminar salario:', error);
                setError('Error al eliminar el salario');
            }
        }
    };

    const handleEditClick = (salary) => {
        setSelectedSalary(salary);
        setIsEditModalOpen(true);
    };

    const handleAddClick = () => {
        setIsAddModalOpen(true);
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Salarios</h1>
                <button onClick={handleAddClick} className={`px-4 py-2 rounded flex items-center space-x-2 ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Añadir Salario</span>
                </button>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="py-2 px-2">Tipo</th>
                                <th className="py-2 px-2">Fecha de Inicio</th>
                                <th className="py-2 px-2">Tarifa Diurna</th>
                                <th className="py-2 px-2">Tarifa Nocturna</th>
                                <th className="py-2 px-2">Horas Diurnas</th>
                                <th className="py-2 px-2">Horas Nocturnas</th>
                                <th className="py-2 px-2" style={{ width: '200px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.map((salary) => (
                                <tr key={salary.id_salario} className="border-b border-gray-700">
                                    <td className="py-2 px-2">{salary.tipo}</td>
                                    <td className="py-2 px-2">{salary.fecha_ini}</td>
                                    <td className="py-2 px-2">{salary.precio_diurno}</td>
                                    <td className="py-2 px-2">{salary.precio_nocturno}</td>
                                    <td className="py-2 px-2">{salary.horas_diurnas}</td>
                                    <td className="py-2 px-2">{salary.horas_nocturnas}</td>
                                    <td className="py-2 px-2 flex space-x-2">
                                        <button onClick={() => handleEditClick(salary)} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                            <FontAwesomeIcon icon={faEdit} />
                                            <span>Editar</span>
                                        </button>
                                        <button onClick={() => handleDeleteSalary(salary.id_salario)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                            <FontAwesomeIcon icon={faTrash} />
                                            <span>Eliminar</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isAddModalOpen && (
                <AddSalaryModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddSalary}
                />
            )}
            {selectedSalary && isEditModalOpen && (
                <EditSalaryModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    salary={selectedSalary}
                    onUpdate={handleEditSalary}
                />
            )}
        </div>
    );
};

export default Salaries;
