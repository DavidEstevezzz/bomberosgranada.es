import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const AssignmentsTable = ({ assignments, setSelectedAssignment, setShowEditModal, handleDelete }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [brigades, setBrigades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [resUsuarios, resBrigades] = await Promise.all([
                    UsuariosApiService.getUsuarios(),
                    BrigadesApiService.getBrigades(),
                ]);

                const bomberos = resUsuarios.data.filter(usuario => usuario.type === 'bombero');
                setUsuarios(bomberos);
                setBrigades(resBrigades.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getUsuarioNombre = (id_empleado) => {
        const usuario = usuarios.find(usuario => usuario.id_empleado === id_empleado);
        return usuario ?`${usuario.nombre} ${usuario.apellido}`  : 'Desconocido';
    };

    const getBrigadaNombre = (id_brigada) => {
        const brigada = brigades.find(brigada => brigada.id_brigada === id_brigada);
        return brigada ? brigada.nombre : 'Desconocida';
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr>
                        <th className="py-2 px-2">Fecha Inicio</th>
                        <th className="py-2 px-2">Empleado</th>
                        <th className="py-2 px-2">Brigada Origen</th>
                        <th className="py-2 px-2">Brigada Destino</th>
                        <th className="py-2 px-2" style={{ width: '200px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {assignments.map(assignment => (
                        <tr key={assignment.id_asignacion}>
                            <td className="py-2 px-2">{assignment.fecha_ini}</td>
                            <td className="py-2 px-2">{getUsuarioNombre(assignment.id_empleado)}</td>
                            <td className="py-2 px-2">{getBrigadaNombre(assignment.id_brigada_origen)}</td>
                            <td className="py-2 px-2">{getBrigadaNombre(assignment.id_brigada_destino)}</td>
                            <td className="py-2 px-2 flex space-x-2">
                                <button onClick={() => { setSelectedAssignment(assignment); setShowEditModal(true); }} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Editar</span>
                                </button>
                                <button onClick={() => handleDelete(assignment.id_asignacion)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                    <FontAwesomeIcon icon={faTrash} />
                                    <span>Borrar</span>
                                </button>
                                
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AssignmentsTable;
