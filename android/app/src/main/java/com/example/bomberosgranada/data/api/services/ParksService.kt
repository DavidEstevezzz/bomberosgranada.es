package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface ParksService {

    @GET("parks")
    suspend fun getParks(): Response<List<Park>>

    @GET("parks/{id_parque}")
    suspend fun getPark(@Path("id_parque") idParque: Int): Response<Park>

    @POST("parks")
    suspend fun createPark(@Body park: CreateParkRequest): Response<Park>

    @PUT("parks/{id_parque}")
    suspend fun updatePark(
        @Path("id_parque") idParque: Int,
        @Body park: UpdateParkRequest
    ): Response<Park>

    @DELETE("parks/{id_parque}")
    suspend fun deletePark(@Path("id_parque") idParque: Int): Response<Unit>
}

// Models
data class Park(
    val id_parque: Int,
    val nombre: String,
    val direccion: String? = null,
    val telefono: String? = null
)

data class CreateParkRequest(
    val nombre: String,
    val direccion: String? = null,
    val telefono: String? = null
)

data class UpdateParkRequest(
    val nombre: String? = null,
    val direccion: String? = null,
    val telefono: String? = null
)