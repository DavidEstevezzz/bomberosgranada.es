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

  /**
   * Crea una nueva intervention.
   * @param {Object} intervention - Los datos de la intervention.
   * @returns {Promise} - Promise con la intervention creada.
   */
  async createIntervention(intervention) {
    return await BaseApiService.post(API_URL, intervention);
  }

  /**
   * Actualiza una intervention existente.
   * @param {string} parte - La clave primaria de la intervention.
   * @param {Object} intervention - Los datos actualizados.
   * @returns {Promise} - Promise con la intervention actualizada.
   */
  async updateIntervention(parte, intervention) {
    return await BaseApiService.put(`${API_URL}/${parte}`, intervention);
  }

  /**
   * Elimina una intervention.
   * @param {string} parte - La clave primaria de la intervention a eliminar.
   * @returns {Promise} - Promise con el resultado de la eliminación.
   */
  async deleteIntervention(parte) {
    return await BaseApiService.delete(`${API_URL}/${parte}`);
  }

  /**
   * Obtiene todas las interventions asociadas a un id_guard.
   * @param {string|number} id_guard - El identificador del guard.
   * @returns {Promise} - Promise con la lista de interventions asociadas.
   */
  async getInterventionsByGuard(id_guard) {
    return await BaseApiService.get(`${API_URL}/by-guard/${id_guard}`);
  }
}

export default new InterventionApiService();
