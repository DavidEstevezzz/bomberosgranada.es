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
   * Subir documentos PDF
   * @param {FormData} formData - Contiene title, pdf_file y opcionalmente pdf_file_second
   */
  async uploadDocument(formData) {
    return await BaseApiService.post(
      `${API_URL}/upload`,
      formData,
      {}, // queryParams
      { 'Content-Type': 'multipart/form-data' } // headers
    );
  }

  /**
   * Obtener URL para mostrar el documento primario
   * @param {number} id - ID del documento
   */
  getDocumentUrl(id) {
    return `${API_URL}/${id}`;
  }

  /**
   * Obtener URL para mostrar el documento secundario
   * @param {number} id - ID del documento
   */
  getSecondaryDocumentUrl(id) {
    return `${API_URL}/${id}/secondary`;
  }

  /**
   * Obtener URL para descargar el documento primario
   * @param {number} id - ID del documento
   */
  getDownloadUrl(id) {
    return `${API_URL}/${id}/download`;
  }

  /**
   * Obtener URL para descargar el documento secundario
   * @param {number} id - ID del documento
   */
  getSecondaryDownloadUrl(id) {
    return `${API_URL}/${id}/download/secondary`;
  }

  /**
   * Eliminar un documento PDF (ambos archivos)
   * @param {number} id - ID del documento
   */
  async deleteDocument(id) {
    return await BaseApiService.delete(`${API_URL}/${id}`);
  }
}

export default new PdfDocumentApiService();