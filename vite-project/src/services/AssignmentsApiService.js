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
const API_URL_CHECK_ESPECIAL_USER = `${API_BASE_URL}/firefighters-assignments/check-especial-user`;
const API_URL_CHECK_ESPECIAL_BRIGADE = `${API_BASE_URL}/firefighters-assignments/check-especial-brigade`;
const API_URL_DELETE_PRACTICES = `${API_BASE_URL}/firefighters-assignments/delete-practices`;
const API_URL_DELETE_RT = `${API_BASE_URL}/firefighters-assignments/delete-rt`;
const API_URL_EXTEND_WORKING_DAY = `${API_BASE_URL}/firefighters-assignments/extend-working-day`;
const API_URL_TRANSFERS = `${API_BASE_URL}/transfers`;

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
async checkEspecialAssignment(brigadeId, date, userId) {
  return await BaseApiService.get(API_URL_CHECK_ESPECIAL_USER, { 
    id_brigada: brigadeId, 
    fecha: date,
    id_usuario: userId
  });
}

// Método para verificar a nivel de brigada (si lo necesitas)
async checkEspecialBrigade(brigadeId, date) {
  return await BaseApiService.get(API_URL_CHECK_ESPECIAL_BRIGADE, { 
    id_brigada: brigadeId, 
    fecha: date
  });
}

  async deletePracticesAssignments(brigadeId, date, userId) {
    return await BaseApiService.post(API_URL_DELETE_PRACTICES, {
      id_brigada: brigadeId,
      fecha: date,
      id_usuario: userId  // Nuevo parámetro
    });
  }
  
  async deleteRTAssignments(brigadeId, date, userId) {
    return await BaseApiService.post(API_URL_DELETE_RT, {
      id_brigada: brigadeId,
      fecha: date,
      id_usuario: userId  // Nuevo parámetro
    });
  }

  async extendWorkingDay(payload) {
    return await BaseApiService.post(API_URL_EXTEND_WORKING_DAY, payload);
  }

  async getActiveTransfers(idBrigada, fecha) {
  return await BaseApiService.get(`${API_URL}/active-transfers`, { 
    id_brigada: idBrigada, 
    fecha: fecha 
  });
}

async undoTransfer(idAsignacionIda) {
  return await BaseApiService.post(`${API_URL}/undo-transfer`, {
    id_asignacion_ida: idAsignacionIda
  });
}

// Nuevos métodos para la tabla de traslados
async getTransfersByBrigadeAndDate(idBrigada, fecha) {
  return await BaseApiService.get(`${API_URL_TRANSFERS}/by-brigade-and-date`, {
    id_brigada: idBrigada,
    fecha: fecha
  });
}

async createTransfer(transferData) {
  return await BaseApiService.post(API_URL_TRANSFERS, transferData);
}

async getTransfer(idTransfer) {
  return await BaseApiService.get(`${API_URL_TRANSFERS}/${idTransfer}`);
}

async updateTransfer(idTransfer, transferData) {
  return await BaseApiService.put(`${API_URL_TRANSFERS}/${idTransfer}`, transferData);
}

async deleteTransfer(idTransfer) {
  return await BaseApiService.delete(`${API_URL_TRANSFERS}/${idTransfer}`);
}

}


export default new AssignmentsApiService();