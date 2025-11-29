package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface VehiclesService {

    @GET("vehicles")
    suspend fun getVehicles(): Response<List<Vehicle>>

    @GET("vehicles/{matricula}")
    suspend fun getVehicle(@Path("matricula") matricula: String): Response<Vehicle>

    @POST("vehicles")
    suspend fun createVehicle(@Body vehicle: CreateVehicleRequest): Response<Vehicle>

    @PUT("vehicles/{matricula}")
    suspend fun updateVehicle(
        @Path("matricula") matricula: String,
        @Body vehicle: UpdateVehicleRequest
    ): Response<Vehicle>

    @DELETE("vehicles/{matricula}")
    suspend fun deleteVehicle(@Path("matricula") matricula: String): Response<Unit>
}

// Models
data class Vehicle(
    val matricula: String,
    val tipo: String,
    val marca: String,
    val modelo: String,
    val año: Int,
    val id_parque: Int,
    val parque_nombre: String? = null,
    val estado: String,
    val kilometraje: Int? = null,
    val ultima_revision: String? = null,
    val observaciones: String? = null
)

data class CreateVehicleRequest(
    val matricula: String,
    val tipo: String,
    val marca: String,
    val modelo: String,
    val año: Int,
    val id_parque: Int,
    val estado: String,
    val kilometraje: Int? = null,
    val observaciones: String? = null
)

data class UpdateVehicleRequest(
    val tipo: String? = null,
    val marca: String? = null,
    val modelo: String? = null,
    val año: Int? = null,
    val estado: String? = null,
    val kilometraje: Int? = null,
    val ultima_revision: String? = null,
    val observaciones: String? = null
)