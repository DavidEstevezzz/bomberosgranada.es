import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/vehicles`;

class VehiclesApiService {
  async getVehicles() {
    return await BaseApiService.get(API_URL);
  }

  async getVehicle(matricula) {
    const url = `${API_URL}/${matricula}`;
    return await BaseApiService.get(url);
  }

  async createVehicle(vehicle) {
    return await BaseApiService.post(API_URL, vehicle);
  }

  async updateVehicle(matricula, vehicle) {
    const url = `${API_URL}/${matricula}`;
    return await BaseApiService.put(url, vehicle);
  }

  async deleteVehicle(matricula) {
    const url = `${API_URL}/${matricula}`;
    return await BaseApiService.delete(url);
  }
}

export default new VehiclesApiService();
