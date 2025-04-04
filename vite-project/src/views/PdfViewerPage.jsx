import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faDownload, 
  faTrash, 
  faFileAlt, 
  faExclamationTriangle,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import PdfDocumentApiService from '../services/PdfDocumentApiService';

const PdfViewerPage = () => {
  // Estados
  const [currentDocument, setCurrentDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();

  // Cargar documento al iniciar
  useEffect(() => {
    fetchLatestDocument();
  }, []);

  // Obtener documento más reciente
  const fetchLatestDocument = async () => {
    setLoading(true);
    try {
      const response = await PdfDocumentApiService.getLatestDocument();
      setCurrentDocument(response.data);
      if (response.data && response.data.id) {
        setPdfUrl(PdfDocumentApiService.getDocumentUrl(response.data.id));
      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar el documento:', err);
      if (err.response && err.response.status === 404) {
        // No hay documentos, es normal
        setError(null);
      } else {
        setError('Error al cargar el documento PDF');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en el input de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected File in handleFileChange:", selectedFile); // Add this line
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Usar el nombre del archivo como título por defecto (sin la extensión)
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
      setError(null);
    } else {
      setFile(null);
      setError('Por favor selecciona un archivo PDF válido');
    }
  };

  // Subir archivo
  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo para subir');
      return;
    }

    if (!title.trim()) {
      setError('Ingresa un título para el documento');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadSuccess(false);

    console.log("File state before upload:", file); // Debugging log

    const formData = new FormData();
    formData.append('title', title);
    formData.append('pdf_file', file);

    console.log("FormData contents:"); // Debugging log
    for (const pair of formData.entries()) {
      console.log(pair[0] + ', ' + pair[1]);
    }

    try {
      const response = await PdfDocumentApiService.uploadDocument(formData);
      setCurrentDocument(response.data.document);
      setPdfUrl(PdfDocumentApiService.getDocumentUrl(response.data.document.id));
      setUploadSuccess(true);

      // Resetear formulario
      setTitle('');
      setFile(null);
      document.getElementById('pdf-upload').value = '';
    } catch (err) {
      console.error('Error al subir el documento:', err);
      setError(err.response?.data?.message || 'Error al subir el documento');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar documento
  const handleDelete = async () => {
    if (!currentDocument) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    setLoading(true);
    try {
      await PdfDocumentApiService.deleteDocument(currentDocument.id);
      setCurrentDocument(null);
      setPdfUrl(null);
      setError(null);
    } catch (err) {
      console.error('Error al eliminar el documento:', err);
      setError('Error al eliminar el documento');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar el PDF
  const handleDownload = () => {
    if (currentDocument && currentDocument.id) {
      window.open(PdfDocumentApiService.getDownloadUrl(currentDocument.id), '_blank');
    }
  };

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Documentación PDF</h1>

        {/* Sección de carga (solo visible para jefes) */}
        {user && user.type === 'jefe' && (
          <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              Subir Nuevo Documento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">
                  Título del documento
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-3 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } border`}
                  placeholder="Nombre del documento"
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">
                  Archivo PDF
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className={`w-full p-2 border rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700'
                  } file:rounded-md file:border-0 file:py-2 file:px-4 file:mr-4 file:font-semibold`}
                />
              </div>
            </div>
            
            {file && (
              <div className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p>
                  <span className="font-medium">Archivo seleccionado:</span> {file.name}
                </p>
                <p>
                  <span className="font-medium">Tamaño:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-600 text-white rounded-md flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                {error}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="mt-4 p-3 bg-green-600 text-white rounded-md">
                Documento subido correctamente
              </div>
            )}
            
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className={`px-5 py-2 rounded-md font-medium flex items-center ${
                  loading || !file
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {loading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </div>
          </div>
        )}

        {/* Sección de información del documento actual */}
        <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md mb-6`}>
          <div className="p-6 border-b border-gray-300">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <FontAwesomeIcon 
                  icon={faFilePdf} 
                  className={`mr-3 text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                />
                <div>
                  <h2 className="text-xl font-bold">
                    {currentDocument ? currentDocument.title : 'No hay documento disponible'}
                  </h2>
                  {currentDocument && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Subido el {new Date(currentDocument.created_at).toLocaleDateString()} • 
                      {(currentDocument.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              
              {currentDocument && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Descargar
                  </button>
                  
                  {user && user.type === 'jefe' && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Visor de PDF */}
        <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="pdf-container bg-gray-900">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                className="w-full h-screen border-none"
                title="PDF Viewer"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                {loading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Cargando documento...</p>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <FontAwesomeIcon icon={faFileAlt} className="text-5xl mb-4" />
                    <p className="text-xl mb-2">No hay ningún documento para mostrar</p>
                    {user && user.type === 'jefe' && (
                      <p className="text-gray-500">Usa el formulario de arriba para subir un PDF</p>
                    )}
            
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerPage;