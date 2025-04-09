const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/firefighters-assignments`;
const API_URL2 = `${API_BASE_URL}/firefighters-assignments/available-firefighters`;
const API_URL3 = `${API_BASE_URL}/firefighters-assignments/available-firefighters-without-mands`;
const API_URL4 = `${API_BASE_URL}/firefighters-assignments/available-firefighters-no-adjacent-days`;
const API_URL_NO_TODAY_TOMORROW   = `${API_BASE_URL}/firefighters-assignments/no-today-and-tomorrow`;
const API_URL_NO_TODAY_YESTERDAY = `${API_BASE_URL}/firefighters-assignments/no-today-and-yesterday`;
const API_URL_WORKING_FIRE = `${API_BASE_URL}/firefighters-assignments/working-firefighters`;
const API_URL_CREATE_PRACTICES = `${API_BASE_URL}/firefighters-assignments/create-practices`;
const API_URL_CREATE_RT = `${API_BASE_URL}/firefighters-assignments/create-rt`;
const API_URL_CHECK_ESPECIAL = `${API_BASE_URL}/firefighters-assignments/check-especial`;

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
    return await BaseApiService.delete(API_URL + '/' + id);
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
  
  // Método para obtener los bomberos que están trabajando
  async getWorkingFirefighters(date) {
    return await BaseApiService.get(API_URL_WORKING_FIRE, { date });
  }

  // Método para crear asignaciones de prácticas (ida por la mañana, vuelta por la tarde)
  async createPracticesAssignments(payload) {
    return await BaseApiService.post(API_URL_CREATE_PRACTICES, payload);
  }

  // Método para crear asignaciones de retén (ida por la mañana, vuelta al día siguiente por la mañana)
  async createRTAssignments(payload) {
    return await BaseApiService.post(API_URL_CREATE_RT, payload);
  }

  // Método para verificar si existe una asignación especial para una brigada en una fecha
  async checkEspecialAssignment(brigadeId, date) {
    return await BaseApiService.get(API_URL_CHECK_ESPECIAL, { 
      id_brigada: brigadeId, 
      fecha: date 
    });
  }

  async deletePracticesAssignments(brigadeId, date) {
    return await BaseApiService.post(API_URL_DELETE_PRACTICES, {
      id_brigada: brigadeId,
      fecha: date
    });
  }
  
  async deleteRTAssignments(brigadeId, date) {
    return await BaseApiService.post(API_URL_DELETE_RT, {
      id_brigada: brigadeId,
      fecha: date
    });
  }
}

export default new AssignmentsApiService();