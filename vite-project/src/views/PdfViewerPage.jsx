import React, { useState, useEffect, useMemo } from 'react';
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
    const [showNewPdfNotice, setShowNewPdfNotice] = useState(false);
    const { darkMode } = useDarkMode();
    const { user } = useStateContext();

    // Función para obtener el PDF como blob e inicializar la URL del blob
    const fetchPdfBlob = async (documentId, documentData) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Iniciando carga de documentos PDF con ID:', documentId);
            console.log('Datos del documento:', documentData);

            try {
                console.log('Obteniendo PDF principal:', PdfDocumentApiService.getDocumentUrl(documentId));
                const response = await axios.get(PdfDocumentApiService.getDocumentUrl(documentId), {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log('PDF principal cargado correctamente, tamaño:', response.data.size);
                const blobUrl = window.URL.createObjectURL(response.data);
                setPdfUrl(blobUrl);
            } catch (errPrimary) {
                console.error('Error al cargar el PDF principal:', errPrimary);
                setPdfUrl(null);
                setError('Error al cargar el PDF principal');
                return false;
            }

            if (documentData && documentData.file_path_second) {
                try {
                    console.log('Documento tiene PDF secundario, intentando cargarlo:', documentData.file_path_second);
                    console.log('URL del PDF secundario:', PdfDocumentApiService.getSecondaryDocumentUrl(documentId));
                    const responseSecondary = await axios.get(
                        PdfDocumentApiService.getSecondaryDocumentUrl(documentId),
                        {
                            responseType: 'blob',
                            headers: {
                                Authorization: `Bearer ${token}`,
                            }
                        }
                    );

                    console.log('PDF secundario cargado correctamente, tamaño:', responseSecondary.data.size);
                    const blobSecondaryUrl = window.URL.createObjectURL(responseSecondary.data);
                    setPdfSecondaryUrl(blobSecondaryUrl);
                } catch (errSecondary) {
                    console.error('Error al cargar el PDF secundario:', errSecondary);
                    setPdfSecondaryUrl(null);
                }
            } else {
                console.log('No hay PDF secundario disponible en los datos del documento');
                setPdfSecondaryUrl(null);
            }

            return true;
        } catch (err) {
            console.error('Error general en fetchPdfBlob:', err);
            setError('Error al cargar los documentos PDF');
            setPdfUrl(null);
            setPdfSecondaryUrl(null);
            return false;
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
            const response = await PdfDocumentApiService.getLatestStatus();
            console.log("Documento obtenido:", response.data);

            
            const documentData = response.data?.document ?? response.data ?? null;
            const hasNewFlag = response.data?.has_new ?? response.data?.hasNew ?? false;

            setCurrentDocument(documentData);
            setShowNewPdfNotice(!!hasNewFlag);

            if (documentData && documentData.id) {
                const blobLoaded = await fetchPdfBlob(documentData.id, documentData);
                if (blobLoaded) {
                    await markDocumentAsViewed(documentData.id);
                }
            } else {
                setPdfUrl(null);
                setPdfSecondaryUrl(null);
            }

            setError(null);
        } catch (err) {
            console.error('Error al cargar el documento:', err);
            if (err.response && err.response.status === 404) {
                setCurrentDocument(null);
                setPdfUrl(null);
                setPdfSecondaryUrl(null);
                setShowNewPdfNotice(false);
                setError(null);
            } else {
                setError('Error al cargar el documento PDF');
            }
        } finally {
            setLoading(false);
        }
    };

    const markDocumentAsViewed = async (documentId) => {
        try {
            const response = await PdfDocumentApiService.markAsViewed(documentId);
            if (response.data?.is_new) {
                setShowNewPdfNotice(true);
            }
        } catch (error) {
            console.error('Error al marcar el documento como visto:', error);
        }
    };

    const handleCloseNewPdfNotice = () => {
        setShowNewPdfNotice(false);
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
            const documentData = response.data.document;
            setCurrentDocument(documentData);
            const blobLoaded = await fetchPdfBlob(documentData.id, documentData);
            if (blobLoaded) {
                await markDocumentAsViewed(documentData.id);
            }
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
            setShowNewPdfNotice(false);
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

    const containerStyles = useMemo(
        () => ({
            card: `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-6xl overflow-hidden rounded-3xl border shadow-2xl backdrop-blur transition-colors duration-300 ${
                darkMode ? 'border-slate-800 bg-slate-950/80 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'
            }`,
            section: `rounded-2xl border px-5 py-6 transition-colors ${
                darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
            }`,
            input: `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                darkMode
                    ? 'border-slate-700 bg-slate-900/40 text-slate-100 placeholder-slate-400'
                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
            }`,
            fileInput: `w-full rounded-2xl border px-3 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-primary-600 ${
                darkMode
                    ? 'border-slate-700 bg-slate-900/40 text-slate-100 placeholder-slate-400 file:bg-primary-600 hover:file:bg-primary-500'
                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
            }`,
            label: 'block text-xs font-semibold uppercase tracking-[0.25em] text-primary-500 dark:text-primary-200',
            subtle: darkMode ? 'text-slate-300' : 'text-slate-600',
            primaryButton: `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ${
                darkMode
                    ? 'bg-primary-600/80 text-white hover:bg-primary-500/80'
                    : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white hover:shadow-xl'
            }`,
            secondaryButton: `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold transition-colors ${
                darkMode
                    ? 'bg-red-600/80 text-white hover:bg-red-500/80'
                    : 'bg-red-500 text-white hover:bg-red-600'
            }`,
            tertiaryButton: `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold transition-colors ${
                darkMode
                    ? 'bg-emerald-600/80 text-white hover:bg-emerald-500/80'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`,
            viewerWrapper: `rounded-2xl border transition-colors ${
                darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white/90'
            }`,
            viewerHeader: `flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 text-sm font-semibold transition-colors ${
                darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'
            }`,
            viewerBody: darkMode ? 'bg-slate-950/80' : 'bg-slate-100'
        }),
        [darkMode]
    );

    return (
        <div className={containerStyles.card}>
            <div
                className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
                    darkMode
                        ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
                        : 'from-primary-400 via-primary-500 to-primary-600'
                }`}
            >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    Documentación corporativa
                </p>
                <h1 className="mt-2 text-3xl font-semibold">Centro de PDFs</h1>
                <p className="mt-3 max-w-3xl text-sm text-white/90">
                    Gestiona la documentación importante del cuerpo de bomberos y consulta los archivos más recientes desde un
                    visor moderno y cómodo.
                </p>
            </div>

            <div className="space-y-8 px-6 py-8 sm:px-10">
                {showNewPdfNotice && currentDocument && (
                    <div
                        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                            darkMode
                                ? 'border-primary-500/40 bg-primary-500/10 text-primary-200'
                                : 'border-primary-200 bg-primary-50 text-primary-700'
                        }`}
                    >
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Nuevo parte disponible</p>
                            <p className="mt-1 text-xs opacity-80">
                                {currentDocument?.title
                                    ? `Has recibido "${currentDocument.title}".`
                                    : 'Hay documentación nueva para revisar.'}
                            </p>
                        </div>
                        <button
                            onClick={handleCloseNewPdfNotice}
                            className={`rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                                darkMode
                                    ? 'bg-primary-600/90 text-white hover:bg-primary-500'
                                    : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                        >
                            Entendido
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                            darkMode
                                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {uploadSuccess && (
                    <div
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            darkMode
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                    >
                        Documentos subidos correctamente.
                    </div>
                )}

                {user && user.type === 'jefe' && (
                    <section className={containerStyles.section}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                                    Subir nueva documentación
                                </p>
                                <p className={`mt-1 text-xs ${containerStyles.subtle}`}>
                                    Añade un archivo principal y, si lo necesitas, adjunta un documento secundario de apoyo.
                                </p>
                            </div>
                            <div
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-200 ${
                                    darkMode ? 'border-primary-700/60 bg-primary-900/40' : 'border-primary-100 bg-primary-50'
                                }`}
                            >
                                <FontAwesomeIcon icon={faUpload} className="h-3 w-3" />
                                Última carga {currentDocument ? new Date(currentDocument.created_at).toLocaleDateString() : '—'}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className={containerStyles.label} htmlFor="document-title">
                                    Título del documento
                                </label>
                                <input
                                    id="document-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={containerStyles.input}
                                    placeholder="Nombre del documento"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={containerStyles.label} htmlFor="pdf-upload">
                                    Archivo PDF principal
                                </label>
                                <input
                                    name="pdf_file"
                                    id="pdf-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    className={containerStyles.fileInput}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={toggleSecondFileInput}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                                    showSecondInput
                                        ? darkMode
                                            ? 'bg-red-600/80 text-white hover:bg-red-500/80'
                                            : 'bg-red-500 text-white hover:bg-red-600'
                                        : darkMode
                                            ? 'bg-primary-700/70 text-white hover:bg-primary-600/80'
                                            : 'bg-primary-500 text-white hover:bg-primary-600'
                                }`}
                            >
                                <FontAwesomeIcon icon={showSecondInput ? faTimes : faPlus} className="h-3.5 w-3.5" />
                                {showSecondInput ? 'Quitar segundo PDF' : 'Añadir segundo PDF'}
                            </button>
                        </div>

                        {showSecondInput && (
                            <div className="mt-6 space-y-2">
                                <label className={containerStyles.label} htmlFor="pdf-upload-second">
                                    Archivo PDF secundario
                                </label>
                                <input
                                    name="pdf_file_second"
                                    id="pdf-upload-second"
                                    type="file"
                                    onChange={handleSecondFileChange}
                                    accept="application/pdf"
                                    className={containerStyles.fileInput}
                                />
                            </div>
                        )}

                        {(file || fileSecond) && (
                            <div
                                className={`mt-6 grid gap-4 rounded-2xl border px-4 py-4 text-sm transition-colors ${
                                    darkMode
                                        ? 'border-slate-800 bg-slate-950/60 text-slate-200'
                                        : 'border-slate-200 bg-white text-slate-700'
                                }`}
                            >
                                {file && (
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200">
                                                Archivo principal
                                            </p>
                                            <p className="text-sm font-medium">{file.name}</p>
                                        </div>
                                        <span className={`text-xs font-semibold ${containerStyles.subtle}`}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                )}

                                {fileSecond && (
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200">
                                                Archivo secundario
                                            </p>
                                            <p className="text-sm font-medium">{fileSecond.name}</p>
                                        </div>
                                        <span className={`text-xs font-semibold ${containerStyles.subtle}`}>
                                            {(fileSecond.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={loading || !file}
                                className={`${containerStyles.primaryButton} disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />
                                {loading ? 'Subiendo…' : 'Guardar documentos'}
                            </button>
                        </div>
                    </section>
                )}

                <section className={containerStyles.section}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-2xl ${
                                    darkMode ? 'bg-primary-900/40 text-primary-200' : 'bg-primary-100 text-primary-600'
                                }`}
                            >
                                <FontAwesomeIcon icon={faFilePdf} />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                                    {currentDocument ? currentDocument.title : 'No hay documentos disponibles'}
                                </p>
                                <p className={`mt-1 text-xs ${containerStyles.subtle}`}>
                                    {currentDocument
                                        ? `Subido el ${new Date(currentDocument.created_at).toLocaleDateString()} · Principal: ${
                                              (currentDocument.file_size /
                                              1024 /
                                              1024).toFixed(2)} MB${
                                              currentDocument.file_size_second
                                                  ? ` · Secundario: ${(currentDocument.file_size_second / 1024 / 1024).toFixed(2)} MB`
                                                  : ''
                                          }`
                                        : 'Cuando subas un documento aparecerá aquí su información resumida.'}
                                </p>
                            </div>
                        </div>

                        {currentDocument && (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={handleDownload} className={containerStyles.tertiaryButton}>
                                    <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                                    Descargar principal
                                </button>

                                {currentDocument.file_path_second && (
                                    <button onClick={handleDownloadSecondary} className={containerStyles.tertiaryButton}>
                                        <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                                        Descargar secundario
                                    </button>
                                )}

                                {user && user.type === 'jefe' && (
                                    <button onClick={handleDelete} className={containerStyles.secondaryButton}>
                                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                        Eliminar documento
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className={containerStyles.viewerWrapper}>
                    <div className={containerStyles.viewerHeader}>
                        <h3 className="text-sm uppercase tracking-[0.3em]">Documento principal</h3>
                    </div>
                    <div className={`${containerStyles.viewerBody} rounded-b-2xl`}>
                        {pdfUrl ? (
                            <iframe
                                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                                className="h-[70vh] w-full border-none"
                                title="PDF Viewer Principal"
                            />
                        ) : (
                            <div className="flex h-[45vh] flex-col items-center justify-center gap-4 text-center">
                                {loading ? (
                                    <>
                                        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-400 border-t-transparent"></div>
                                        <p className={`text-sm ${containerStyles.subtle}`}>Cargando documento...</p>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-primary-400" />
                                        <div className={`space-y-1 text-sm ${containerStyles.subtle}`}>
                                            <p>No hay documento principal para mostrar.</p>
                                            {user && user.type === 'jefe' && <p>Utiliza el formulario superior para subir un PDF.</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {(pdfSecondaryUrl || (currentDocument && currentDocument.file_path_second)) && (
                    <section className={containerStyles.viewerWrapper}>
                        <div className={containerStyles.viewerHeader}>
                            <h3 className="text-sm uppercase tracking-[0.3em]">Documento secundario</h3>
                        </div>
                        <div className={`${containerStyles.viewerBody} rounded-b-2xl`}>
                            {pdfSecondaryUrl ? (
                                <iframe
                                    src={`${pdfSecondaryUrl}#toolbar=1&navpanes=1`}
                                    className="h-[70vh] w-full border-none"
                                    title="PDF Viewer Secundario"
                                />
                            ) : (
                                <div className="flex h-[45vh] flex-col items-center justify-center gap-4 text-center">
                                    {loading ? (
                                        <>
                                            <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-400 border-t-transparent"></div>
                                            <p className={`text-sm ${containerStyles.subtle}`}>
                                                Cargando documento secundario...
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-primary-400" />
                                            <p className={`text-sm ${containerStyles.subtle}`}>
                                                Error al cargar el documento secundario.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default PdfViewerPage;
