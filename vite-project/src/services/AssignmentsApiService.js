const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/firefighters-assignments`;
const API_URL2 = `${API_BASE_URL}/firefighters-assignments/available-firefighters`;

import BaseApiService from './BaseApiService';

class AssignmentsApiService {
    async getAssignments() {
        return await BaseApiService.get(API_URL);
    }

    async getAssignment(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    async createAssignment(assignment) {
        return await BaseApiService.post(API_URL, assignment);
    }

    async updateAssignment(id, assignment) {
        return await BaseApiService.put(`${API_URL}/${id}`, assignment);
    }

    async deleteAssignment(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    async getAvailableFirefighters(date) {
        console.log("Enviando fecha desde frontend:", date);  // Log para verificar la fecha en el frontend
        return await BaseApiService.get(API_URL2, { date });
    }
}

export default new AssignmentsApiService();
