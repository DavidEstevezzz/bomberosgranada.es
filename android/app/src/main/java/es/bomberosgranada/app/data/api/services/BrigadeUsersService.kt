package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface BrigadeUsersService {

    @GET("brigade-users")
    suspend fun getBrigadeUsers(): Response<List<BrigadeUser>>

    @GET("brigade-users/{id}")
    suspend fun getBrigadeUser(@Path("id") id: Int): Response<BrigadeUser>

    @GET("brigade-users/brigade/{brigadeId}")
    suspend fun getUsersByBrigade(@Path("brigadeId") brigadeId: Int): Response<BrigadeUsersByBrigadeResponse>

    @GET("brigade-users/user/{employeeId}/practicas")
    suspend fun getUserPracticas(@Path("employeeId") employeeId: Int): Response<UserPracticasResponse>

    @POST("brigade-users")
    suspend fun createBrigadeUser(@Body brigadeUser: CreateBrigadeUserRequest): Response<BrigadeUser>

    @PUT("brigade-users/{id}")
    suspend fun updateBrigadeUser(
        @Path("id") id: Int,
        @Body brigadeUser: UpdateBrigadeUserRequest
    ): Response<UpdateBrigadeUserResponse>

    @DELETE("brigade-users/{id}")
    suspend fun deleteBrigadeUser(@Path("id") id: Int): Response<Unit>

    @POST("brigade-users/update-practicas")
    suspend fun updatePracticas(@Body request: UpdatePracticasRequest): Response<PracticasUpdateResponse>

    @POST("brigade-users/increment-practicas")
    suspend fun incrementPracticas(@Body request: IncrementPracticasRequest): Response<PracticasUpdateResponse>
}