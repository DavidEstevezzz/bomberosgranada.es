// src/services/PersonalEquipmentApiService.js
import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/equipos-personales`;

class PersonalEquipmentApiService {
    // Obtener todos los equipos personales
    async getPersonalEquipments() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener un equipo personal específico por ID
    async getPersonalEquipment(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Verificar y asignar equipos para un bombero o mando
    async checkAndAssignEquipment(data) {
        return await BaseApiService.post(`${API_URL}/check-and-assign`, data);
    }
    
    // Crear un nuevo equipo personal
    async createPersonalEquipment(personalEquipment) {
        let headers = {};

        // Si el personalEquipment es FormData, ajusta el encabezado
        if (personalEquipment instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }

        return await BaseApiService.post(API_URL, personalEquipment, null, headers);
    }

    // Obtener todas las categorías de equipos personales
    async getCategories() {
        return await BaseApiService.get(`${API_BASE_URL}/categorias-equipos`);
    }

    // Actualizar un equipo personal existente por ID
    async updatePersonalEquipment(id, personalEquipment) {
        return await BaseApiService.put(`${API_URL}/${id}`, personalEquipment);
    }

    // Eliminar un equipo personal por ID
    async deletePersonalEquipment(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    // Alternar disponibilidad de un equipo
    async toggleDisponibilidad(id) {
        return await BaseApiService.put(`${API_URL}/${id}/toggle-disponibilidad`);
    }
    
    // Obtener equipos por parque
    async getEquipmentsByPark(parkId) {
        return await BaseApiService.get(`${API_URL}/parque/${parkId}`);
    }

    // Verificar disponibilidad de un equipo por número
    async checkEquipmentAvailability(equipmentNumber) {
        return await BaseApiService.get(`${API_URL}/check-availability/${equipmentNumber}`);
    }
    
    // Resetear todas las asignaciones de equipos para un parque y fecha específica
    async resetEquipmentAssignments(parkId, date = null) {
        const data = {
            parkId: parkId,
            date: date
        };
        return await BaseApiService.post(`${API_URL}/reset-assignments`, data);
    }
}

export default new PersonalEquipmentApiService();