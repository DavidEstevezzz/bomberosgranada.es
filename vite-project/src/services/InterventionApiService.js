import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/intervenciones`;

class InterventionApiService {
  /**
   * Obtiene todas las interventions.
   * @returns {Promise} - Promise con la lista de interventions.
   */
  async getInterventions() {
    return await BaseApiService.get(API_URL);
  }

  /**
   * Obtiene una intervention por 'parte' (clave primaria).
   * @param {string} parte - La clave primaria de la intervention.
   * @returns {Promise} - Promise con el detalle de la intervention.
   */
  async getIntervention(parte) {
    return await BaseApiService.get(`${API_URL}/${parte}`);
  }

  async createIntervention(intervention) {
    return await BaseApiService.post(API_URL, intervention);
  }

 
  async updateIntervention(parte, intervention) {
    return await BaseApiService.put(`${API_URL}/${parte}`, intervention);
  }

  async deleteIntervention(parte) {
    return await BaseApiService.delete(`${API_URL}/${parte}`);
  }

  async getInterventionsByGuard(id_guard) {
    return await BaseApiService.get(`${API_URL}/by-guard/${id_guard}`);
  }
}

export default new InterventionApiService();
