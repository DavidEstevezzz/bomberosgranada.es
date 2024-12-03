import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/es';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AssignmentsTable from '../components/AssignmentsTable';
import AddAssignmentModal from '../components/AddAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');
dayjs.extend(isBetween);

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
        setCurrentPage(1);
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
        setAssignments(assignments.filter((a) => a.id !== id));
    };

    if (loading) return <div className="text-center py-8">Cargando...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

    return (
        <div
            className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-900'
                }`}
        >
            <div className={`max-w-7xl mx-auto`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">
                        Asignaciones de Bomberos - {currentMonth.format('MMMM YYYY')}
                    </h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => handleMonthChange(-1)}
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                            <span className="ml-2">Mes Anterior</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span className="ml-2">Añadir Asignación</span>
                        </button>
                        <button
                            onClick={() => handleMonthChange(1)}
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                        >
                            <span className="mr-2">Mes Siguiente</span>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div
                    className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                >
                    {filteredAssignments.length === 0 ? (
                        <div className="text-center py-4">No hay asignaciones para este mes.</div>
                    ) : (
                        <AssignmentsTable
    assignments={paginate(filteredAssignments)}
    setSelectedAssignment={setSelectedAssignment}
    setShowEditModal={setShowEditModal}
    handleDelete={handleDelete}
    darkMode={darkMode} // Pasamos el valor de darkMode como prop
/>

                    )}

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-500' : 'bg-blue-600 text-white'
                                }`}
                        >
                            Anterior
                        </button>
                        <span>
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-500' : 'bg-blue-600 text-white'
                                }`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
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
