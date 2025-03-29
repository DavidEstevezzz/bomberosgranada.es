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
}

export default new PersonalEquipmentApiService();