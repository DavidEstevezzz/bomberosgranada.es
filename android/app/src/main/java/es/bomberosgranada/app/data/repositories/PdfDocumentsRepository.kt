package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody
import java.io.File

/**
 * Repository para gestión de documentos PDF
 *
 * Funcionalidades:
 * - Obtener último documento
 * - Marcar como visto
 * - Generar URLs de visualización
 * - Subir documentos
 * - Descargar documentos
 * - Eliminar documentos
 */
class PdfDocumentsRepository {
    private val TAG = "PdfDocumentsRepository"
    private val pdfService = ApiClient.pdfDocuments

    /**
     * Obtener el documento PDF más reciente
     */
    suspend fun getLatestDocument(): Result<LatestPdfDocumentResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO ÚLTIMO DOCUMENTO PDF ===")

            val response = pdfService.getLatest()

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ Documento obtenido: ${result.document?.title ?: "Sin documentos"}")
                Log.d(TAG, "Has new: ${result.has_new}")
                Result.success(result)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Marcar documento como visto
     */
    suspend fun markAsViewed(documentId: Int): Result<PdfMarkAsViewedResponse> {
        return try {
            Log.d(TAG, "=== MARCANDO DOCUMENTO $documentId COMO VISTO ===")

            val response = pdfService.markAsViewed(documentId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Documento marcado como visto")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Generar URL temporal de embed
     */
    suspend fun generateEmbedUrl(
        documentId: Int,
        type: String = "primary"
    ): Result<PdfEmbedUrlResponse> {
        return try {
            Log.d(TAG, "=== GENERANDO URL DE EMBED ===")
            Log.d(TAG, "Documento: $documentId, Tipo: $type")

            val response = pdfService.generateEmbedUrl(documentId, type)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ URL generada")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Subir documento PDF
     *
     * @param title Título del documento
     * @param primaryFile Archivo PDF principal
     * @param secondaryFile Archivo PDF secundario (opcional)
     */
    suspend fun uploadDocument(
        title: String,
        primaryFile: File,
        secondaryFile: File? = null
    ): Result<MessageResponse> {
        return try {
            Log.d(TAG, "=== SUBIENDO DOCUMENTO PDF ===")
            Log.d(TAG, "Título: $title")
            Log.d(TAG, "Archivo principal: ${primaryFile.name} (${primaryFile.length()} bytes)")
            if (secondaryFile != null) {
                Log.d(TAG, "Archivo secundario: ${secondaryFile.name} (${secondaryFile.length()} bytes)")
            }

            // Preparar title como RequestBody
            val titleBody = title.toRequestBody("text/plain".toMediaTypeOrNull())

            // Preparar archivo principal
            val primaryRequestFile = primaryFile.asRequestBody("application/pdf".toMediaTypeOrNull())
            val primaryPart = MultipartBody.Part.createFormData(
                "pdf_file",
                primaryFile.name,
                primaryRequestFile
            )

            // Preparar archivo secundario si existe
            val secondaryPart = if (secondaryFile != null) {
                val secondaryRequestFile = secondaryFile.asRequestBody("application/pdf".toMediaTypeOrNull())
                MultipartBody.Part.createFormData(
                    "pdf_file_second",
                    secondaryFile.name,
                    secondaryRequestFile
                )
            } else null

            val response = pdfService.uploadDocument(titleBody, primaryPart, secondaryPart)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Documento subido correctamente")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Descargar PDF principal
     */
    suspend fun downloadPrimary(documentId: Int): Result<ResponseBody> {
        return try {
            Log.d(TAG, "=== DESCARGANDO PDF PRINCIPAL $documentId ===")

            val response = pdfService.downloadPrimary(documentId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ PDF descargado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Descargar PDF secundario
     */
    suspend fun downloadSecondary(documentId: Int): Result<ResponseBody> {
        return try {
            Log.d(TAG, "=== DESCARGANDO PDF SECUNDARIO $documentId ===")

            val response = pdfService.downloadSecondary(documentId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ PDF secundario descargado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Eliminar documento
     */
    suspend fun deleteDocument(documentId: Int): Result<MessageResponse> {
        return try {
            Log.d(TAG, "=== ELIMINANDO DOCUMENTO $documentId ===")

            val response = pdfService.deleteDocument(documentId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Documento eliminado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Stream documento desde URL firmada
     */
    suspend fun streamDocument(signedUrl: String): Result<ResponseBody> {
        return try {
            Log.d(TAG, "=== STREAMING DOCUMENTO ===")

            val response = pdfService.streamDocument(signedUrl)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Stream iniciado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }
}