import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween'; // Importa el plugin isBetween
import 'dayjs/locale/es';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AssignmentsTable from '../components/AssignmentsTable';
import AddAssignmentModal from '../components/AddAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');
dayjs.extend(isBetween); // Extiende dayjs con el plugin isBetween

const FirefighterAssignment = () => {
    const [assignments, setAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const { darkMode } = useDarkMode();

    useEffect(() => {
        fetchAssignments();
    }, [currentMonth]);

    useEffect(() => {
        filterAssignmentsByMonth();
    }, [assignments, currentMonth]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const response = await AssignmentsApiService.getAssignments();
            setAssignments(response.data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const filterAssignmentsByMonth = () => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const filtered = assignments.filter((assignment) => {
            const assignmentDate = dayjs(assignment.fecha_ini);
            return assignmentDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
        });
        setFilteredAssignments(filtered);
        setCurrentPage(1); // Reset to first page on new filter
    };

    const handleMonthChange = (direction) => {
        setCurrentMonth(currentMonth.add(direction, 'month'));
    };

    const paginate = (data) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

    const handleAdd = () => {
        fetchAssignments();
    };

    const handleEdit = () => {
        fetchAssignments();
    };

    const handleDelete = (id) => {
        setAssignments(assignments.filter(a => a.id !== id));
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={`p-4 ${showAddModal || showEditModal ? 'backdrop-blur-sm' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Asignaciones de Bomberos - {currentMonth.format('MMMM YYYY')}</h1>
                <div className="flex space-x-4">
                    <button onClick={() => handleMonthChange(-1)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <span>Mes Anterior</span>
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Añadir Asignación</span>
                    </button>
                    <button onClick={() => handleMonthChange(1)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
                        <span>Mes Siguiente</span>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>
            <div className={`bg-gray-800 text-white p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {filteredAssignments.length === 0 ? (
                    <div className="text-center py-4">No hay asignaciones para este mes.</div>
                ) : (
                    <AssignmentsTable
                        assignments={paginate(filteredAssignments)}
                        setSelectedAssignment={setSelectedAssignment}
                        setShowEditModal={setShowEditModal}
                        handleDelete={handleDelete}
                        showAssignmentId={false} // No mostrar ID en la tabla
                    />
                )}
                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                    >
                        Anterior
                    </button>
                    <span className="text-center py-2">{`Página ${currentPage} de ${totalPages}`}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
            <AddAssignmentModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAdd}
            />
            <EditAssignmentModal
                assignment={selectedAssignment}
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onEdit={handleEdit}
            />
        </div>
    );
};

export default FirefighterAssignment;
