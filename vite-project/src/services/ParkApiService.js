import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/parks`;

class ParkApiService {
  async getParks() {
    return await BaseApiService.get(API_URL);
  }

  async getPark(id_parque) {
    const url = `${API_URL}/${id_parque}`;
    return await BaseApiService.get(url);
  }

  async createPark(park) {
    return await BaseApiService.post(API_URL, park);
  }

  async updatePark(id_parque, park) {
    const url = `${API_URL}/${id_parque}`;
    return await BaseApiService.put(url, park);
  }

  async deletePark(id_parque) {
    const url = `${API_URL}/${id_parque}`;
    return await BaseApiService.delete(url);
  }
}

export default new ParkApiService();
