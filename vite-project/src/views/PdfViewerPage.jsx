import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUpload,
    faDownload,
    faTrash,
    faFileAlt,
    faExclamationTriangle,
    faFilePdf,
    faPlus,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import PdfDocumentApiService from '../services/PdfDocumentApiService';

const PdfViewerPage = () => {
    // Estados
    const [currentDocument, setCurrentDocument] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfSecondaryUrl, setPdfSecondaryUrl] = useState(null);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [fileSecond, setFileSecond] = useState(null);
    const [showSecondInput, setShowSecondInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const { darkMode } = useDarkMode();
    const { user } = useStateContext();

    // Función para obtener el PDF como blob e inicializar la URL del blob
    const fetchPdfBlob = async (documentId) => {
        try {
            const token = localStorage.getItem('token');
            // Obtener el PDF principal
            const response = await axios.get(PdfDocumentApiService.getDocumentUrl(documentId), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const blobUrl = window.URL.createObjectURL(response.data);
            setPdfUrl(blobUrl);
            
            // Intentar obtener el PDF secundario si existe
            if (currentDocument && currentDocument.file_path_second) {
                try {
                    const responseSecondary = await axios.get(PdfDocumentApiService.getSecondaryDocumentUrl(documentId), {
                        responseType: 'blob',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const blobSecondaryUrl = window.URL.createObjectURL(responseSecondary.data);
                    setPdfSecondaryUrl(blobSecondaryUrl);
                } catch (err) {
                    console.error('Error al cargar el PDF secundario:', err);
                    setPdfSecondaryUrl(null);
                }
            } else {
                setPdfSecondaryUrl(null);
            }
        } catch (err) {
            console.error('Error al cargar el PDF principal:', err);
            setError('Error al cargar el PDF');
            setPdfUrl(null);
        }
    };

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
                await fetchPdfBlob(response.data.id);
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

    // Manejar cambio en el input del primer archivo
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.log("Selected File in handleFileChange:", selectedFile);
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

    // Manejar cambio en el input del segundo archivo
    const handleSecondFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.log("Selected Secondary File:", selectedFile);
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFileSecond(selectedFile);
            setError(null);
        } else {
            setFileSecond(null);
            setError('Por favor selecciona un archivo PDF válido para el segundo documento');
        }
    };

    // Alternar la visibilidad del segundo input de archivo
    const toggleSecondFileInput = () => {
        setShowSecondInput(!showSecondInput);
        if (!showSecondInput === false) {
            setFileSecond(null);
        }
    };

    // Subir archivos
    const handleUpload = async () => {
        if (!file) {
            setError('Selecciona al menos un archivo para subir');
            return;
        }

        if (!title.trim()) {
            setError('Ingresa un título para el documento');
            return;
        }

        setLoading(true);
        setError(null);
        setUploadSuccess(false);

        console.log("Files state before upload:", { file, fileSecond });

        const formData = new FormData();
        formData.append('title', title);
        formData.append('pdf_file', file);
        
        if (fileSecond) {
            formData.append('pdf_file_second', fileSecond);
        }

        console.log("FormData contents:");
        for (const pair of formData.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }

        try {
            const response = await PdfDocumentApiService.uploadDocument(formData);
            setCurrentDocument(response.data.document);
            await fetchPdfBlob(response.data.document.id);
            setUploadSuccess(true);

            // Resetear formulario
            setTitle('');
            setFile(null);
            setFileSecond(null);
            setShowSecondInput(false);
            document.getElementById('pdf-upload').value = '';
            if (document.getElementById('pdf-upload-second')) {
                document.getElementById('pdf-upload-second').value = '';
            }
        } catch (err) {
            console.error('Error al subir los documentos:', err);
            setError(err.response?.data?.message || 'Error al subir los documentos');
        } finally {
            setLoading(false);
        }
    };

    // Eliminar documentos
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
            setPdfSecondaryUrl(null);
            setError(null);
        } catch (err) {
            console.error('Error al eliminar el documento:', err);
            setError('Error al eliminar el documento');
        } finally {
            setLoading(false);
        }
    };

    // Función para descargar el PDF principal
    const handleDownload = async () => {
        if (currentDocument && currentDocument.id) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(PdfDocumentApiService.getDownloadUrl(currentDocument.id), {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const blobUrl = window.URL.createObjectURL(response.data);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', currentDocument.original_filename || 'documento.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error('Error al descargar el documento principal:', error);
                setError('Error al descargar el documento principal');
            }
        }
    };

    // Función para descargar el PDF secundario
    const handleDownloadSecondary = async () => {
        if (currentDocument && currentDocument.id && currentDocument.file_path_second) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(PdfDocumentApiService.getSecondaryDownloadUrl(currentDocument.id), {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const blobUrl = window.URL.createObjectURL(response.data);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', currentDocument.original_filename_second || 'documento_secundario.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error('Error al descargar el documento secundario:', error);
                setError('Error al descargar el documento secundario');
            }
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
                            Subir Documentos
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
                                    className={`w-full p-3 rounded-md ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-gray-50 border-gray-300 text-gray-900'
                                        } border`}
                                    placeholder="Nombre del documento"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Archivo PDF Principal
                                </label>
                                <input
                                    name="pdf_file"
                                    id="pdf-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    className={`w-full p-2 border rounded-md ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white'
                                            : 'bg-gray-50 border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700'
                                        } file:rounded-md file:border-0 file:py-2 file:px-4 file:mr-4 file:font-semibold`}
                                />
                            </div>
                        </div>

                        {/* Botón para mostrar/ocultar el segundo input de archivo */}
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={toggleSecondFileInput}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                                    showSecondInput 
                                    ? `${darkMode ? 'bg-red-800' : 'bg-red-600'} text-white` 
                                    : `${darkMode ? 'bg-blue-800' : 'bg-blue-600'} text-white`
                                }`}
                            >
                                <FontAwesomeIcon icon={showSecondInput ? faTimes : faPlus} className="mr-2" />
                                {showSecondInput ? 'Quitar segundo PDF' : 'Añadir segundo PDF'}
                            </button>
                        </div>

                        {/* Segundo input de archivo (condicional) */}
                        {showSecondInput && (
                            <div className="mt-4">
                                <label className="block mb-2 font-medium">
                                    Archivo PDF Secundario
                                </label>
                                <input
                                    name="pdf_file_second"
                                    id="pdf-upload-second"
                                    type="file"
                                    onChange={handleSecondFileChange}
                                    accept="application/pdf"
                                    className={`w-full p-2 border rounded-md ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white'
                                            : 'bg-gray-50 border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700'
                                        } file:rounded-md file:border-0 file:py-2 file:px-4 file:mr-4 file:font-semibold`}
                                />
                            </div>
                        )}

                        {/* Información del primer archivo seleccionado */}
                        {file && (
                            <div className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <p className="font-medium">Archivo principal:</p>
                                <p>
                                    <span className="font-medium">Nombre:</span> {file.name}
                                </p>
                                <p>
                                    <span className="font-medium">Tamaño:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}

                        {/* Información del segundo archivo seleccionado */}
                        {fileSecond && (
                            <div className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <p className="font-medium">Archivo secundario:</p>
                                <p>
                                    <span className="font-medium">Nombre:</span> {fileSecond.name}
                                </p>
                                <p>
                                    <span className="font-medium">Tamaño:</span> {(fileSecond.size / 1024 / 1024).toFixed(2)} MB
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
                                Documentos subidos correctamente
                            </div>
                        )}

                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={loading || !file}
                                className={`px-5 py-2 rounded-md font-medium flex items-center ${loading || !file
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                            >
                                {loading ? 'Subiendo...' : 'Subir documentos'}
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
                                        {currentDocument ? currentDocument.title : 'No hay documentos disponibles'}
                                    </h2>
                                    {currentDocument && (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Subido el {new Date(currentDocument.created_at).toLocaleDateString()} •
                                            Principal: {(currentDocument.file_size / 1024 / 1024).toFixed(2)} MB
                                            {currentDocument.file_size_second && ` • Secundario: ${(currentDocument.file_size_second / 1024 / 1024).toFixed(2)} MB`}
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
                                        Descargar Principal
                                    </button>

                                    {currentDocument.file_path_second && (
                                        <button
                                            onClick={handleDownloadSecondary}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                                        >
                                            <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                            Descargar Secundario
                                        </button>
                                    )}

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

                {/* Visor del PDF Principal */}
                <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md mb-6`}>
                    <div className="p-3 border-b border-gray-300">
                        <h3 className="font-semibold">Documento Principal</h3>
                    </div>
                    <div className="pdf-container bg-gray-900">
                        {pdfUrl ? (
                            <iframe
                                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                                className="w-full h-screen border-none"
                                title="PDF Viewer Principal"
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
                                        <p className="text-xl mb-2">No hay documento principal para mostrar</p>
                                        {user && user.type === 'jefe' && (
                                            <p className="text-gray-500">Usa el formulario de arriba para subir un PDF</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Visor del PDF Secundario (solo visible si existe) */}
                {(pdfSecondaryUrl || (currentDocument && currentDocument.file_path_second)) && (
                    <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                        <div className="p-3 border-b border-gray-300">
                            <h3 className="font-semibold">Documento Secundario</h3>
                        </div>
                        <div className="pdf-container bg-gray-900">
                            {pdfSecondaryUrl ? (
                                <iframe
                                    src={`${pdfSecondaryUrl}#toolbar=1&navpanes=1`}
                                    className="w-full h-screen border-none"
                                    title="PDF Viewer Secundario"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-96 text-gray-400">
                                    {loading ? (
                                        <div className="text-center p-8">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                            <p>Cargando documento secundario...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8">
                                            <FontAwesomeIcon icon={faFileAlt} className="text-5xl mb-4" />
                                            <p className="text-xl mb-2">Error al cargar el documento secundario</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfViewerPage;