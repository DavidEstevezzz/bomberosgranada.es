package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ShiftChangeRequestsService {

    /**
     * GET /shift-change-requests
     * Laravel devuelve: List<ShiftChangeRequest> con relaciones
     */
    @GET("shift-change-requests")
    suspend fun getShiftChangeRequests(): Response<List<ShiftChangeRequest>>

    /**
     * GET /shift-change-requests/{id}
     * Laravel devuelve: ShiftChangeRequest
     */
    @GET("shift-change-requests/{id}")
    suspend fun getShiftChangeRequest(@Path("id") id: Int): Response<ShiftChangeRequest>

    /**
     * POST /shift-change-requests
     * Laravel espera: { id_empleado1, id_empleado2, fecha, fecha2?, turno, motivo, estado }
     * Laravel calcula brigada1 y brigada2 automáticamente
     * Laravel devuelve: ShiftChangeRequest
     */
    @POST("shift-change-requests")
    suspend fun createShiftChangeRequest(@Body request: CreateShiftChangeRequest): Response<ShiftChangeRequest>

    /**
     * PUT /shift-change-requests/{id}
     * Laravel espera: { estado }
     * Laravel devuelve: ShiftChangeRequest
     */
    @PUT("shift-change-requests/{id}")
    suspend fun updateShiftChangeRequest(
        @Path("id") id: Int,
        @Body request: UpdateShiftChangeRequest
    ): Response<ShiftChangeRequest>

    /**
     * DELETE /shift-change-requests/{id}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("shift-change-requests/{id}")
    suspend fun deleteShiftChangeRequest(@Path("id") id: Int): Response<Unit>
}