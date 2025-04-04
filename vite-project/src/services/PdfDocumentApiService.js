import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/pdf-documents`;

class PdfDocumentApiService {
  /**
   * Obtener el documento PDF más reciente
   */
  async getLatestDocument() {
    return await BaseApiService.get(`${API_URL}/latest`);
  }

  /**
   * Subir un documento PDF
   * @param {FormData} formData - Contiene title y pdf_file
   */
  async uploadDocument(formData) {
    // Se quita la configuración manual del header para que Axios lo gestione
    return await BaseApiService.post(`${API_URL}/upload`, formData);
  }

  /**
   * Obtener URL para mostrar el documento
   * @param {number} id - ID del documento
   */
  getDocumentUrl(id) {
    return `${API_URL}/${id}`;
  }

  /**
   * Obtener URL para descargar el documento
   * @param {number} id - ID del documento
   */
  getDownloadUrl(id) {
    return `${API_URL}/${id}/download`;
  }

  /**
   * Eliminar un documento PDF
   * @param {number} id - ID del documento
   */
  async deleteDocument(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }
}

export default new PdfDocumentApiService();
