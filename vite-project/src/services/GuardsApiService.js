import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const API_URL = `${API_BASE_URL}/guards`;

class GuardsApiService {
  async getGuards() {
    return await BaseApiService.get(API_URL);
  }

  async getGuard(id_brigada, date) {
    const url = `${API_URL}/by-brigade-and-date?id_brigada=${id_brigada}&date=${date}`;
    return await BaseApiService.get(url);
  }

  async createGuard(guard) {
    return await BaseApiService.post(API_URL, guard);
  }

  async updateGuard(date, guard) {
    return await BaseApiService.put(`${API_URL}/${date}`, guard);
  }

  async deleteGuard(date) {
    return await BaseApiService.delete(`${API_URL}/${date}`);
  }

  async getGuardsByBrigades(brigades, startDate, endDate) {
    const url = `${API_URL}/by-brigades`;
    const params = {
        brigades: brigades.join(','),
        start_date: startDate,
        end_date: endDate,
    };

    return await BaseApiService.get(url,  params );
}

async getGuardsByDate(date) {
  const url = `${API_URL}/by-date?date=${date}`;
  return await BaseApiService.get(url);
}

async getAvailableFirefighters(date) {
  const url = `${API_URL}/available-firefighters`;
  const params = { date };
  return await BaseApiService.get(url, params);
}

async updateGuardComments(idBrigada, date, comentarios) {
  const url = `${API_URL}/update-comments`;
  return await BaseApiService.put(url, {
    id_brigada: idBrigada,
    date: date,
    comentarios: comentarios,
  });
}
  
}

export default new GuardsApiService();
