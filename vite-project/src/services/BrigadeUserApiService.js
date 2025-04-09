import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/brigade-users`;

class BrigadeUsersApiService {
    // CRUD básico
    async getBrigadeUsers() {
        return await BaseApiService.get(API_URL);
    }

    async createBrigadeUser(brigadeUser) {
        return await BaseApiService.post(API_URL, brigadeUser);
    }

    async getBrigadeUser(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    async updateBrigadeUser(id, brigadeUser) {
        return await BaseApiService.put(`${API_URL}/${id}`, brigadeUser);
    }

    async deleteBrigadeUser(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    // Métodos específicos
    async getUsersByBrigade(brigadeId) {
        // La ruta debe ser `/api/brigade/${brigadeId}/users` o ajustarla según corresponda
        return await BaseApiService.get(`${API_URL}/brigade/${brigadeId}`);
    }

    async getUserPracticas(employeeId) {
        return await BaseApiService.get(`${API_URL}/user/${employeeId}/practicas`);
    }

    async updatePracticas(data) {
        return await BaseApiService.post(`${API_URL}/update-practicas`, data);
    }

    async incrementPracticas(data) {
        return await BaseApiService.post(`${API_URL}/increment-practicas`, data);
    }
}

export default new BrigadeUsersApiService();