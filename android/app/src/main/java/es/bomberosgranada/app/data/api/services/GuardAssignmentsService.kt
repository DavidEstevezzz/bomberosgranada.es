package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface GuardAssignmentsService {

    @GET("guard-assignments")
    suspend fun getGuardAssignments(): Response<List<GuardAssignment>>

    @GET("guard-assignments/{id}")
    suspend fun getGuardAssignment(@Path("id") id: Int): Response<GuardAssignment>

    @POST("guard-assignments")
    suspend fun createGuardAssignment(@Body assignment: CreateGuardAssignmentRequest): Response<GuardAssignment>

    @PUT("guard-assignments/{id}")
    suspend fun updateGuardAssignment(
        @Path("id") id: Int,
        @Body assignment: UpdateGuardAssignmentRequest
    ): Response<GuardAssignment>

    @PUT("guard-assignments/update-or-create")
    suspend fun updateOrCreateAssignment(@Body assignment: UpdateOrCreateGuardAssignmentRequest): Response<GuardAssignment>

    @DELETE("guard-assignments/{id}")
    suspend fun deleteGuardAssignment(@Path("id") id: Int): Response<Unit>
}