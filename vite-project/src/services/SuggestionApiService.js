// src/services/SuggestionApiService.js
import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/suggestions`;

class SuggestionApiService {
    // Obtener todas las sugerencias
    async getSuggestions() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener una sugerencia específica por ID
    async getSuggestion(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Crear una nueva sugerencia
    async createSuggestion(suggestion) {
        let headers = {};

        // Si la sugerencia es FormData, ajusta el encabezado
        if (suggestion instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }

        return await BaseApiService.post(API_URL, suggestion, null, headers);
    }

    // Actualizar una sugerencia existente por ID
    async updateSuggestion(id, suggestion) {
        return await BaseApiService.put(`${API_URL}/${id}`, suggestion);
    }

    // Eliminar una sugerencia por ID
    async deleteSuggestion(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    // Agregar voto a una sugerencia
    async addVote(id) {
        return await BaseApiService.post(`${API_URL}/${id}/vote`);
    }
}

export default new SuggestionApiService();
