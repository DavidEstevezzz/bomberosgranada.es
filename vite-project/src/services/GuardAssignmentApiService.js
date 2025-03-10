import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/guard-assignments`;

class GuardAssignmentApiService {
  async getGuardAssignments() {
    return await BaseApiService.get(API_URL);
  }

  async getGuardAssignment(id) {
    return await BaseApiService.get(`${API_URL}/${id}`);
  }

  async createGuardAssignment(assignment) {
    return await BaseApiService.post(API_URL, assignment);
  }

  async updateGuardAssignment(id, assignment) {
    return await BaseApiService.put(`${API_URL}/${id}`, assignment);
  }

  async deleteGuardAssignment(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }

  async updateOrCreateAssignment(assignment) {
    return await BaseApiService.put(`${API_URL}/update-or-create`, assignment);
  }
}

export default new GuardAssignmentApiService();
