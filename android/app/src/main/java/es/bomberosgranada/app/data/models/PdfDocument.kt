package es.bomberosgranada.app.data.models

/**
 * Modelo PdfDocument
 * Tabla: pdf_documents
 */
data class PdfDocument(
    val id: Int,
    val title: String,
    val filename: String,
    val filename_second: String? = null,
    val original_filename: String? = null,
    val original_filename_second: String? = null,
    val file_path: String,
    val file_path_second: String? = null,
    val file_size: Long,
    val file_size_second: Long? = null,
    val uploaded_by: Int,
    val created_at: String? = null,
    val updated_at: String? = null
)

/**
 * Response al obtener el último documento
 */
data class LatestPdfDocumentResponse(
    val document: PdfDocument?,
    val has_new: Boolean,
    val message: String? = null
)

/**
 * Response al generar URL de embed
 */
data class PdfEmbedUrlResponse(
    val url: String,
    val expires_at: String,
    val type: String
)

/**
 * Response al marcar como visto
 */
data class PdfMarkAsViewedResponse(
    val message: String,
    val is_new: Boolean
)

/**
 * Request para subir PDF (usado con multipart/form-data)
 * No necesitamos data class, se enviará como FormData
 */