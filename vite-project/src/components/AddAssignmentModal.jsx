import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const AddAssignmentModal = ({ show, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        fecha_ini: '',
        id_empleado: '',
        id_brigada_origen: '',
        id_brigada_destino: '',
        turno: '', // Nuevo campo agregado
    });
    const [usuarios, setUsuarios] = useState([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [brigades, setBrigades] = useState([]);

    useEffect(() => {
        if (show) {
            const fetchUsuarios = async () => {
                try {
                    const response = await UsuariosApiService.getUsuarios();
                    const bomberos = response.data.filter(usuario => usuario.type === 'bombero' || usuario.type === 'mando');
                    setUsuarios(bomberos);
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                }
            };

            const fetchBrigades = async () => {
                try {
                    const response = await BrigadesApiService.getBrigades();
                    setBrigades(response.data);
                } catch (error) {
                    console.error('Failed to fetch brigades:', error);
                }
            };

            fetchUsuarios();
            fetchBrigades();
        }
    }, [show]);

    useEffect(() => {
        const filtered = usuarios.filter(usuario =>
            `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsuarios(filtered);
    }, [searchTerm, usuarios]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { id_asignacion, ...dataToSend } = formData;
            await AssignmentsApiService.createAssignment(dataToSend);
            onAdd();
            onClose();
        } catch (error) {
            console.error('Failed to create assignment:', error);
            if (error.response && error.response.data) {
                alert("Error: " + Object.values(error.response.data).join("\n"));
            }
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
            <div className="relative bg-gray-800 p-6 rounded-lg z-10 max-w-md w-full mx-4 my-8">
                <h2 className="text-2xl font-bold text-white mb-4">Añadir Asignación</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="date"
                        name="fecha_ini"
                        placeholder="Fecha Inicio"
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Buscar empleado"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        />
                        <select
                            name="id_empleado"
                            onChange={handleChange}
                            required
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                            <option value="">Seleccione un Empleado</option>
                            {filteredUsuarios.map(usuario => (
                                <option key={usuario.id_empleado} value={usuario.id_empleado}>
                                    {usuario.nombre} {usuario.apellido}
                                </option>
                            ))}
                        </select>
                    </div>
                    <select
                        name="id_brigada_origen"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        <option value="">Seleccione Brigada Origen</option>
                        {brigades.map(brigada => (
                            <option key={brigada.id_brigada} value={brigada.id_brigada}>
                                {brigada.nombre} ({brigada.id_parque})
                            </option>
                        ))}
                    </select>
                    <select
                        name="id_brigada_destino"
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        <option value="">Seleccione Brigada Destino</option>
                        {brigades.map(brigada => (
                            <option key={brigada.id_brigada} value={brigada.id_brigada}>
                                {brigada.nombre} ({brigada.id_parque})
                            </option>
                        ))}
                    </select>
                    {/* Nuevo campo para seleccionar el turno */}
                    <select
                        name="turno"
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        <option value="">Seleccione Turno</option>
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noche">Noche</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                            Añadir
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAssignmentModal;
