package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface BrigadeCompositionService {

    /**
     * GET /brigade-compositions/brigades
     * Laravel devuelve: List<Brigade> con relación park
     */
    @GET("brigade-compositions/brigades")
    suspend fun getBrigades(): Response<List<Brigade>>

    /**
     * GET /brigade-compositions/{brigadeId}/{idParque}/{year}/{month}
     * Laravel devuelve: { brigade, firefighters, guard_days, message? }
     */
    @GET("brigade-compositions/{brigadeId}/{idParque}/{year}/{month}")
    suspend fun getBrigadeComposition(
        @Path("brigadeId") brigadeId: Int,
        @Path("idParque") idParque: Int,
        @Path("year") year: Int,
        @Path("month") month: Int
    ): Response<BrigadeCompositionResponse>

    /**
     * POST /brigade-compositions/copy-to-next-month
     * Laravel espera: { year, month }
     * Laravel devuelve: { message, copied, to }
     */
    @POST("brigade-compositions/copy-to-next-month")
    suspend fun copyToNextMonth(@Body request: CopyCompositionRequest): Response<CopyCompositionResponse>

    /**
     * POST /brigade-compositions/transfer-firefighter
     * Laravel espera: { user_id, from_brigade_id, from_id_parque, to_brigade_id, to_id_parque, year, month }
     * Laravel devuelve: { message, composition }
     */
    @POST("brigade-compositions/transfer-firefighter")
    suspend fun transferFirefighter(@Body request: TransferFirefighterRequest): Response<TransferFirefighterResponse>
}