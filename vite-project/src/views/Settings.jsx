import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsApiService from '../services/SettingsApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import EditSettingModal from '../components/EditSettingModal';
import AddSettingModal from '../components/AddSettingModal';

const Settings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await SettingsApiService.getSettings();
                setSettings(response.data);
                setError(null);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleEditClick = (setting) => {
        setSelectedSetting(setting);
        setIsEditModalOpen(true);
    };

    const handleAddSettingClick = () => {
        setIsAddModalOpen(true);
    };

    const handleUpdateSetting = async (updatedSetting) => {
        try {
            const response = await SettingsApiService.updateSetting(updatedSetting.id, updatedSetting);
            setSettings(settings.map(setting => setting.id === updatedSetting.id ? response.data : setting));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Failed to update setting:', error);
            if (error.response && error.response.data) {
                alert("Error: " + Object.values(error.response.data).join("\n"));
            }
        }
    };

    const handleAddSetting = async (newSetting) => {
        try {
            const response = await SettingsApiService.createSetting(newSetting);
            setSettings([...settings, response.data]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Failed to add setting:', error);
            if (error.response && error.response.data) {
                alert("Error: " + Object.values(error.response.data).join("\n"));
            } else {
                alert("Error: An unexpected error occurred");
            }
        }
    };

    const handleDeleteSetting = async (id) => {
        if (window.confirm("Are you sure you want to delete this setting?")) {
            try {
                await SettingsApiService.deleteSetting(id);
                setSettings(settings.filter(setting => setting.id !== id));
            } catch (error) {
                console.error('Failed to delete setting:', error);
                alert('Failed to delete setting');
            }
        }
    };

    const handleDetailClick = (setting) => {
        navigate(`/settings/${setting.id}`);
    };

    const filteredSettings = settings.filter((setting) =>
        (setting.nombre && setting.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">Configuraciones</h1>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                    <button onClick={handleAddSettingClick} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Añadir Configuración</span>
                    </button>
                </div>
            </div>
            <div className="bg-gray-800 text-white p-4 rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-700 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
                    <input
                        type="text"
                        placeholder="Buscar configuraciones"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="bg-gray-700 text-gray-300 px-4 py-2 rounded w-full md:w-3/4 flex-grow md:flex-grow-0"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="py-2 px-2">Nombre</th>
                                <th className="py-2 px-2">Valor</th>
                                <th className="py-2 px-2">Descripción</th>
                                <th className="py-2 px-2" style={{ width: '200px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSettings.map((setting) => (
                                <tr key={setting.id} className="border-b border-gray-700">
                                    <td className="py-2 px-2">{setting.nombre}</td>
                                    <td className="py-2 px-2">{setting.valor}</td>
                                    <td className="py-2 px-2">{setting.descripcion}</td>
                                    <td className="py-2 px-2 flex space-x-2">
                                        <button onClick={() => handleEditClick(setting)} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                            <FontAwesomeIcon icon={faEdit} />
                                            <span>Editar</span>
                                        </button>
                                        <button onClick={() => handleDeleteSetting(setting.id)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                            <FontAwesomeIcon icon={faTrash} />
                                            <span>Borrar</span>
                                        </button>
                                        <button onClick={() => handleDetailClick(setting)} className="bg-gray-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                                            <FontAwesomeIcon icon={faInfoCircle} />
                                            <span>Detalle</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedSetting && (
                <EditSettingModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    setting={selectedSetting}
                    onUpdate={handleUpdateSetting}
                />
            )}
            <AddSettingModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddSetting}
            />
        </div>
    );
};

export default Settings;
