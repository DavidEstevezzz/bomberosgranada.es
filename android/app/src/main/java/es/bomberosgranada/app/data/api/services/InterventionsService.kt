package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface InterventionsService {

    /**
     * GET /intervenciones
     * Laravel devuelve: List<Intervention>
     */
    @GET("intervenciones")
    suspend fun getInterventions(): Response<List<Intervention>>

    /**
     * GET /intervenciones/by-guard/{id_guard}
     * IMPORTANTE: Este endpoint debe estar ANTES del /{parte} o Laravel lo interpretará como parte="by-guard"
     */
    @GET("intervenciones/by-guard/{id_guard}")
    suspend fun getInterventionsByGuard(@Path("id_guard") idGuard: Int): Response<List<Intervention>>

    /**
     * GET /intervenciones/{parte}
     * Laravel devuelve: Intervention
     * NOTA: 'parte' es la clave primaria (String)
     */
    @GET("intervenciones/{parte}")
    suspend fun getIntervention(@Path("parte", encoded = true) parte: String): Response<Intervention>

    /**
     * POST /intervenciones
     * Laravel espera: { id_guard, parte, tipo, mando, direccion?, fecha_hora?, descripcion?, observaciones?, vehiculos_utilizados? }
     * Laravel devuelve: Intervention
     */
    @POST("intervenciones")
    suspend fun createIntervention(@Body intervention: CreateInterventionRequest): Response<Intervention>

    /**
     * PUT /intervenciones/{parte}
     * Laravel devuelve: Intervention
     */
    @PUT("intervenciones/{parte}")
    suspend fun updateIntervention(
        @Path("parte", encoded = true) parte: String,
        @Body intervention: UpdateInterventionRequest
    ): Response<Intervention>

    /**
     * DELETE /intervenciones/{parte}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("intervenciones/{parte}")
    suspend fun deleteIntervention(@Path("parte", encoded = true) parte: String): Response<Unit>
}