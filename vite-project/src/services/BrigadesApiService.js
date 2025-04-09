import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const API_URL = `${API_BASE_URL}/brigades`;

class BrigadesApiService {
    async getBrigades() {
        return await BaseApiService.get(API_URL);
    }

    async getBrigade(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    async checkBrigadaEspecial(id) {
        return await BaseApiService.get(`${API_URL}/${id}/check-especial`);
    }

    async getEspecialBrigades() {
        return await BaseApiService.get(`${API_URL}/especial`);
    }

    async createBrigade(brigade) {
        return await BaseApiService.post(API_URL, brigade);
    }

    async updateBrigade(id, brigade) {
        return await BaseApiService.put(`${API_URL}/${id}`, brigade);
    }

    async deleteBrigade(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    async getFirefightersByBrigade(id, fecha) {
        console.log('Enviando fecha:', fecha); // Verificar qué fecha se está enviando
        const url = `${API_URL}/${id}/firefighters?fecha=${fecha}`; // Añadir fecha como query param
        return await BaseApiService.get(url); // Hacer la solicitud con la URL completa
    }

    async getFirefightersByBrigadeDebouncing(id, fecha) {
        return await BaseApiService.getWithDebounce(`${API_URL}/${id}/firefighters`, { fecha });
    }
    

    async getParks() {
        return await BaseApiService.get(`${API_BASE_URL}/parks`);
    }
}

export default new BrigadesApiService();
