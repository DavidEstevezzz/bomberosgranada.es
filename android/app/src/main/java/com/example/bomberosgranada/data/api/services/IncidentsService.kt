package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface IncidentsService {

    @GET("incidents")
    suspend fun getIncidents(): Response<List<Incident>>

    @GET("incidents/{id}")
    suspend fun getIncident(@Path("id") id: Int): Response<Incident>

    @POST("incidents")
    suspend fun createIncident(@Body incident: CreateIncidentRequest): Response<Incident>

    @PUT("incidents/{id}")
    suspend fun updateIncident(
        @Path("id") id: Int,
        @Body incident: UpdateIncidentRequest
    ): Response<Incident>

    @DELETE("incidents/{id}")
    suspend fun deleteIncident(@Path("id") id: Int): Response<Unit>

    @PATCH("incidents/{id}/mark-as-read")
    suspend fun markAsRead(@Path("id") id: Int): Response<Unit>

    @PATCH("incidents/{id}/resolve")
    suspend fun resolveIncident(
        @Path("id") id: Int,
        @Body resolution: ResolveIncidentRequest
    ): Response<Incident>

    @GET("incidents/count-pending")
    suspend fun countPending(): Response<CountResponseIncident>
}

// Models
data class Incident(
    val id: Int,
    val tipo: String,
    val descripcion: String,
    val id_parque: Int? = null,
    val parque_nombre: String? = null,
    val id_vehiculo: Int? = null,
    val vehiculo_matricula: String? = null,
    val estado: String,
    val prioridad: String,
    val created_by: Int,
    val creator_nombre: String,
    val leido: Boolean,
    val resolviendo: String? = null,
    val resuelto: String? = null,
    val created_at: String
)

data class CreateIncidentRequest(
    val tipo: String,
    val descripcion: String,
    val id_parque: Int? = null,
    val id_vehiculo: Int? = null,
    val prioridad: String = "media"
)

data class UpdateIncidentRequest(
    val tipo: String? = null,
    val descripcion: String? = null,
    val estado: String? = null,
    val prioridad: String? = null,
    val resolviendo: String? = null
)

data class ResolveIncidentRequest(
    val resuelto: String,
    val estado: String = "resuelto"
)

data class CountResponseIncident(
    val count: Int
)