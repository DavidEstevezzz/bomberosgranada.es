package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface TransfersService {

    @GET("transfers/by-brigade-and-date")
    suspend fun getTransfersByBrigadeAndDate(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<List<Transfer>>

    @GET("transfers/{id_transfer}")
    suspend fun getTransfer(@Path("id_transfer") idTransfer: Int): Response<Transfer>

    @POST("transfers")
    suspend fun createTransfer(@Body transfer: CreateTransferRequest): Response<Transfer>

    @PUT("transfers/{id_transfer}")
    suspend fun updateTransfer(
        @Path("id_transfer") idTransfer: Int,
        @Body transfer: UpdateTransferRequest
    ): Response<Transfer>

    @DELETE("transfers/{id_transfer}")
    suspend fun deleteTransfer(@Path("id_transfer") idTransfer: Int): Response<Unit>
}

// Models
data class Transfer(
    val id_transfer: Int,
    val id_empleado: Int,
    val empleado_nombre: String,
    val empleado_apellido: String,
    val id_brigada_origen: Int,
    val brigada_origen_nombre: String,
    val id_brigada_destino: Int,
    val brigada_destino_nombre: String,
    val fecha_inicio: String,
    val fecha_fin: String? = null,
    val motivo: String? = null,
    val created_at: String
)

data class CreateTransferRequest(
    val id_empleado: Int,
    val id_brigada_origen: Int,
    val id_brigada_destino: Int,
    val fecha_inicio: String,
    val fecha_fin: String? = null,
    val motivo: String? = null
)

data class UpdateTransferRequest(
    val fecha_fin: String? = null,
    val motivo: String? = null
)