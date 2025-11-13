import BaseApiService from './BaseApiService';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/brigade-compositions`;

class BrigadeCompositionApiService {
    /**
     * Obtener todas las brigadas disponibles
     */
    async getBrigades() {
        return await BaseApiService.get(`${API_URL}/brigades`);
    }

    /**
     * Obtener la composición de una brigada en un mes específico
     * @param {number} brigadeId - ID de la brigada
     * @param {number} idParque - ID del parque (1: Norte, 2: Sur)
     * @param {number} year - Año
     * @param {number} month - Mes (1-12)
     */
    async getComposition(brigadeId, idParque, year, month) {
        return await BaseApiService.get(`${API_URL}/${brigadeId}/${idParque}/${year}/${month}`);
    }

    /**
     * Copiar todas las brigadas del mes actual al mes siguiente
     * @param {number} year - Año del mes actual
     * @param {number} month - Mes actual (1-12)
     */
    async copyToNextMonth(year, month) {
        return await BaseApiService.post(`${API_URL}/copy-to-next-month`, { year, month });
    }

    /**
     * Trasladar un bombero de una brigada a otra
     * @param {object} transferData - Datos del traslado
     * @param {number} transferData.user_id - ID del usuario/bombero
     * @param {number} transferData.from_brigade_id - ID de la brigada origen
     * @param {number} transferData.from_id_parque - ID del parque origen
     * @param {number} transferData.to_brigade_id - ID de la brigada destino
     * @param {number} transferData.to_id_parque - ID del parque destino
     * @param {number} transferData.year - Año
     * @param {number} transferData.month - Mes (1-12)
     */
    async transferFirefighter(transferData) {
        return await BaseApiService.post(`${API_URL}/transfer-firefighter`, transferData);
    }
}

export default new BrigadeCompositionApiService();
