package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface InterventionsService {

    @GET("intervenciones")
    suspend fun getInterventions(): Response<List<Intervention>>

    @GET("intervenciones/{parte}")
    suspend fun getIntervention(@Path("parte") parte: String): Response<Intervention>

    @GET("intervenciones/by-guard/{id_guard}")
    suspend fun getInterventionsByGuard(@Path("id_guard") idGuard: Int): Response<List<Intervention>>

    @POST("intervenciones")
    suspend fun createIntervention(@Body intervention: CreateInterventionRequest): Response<Intervention>

    @PUT("intervenciones/{parte}")
    suspend fun updateIntervention(
        @Path("parte") parte: String,
        @Body intervention: UpdateInterventionRequest
    ): Response<Intervention>

    @DELETE("intervenciones/{parte}")
    suspend fun deleteIntervention(@Path("parte") parte: String): Response<Unit>
}

// Models
data class Intervention(
    val parte: String,
    val id_guard: Int,
    val tipo: String,
    val direccion: String,
    val fecha_hora: String,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null,
    val created_at: String
)

data class CreateInterventionRequest(
    val parte: String,
    val id_guard: Int,
    val tipo: String,
    val direccion: String,
    val fecha_hora: String,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null
)

data class UpdateInterventionRequest(
    val tipo: String? = null,
    val direccion: String? = null,
    val fecha_hora: String? = null,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null
)