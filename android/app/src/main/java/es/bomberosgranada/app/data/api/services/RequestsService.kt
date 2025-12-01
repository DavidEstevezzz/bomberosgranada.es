package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface RequestsService {

    /**
     * GET /requests
     * Laravel devuelve: List<RequestItem> (transformado con creacion)
     */
    @GET("requests")
    suspend fun getRequests(): Response<List<RequestItem>>

    /**
     * GET /requests/{id}
     * Laravel devuelve: { request, file_url }
     */
    @GET("requests/{id}")
    suspend fun getRequest(@Path("id") id: Int): Response<RequestShowResponse>

    /**
     * GET /requests/{id}/file
     * Descarga el archivo adjunto
     * Laravel devuelve: archivo binario (ResponseBody)
     */
    @GET("requests/{id}/file")
    suspend fun downloadFile(@Path("id") id: Int): Response<ResponseBody>

    /**
     * GET /employees
     * Laravel devuelve: List<User> (todos los empleados)
     */
    @GET("employees")
    suspend fun getEmployees(): Response<List<User>>

    /**
     * POST /requests
     * Multipart para soportar archivo adjunto
     * Laravel espera: { id_empleado, tipo, fecha_ini, fecha_fin, estado, motivo?, turno?, horas?, file? }
     * Laravel devuelve: RequestItem
     */
    @Multipart
    @POST("requests")
    suspend fun createRequest(
        @Part("id_empleado") idEmpleado: RequestBody,
        @Part("tipo") tipo: RequestBody,
        @Part("fecha_ini") fechaInicio: RequestBody,
        @Part("fecha_fin") fechaFin: RequestBody,
        @Part("estado") estado: RequestBody,
        @Part("motivo") motivo: RequestBody? = null,
        @Part("turno") turno: RequestBody? = null,
        @Part("horas") horas: RequestBody? = null,
        @Part file: MultipartBody.Part? = null
    ): Response<RequestItem>

    /**
     * PUT /requests/{id}
     * Laravel espera: { estado }
     * Laravel devuelve: RequestItem
     */
    @PUT("requests/{id}")
    suspend fun updateRequest(
        @Path("id") id: Int,
        @Body request: UpdateRequestRequest
    ): Response<RequestItem>

    /**
     * DELETE /requests/{id}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("requests/{id}")
    suspend fun deleteRequest(@Path("id") id: Int): Response<Unit>
}

