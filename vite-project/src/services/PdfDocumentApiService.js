import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/pdf-documents`;

const PdfDocumentApiService = {
  /**
   * Obtener el documento PDF más reciente
   */
  getLatestDocument() {
    return this.getLatestStatus();
  },

  getLatestStatus() {
    return BaseApiService.get(`${API_URL}/latest`);
  },

  /**
   * Subir documentos PDF
   * @param {FormData} formData - Contiene title, pdf_file y opcionalmente pdf_file_second
   */
  uploadDocument(formData) {
    console.log('Enviando FormData con los siguientes campos:');
    for (const pair of formData.entries()) {
      console.log(
        pair[0] +
          ': ' +
          (pair[1] instanceof File
            ? `Archivo (${pair[1].name}, ${pair[1].size} bytes)`
            : pair[1])
      );
    }

    return BaseApiService.post(
      `${API_URL}/upload`,
      formData,
      {},
      { 'Content-Type': 'multipart/form-data' }
    );
  },

  /**
   * Genera un enlace temporal firmado para incrustar el documento
   * @param {number} id
   * @param {('primary'|'secondary')} [type='primary']
   */
  getEmbedUrl(id, type = 'primary') {
    const queryParams = {};
    if (type === 'secondary') {
      queryParams.type = 'secondary';
    }

    return BaseApiService.get(`${API_URL}/${id}/embed`, queryParams);
  },

  /**
   * Obtener URL para mostrar el documento primario (uso interno/backend)
   */
  getDocumentUrl(id) {
    return `${API_URL}/${id}`;
  },

  getSecondaryDocumentUrl(id) {
    return `${API_URL}/${id}/secondary`;
  },

  getDownloadUrl(id) {
    return `${API_URL}/${id}/download`;
  },

  getSecondaryDownloadUrl(id) {
    return `${API_URL}/${id}/download/secondary`;
  },

  deleteDocument(id) {
    return BaseApiService.delete(`${API_URL}/${id}`);
  },

  markAsViewed(id) {
    return BaseApiService.post(`${API_URL}/${id}/mark-as-viewed`, {});
  },
};

export default PdfDocumentApiService;
