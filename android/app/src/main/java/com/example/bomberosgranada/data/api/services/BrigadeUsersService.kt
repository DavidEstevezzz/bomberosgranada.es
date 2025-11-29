package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface BrigadeUsersService {

    @GET("brigade-users")
    suspend fun getBrigadeUsers(): Response<List<BrigadeUser>>

    @GET("brigade-users/{id}")
    suspend fun getBrigadeUser(@Path("id") id: Int): Response<BrigadeUser>

    @GET("brigade-users/brigade/{brigadeId}")
    suspend fun getUsersByBrigade(@Path("brigadeId") brigadeId: Int): Response<List<BrigadeUser>>

    @GET("brigade-users/user/{employeeId}/practicas")
    suspend fun getUserPracticas(@Path("employeeId") employeeId: Int): Response<PracticasResponse>

    @POST("brigade-users")
    suspend fun createBrigadeUser(@Body brigadeUser: CreateBrigadeUserRequest): Response<BrigadeUser>

    @PUT("brigade-users/{id}")
    suspend fun updateBrigadeUser(
        @Path("id") id: Int,
        @Body brigadeUser: UpdateBrigadeUserRequest
    ): Response<BrigadeUser>

    @DELETE("brigade-users/{id}")
    suspend fun deleteBrigadeUser(@Path("id") id: Int): Response<Unit>

    @POST("brigade-users/update-practicas")
    suspend fun updatePracticas(@Body request: UpdatePracticasRequest): Response<Unit>

    @POST("brigade-users/increment-practicas")
    suspend fun incrementPracticas(@Body request: IncrementPracticasRequest): Response<Unit>
}

// Models
data class BrigadeUser(
    val id: Int,
    val id_empleado: Int,
    val id_brigada: Int,
    val nombre: String,
    val apellido: String,
    val brigada_nombre: String,
    val practicas: Int
)

data class PracticasResponse(
    val practicas: Int
)

data class CreateBrigadeUserRequest(
    val id_empleado: Int,
    val id_brigada: Int,
    val practicas: Int = 0
)

data class UpdateBrigadeUserRequest(
    val id_brigada: Int? = null,
    val practicas: Int? = null
)

data class UpdatePracticasRequest(
    val id_empleado: Int,
    val practicas: Int
)

data class IncrementPracticasRequest(
    val id_empleado: Int,
    val increment: Int
)