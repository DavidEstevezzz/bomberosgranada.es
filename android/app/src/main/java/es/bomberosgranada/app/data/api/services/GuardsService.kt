package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface GuardsService {

    @GET("guards")
    suspend fun getGuards(): Response<List<Guard>>

    @GET("guards/{id}")
    suspend fun getGuard(@Path("id") id: Int): Response<Guard>

    @GET("guards/especial")
    suspend fun getEspecialGuards(): Response<List<Guard>>

    @GET("guards/by-brigades")
    suspend fun getGuardsByBrigades(
        @Query("brigades") brigades: String,
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String
    ): Response<List<Guard>>

    @GET("guards/by-date")
    suspend fun getGuardsByDate(@Query("date") date: String): Response<List<Guard>>

    @GET("guards/by-brigade-and-date")
    suspend fun getGuardByBrigadeAndDate(
        @Query("id_brigada") idBrigada: Int,
        @Query("date") date: String
    ): Response<GuardByBrigadeAndDateResponse>

    @POST("guards")
    suspend fun createGuard(@Body guard: CreateGuardRequest): Response<Guard>

    @PUT("guards/{id}")
    suspend fun updateGuard(
        @Path("id") id: Int,
        @Body guard: UpdateGuardRequest
    ): Response<UpdateGuardResponse>

    @PUT("guards/{id}/update-schedule")
    suspend fun updateSchedule(
        @Path("id") id: Int,
        @Body schedule: UpdateScheduleRequest
    ): Response<UpdateGuardResponse>

    @PUT("guards/{id}/daily-activities")
    suspend fun updateDailyActivities(
        @Path("id") id: Int,
        @Body activities: UpdateDailyActivitiesRequest
    ): Response<UpdateGuardResponse>

    @PUT("guards/update-comments")
    suspend fun updateComments(@Body request: UpdateCommentsRequest): Response<UpdateCommentsResponse>

    @PUT("guards/update-personal-incidents")
    suspend fun updatePersonalIncidents(@Body request: UpdatePersonalIncidentsRequest): Response<UpdatePersonalIncidentsResponse>

    @PUT("guards/update-general-incidents")
    suspend fun updateGeneralIncidents(@Body request: UpdateGeneralIncidentsRequest): Response<UpdateGeneralIncidentsResponse>

    @DELETE("guards/{id}")
    suspend fun deleteGuard(@Path("id") id: Int): Response<Unit>
}