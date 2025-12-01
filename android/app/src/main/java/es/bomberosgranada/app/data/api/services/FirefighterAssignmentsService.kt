package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface FirefighterAssignmentsService {

    @GET("firefighters-assignments")
    suspend fun getAssignments(): Response<List<FirefighterAssignment>>

    @GET("firefighters-assignments/{id}")
    suspend fun getAssignment(@Path("id") id: Int): Response<FirefighterAssignment>

    @GET("firefighters-assignments/{id}/firefighters")
    suspend fun getFirefightersByAssignment(@Path("id") id: Int): Response<List<User>>

    @POST("firefighters-assignments")
    suspend fun createAssignment(@Body assignment: CreateAssignmentRequest): Response<FirefighterAssignment>

    @PUT("firefighters-assignments/{id}")
    suspend fun updateAssignment(
        @Path("id") id: Int,
        @Body assignment: UpdateAssignmentRequest
    ): Response<FirefighterAssignment>

    @DELETE("firefighters-assignments/{id}")
    suspend fun deleteAssignment(@Path("id") id: Int): Response<Unit>

    @GET("firefighters-assignments/available-firefighters")
    suspend fun getAvailableFirefighters(@Query("date") date: String): Response<AvailableFirefightersResponse>

    @GET("firefighters-assignments/available-firefighters-without-mands")
    suspend fun getAvailableFirefightersWithoutMands(@Query("date") date: String): Response<AvailableFirefightersResponse>

    @GET("firefighters-assignments/available-firefighters-no-adjacent-days")
    suspend fun getAvailableFirefightersNoAdjacentDays(@Query("date") date: String): Response<AvailableFirefightersResponse>

    @GET("firefighters-assignments/no-today-and-tomorrow")
    suspend fun getAvailableFirefightersNoTodayAndTomorrow(@Query("date") date: String): Response<AvailableFirefightersResponse>

    @GET("firefighters-assignments/no-today-and-yesterday")
    suspend fun getAvailableFirefightersNoTodayAndYesterday(@Query("date") date: String): Response<AvailableFirefightersResponse>

    @GET("firefighters-assignments/working-firefighters")
    suspend fun getWorkingFirefighters(@Query("date") date: String): Response<WorkingFirefightersResponse>

    @GET("firefighters-assignments/check-especial-brigade")
    suspend fun checkEspecialBrigade(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<CheckEspecialBrigadeResponse>

    @POST("firefighters-assignments/{id}/move-to-top/{column}")
    suspend fun moveToTop(
        @Path("id") id: Int,
        @Path("column") column: String
    ): Response<MoveResponse>

    @POST("firefighters-assignments/{id}/move-to-bottom/{column}")
    suspend fun moveToBottom(
        @Path("id") id: Int,
        @Path("column") column: String
    ): Response<MoveResponse>

    @POST("firefighters-assignments/require-firefighter")
    suspend fun requireFirefighter(@Body request: RequireFirefighterRequest): Response<RequireFirefighterResponse>

    @PUT("firefighters-assignments/{id_asignacion}/increment-user-column")
    suspend fun incrementUserColumn(
        @Path("id_asignacion") idAsignacion: Int,
        @Body payload: IncrementColumnRequest
    ): Response<IncrementColumnResponse>

    @POST("firefighters-assignments/extend-working-day")
    suspend fun extendWorkingDay(@Body request: ExtendWorkingDayRequest): Response<ExtendWorkingDayResponse>

    @POST("firefighters-assignments/create-practices")
    suspend fun createPracticesAssignments(@Body request: CreatePracticesRequest): Response<CreatePracticesResponse>

    @POST("firefighters-assignments/create-rt")
    suspend fun createRTAssignments(@Body request: CreateRTRequest): Response<CreateRTResponse>

    @POST("firefighters-assignments/delete-practices")
    suspend fun deletePracticesAssignments(@Body request: DeletePracticesRequest): Response<DeleteAssignmentsResponse>

    @POST("firefighters-assignments/delete-rt")
    suspend fun deleteRTAssignments(@Body request: DeleteRTRequest): Response<DeleteAssignmentsResponse>

    @GET("firefighters-assignments/active-transfers")
    suspend fun getActiveTransfers(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<List<ActiveTransfer>>

    @POST("firefighters-assignments/undo-transfer")
    suspend fun undoTransfer(@Body request: UndoTransferRequest): Response<UndoTransferResponse>
}
