package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface BrigadesService {

    @GET("brigades")
    suspend fun getBrigades(): Response<List<Brigade>>

    @GET("brigades/{id}")
    suspend fun getBrigade(@Path("id") id: Int): Response<Brigade>

    @GET("brigades/especial")
    suspend fun getEspecialBrigades(): Response<List<Brigade>>

    @GET("brigades/{id}/check-especial")
    suspend fun checkBrigadaEspecial(@Path("id") id: Int): Response<CheckEspecialResponse>

    @GET("brigades/{id}/firefighters")
    suspend fun getFirefightersByBrigade(
        @Path("id") id: Int,
        @Query("fecha") fecha: String
    ): Response<BrigadeFirefightersResponse>

    @POST("brigades")
    suspend fun createBrigade(@Body brigade: CreateBrigadeRequest): Response<Brigade>

    @PUT("brigades/{id}")
    suspend fun updateBrigade(
        @Path("id") id: Int,
        @Body brigade: UpdateBrigadeRequest
    ): Response<Brigade>

    @DELETE("brigades/{id}")
    suspend fun deleteBrigade(@Path("id") id: Int): Response<Unit>
}