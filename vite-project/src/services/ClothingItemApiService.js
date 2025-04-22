import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/clothing-items`;

class ClothingItemApiService {
  /**
   * Obtiene todos los ítems de vestuario.
   * @returns {Promise} - Promise con la lista de ítems de vestuario.
   */
  async getClothingItems() {
    return await BaseApiService.get(API_URL);
  }

  /**
   * Obtiene un ítem de vestuario por su ID.
   * @param {number} id - El ID del ítem de vestuario.
   * @returns {Promise} - Promise con el detalle del ítem de vestuario.
   */
  async getClothingItem(id) {
    return await BaseApiService.get(`${API_URL}/${id}`);
  }

  /**
   * Crea un nuevo ítem de vestuario.
   * @param {Object} clothingItem - Datos del ítem de vestuario a crear.
   * @returns {Promise} - Promise con el ítem de vestuario creado.
   */
  async createClothingItem(clothingItem) {
    return await BaseApiService.post(API_URL, clothingItem);
  }

  /**
   * Actualiza un ítem de vestuario existente.
   * @param {number} id - El ID del ítem de vestuario a actualizar.
   * @param {Object} clothingItem - Datos actualizados del ítem de vestuario.
   * @returns {Promise} - Promise con el ítem de vestuario actualizado.
   */
  async updateClothingItem(id, clothingItem) {
    return await BaseApiService.put(`${API_URL}/${id}`, clothingItem);
  }

  /**
   * Elimina un ítem de vestuario.
   * @param {number} id - El ID del ítem de vestuario a eliminar.
   * @returns {Promise} - Promise con el resultado de la eliminación.
   */
  async deleteClothingItem(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }

  /**
   * Cambia el estado de disponibilidad de un ítem de vestuario.
   * @param {number} id - El ID del ítem de vestuario.
   * @returns {Promise} - Promise con el resultado del cambio de estado.
   */
  async toggleAvailability(id) {
    return await BaseApiService.put(`${API_URL}/${id}/toggle-availability`);
  }

  /**
   * Obtiene ítems de vestuario filtrados por parque.
   * @param {number} parkId - El ID del parque a filtrar.
   * @returns {Promise} - Promise con la lista de ítems de vestuario del parque.
   */
  async getClothingItemsByPark(parkId) {
    return await BaseApiService.get(`${API_URL}/by-park/${parkId}`);
  }

  /**
   * Obtiene ítems de vestuario filtrados por tipo.
   * @param {string} type - El tipo de vestuario a filtrar.
   * @returns {Promise} - Promise con la lista de ítems de vestuario del tipo especificado.
   */
  async getClothingItemsByType(type) {
    return await BaseApiService.get(`${API_URL}/by-type/${type}`);
  }
}

export default new ClothingItemApiService();