package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface BrigadeCompositionService {

    @GET("brigade-compositions/brigades")
    suspend fun getBrigades(): Response<List<Brigade>>

    @GET("brigade-compositions/{brigadeId}/{idParque}/{year}/{month}")
    suspend fun getBrigadeComposition(
        @Path("brigadeId") brigadeId: Int,
        @Path("idParque") idParque: Int,
        @Path("year") year: Int,
        @Path("month") month: Int
    ): Response<BrigadeComposition>

    @POST("brigade-compositions/copy-to-next-month")
    suspend fun copyToNextMonth(@Body request: CopyToNextMonthRequest): Response<Unit>

    @POST("brigade-compositions/transfer-firefighter")
    suspend fun transferFirefighter(@Body request: TransferFirefighterRequest): Response<Unit>
}

// Models
data class BrigadeComposition(
    val brigade: Brigade,
    val members: List<BrigadeMember>,
    val year: Int,
    val month: Int
)

data class BrigadeMember(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val puesto: String,
    val orden: Int
)

data class CopyToNextMonthRequest(
    val brigadeId: Int,
    val idParque: Int,
    val year: Int,
    val month: Int
)

data class TransferFirefighterRequest(
    val id_empleado: Int,
    val id_brigada_origen: Int,
    val id_brigada_destino: Int,
    val year: Int,
    val month: Int
)