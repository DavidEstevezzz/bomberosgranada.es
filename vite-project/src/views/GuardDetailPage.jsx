import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import BrigadeUsersApiService from '../services/BrigadeUsersApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardDetailPage = () => {
    const { brigadeId, date } = useParams();
    const navigate = useNavigate();
    const { darkMode } = useDarkMode();
    const [guard, setGuard] = useState(null);
    const [brigade, setBrigade] = useState(null);
    const [brigadeUsers, setBrigadeUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [processingUser, setProcessingUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Obtener datos de la brigada
                const brigadeResponse = await BrigadesApiService.getBrigade(brigadeId);
                setBrigade(brigadeResponse.data);
                
                // Obtener la guardia específica
                const guardsResponse = await GuardsApiService.getGuards();
                const guardsFiltered = guardsResponse.data.filter(g => 
                    g.id_brigada == brigadeId && 
                    g.date === date && 
                    g.especiales !== null && 
                    g.especiales !== undefined && 
                    g.especiales !== ""
                );
                
                // Si encontramos una guardia, la usamos
                if (guardsFiltered.length > 0) {
                    setGuard(guardsFiltered[0]);
                }
                
                // Obtener usuarios de la brigada
                const brigadeUsersResponse = await BrigadeUsersApiService.getUsersByBrigade(brigadeId);
                setBrigadeUsers(brigadeUsersResponse.data.brigadeUsers || []);
                
                // Verificar para cada usuario si está asignado para esta guardia especial
                const assignmentsData = {};
                
                if (brigadeUsersResponse.data && brigadeUsersResponse.data.brigadeUsers) {
                    for (const user of brigadeUsersResponse.data.brigadeUsers) {
                        try {
                            // Verificar si el bombero está asignado para esta fecha
                            const checkResponse = await AssignmentsApiService.checkEspecialAssignment(
                                brigadeId, 
                                date
                            );
                            
                            // Guardar el estado de asignación para este usuario
                            assignmentsData[user.id_usuario] = checkResponse.data.assigned || false;
                        } catch (err) {
                            console.error(`Error checking assignment for user ${user.id_usuario}:`, err);
                            assignmentsData[user.id_usuario] = false;
                        }
                    }
                }
                
                setAssignments(assignmentsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching guard details:', error);
                setError('Ocurrió un error al cargar los detalles de la guardia.');
                setLoading(false);
            }
        };

        fetchData();
    }, [brigadeId, date]);

    const handleBack = () => {
        navigate(-1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // Obtener los componentes de la fecha
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        // Formatear la fecha en formato español
        return `${day}/${month}/${year}`;
    };

    const toggleUserAssignment = async (userId) => {
        if (!guard || !guard.especiales) return;
        
        try {
            setProcessingUser(userId);
            const isCurrentlyAssigned = assignments[userId];
            const payload = {
                id_brigada: parseInt(brigadeId),
                fecha: date,
                id_usuario: userId
            };
            
            if (isCurrentlyAssigned) {
                // Quitar al bombero de la asignación
                if (guard.especiales.includes('Prácticas')) {
                    await AssignmentsApiService.deletePracticesAssignments(brigadeId, date);
                } else if (guard.especiales.includes('Guardia Localizada')) {
                    await AssignmentsApiService.deleteRTAssignments(brigadeId, date);
                }
                
                // Actualizar el estado local
                setAssignments(prev => ({
                    ...prev,
                    [userId]: false
                }));
            } else {
                // Asignar al bombero
                if (guard.especiales.includes('Prácticas')) {
                    await AssignmentsApiService.createPracticesAssignments(payload);
                    
                    // Incrementar el contador de prácticas
                    await BrigadeUsersApiService.incrementPracticas({
                        id_brigada: parseInt(brigadeId),
                        id_usuario: userId,
                        increment: 1
                    });
                    
                } else if (guard.especiales.includes('Guardia Localizada')) {
                    await AssignmentsApiService.createRTAssignments(payload);
                }
                
                // Actualizar el estado local
                setAssignments(prev => ({
                    ...prev,
                    [userId]: true
                }));
            }
            
            setProcessingUser(null);
        } catch (error) {
            console.error('Error toggling user assignment:', error);
            setProcessingUser(null);
            // Mostrar un mensaje de error al usuario
            alert('Ocurrió un error al actualizar la asignación.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button 
                    onClick={handleBack}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Volver al calendario
                </button>
            </div>
        );
    }

    // Si no tenemos datos de brigada, mostramos un mensaje
    if (!brigade) {
        return (
            <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <div className={`max-w-4xl mx-auto p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <button 
                        onClick={handleBack}
                        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Volver al calendario
                    </button>
                    <div className="text-center py-8">
                        <h1 className="text-2xl font-bold mb-4">No se encontró información</h1>
                        <p>No se encontraron datos para la brigada seleccionada.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className={`max-w-4xl mx-auto p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <button 
                    onClick={handleBack}
                    className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Volver al calendario
                </button>

                <h1 className="text-2xl font-bold mb-6">Detalle de Guardia Especial</h1>
                
                <div className="space-y-6">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h2 className="text-xl font-semibold mb-2">Información de la Brigada</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">Nombre:</p>
                                <p>{brigade.nombre}</p>
                            </div>
                            {brigade.responsable && (
                                <div>
                                    <p className="font-medium">Responsable:</p>
                                    <p>{brigade.responsable}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h2 className="text-xl font-semibold mb-2">Detalles de la Guardia</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">Fecha:</p>
                                <p>{formatDate(date)}</p>
                            </div>
                            {guard && (
                                <div>
                                    <p className="font-medium">Tipo:</p>
                                    <p>{guard.tipo || 'No especificado'}</p>
                                </div>
                            )}
                            {guard && guard.especiales && (
                                <div className="col-span-2">
                                    <p className="font-medium">Información Especial:</p>
                                    <p>{guard.especiales}</p>
                                </div>
                            )}
                        </div>
                        
                        {!guard && (
                            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                                <p>No se encontró información detallada de esta guardia para la fecha seleccionada.</p>
                            </div>
                        )}
                    </div>

                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h2 className="text-xl font-semibold mb-2">Personal Asignado</h2>
                        
                        {brigadeUsers && brigadeUsers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className={`min-w-full ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                        <tr>
                                            <th className="py-2 px-4 text-left">Nombre</th>
                                            <th className="py-2 px-4 text-center">Estado</th>
                                            <th className="py-2 px-4 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brigadeUsers.map((brigadeUser) => (
                                            <tr key={brigadeUser.id} className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                <td className="py-2 px-4">
                                                    {brigadeUser.user?.nombre} {brigadeUser.user?.apellido}
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                        assignments[brigadeUser.id_usuario] 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {assignments[brigadeUser.id_usuario] ? 'Acude' : 'No acude'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleUserAssignment(brigadeUser.id_usuario)}
                                                        disabled={processingUser === brigadeUser.id_usuario}
                                                        className={`px-3 py-1 rounded ${
                                                            assignments[brigadeUser.id_usuario]
                                                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                        } ${processingUser === brigadeUser.id_usuario ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {processingUser === brigadeUser.id_usuario 
                                                            ? 'Procesando...' 
                                                            : (assignments[brigadeUser.id_usuario] ? 'Quitar' : 'Asignar')
                                                        }
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p>No hay bomberos asignados a esta brigada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardDetailPage;