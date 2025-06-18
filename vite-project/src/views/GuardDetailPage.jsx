import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import BrigadeUsersApiService from '../services/BrigadeUserApiService';
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
      
            console.log('Iniciando fetchData con parámetros:', { brigadeId, date });
      
            // Obtener datos de la brigada
            console.log('Solicitando datos de la brigada:', brigadeId);
            const brigadeResponse = await BrigadesApiService.getBrigade(brigadeId);
            console.log('Respuesta de brigada recibida:', brigadeResponse);
      
            if (!brigadeResponse || !brigadeResponse.data) {
              console.error('Respuesta de brigada inválida:', brigadeResponse);
              setError('No se pudo obtener información de la brigada');
              setLoading(false);
              return;
            }
      
            setBrigade(brigadeResponse.data);
            console.log('Brigada establecida en el estado:', brigadeResponse.data);
      
            // Obtener la guardia específica
            console.log('Solicitando guardias');
            const guardsResponse = await GuardsApiService.getGuards();
            console.log('Respuesta de guardias recibida:', guardsResponse);
      
            if (!guardsResponse || !guardsResponse.data) {
              console.error('Respuesta de guardias inválida:', guardsResponse);
            } else {
              console.log('Filtrando guardias para brigada y fecha:', { brigadeId, date });
              const guardsFiltered = guardsResponse.data.filter(g =>
                g.id_brigada == brigadeId &&
                g.date === date &&
                g.especiales !== null &&
                g.especiales !== undefined &&
                g.especiales !== ""
              );
      
              console.log('Guardias filtradas:', guardsFiltered);
      
              if (guardsFiltered.length > 0) {
                setGuard(guardsFiltered[0]);
                console.log('Guardia establecida en el estado:', guardsFiltered[0]);
              } else {
                console.log('No se encontraron guardias especiales para esta brigada y fecha');
              }
            }
      
            // Obtener usuarios de la brigada
            console.log('Solicitando bomberos para la brigada:', brigadeId);
            const brigadeUsersResponse = await BrigadeUsersApiService.getUsersByBrigade(brigadeId);
            console.log('Respuesta de bomberos recibida:', brigadeUsersResponse);
      
            let formattedUsers = [];
            // Usamos la propiedad "brigadeUsers" que viene de la API, la cual ya incluye la relación 'user'
            if (brigadeUsersResponse.data && brigadeUsersResponse.data.brigadeUsers) {
              formattedUsers = brigadeUsersResponse.data.brigadeUsers;
            }
            setBrigadeUsers(formattedUsers);
      
            // Procesamos asignaciones para cada usuario
            const assignmentsData = {};
            console.log('Verificando asignaciones para cada usuario');
            for (const user of formattedUsers) {
              try {
                console.log('Verificando asignación para usuario:', user.id_usuario);
                const checkResponse = await AssignmentsApiService.checkEspecialAssignment(brigadeId, date, user.id_usuario);
                
                console.log('Respuesta de verificación recibida:', checkResponse);
      
                assignmentsData[user.id_usuario] = checkResponse.data.has_assignments || false;
                console.log(`Estado de asignación para ${user.id_usuario}:`, assignmentsData[user.id_usuario]);
              } catch (err) {
                console.error(`Error checking assignment for user ${user.id_usuario}:`, err);
                assignmentsData[user.id_usuario] = false;
              }
            }
      
            console.log('Datos de asignaciones completos:', assignmentsData);
            setAssignments(assignmentsData);
            setLoading(false);
          } catch (error) {
            console.error('Error en fetchData:', error);
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
                id_empleado: userId,
                id_brigada_destino: parseInt(brigadeId),
                fecha: date
            };

            if (isCurrentlyAssigned) {
                // Quitar al bombero de la asignación
                if (guard.especiales.includes('Prácticas')) {
                    await AssignmentsApiService.deletePracticesAssignments(brigadeId, date, userId);
            
                    await BrigadeUsersApiService.incrementPracticas({
                        id_brigada: parseInt(brigadeId),
                        id_usuario: userId,
                        increment: -1
                    });
                } else if (guard.especiales.includes('Guardia localizada')) {
                    await AssignmentsApiService.deleteRTAssignments(brigadeId, date, userId);
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

                } else if (guard.especiales.includes('Guardia localizada')) {
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
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md w-full max-w-lg">
                    <div className="flex items-center">
                        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
                <button
                    onClick={handleBack}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition duration-200"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al calendario
                </button>
            </div>
        );
    }

    // Si no tenemos datos de brigada, mostramos un mensaje
    if (!brigade) {
        return (
            <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`max-w-4xl mx-auto p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <button
                        onClick={handleBack}
                        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition duration-200"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al calendario
                    </button>
                    <div className="text-center py-10">
                        <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h1 className="text-2xl font-bold mb-3">No se encontró información</h1>
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron datos para la brigada seleccionada.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`max-w-5xl mx-auto rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Header con botón de regreso y título */}
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            className={`flex items-center font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition duration-200`}
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver
                        </button>
                        <h1 className="text-2xl font-bold">Guardia Especial</h1>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información de la Brigada */}
                        <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                            <div className="flex items-center mb-4">
                                <svg className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h2 className="text-xl font-semibold">Brigada</h2>
                            </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nombre:</p>
                                        <p className="font-medium text-lg">{brigade.nombre}</p>
                                    </div>
                                    {brigade.responsable && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Responsable:</p>
                                            <p className="font-medium">{brigade.responsable}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detalles de la Guardia */}
                        <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                            <div className="flex items-center mb-4">
                                <svg className="h-6 w-6 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h2 className="text-xl font-semibold">Detalles</h2>
                            </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha:</p>
                                        <p className="font-medium text-lg">{formatDate(date)}</p>
                                    </div>
                                    {guard && guard.especiales && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Información Especial:</p>
                                            <p className="font-medium">{guard.especiales}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!guard && (
                                <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
                                    <div className="flex">
                                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p>No se encontró información detallada de esta guardia para la fecha seleccionada.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Personal Asignado */}
                    <div className={`mt-8 rounded-lg p-6 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                        <div className="flex items-center mb-6">
                            <svg className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h2 className="text-xl font-semibold">Personal Asignado</h2>
                        </div>

                        {brigadeUsers && brigadeUsers.length > 0 ? (
                            <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                    Nombre
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                            {brigadeUsers.map((brigadeUser) => (
                                                <tr key={brigadeUser.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                                                                <span className="text-lg font-medium">
                                                                    {brigadeUser.user?.nombre.charAt(0)}{brigadeUser.user?.apellido.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {brigadeUser.user?.nombre} {brigadeUser.user?.apellido}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                            assignments[brigadeUser.id_usuario]
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {assignments[brigadeUser.id_usuario] 
                                                                ? (<>
                                                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Acude
                                                                </>)
                                                                : (<>
                                                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    No acude
                                                                </>)
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => toggleUserAssignment(brigadeUser.id_usuario)}
                                                            disabled={processingUser === brigadeUser.id_usuario}
                                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                                                                assignments[brigadeUser.id_usuario]
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                                                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                                    assignments[brigadeUser.id_usuario] ? 'focus:ring-red-500' : 'focus:ring-green-500'
                                                                } ${processingUser === brigadeUser.id_usuario ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        >
                                                            {processingUser === brigadeUser.id_usuario ? (
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                assignments[brigadeUser.id_usuario] ? 
                                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg> : 
                                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            )}
                                                            {assignments[brigadeUser.id_usuario] ? 'Quitar' : 'Asignar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-10 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium">Sin personal asignado</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay bomberos asignados a esta brigada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardDetailPage;