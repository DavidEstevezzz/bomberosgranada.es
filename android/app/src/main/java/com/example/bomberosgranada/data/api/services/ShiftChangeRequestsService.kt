package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface ShiftChangeRequestsService {

    @GET("shift-change-requests")
    suspend fun getShiftChangeRequests(): Response<List<ShiftChangeRequest>>

    @GET("shift-change-requests/{id}")
    suspend fun getShiftChangeRequest(@Path("id") id: Int): Response<ShiftChangeRequest>

    @POST("shift-change-requests")
    suspend fun createShiftChangeRequest(@Body request: CreateShiftChangeRequest): Response<ShiftChangeRequest>

    @PUT("shift-change-requests/{id}")
    suspend fun updateShiftChangeRequest(
        @Path("id") id: Int,
        @Body request: UpdateShiftChangeRequest
    ): Response<ShiftChangeRequest>

    @DELETE("shift-change-requests/{id}")
    suspend fun deleteShiftChangeRequest(@Path("id") id: Int): Response<Unit>
}

// Models
data class ShiftChangeRequest(
    val id: Int,
    val id_empleado1: Int,
    val empleado1_nombre: String,
    val empleado1_apellido: String,
    val id_empleado2: Int,
    val empleado2_nombre: String,
    val empleado2_apellido: String,
    val fecha: String,
    val turno: String,
    val estado: String, // "pendiente", "aprobada", "rechazada"
    val motivo: String? = null,
    val created_at: String
)

data class CreateShiftChangeRequest(
    val id_empleado2: Int,
    val fecha: String,
    val turno: String,
    val motivo: String? = null
)

data class UpdateShiftChangeRequest(
    val estado: String? = null,
    val motivo_rechazo: String? = null
)