import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const API_URL = `${API_BASE_URL}/extra_hours`;

class ExtraHoursApiService {
  /**
   * Get all extra hours
   * @returns {Promise} - Promise representing the list of extra hours
   */
  async getExtraHours() {
    return await BaseApiService.get(API_URL);
  }

  /**
   * Get a single extra hour by ID
   * @param {number|string} id - The unique ID of the extra hour
   * @returns {Promise} - Promise representing the extra hour details
   */
  async getExtraHour(id) {
    return await BaseApiService.get(`${API_URL}/${id}`);
  }

  /**
   * Create a new extra hour entry
   * @param {Object} extraHour - The extra hour data
   * @returns {Promise} - Promise representing the newly created extra hour
   */
  async createExtraHour(extraHour) {
    return await BaseApiService.post(API_URL, extraHour);
  }

  /**
   * Update an existing extra hour entry
   * @param {number|string} id - The unique ID of the extra hour to update
   * @param {Object} extraHour - The updated extra hour data
   * @returns {Promise} - Promise representing the updated extra hour
   */
  async updateExtraHour(id, extraHour) {
    return await BaseApiService.put(`${API_URL}/${id}`, extraHour);
  }

  /**
   * Delete an extra hour entry
   * @param {number|string} id - The unique ID of the extra hour to delete
   * @returns {Promise} - Promise representing the deletion result
   */
  async deleteExtraHour(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }

  async getExtraHoursByMonth(month) {
    return await BaseApiService.get(`${API_BASE_URL}/extra-hours-by-month?month=${month}`);
  }
  
}

export default new ExtraHoursApiService();
