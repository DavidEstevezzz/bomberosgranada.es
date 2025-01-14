import React, { useState, useEffect } from 'react';
import MessagesApiService from '../services/MessagesApiService';
import UsersApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import CreateMessageModal from '../components/CreateMessageModal';
import dayjs from 'dayjs';

const MessagesPage = () => {
    const { darkMode } = useDarkMode();
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [users, setUsers] = useState([]);
    const [view, setView] = useState('inbox');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    useEffect(() => {
        fetchUsers();
        fetchMessages();
    }, [view, currentMonth]);

    const fetchUsers = async () => {
        try {
            const response = await UsersApiService.getUsuarios();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const messages = view === 'inbox'
                ? await MessagesApiService.getInbox()
                : await MessagesApiService.getSent();

            const filteredMessages = messages.data.filter((message) =>
                dayjs(message.created_at).isSame(currentMonth, 'month')
            );

            if (view === 'inbox') setInbox(filteredMessages);
            else setSent(filteredMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const user = users.find((user) => user.id_empleado === userId);
        return user ? `${user.nombre} ${user.apellido}` : 'Desconocido';
    };

    const handleDelete = async (id) => {
        try {
            await MessagesApiService.deleteMessage(id);
            fetchMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await MessagesApiService.markAsRead(id);
            fetchMessages();
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const handleOpenMessage = async (message) => {
        if (!message.is_read) {
            try {
                await MessagesApiService.markAsRead(message.id);
                setInbox((prevInbox) =>
                    prevInbox.map((msg) =>
                        msg.id === message.id ? { ...msg, is_read: true } : msg
                    )
                );
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
        setSelectedMessage(message);
    };

    const handleDownloadAttachment = async (id, filename) => {
        setDownloading(true);
        try {
            const response = await MessagesApiService.downloadAttachment(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading attachment:', error);
        } finally {
            setDownloading(false);
        }
    };

    const handlePreviousMonth = () => {
        setCurrentMonth((prev) => prev.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => prev.add(1, 'month'));
    };

    const closeModal = () => {
        setShowModal(false);
        fetchMessages();
    };

    if (loading) return <div className="text-center py-4">Cargando...</div>;

    const messages = view === 'inbox' ? inbox : sent;

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Mensajes</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Crear Mensaje
                </button>
            </div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setView('inbox')}
                        className={`px-4 py-2 rounded ${view === 'inbox' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}
                    >
                        Bandeja de Entrada
                    </button>
                    <button
                        onClick={() => setView('sent')}
                        className={`px-4 py-2 rounded ${view === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}
                    >
                        Bandeja de Salida
                    </button>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePreviousMonth}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Mes Anterior
                    </button>
                    <span className="text-lg mt-2 font-semibold">
                        {currentMonth.format('MMMM YYYY').charAt(0).toUpperCase() + currentMonth.format('MMMM YYYY').slice(1)}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Mes Siguiente
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full table-auto text-center">
                    <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                        <tr>
                            <th className="py-2 px-4">Fecha</th>
                            <th className="py-2 px-4">Asunto</th>
                            <th className="py-2 px-4">Remitente/Destinatario</th>
                            <th className="py-2 px-4">Estado</th>
                            <th className="py-2 px-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <tr
                                    key={message.id}
                                    className={`border-b ${message.is_read ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                                >
                                    <td className="py-2 px-4">{new Date(message.created_at).toLocaleDateString()}</td>
                                    <td className="py-2 px-4">{message.subject}</td>
                                    <td className="py-2 px-4">
                                        {view === 'inbox'
                                            ? getUserName(message.sender_id)
                                            : getUserName(message.receiver_id)}
                                    </td>
                                    <td className="py-2 px-4">{message.is_read ? 'Leído' : 'No leído'}</td>
                                    <td className="py-2 px-4 flex space-x-2 justify-center">
                                        <button
                                            onClick={() => handleOpenMessage(message)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Abrir
                                        </button>
                                        <button
                                            onClick={() => handleDelete(message.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    No hay mensajes en esta bandeja.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showModal && <CreateMessageModal isOpen={showModal} onClose={closeModal} />}
            {selectedMessage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-8 w-full max-w-3xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
                        <div className="flex justify-between items-center pb-6 border-b">
                            <h2 className="text-xl font-bold">Detalles del Mensaje</h2>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                                Cerrar
                            </button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div>
                                <p className="font-bold text-lg">Asunto:</p>
                                <p className="text-base">{selectedMessage.subject}</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg">De:</p>
                                <p className="text-base">{getUserName(selectedMessage.sender_id)}</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Para:</p>
                                <p className="text-base">{getUserName(selectedMessage.receiver_id)}</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Mensaje:</p>
                                <p className="text-base">{selectedMessage.body}</p>
                            </div>
                            {selectedMessage.attachment && (
                                <div>
                                    <p className="font-bold text-lg">Adjunto:</p>
                                    <button
                                        onClick={() => handleDownloadAttachment(selectedMessage.id, selectedMessage.attachment.split('/').pop())}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Descargar Archivo
                                    </button>
                                </div>
                            )}
                            {downloading && <p className="text-blue-500 mt-4">Descargando archivo...</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
