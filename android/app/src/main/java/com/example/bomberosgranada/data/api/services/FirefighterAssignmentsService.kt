package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface FirefighterAssignmentsService {

    @GET("firefighters-assignments")
    suspend fun getAssignments(): Response<List<FirefighterAssignment>>

    @GET("firefighters-assignments/{id}")
    suspend fun getAssignment(@Path("id") id: Int): Response<FirefighterAssignment>

    @POST("firefighters-assignments")
    suspend fun createAssignment(@Body assignment: CreateAssignmentRequest): Response<FirefighterAssignment>

    @PUT("firefighters-assignments/{id}")
    suspend fun updateAssignment(
        @Path("id") id: Int,
        @Body assignment: UpdateAssignmentRequest
    ): Response<FirefighterAssignment>

    @DELETE("firefighters-assignments/{id}")
    suspend fun deleteAssignment(@Path("id") id: Int): Response<Unit>

    // Disponibilidad de bomberos
    @GET("firefighters-assignments/available-firefighters")
    suspend fun getAvailableFirefighters(@Query("date") date: String): Response<List<AvailableFirefighter>>

    @GET("firefighters-assignments/available-firefighters-without-mands")
    suspend fun getAvailableFirefightersWithoutMands(@Query("date") date: String): Response<List<AvailableFirefighter>>

    @GET("firefighters-assignments/available-firefighters-no-adjacent-days")
    suspend fun getAvailableFirefightersNoAdjacentDays(@Query("date") date: String): Response<List<AvailableFirefighter>>

    @GET("firefighters-assignments/no-today-and-tomorrow")
    suspend fun getAvailableFirefightersNoTodayAndTomorrow(@Query("date") date: String): Response<List<AvailableFirefighter>>

    @GET("firefighters-assignments/no-today-and-yesterday")
    suspend fun getAvailableFirefightersNoTodayAndYesterday(@Query("date") date: String): Response<List<AvailableFirefighter>>

    @GET("firefighters-assignments/working-firefighters")
    suspend fun getWorkingFirefighters(@Query("date") date: String): Response<List<WorkingFirefighter>>

    // Verificaciones
    @GET("firefighters-assignments/check-especial-user")
    suspend fun checkEspecialUser(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String,
        @Query("id_usuario") idUsuario: Int
    ): Response<EspecialCheckResponse>

    @GET("firefighters-assignments/check-especial-brigade")
    suspend fun checkEspecialBrigade(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<EspecialCheckResponse>

    // Operaciones especiales
    @POST("firefighters-assignments/{id}/move-to-top/{column}")
    suspend fun moveToTop(
        @Path("id") id: Int,
        @Path("column") column: String
    ): Response<Unit>

    @POST("firefighters-assignments/{id}/move-to-bottom/{column}")
    suspend fun moveToBottom(
        @Path("id") id: Int,
        @Path("column") column: String
    ): Response<Unit>

    @POST("firefighters-assignments/require-firefighter")
    suspend fun requireFirefighter(@Body request: RequireFirefighterRequest): Response<FirefighterAssignment>

    @PUT("firefighters-assignments/{id}/increment-user-column")
    suspend fun incrementUserColumn(
        @Path("id") id: Int,
        @Body payload: IncrementColumnRequest
    ): Response<Unit>

    @POST("firefighters-assignments/extend-working-day")
    suspend fun extendWorkingDay(@Body request: ExtendWorkingDayRequest): Response<FirefighterAssignment>

    // Prácticas y Retén
    @POST("firefighters-assignments/create-practices")
    suspend fun createPracticesAssignments(@Body request: CreatePracticesRequest): Response<Unit>

    @POST("firefighters-assignments/create-rt")
    suspend fun createRTAssignments(@Body request: CreateRTRequest): Response<Unit>

    @POST("firefighters-assignments/delete-practices")
    suspend fun deletePracticesAssignments(@Body request: DeletePracticesRequest): Response<Unit>

    @POST("firefighters-assignments/delete-rt")
    suspend fun deleteRTAssignments(@Body request: DeleteRTRequest): Response<Unit>

    // Traslados (legacy - mantener por compatibilidad)
    @GET("firefighters-assignments/active-transfers")
    suspend fun getActiveTransfers(
        @Query("id_brigada") idBrigada: Int,
        @Query("fecha") fecha: String
    ): Response<List<ActiveTransfer>>

    @POST("firefighters-assignments/undo-transfer")
    suspend fun undoTransfer(@Body request: UndoTransferRequest): Response<Unit>
}

// Models
data class FirefighterAssignment(
    val id_asignacion: Int,
    val id_empleado: Int,
    val empleado_nombre: String,
    val empleado_apellido: String,
    val fecha_ini: String,
    val fecha_fin: String? = null,
    val id_brigada_origen: Int,
    val brigada_origen_nombre: String,
    val id_brigada_destino: Int,
    val brigada_destino_nombre: String,
    val turno: String,
    val tipo_asignacion: String,
    val puesto: String? = null,
    val requerimiento: Boolean,
    val created_at: String
)

data class CreateAssignmentRequest(
    val id_empleado: Int,
    val fecha_ini: String,
    val id_brigada_origen: Int,
    val id_brigada_destino: Int,
    val turno: String,
    val tipo_asignacion: String,
    val puesto: String? = null,
    val requerimiento: Boolean = false
)

data class UpdateAssignmentRequest(
    val fecha_fin: String? = null,
    val id_brigada_destino: Int? = null,
    val turno: String? = null,
    val tipo_asignacion: String? = null,
    val puesto: String? = null
)

data class AvailableFirefighter(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val brigada_origen: String,
    val disponible: Boolean,
    val motivo_no_disponible: String? = null
)

data class WorkingFirefighter(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val brigada: String,
    val turno: String,
    val puesto: String
)

data class EspecialCheckResponse(
    val exists: Boolean,
    val assignment: FirefighterAssignment? = null
)

data class RequireFirefighterRequest(
    val id_empleado: Int,
    val id_brigada_destino: Int,
    val fecha: String,
    val turno: String,
    val requerimiento: Boolean = true
)

data class IncrementColumnRequest(
    val column: String,
    val value: Int
)

data class ExtendWorkingDayRequest(
    val id_empleado: Int,
    val fecha: String,
    val turno: String,
    val id_brigada: Int
)

data class CreatePracticesRequest(
    val id_empleado: Int,
    val fecha: String,
    val id_brigada: Int
)

data class CreateRTRequest(
    val id_empleado: Int,
    val fecha: String,
    val id_brigada: Int
)

data class DeletePracticesRequest(
    val id_brigada: Int,
    val fecha: String,
    val id_usuario: Int
)

data class DeleteRTRequest(
    val id_brigada: Int,
    val fecha: String,
    val id_usuario: Int
)

data class ActiveTransfer(
    val id_asignacion: Int,
    val id_empleado: Int,
    val nombre_completo: String,
    val fecha_ini: String,
    val brigada_origen: String,
    val brigada_destino: String
)

data class UndoTransferRequest(
    val id_asignacion_ida: Int
)