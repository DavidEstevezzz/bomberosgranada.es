// src/services/RequestApiService.js
import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const API_URL = `${API_BASE_URL}/requests`;

class RequestApiService {
    // Obtener todas las solicitudes
    async getRequests() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener una solicitud específica por ID
    async getRequest(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Crear una nueva solicitud
    async createRequest(request) {
        let headers = {};
    
        // Si el request es FormData, ajusta el encabezado
        if (request instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }
    
        return await BaseApiService.post(API_URL, request, null, headers);
    }

    async downloadFile(id) {
        const url = `${API_URL}/${id}/file`;
        return await BaseApiService.get(url, null, {}, 'blob');
    }

    // Actualizar una solicitud existente por ID
    async updateRequest(id, request) {
        return await BaseApiService.put(`${API_URL}/${id}`, request);
    }

    // Eliminar una solicitud por ID
    async deleteRequest(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }
}

export default new RequestApiService();
