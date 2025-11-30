package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface PdfDocumentsService {

    /**
     * Obtener el documento PDF más reciente
     * GET /api/pdf-documents/latest
     */
    @GET("pdf-documents/latest")
    suspend fun getLatest(): Response<LatestPdfDocumentResponse>

    /**
     * Marcar documento como visto
     * POST /api/pdf-documents/{id}/mark-as-viewed
     */
    @POST("pdf-documents/{id}/mark-as-viewed")
    suspend fun markAsViewed(@Path("id") id: Int): Response<PdfMarkAsViewedResponse>

    /**
     * Generar URL de embed temporal
     * GET /api/pdf-documents/{id}/embed?type=primary|secondary
     */
    @GET("pdf-documents/{id}/embed")
    suspend fun generateEmbedUrl(
        @Path("id") id: Int,
        @Query("type") type: String = "primary"
    ): Response<PdfEmbedUrlResponse>

    /**
     * Subir documento PDF
     * POST /api/pdf-documents/upload
     *
     * Requiere multipart/form-data con:
     * - title: String
     * - pdf_file: File
     * - pdf_file_second: File (opcional)
     */
    @Multipart
    @POST("pdf-documents/upload")
    suspend fun uploadDocument(
        @Part("title") title: RequestBody,
        @Part pdf_file: MultipartBody.Part,
        @Part pdf_file_second: MultipartBody.Part? = null
    ): Response<MessageResponse>

    /**
     * Mostrar documento principal
     * GET /api/pdf-documents/{id}
     */
    @GET("pdf-documents/{id}")
    @Streaming
    suspend fun showPrimary(@Path("id") id: Int): Response<ResponseBody>

    /**
     * Mostrar documento secundario
     * GET /api/pdf-documents/{id}/secondary
     */
    @GET("pdf-documents/{id}/secondary")
    @Streaming
    suspend fun showSecondary(@Path("id") id: Int): Response<ResponseBody>

    /**
     * Descargar documento principal
     * GET /api/pdf-documents/{id}/download
     */
    @GET("pdf-documents/{id}/download")
    @Streaming
    suspend fun downloadPrimary(@Path("id") id: Int): Response<ResponseBody>

    /**
     * Descargar documento secundario
     * GET /api/pdf-documents/{id}/download/secondary
     */
    @GET("pdf-documents/{id}/download/secondary")
    @Streaming
    suspend fun downloadSecondary(@Path("id") id: Int): Response<ResponseBody>

    /**
     * Eliminar documento
     * DELETE /api/pdf-documents/{id}
     */
    @DELETE("pdf-documents/{id}")
    suspend fun deleteDocument(@Path("id") id: Int): Response<MessageResponse>

    /**
     * Stream documento (ruta firmada)
     * GET /api/pdf-documents/{id}/stream?type=primary|secondary&signature=...
     *
     * Esta ruta usa signed URLs, normalmente se accede desde navegador
     */
    @GET
    @Streaming
    suspend fun streamDocument(@Url url: String): Response<ResponseBody>
}