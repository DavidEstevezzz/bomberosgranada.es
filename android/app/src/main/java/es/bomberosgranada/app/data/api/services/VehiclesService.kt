package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface VehiclesService {

    /**
     * GET /vehicles
     * Laravel devuelve: List<Vehicle> con relación park
     */
    @GET("vehicles")
    suspend fun getVehicles(): Response<List<Vehicle>>

    /**
     * GET /vehicles/{matricula}
     * Laravel devuelve: Vehicle con relación park
     */
    @GET("vehicles/{matricula}")
    suspend fun getVehicle(@Path("matricula") matricula: String): Response<Vehicle>

    /**
     * POST /vehicles
     * Laravel espera: { matricula, nombre, id_parque, año, tipo }
     * Laravel devuelve: Vehicle
     */
    @POST("vehicles")
    suspend fun createVehicle(@Body vehicle: CreateVehicleRequest): Response<Vehicle>

    /**
     * PUT /vehicles/{matricula}
     * Laravel espera: { matricula, nombre, id_parque, año, tipo }
     * NOTA: Laravel requiere TODOS los campos en update
     * Laravel devuelve: Vehicle
     */
    @PUT("vehicles/{matricula}")
    suspend fun updateVehicle(
        @Path("matricula") matricula: String,
        @Body vehicle: UpdateVehicleRequest
    ): Response<Vehicle>

    /**
     * DELETE /vehicles/{matricula}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("vehicles/{matricula}")
    suspend fun deleteVehicle(@Path("matricula") matricula: String): Response<Unit>
}