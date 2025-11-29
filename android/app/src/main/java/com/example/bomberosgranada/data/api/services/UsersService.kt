package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface UsersService {

    @GET("users")
    suspend fun getUsers(): Response<List<UserItem>>

    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: Int): Response<UserItem>

    @GET("users/por-puesto")
    suspend fun getUsersByPuesto(@Query("puesto") puesto: String): Response<List<UserItem>>

    @GET("users/{id}/check-mando-especial")
    suspend fun checkMandoEspecial(@Path("id") id: Int): Response<CheckMandoEspecialResponse>

    @POST("users/create")
    suspend fun createUser(@Body user: CreateUserRequest): Response<UserItem>

    @PUT("users/{id}")
    suspend fun updateUser(
        @Path("id") id: Int,
        @Body user: UpdateUserRequest
    ): Response<UserItem>

    @PUT("users/{id}/update-ap")
    suspend fun updateUserAP(
        @Path("id") id: Int,
        @Body ap: UpdateAPRequest
    ): Response<UserItem>

    @PUT("users/{id}/update-traslado")
    suspend fun updateUserTraslado(
        @Path("id") id: Int,
        @Body traslado: UpdateTrasladoRequest
    ): Response<UserItem>

    @PUT("users/{id}/{field}")
    suspend fun updateUserField(
        @Path("id") id: Int,
        @Path("field") field: String,
        @Body value: Map<String, Any>
    ): Response<UserItem>
}

// Models
data class UserItem(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val dni: String,
    val type: String,
    val email: String,
    val telefono: String? = null,
    val puesto: String? = null,
    val AP: Int? = null,
    val vacaciones: Int? = null,
    val modulo: Int? = null,
    val SP: Int? = null,
    val orden: Int? = null,
    val foto: String? = null,
    val mando_especial: Boolean = false,
    val traslados: Int? = null,
    val created_at: String,
    val updated_at: String
)

data class CreateUserRequest(
    val nombre: String,
    val apellido: String,
    val dni: String,
    val type: String,
    val email: String,
    val password: String,
    val telefono: String? = null,
    val puesto: String? = null
)

data class UpdateUserRequest(
    val nombre: String? = null,
    val apellido: String? = null,
    val email: String? = null,
    val telefono: String? = null,
    val puesto: String? = null,
    val AP: Int? = null,
    val vacaciones: Int? = null,
    val SP: Int? = null
)

data class UpdateAPRequest(
    val AP: Int
)

data class UpdateTrasladoRequest(
    val traslado: Int
)

data class CheckMandoEspecialResponse(
    val mando_especial: Boolean
)