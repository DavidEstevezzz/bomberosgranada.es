package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ExtraHoursService {

    @GET("extra_hours")
    suspend fun getExtraHours(): Response<List<ExtraHour>>

    @GET("extra_hours/{id}")
    suspend fun getExtraHour(@Path("id") id: Int): Response<ExtraHour>

    @POST("extra_hours")
    suspend fun createExtraHour(@Body extraHour: CreateExtraHourRequest): Response<ExtraHour>

    @PUT("extra_hours/{id}")
    suspend fun updateExtraHour(
        @Path("id") id: Int,
        @Body extraHour: UpdateExtraHourRequest
    ): Response<ExtraHour>

    @DELETE("extra_hours/{id}")
    suspend fun deleteExtraHour(@Path("id") id: Int): Response<Unit>

    @GET("extra-hours-by-month")
    suspend fun getExtraHoursByMonth(@Query("month") month: String): Response<List<ExtraHoursByMonthItem>>
}
