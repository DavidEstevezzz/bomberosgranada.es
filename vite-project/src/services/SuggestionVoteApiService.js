import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/suggestions/vote`;

class SuggestionVoteApiService {
    // Registrar (crear) un voto
    async storeVote(data) {
        return await BaseApiService.post(API_URL, data);
    }

    // Eliminar un voto previamente registrado
    async deleteVote(data) {
        return await BaseApiService.delete(API_URL, { data });
    }
}

export default new SuggestionVoteApiService();
