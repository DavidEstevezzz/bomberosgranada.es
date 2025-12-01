package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ParksService {

    /**
     * GET /parks
     * Laravel devuelve: List<Park>
     */
    @GET("parks")
    suspend fun getParks(): Response<List<Park>>

    /**
     * GET /parks/{id_parque}
     * Laravel devuelve: Park
     */
    @GET("parks/{id_parque}")
    suspend fun getPark(@Path("id_parque") idParque: Int): Response<Park>

    /**
     * POST /parks
     * Laravel espera: { id_parque, nombre, ubicacion, telefono, parque? }
     * Laravel devuelve: Park
     */
    @POST("parks")
    suspend fun createPark(@Body park: CreateParkRequest): Response<Park>

    /**
     * PUT /parks/{id_parque}
     * Laravel espera: { nombre?, ubicacion?, telefono?, parque? }
     * Laravel devuelve: Park
     */
    @PUT("parks/{id_parque}")
    suspend fun updatePark(
        @Path("id_parque") idParque: Int,
        @Body park: UpdateParkRequest
    ): Response<Park>

    /**
     * DELETE /parks/{id_parque}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("parks/{id_parque}")
    suspend fun deletePark(@Path("id_parque") idParque: Int): Response<Unit>
}