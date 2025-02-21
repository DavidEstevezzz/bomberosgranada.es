import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/incidents`;

class IncidentApiService {
  async getIncidents() {
    return await BaseApiService.get(API_URL);
  }

  async getIncident(id) {
    return await BaseApiService.get(`${API_URL}/${id}`);
  }

  async createIncident(incident) {
    return await BaseApiService.post(API_URL, incident);
  }

  async updateIncident(id, incident) {
    return await BaseApiService.put(`${API_URL}/${id}`, incident);
  }

  async markAsRead(id) {
    return await BaseApiService.patch(`${API_URL}/${id}/mark-as-read`);
  }

  async resolveIncident(id, resolverData) {
    return await BaseApiService.patch(`${API_URL}/${id}/resolve`, resolverData);
  }

  async countPending() {
    return await BaseApiService.get(`${API_URL}/count-pending`);
  }
}

export default new IncidentApiService();
