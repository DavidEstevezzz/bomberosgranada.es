package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface UsersService {

    @GET("users")
    suspend fun getUsers(): Response<List<User>>

    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: Int): Response<User>

    @GET("users/por-puesto")
    suspend fun getUsersByPosition(@Query("puesto") puesto: String): Response<List<User>>

    @GET("users/{id}/check-mando-especial")
    suspend fun checkMandoEspecial(@Path("id") id: Int): Response<MandoEspecialResponse>

    @POST("users/create")
    suspend fun createUser(@Body user: CreateUserRequest): Response<User>

    @PUT("users/{id}")
    suspend fun updateUser(
        @Path("id") id: Int,
        @Body user: UpdateUserRequest
    ): Response<User>

    @PUT("users/{id}/update-ap")
    suspend fun updateUserAP(
        @Path("id") id: Int,
        @Body ap: UpdateUserAPRequest
    ): Response<User>

    @PUT("users/{id}/update-traslado")
    suspend fun updateUserTraslado(
        @Path("id") id: Int,
        @Body traslado: UpdateUserTrasladoRequest
    ): Response<User>

    @PUT("users/{id}/SP")
    suspend fun updateUserSP(
        @Path("id") id: Int,
        @Body sp: UpdateUserSPRequest
    ): Response<User>

    @PUT("users/{id}/{field}")
    suspend fun updateUserField(
        @Path("id") id: Int,
        @Path("field") field: String,
        @Body value: Map<String, Any>
    ): Response<User>

    @DELETE("users/{id}/delete")
    suspend fun deleteUser(@Path("id") id: Int): Response<Unit>
}

