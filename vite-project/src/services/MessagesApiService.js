import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/messages`;

class MessagesApiService {
    // Obtener bandeja de entrada
    async getInbox() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener bandeja de salida
    async getSent() {
        return await BaseApiService.get(`${API_URL}/sent`);
    }

    // Ver un mensaje específico
    async getMessage(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Enviar un mensaje
    async sendMessage(message) {
        let headers = {};
    
        if (message instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }
    
        return await BaseApiService.post(API_URL, message, null, headers);
    }

    async downloadAttachment(id) {
        const url = `${API_URL}/${id}/attachment`;
        return await BaseApiService.get(url, null, {}, 'blob'); // Indicamos que queremos un blob
    }

    // Marcar un mensaje como leído
    async markAsRead(id) {
        return await BaseApiService.patch(`${API_URL}/${id}/mark-as-read`);
    }

    // Eliminar un mensaje (soft delete)
    async deleteMessage(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    // Restaurar un mensaje eliminado
    async restoreMessage(id) {
        return await BaseApiService.patch(`${API_URL}/${id}/restore`);
    }

    // Buscar mensajes
    async searchMessages(query) {
        return await BaseApiService.get(`${API_URL}/search`, { params: { query } });
    }
}

export default new MessagesApiService();
