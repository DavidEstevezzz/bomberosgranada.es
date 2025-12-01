package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface MessagesService {

    /**
     * GET /messages
     * Bandeja de entrada
     * Laravel devuelve: List<Message> con relaciones y campos calculados para masivos
     */
    @GET("messages")
    suspend fun getInboxMessages(): Response<List<Message>>

    /**
     * GET /messages/sent
     * Bandeja de salida
     * Laravel devuelve: List<Message> con estadísticas para masivos
     */
    @GET("messages/sent")
    suspend fun getSentMessages(): Response<List<Message>>

    /**
     * GET /messages/search?query=...
     * Laravel devuelve: List<Message>
     */
    @GET("messages/search")
    suspend fun searchMessages(@Query("query") query: String): Response<List<Message>>

    /**
     * GET /messages/{id}
     * IMPORTANTE: getMessageThread debe estar ANTES del show genérico
     * Laravel devuelve: { message: {...} }
     */
    @GET("messages/{id}")
    suspend fun getMessageThread(@Path("id") id: Int): Response<MessageThread>

    /**
     * GET /messages/{id}/attachment
     * Laravel devuelve: archivo binario (ResponseBody)
     */
    @GET("messages/{id}/attachment")
    suspend fun downloadAttachment(@Path("id") id: Int): Response<ResponseBody>

    /**
     * POST /messages
     * Multipart para soportar archivos adjuntos
     * Laravel espera: receiver_id (si no es masivo), subject, body, attachment?, parent_id?, massive?
     * Laravel devuelve: Message
     */
    @Multipart
    @POST("messages")
    suspend fun sendMessage(
        @Part("receiver_id") receiverId: RequestBody? = null,
        @Part("subject") subject: RequestBody,
        @Part("body") body: RequestBody,
        @Part attachment: MultipartBody.Part? = null,
        @Part("parent_id") parentId: RequestBody? = null,
        @Part("massive") massive: RequestBody? = null
    ): Response<Message>

    /**
     * PATCH /messages/{id}/mark-as-read
     * Laravel devuelve: { message, is_read }
     */
    @PATCH("messages/{id}/mark-as-read")
    suspend fun markAsRead(@Path("id") id: Int): Response<MarkAsReadResponse>

    /**
     * PATCH /messages/{id}/mark-massive-as-read
     * Solo para jefes - marca como leído para TODOS los usuarios
     * Laravel devuelve: { message, affected_users_count, total_users }
     */
    @PATCH("messages/{id}/mark-massive-as-read")
    suspend fun markMassiveAsRead(@Path("id") id: Int): Response<MarkMassiveAsReadResponse>

    /**
     * DELETE /messages/{id}
     * Soft delete
     * Laravel devuelve: { message }
     */
    @DELETE("messages/{id}")
    suspend fun deleteMessage(@Path("id") id: Int): Response<MessageResponse>

    /**
     * PATCH /messages/{id}/restore
     * Laravel devuelve: { message }
     */
    @PATCH("messages/{id}/restore")
    suspend fun restoreMessage(@Path("id") id: Int): Response<MessageResponse>

    /**
     * GET /users
     * Laravel devuelve: List<User>
     */
    @GET("users")
    suspend fun getUsers(): Response<List<User>>
}

