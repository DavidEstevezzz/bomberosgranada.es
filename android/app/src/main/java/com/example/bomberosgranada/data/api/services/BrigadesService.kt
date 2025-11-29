package com.example.bomberosgranada.data.api.services

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
    ): Response<List<BrigadeFirefighter>>

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

// Models
data class Brigade(
    val id: Int,
    val nombre: String,
    val descripcion: String? = null,
    val especial: Boolean = false
)

data class CheckEspecialResponse(
    val especial: Boolean
)

data class BrigadeFirefighter(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val puesto: String,
    val orden: Int
)

data class CreateBrigadeRequest(
    val nombre: String,
    val descripcion: String? = null,
    val especial: Boolean = false
)

data class UpdateBrigadeRequest(
    val nombre: String? = null,
    val descripcion: String? = null,
    val especial: Boolean? = null
)