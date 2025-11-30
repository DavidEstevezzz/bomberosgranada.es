package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface IncidentsService {

    /**
     * GET /incidents
     * Laravel devuelve: List<Incident> con relaciones creator, employee2, vehicle, park, resolver, clothing_item, equipment
     */
    @GET("incidents")
    suspend fun getIncidents(): Response<List<Incident>>

    /**
     * GET /incidents/{id}
     * Laravel devuelve: Incident
     */
    @GET("incidents/{id}")
    suspend fun getIncident(@Path("id") id: Int): Response<Incident>

    /**
     * GET /incidents/count-pending
     * Laravel devuelve: { "pending": number }
     * IMPORTANTE: Este endpoint debe estar ANTES del /{id} o Laravel lo interpretará como id="count-pending"
     */
    @GET("incidents/count-pending")
    suspend fun countPending(): Response<CountResponseIncident>

    /**
     * POST /incidents
     * Laravel espera: { fecha, id_empleado, tipo, estado, descripcion, nivel, id_parque, leido?, resolviendo?, matricula?, id_empleado2?, equipo?, id_vestuario? }
     * Laravel devuelve: Incident
     */
    @POST("incidents")
    suspend fun createIncident(@Body incident: CreateIncidentRequest): Response<Incident>

    /**
     * PUT /incidents/{id}
     * Laravel devuelve: Incident
     */
    @PUT("incidents/{id}")
    suspend fun updateIncident(
        @Path("id") id: Int,
        @Body incident: UpdateIncidentRequest
    ): Response<Incident>

    /**
     * DELETE /incidents/{id}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("incidents/{id}")
    suspend fun deleteIncident(@Path("id") id: Int): Response<Unit>

    /**
     * PATCH /incidents/{id}/mark-as-read
     * Laravel devuelve: Incident (con leido=true)
     */
    @PATCH("incidents/{id}/mark-as-read")
    suspend fun markAsRead(@Path("id") id: Int): Response<Incident>

    /**
     * PATCH /incidents/{id}/resolve
     * Laravel espera: { resulta_por, resolucion }
     * Laravel devuelve: Incident (con estado='resuelta')
     */
    @PATCH("incidents/{id}/resolve")
    suspend fun resolveIncident(
        @Path("id") id: Int,
        @Body resolution: ResolveIncidentRequest
    ): Response<Incident>
}