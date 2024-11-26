import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/settings`;

class SettingsApiService {
    async getSettings() {
        return await BaseApiService.get(API_URL);
    }

    async getSetting(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    async createSetting(setting) {
        return await BaseApiService.post(API_URL, setting);
    }

    async updateSetting(id, setting) {
        return await BaseApiService.put(`${API_URL}/${id}`, setting);
    }

    async deleteSetting(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }
}

export default new SettingsApiService();
