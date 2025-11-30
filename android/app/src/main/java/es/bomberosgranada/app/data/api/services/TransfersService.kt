package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface TransfersService {

    /**
     * GET /transfers/by-brigade-and-date
     * Laravel espera: { id_brigada, fecha }
     * Laravel devuelve: { transfers, count }
     */
    @GET("transfers/by-brigade-and-date")
    suspend fun getTransfersByBrigadeAndDate(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<TransfersByBrigadeResponse>

    /**
     * GET /transfers/{id_transfer}
     * Laravel devuelve: Transfer con relaciones
     */
    @GET("transfers/{id_transfer}")
    suspend fun getTransfer(@Path("id_transfer") idTransfer: Int): Response<Transfer>

    /**
     * POST /transfers
     * Laravel espera: { id_empleado, id_brigada_origen, id_brigada_destino, fecha_traslado, turno_seleccionado, horas_traslado }
     * Laravel crea automáticamente asignaciones de ida/vuelta
     * Laravel devuelve: { message, transfer, asignacion_ida, asignacion_vuelta }
     */
    @POST("transfers")
    suspend fun createTransfer(@Body transfer: CreateTransferRequest): Response<CreateTransferResponse>

    /**
     * PUT /transfers/{id_transfer}
     * Laravel espera: { turno_seleccionado?, horas_traslado? }
     * Laravel actualiza asignaciones si cambia el turno
     * Laravel devuelve: { message, transfer }
     */
    @PUT("transfers/{id_transfer}")
    suspend fun updateTransfer(
        @Path("id_transfer") idTransfer: Int,
        @Body transfer: UpdateTransferRequest
    ): Response<UpdateTransferResponse>

    /**
     * DELETE /transfers/{id_transfer}
     * Laravel revierte horas y elimina asignaciones automáticamente
     * Laravel devuelve: { message, horas_revertidas, asignaciones_eliminadas }
     */
    @DELETE("transfers/{id_transfer}")
    suspend fun deleteTransfer(@Path("id_transfer") idTransfer: Int): Response<DeleteTransferResponse>
}