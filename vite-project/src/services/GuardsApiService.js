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

async getEspecialGuards() {
  return await BaseApiService.get(`${API_URL}/especial`);
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

async updateSchedule(guardId, commentsData) {
  return await BaseApiService.put(`${API_URL}/${guardId}/update-schedule`, commentsData);
}

async updateGuardComments(idBrigada, date, comentarios) {
  const url = `${API_URL}/update-comments`;
  return await BaseApiService.put(url, {
    id_brigada: idBrigada,
    date: date,
    comentarios: comentarios,
  });
}

async updateDailyActivities(guardId, dailyData) {
  return await BaseApiService.put(`${API_URL}/${guardId}/daily-activities`, dailyData);
}

async updatePersonalIncidents(idBrigada, date, incidencias_personal) {
  const url = `${API_URL}/update-personal-incidents`;
  return await BaseApiService.put(url, {
    id_brigada: idBrigada,
    date: date,
    incidencias_personal: incidencias_personal,
  });
}

async updateGeneralIncidents(idBrigada, date, incidencias_generales) {
  const url = `${API_URL}/update-general-incidents`;
  return await BaseApiService.put(url, {
    id_brigada: idBrigada,
    date: date,
    incidencias_generales: incidencias_generales,
  });
}

async getPreviousGuards(id_brigada, currentDate, daysBack = [5, 10, 15]) {
  try {
    const guardPromises = daysBack.map(days => {
      // USAR STRING PARSING EN LUGAR DE new Date()
      const [year, month, day] = currentDate.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
      date.setDate(date.getDate() - days);
      
      // Formatear manualmente para evitar problemas de zona horaria
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      
      console.log(`📅 Buscando guardia de hace ${days} días: ${formattedDate}`);
      
      return this.getGuard(id_brigada, formattedDate);
    });

    const responses = await Promise.allSettled(guardPromises);
    
    // Filtrar solo las respuestas exitosas manteniendo el índice original
    const previousGuards = responses
      .map((response, index) => ({ response, originalIndex: index }))
      .filter(({ response }) => response.status === 'fulfilled' && response.value.data.guard)
      .map(({ response, originalIndex }) => {
        const [year, month, day] = currentDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() - daysBack[originalIndex]);
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;
        
        return {
          guard: response.value.data.guard,
          daysBack: daysBack[originalIndex],
          date: formattedDate
        };
      });
      
    console.log(`✅ Guardias previas encontradas: ${previousGuards.length}`, previousGuards);
    return previousGuards;
  } catch (error) {
    console.error('Error obteniendo guardias anteriores:', error);
    return [];
  }
}
  
}

export default new GuardsApiService();
