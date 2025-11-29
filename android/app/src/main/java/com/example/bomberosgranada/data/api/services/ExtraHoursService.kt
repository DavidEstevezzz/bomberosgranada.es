package com.example.bomberosgranada.data.api.services

import com.example.bomberosgranada.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ExtraHoursService {

    /**
     * Obtener todas las horas extras
     */
    @GET("extra_hours")
    suspend fun getExtraHours(): Response<List<ExtraHour>>

    /**
     * Obtener una hora extra específica por ID
     */
    @GET("extra_hours/{id}")
    suspend fun getExtraHour(@Path("id") id: Int): Response<ExtraHour>

    /**
     * Crear nueva entrada de horas extras
     */
    @POST("extra_hours")
    suspend fun createExtraHour(@Body extraHour: CreateExtraHourRequest): Response<ExtraHour>

    /**
     * Actualizar entrada de horas extras
     */
    @PUT("extra_hours/{id}")
    suspend fun updateExtraHour(
        @Path("id") id: Int,
        @Body extraHour: UpdateExtraHourRequest
    ): Response<ExtraHour>

    /**
     * Eliminar entrada de horas extras
     */
    @DELETE("extra_hours/{id}")
    suspend fun deleteExtraHour(@Path("id") id: Int): Response<Unit>

    /**
     * Obtener horas extras por mes
     */
    @GET("extra-hours-by-month")
    suspend fun getExtraHoursByMonth(@Query("month") month: String): Response<List<ExtraHour>>
}

// Models
data class ExtraHour(
    val id: Int,
    val id_empleado: Int,
    val fecha: String,
    val horas: Double,
    val descripcion: String?,
    val tipo: String?, // "normal", "nocturna", "festiva", etc.
    val estado: String?, // "pendiente", "aprobada", "rechazada"
    val created_at: String?,
    val updated_at: String?
)

data class CreateExtraHourRequest(
    val id_empleado: Int,
    val fecha: String,
    val horas: Double,
    val descripcion: String? = null,
    val tipo: String? = null
)

data class UpdateExtraHourRequest(
    val fecha: String? = null,
    val horas: Double? = null,
    val descripcion: String? = null,
    val tipo: String? = null,
    val estado: String? = null
)