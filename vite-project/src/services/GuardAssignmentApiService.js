import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/guard-assignments`;

class GuardAssignmentApiService {
  async getGuardAssignments() {
    return await BaseApiService.get(API_URL);
  }

  async getGuardAssignment(id) {
    return await BaseApiService.get(`${API_URL}/${id}`);
  }

  async createGuardAssignment(assignment) {
    return await BaseApiService.post(API_URL, assignment);
  }

  async updateGuardAssignment(id, assignment) {
    return await BaseApiService.put(`${API_URL}/${id}`, assignment);
  }

  async deleteGuardAssignment(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }

  async updateOrCreateAssignment(assignment) {
    return await BaseApiService.put(`${API_URL}/update-or-create`, assignment);
  }

  async getAssignmentsByGuardId(guardId) {
    try {
      const response = await this.getGuardAssignments();
      // Filtrar las asignaciones por el ID de la guardia
      return response.data.filter(item => item.id_guard === guardId);
    } catch (error) {
      console.error(`Error obteniendo asignaciones para la guardia ${guardId}:`, error);
      return [];
    }
  }

  async findPreviousAssignmentsForEmployee(employeeId, guardIds) {
    try {
      // Obtener todas las asignaciones
      const response = await this.getGuardAssignments();
      const allAssignments = response.data;
      
      // Para cada ID de guardia, buscar asignaciones del empleado
      for (const guardData of guardIds) {
        const matchingAssignments = allAssignments.filter(
          assignment => assignment.id_guard === guardData.guard.id && 
                         assignment.id_empleado === employeeId
        );
        
        if (matchingAssignments.length > 0) {
          // Si encontramos asignaciones, devolvemos la primera junto con la información de la fecha
          return {
            assignment: matchingAssignments[0],
            daysAgo: guardData.daysBack,
            date: guardData.date
          };
        }
      }
      
      // Si no encontramos asignaciones en ninguna de las guardias anteriores
      return null;
    } catch (error) {
      console.error(`Error buscando asignaciones previas para el empleado ${employeeId}:`, error);
      return null;
    }
  }
}

export default new GuardAssignmentApiService();
