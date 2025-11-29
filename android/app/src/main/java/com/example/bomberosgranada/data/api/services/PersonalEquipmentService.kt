package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface PersonalEquipmentService {

    @GET("equipos-personales")
    suspend fun getPersonalEquipment(): Response<List<PersonalEquipmentItem>>

    @GET("equipos-personales/parque/{parkId}")
    suspend fun getEquipmentByPark(@Path("parkId") parkId: Int): Response<List<PersonalEquipmentItem>>

    @GET("equipos-personales/{equipo}")
    suspend fun getEquipmentItem(@Path("equipo") equipo: Int): Response<PersonalEquipmentItem>

    @POST("equipos-personales")
    suspend fun createEquipmentItem(@Body equipment: CreateEquipmentRequest): Response<PersonalEquipmentItem>

    @PUT("equipos-personales/{equipo}")
    suspend fun updateEquipmentItem(
        @Path("equipo") equipo: Int,
        @Body equipment: UpdateEquipmentRequest
    ): Response<PersonalEquipmentItem>

    @DELETE("equipos-personales/{equipo}")
    suspend fun deleteEquipmentItem(@Path("equipo") equipo: Int): Response<Unit>

    @PUT("equipos-personales/{equipo}/toggle-disponibilidad")
    suspend fun toggleDisponibilidad(@Path("equipo") equipo: Int): Response<PersonalEquipmentItem>

    @GET("equipos-personales/check-availability/{equipmentNumber}")
    suspend fun checkAvailability(@Path("equipmentNumber") equipmentNumber: String): Response<AvailabilityResponse>

    @POST("equipos-personales/check-and-assign")
    suspend fun checkAndAssignEquipment(@Body request: CheckAndAssignRequest): Response<PersonalEquipmentItem>

    @POST("equipos-personales/reset-assignments")
    suspend fun resetEquipmentAssignments(@Body request: ResetAssignmentsRequest): Response<Unit>

    @GET("categorias-equipos")
    suspend fun getCategories(): Response<List<String>>
}

// Models
data class PersonalEquipmentItem(
    val id: Int,
    val numero_equipo: String,
    val categoria: String,
    val id_empleado: Int? = null,
    val empleado_nombre: String? = null,
    val empleado_apellido: String? = null,
    val id_parque: Int,
    val parque_nombre: String,
    val disponible: Boolean,
    val fecha_asignacion: String? = null,
    val observaciones: String? = null
)

data class CreateEquipmentRequest(
    val numero_equipo: String,
    val categoria: String,
    val id_parque: Int,
    val id_empleado: Int? = null,
    val disponible: Boolean = true,
    val observaciones: String? = null
)

data class UpdateEquipmentRequest(
    val id_empleado: Int? = null,
    val disponible: Boolean? = null,
    val observaciones: String? = null
)

data class AvailabilityResponse(
    val available: Boolean,
    val equipment: PersonalEquipmentItem? = null
)

data class CheckAndAssignRequest(
    val numero_equipo: String,
    val id_empleado: Int,
    val id_parque: Int
)

data class ResetAssignmentsRequest(
    val id_parque: Int
)