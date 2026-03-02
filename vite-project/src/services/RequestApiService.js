// src/services/RequestApiService.js
import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/requests`;

class RequestApiService {
    // Obtener todas las solicitudes
    async getRequests() {
        return await BaseApiService.get(API_URL);
    }

    // Obtener una solicitud específica por ID
    async getRequest(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    // Crear una nueva solicitud
    async createRequest(request) {
        let headers = {};

        // Si el request es FormData, ajusta el encabezado
        if (request instanceof FormData) {
            headers['Content-Type'] = 'multipart/form-data';
        }

        return await BaseApiService.post(API_URL, request, null, headers);
    }

    async downloadFile(id) {
        const url = `${API_URL}/${id}/file`;
        return await BaseApiService.get(url, null, {}, 'blob');
    }

    // Actualizar una solicitud existente por ID
    async updateRequest(id, request) {
        return await BaseApiService.put(`${API_URL}/${id}`, request);
    }

    // Eliminar una solicitud por ID
    async deleteRequest(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }

    // NUEVO MÉTODO: Obtener lista de empleados (solo para jefes)
    async getEmployees() {
        const url = `${API_BASE_URL}/employees`;
        return await BaseApiService.get(url);
    }

    async getMyGuards(month, idEmpleado) {
        const url = `${API_BASE_URL}/requests/my-guards`;
        const params = { month, id_empleado: idEmpleado };
        return await BaseApiService.get(url, params);
    }
    /**
 * Obtener las guardias del bombero para un mes, filtrando por tipo de solicitud.
 * Devuelve guardias con info de solicitudes existentes de ese tipo.
 * Usado por: asuntos propios, licencias por jornadas, salidas personales
 * 
 * @param {string} month - Formato YYYY-MM
 * @param {number} idEmpleado - ID del empleado
 * @param {string} tipoSolicitud - Tipo de solicitud (ej: 'asuntos propios', 'licencias por jornadas', 'salidas personales')
 * @returns {Promise} - { guards: [...], balance: number, month, tipo_solicitud }
 */
    async getMyGuardsForRequest(month, idEmpleado, tipoSolicitud) {
        const url = `${API_BASE_URL}/requests/my-guards-for-request`;
        const params = { month, id_empleado: idEmpleado, tipo_solicitud: tipoSolicitud };
        return await BaseApiService.get(url, params);
    }
}

export default new RequestApiService();