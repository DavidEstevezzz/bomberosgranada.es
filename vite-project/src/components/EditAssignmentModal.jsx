import React, { useState, useEffect } from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const EditAssignmentModal = ({ assignment, show, onClose, onEdit }) => {
    const [formData, setFormData] = useState({ ...assignment });
    const [usuarios, setUsuarios] = useState([]);
    const [brigades, setBrigades] = useState([]);

    // Opciones de turno disponibles
    const turnoOptions = ['Mañana', 'Tarde', 'Noche'];
    
    // Opciones de tipo de asignación
    const tipoAsignacionOptions = ['ida', 'vuelta'];

    useEffect(() => {
        if (show) {
            const fetchUsuarios = async () => {
                try {
                    const response = await UsuariosApiService.getUsuarios();
                    const bomberos = response.data.filter(usuario => usuario.type === 'bombero');
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
        setFormData({ ...assignment });
    }, [assignment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value === '' ? null : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await AssignmentsApiService.updateAssignment(formData.id_asignacion, formData);
            onEdit();
            onClose();
        } catch (error) {
            console.error('Failed to update assignment:', error);
            if (error.response && error.response.data) {
                alert("Error: " + Object.values(error.response.data).join("\n"));
            }
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
            <div className="relative bg-gray-800 p-6 rounded-lg z-10 max-w-md w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Editar Asignación</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ID Asignación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            ID Asignación
                        </label>
                        <input 
                            type="text" 
                            name="id_asignacion" 
                            value={formData.id_asignacion || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded bg-gray-700 text-white" 
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Fecha
                        </label>
                        <input 
                            type="date" 
                            name="fecha_ini" 
                            value={formData.fecha_ini || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded bg-gray-700 text-white" 
                        />
                    </div>

                    {/* Empleado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Empleado
                        </label>
                        <select 
                            name="id_empleado" 
                            value={formData.id_empleado || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                            <option value="">Seleccione un Empleado</option>
                            {usuarios.map(usuario => (
                                <option key={usuario.id_empleado} value={usuario.id_empleado}>
                                    {usuario.nombre} {usuario.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Turno */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Turno
                        </label>
                        <select 
                            name="turno" 
                            value={formData.turno || ''} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                            <option value="">Seleccione un Turno</option>
                            {turnoOptions.map(turno => (
                                <option key={turno} value={turno}>
                                    {turno}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Asignación - NUEVO CAMPO */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Tipo de Asignación
                        </label>
                        <select 
                            name="tipo_asignacion" 
                            value={formData.tipo_asignacion || ''} 
                            onChange={handleChange} 
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                            <option value="">Seleccione Tipo de Asignación</option>
                            {tipoAsignacionOptions.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            Ida: Asignación hacia la brigada destino | Vuelta: Regreso a la brigada origen
                        </p>
                    </div>

                    {/* Brigada Origen */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Brigada Origen
                        </label>
                        <select 
                            name="id_brigada_origen" 
                            value={formData.id_brigada_origen || ''} 
                            onChange={handleSelectChange} 
                            className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                            <option value="">Seleccione Brigada Origen</option>
                            {brigades.map(brigada => (
                                <option key={brigada.id_brigada} value={brigada.id_brigada}>
                                    {brigada.nombre} ({brigada.id_parque})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brigada Destino */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Brigada Destino
                        </label>
                        <select 
                            name="id_brigada_destino" 
                            value={formData.id_brigada_destino || ''} 
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
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Guardar
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAssignmentModal;