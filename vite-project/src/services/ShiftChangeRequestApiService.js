// src/services/ShiftChangeRequestApiService.js

import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/shift-change-requests`;

class ShiftChangeRequestApiService {
    // Obtener todas las solicitudes de cambio de guardia
    async getRequests() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener una solicitud de cambio de guardia específica por ID
    async getRequest(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Crear una nueva solicitud de cambio de guardia
    async createRequest(request) {
        return await BaseApiService.post(API_URL, request);
    }

    // Actualizar una solicitud de cambio de guardia existente por ID
    async updateRequest(id, request) {
        return await BaseApiService.put(`${API_URL}/${id}`, request);
    }

    // Eliminar una solicitud de cambio de guardia por ID
    async deleteRequest(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }
}

export default new ShiftChangeRequestApiService();
