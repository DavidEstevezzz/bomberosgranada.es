package com.example.bomberosgranada.data.api.services

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
        @Query("id_brigada") idBrigada: Int?,
        @Query("fecha") fecha: String?
    ): Response<List<Guard>>

    @GET("guards/by-date")
    suspend fun getGuardsByDate(@Query("fecha") fecha: String): Response<List<Guard>>

    @GET("guards/by-brigade-and-date")
    suspend fun getGuardByBrigadeAndDate(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<Guard>

    @POST("guards")
    suspend fun createGuard(@Body guard: CreateGuardRequest): Response<Guard>

    @PUT("guards/{id}")
    suspend fun updateGuard(
        @Path("id") id: Int,
        @Body guard: UpdateGuardRequest
    ): Response<Guard>

    @PUT("guards/{id}/update-schedule")
    suspend fun updateSchedule(
        @Path("id") id: Int,
        @Body schedule: UpdateScheduleRequest
    ): Response<Guard>

    @PUT("guards/{id}/daily-activities")
    suspend fun updateDailyActivities(
        @Path("id") id: Int,
        @Body activities: UpdateDailyActivitiesRequest
    ): Response<Guard>

    @PUT("guards/update-comments")
    suspend fun updateComments(@Body request: UpdateCommentsRequest): Response<Guard>

    @PUT("guards/update-personal-incidents")
    suspend fun updatePersonalIncidents(@Body request: UpdatePersonalIncidentsRequest): Response<Guard>

    @PUT("guards/update-general-incidents")
    suspend fun updateGeneralIncidents(@Body request: UpdateGeneralIncidentsRequest): Response<Guard>

    @DELETE("guards/{id}")
    suspend fun deleteGuard(@Path("id") id: Int): Response<Unit>
}

// Models
data class Guard(
    val id: Int,
    val fecha_ini: String,
    val fecha_fin: String,
    val turno: String,
    val id_brigada: Int,
    val id_parque: Int,
    val observaciones: String? = null,
    val actividades_diarias: String? = null,
    val incidencias_personales: String? = null,
    val incidencias_generales: String? = null
)

data class CreateGuardRequest(
    val fecha_ini: String,
    val fecha_fin: String,
    val turno: String,
    val id_brigada: Int,
    val id_parque: Int,
    val observaciones: String? = null
)

data class UpdateGuardRequest(
    val fecha_ini: String? = null,
    val fecha_fin: String? = null,
    val turno: String? = null,
    val observaciones: String? = null
)

data class UpdateScheduleRequest(
    val fecha_ini: String,
    val fecha_fin: String
)

data class UpdateDailyActivitiesRequest(
    val actividades_diarias: String
)

data class UpdateCommentsRequest(
    val id: Int,
    val observaciones: String
)

data class UpdatePersonalIncidentsRequest(
    val id: Int,
    val incidencias_personales: String
)

data class UpdateGeneralIncidentsRequest(
    val id: Int,
    val incidencias_generales: String
)