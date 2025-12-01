package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface PersonalEquipmentService {

    /**
     * GET /equipos-personales
     * Laravel devuelve: List<PersonalEquipment>
     */
    @GET("equipos-personales")
    suspend fun getPersonalEquipments(): Response<List<PersonalEquipment>>

    /**
     * GET /equipos-personales/{equipo}
     * Laravel devuelve: PersonalEquipment
     */
    @GET("equipos-personales/{equipo}")
    suspend fun getPersonalEquipment(@Path("equipo") equipo: Int): Response<PersonalEquipment>

    /**
     * GET /equipos-personales/parque/{parkId}
     * Laravel devuelve: List<PersonalEquipment>
     */
    @GET("equipos-personales/parque/{parkId}")
    suspend fun getEquipmentsByPark(@Path("parkId") parkId: Int): Response<List<PersonalEquipment>>

    /**
     * GET /equipos-personales/check-availability/{equipmentNumber}
     * Laravel devuelve: { available, equipment_number, unavailable_equipment }
     */
    @GET("equipos-personales/check-availability/{equipmentNumber}")
    suspend fun checkEquipmentAvailability(@Path("equipmentNumber") equipmentNumber: String): Response<CheckAvailabilityResponse>

    /**
     * GET /categorias-equipos
     * Laravel devuelve: List<String> (array de categorías)
     */
    @GET("categorias-equipos")
    suspend fun getCategories(): Response<List<String>>

    /**
     * POST /equipos-personales
     * Laravel espera: { nombre, categoria, disponible? }
     * Laravel devuelve: PersonalEquipment
     */
    @POST("equipos-personales")
    suspend fun createPersonalEquipment(@Body equipment: CreatePersonalEquipmentRequest): Response<PersonalEquipment>

    /**
     * PUT /equipos-personales/{equipo}
     * Laravel espera: { nombre?, categoria?, disponible? }
     * Laravel devuelve: PersonalEquipment
     */
    @PUT("equipos-personales/{equipo}")
    suspend fun updatePersonalEquipment(
        @Path("equipo") equipo: Int,
        @Body equipment: UpdatePersonalEquipmentRequest
    ): Response<PersonalEquipment>

    /**
     * DELETE /equipos-personales/{equipo}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("equipos-personales/{equipo}")
    suspend fun deletePersonalEquipment(@Path("equipo") equipo: Int): Response<Unit>

    /**
     * PUT /equipos-personales/{equipo}/toggle-disponibilidad
     * Laravel devuelve: PersonalEquipment (con disponible invertido)
     */
    @PUT("equipos-personales/{equipo}/toggle-disponibilidad")
    suspend fun toggleDisponibilidad(@Path("equipo") equipo: Int): Response<PersonalEquipment>

    /**
     * POST /equipos-personales/check-and-assign
     * Laravel espera: { id_empleado, categoria, id_parque }
     * Laravel devuelve: { success, message, equipoAsignado?, equiposNoDisponibles?, equiposNoExistentes? }
     */
    @POST("equipos-personales/check-and-assign")
    suspend fun checkAndAssignEquipment(@Body request: CheckAndAssignEquipmentRequest): Response<CheckAndAssignEquipmentResponse>

    /**
     * POST /equipos-personales/reset-assignments
     * Laravel espera: { parkId, date? }
     * Laravel devuelve: { success, message, park_id, date }
     */
    @POST("equipos-personales/reset-assignments")
    suspend fun resetEquipmentAssignments(@Body request: ResetEquipmentAssignmentsRequest): Response<ResetEquipmentAssignmentsResponse>
}