package com.example.bomberosgranada.data.api.services

import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface RequestsService {

    @GET("requests")
    suspend fun getRequests(): Response<List<RequestItem>>

    @GET("requests/{id}")
    suspend fun getRequest(@Path("id") id: Int): Response<RequestItem>

    @Multipart
    @POST("requests")
    suspend fun createRequest(
        @Part("type") type: RequestBody,
        @Part("descripcion") descripcion: RequestBody,
        @Part("fecha_inicio") fechaInicio: RequestBody? = null,
        @Part("fecha_fin") fechaFin: RequestBody? = null,
        @Part file: MultipartBody.Part? = null
    ): Response<RequestItem>

    @PUT("requests/{id}")
    suspend fun updateRequest(
        @Path("id") id: Int,
        @Body request: UpdateRequestRequest
    ): Response<RequestItem>

    @DELETE("requests/{id}")
    suspend fun deleteRequest(@Path("id") id: Int): Response<Unit>

    @GET("requests/{id}/file")
    suspend fun downloadFile(@Path("id") id: Int): Response<ResponseBody>

    @GET("employees")
    suspend fun getEmployees(): Response<List<Employee>>
}

// Models
data class RequestItem(
    val id: Int,
    val id_empleado: Int,
    val empleado_nombre: String,
    val empleado_apellido: String,
    val type: String, // "vacaciones", "permiso", "compensacion", etc.
    val descripcion: String,
    val fecha_inicio: String? = null,
    val fecha_fin: String? = null,
    val status: String, // "pendiente", "aprobada", "rechazada"
    val created_at: String,
    val updated_at: String,
    val aprobador_nombre: String? = null,
    val archivo: String? = null
)

data class UpdateRequestRequest(
    val status: String? = null, // "aprobada" o "rechazada"
    val motivo_rechazo: String? = null
)

data class Employee(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val email: String,
    val brigada: String? = null
)