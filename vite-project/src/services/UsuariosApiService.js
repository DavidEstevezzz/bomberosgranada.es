import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/users`;

class UsuariosApiService {
    async getUsuarios() {
        return await BaseApiService.get(API_URL);
    }
    async getUsuario(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }
    async createUsuario(usuario) {
        return await BaseApiService.post(API_URL + '/create', usuario);
    }
    async updateUsuario(id, usuario) {
        return await BaseApiService.put(`${API_URL}/${id}`, usuario);
    }
    async deleteUsuario(id) {
        return await BaseApiService.delete(`${API_URL}/${id}/delete`);
    }
    async getUserByToken() {
        return await BaseApiService.get(`${API_BASE_URL}/user`);
    }
    async updateUserAP(id, newAP) {
        return await BaseApiService.put(`${API_URL}/${id}/update-ap`, { AP: newAP });
    }
    async forgotPassword(data) {
        return await BaseApiService.post(`${API_URL}/forgot-password`, data);
    }
    
    async resetPassword(data) {
        return await BaseApiService.post(`${API_URL}/reset-password`, data);
    }
    
    
}

export default new UsuariosApiService();

