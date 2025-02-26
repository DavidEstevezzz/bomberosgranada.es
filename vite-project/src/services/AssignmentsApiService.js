const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/firefighters-assignments`;
const API_URL2 = `${API_BASE_URL}/firefighters-assignments/available-firefighters`;
const API_URL3 = `${API_BASE_URL}/firefighters-assignments/available-firefighters-without-mands`;
const API_URL4 = `${API_BASE_URL}/firefighters-assignments/available-firefighters-no-adjacent-days`;
const API_URL_NO_TODAY_TOMORROW   = `${API_BASE_URL}/firefighters-assignments/no-today-and-tomorrow`;
const API_URL_NO_TODAY_YESTERDAY = `${API_BASE_URL}/firefighters-assignments/no-today-and-yesterday`;

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
    return await BaseApiService.get(API_URL2, { date });
  }

  async getAvailableFirefightersWithoutMands(date) {
    return await BaseApiService.get(API_URL3, { date });
  }

  async getAvailableFirefightersNoAdjacentDays(date) {
    return await BaseApiService.get(API_URL4, { date });
  }

  async getAvailableFirefightersNoTodayAndTomorrow(date) {
    return await BaseApiService.get(API_URL_NO_TODAY_TOMORROW, { date });
  }

  async getAvailableFirefightersNoTodayAndYesterday(date) {
    return await BaseApiService.get(API_URL_NO_TODAY_YESTERDAY, { date });
  }

  async moveFirefighterToTop(id, column = 'orden') {
    return await BaseApiService.post(`${API_URL}/${id}/move-to-top/${column}`);
  }

  async moveFirefighterToBottom(id, column = 'orden') {
    return await BaseApiService.post(`${API_URL}/${id}/move-to-bottom/${column}`);
  }

  async requireFirefighter(payload) {
    return await BaseApiService.post(`${API_URL}/require-firefighter`, payload);
  }

  async incrementUserColumn(id, payload) {
    return await BaseApiService.put(`${API_URL}/${id}/increment-user-column`, payload);
  }
  
}

export default new AssignmentsApiService();
