package es.bomberosgranada.app.data.models

import com.google.gson.annotations.JsonAdapter
import es.bomberosgranada.app.data.serialization.BooleanAsIntAdapter

data class FirefighterAssignment(
    val id_asignacion: Int,
    val id_empleado: Int,
    val fecha_ini: String,
    val fecha_fin: String? = null,
    val id_brigada_origen: Int?,
    val id_brigada_destino: Int,
    val turno: String,
    val tipo_asignacion: String?,
    @JsonAdapter(BooleanAsIntAdapter::class)
    val requerimiento: Boolean? = null,
    val horas_traslado: Double? = null,
    val created_at: String?,
    val updated_at: String?,
    val firefighter: FirefighterBasic? = null,
    val brigadeOrigin: BrigadeBasic? = null,
    val brigadeDestination: BrigadeBasic? = null
)

data class FirefighterBasic(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String
)

data class CreateAssignmentRequest(
    val id_empleado: Int,
    val fecha_ini: String,
    val id_brigada_origen: Int?,
    val id_brigada_destino: Int,
    val turno: String,
    val tipo_asignacion: String? = null,
    val requerimiento: Boolean = false,
    val horas_traslado: Double? = null
)

data class UpdateAssignmentRequest(
    val id_empleado: Int,
    val fecha_ini: String,
    val id_brigada_origen: Int? = null,
    val id_brigada_destino: Int,
    val turno: String,
    @JsonAdapter(BooleanAsIntAdapter::class)
    val requerimiento: Boolean? = null,
    val tipo_asignacion: String
)

data class AvailableFirefightersResponse(
    val date: String,
    val available_firefighters: List<User>
)

data class WorkingFirefightersResponse(
    val date: String,
    val available_firefighters: List<User>
)

data class CheckEspecialBrigadeResponse(
    val id_brigada: Int,
    val fecha: String,
    val has_assignments: Boolean
)

data class RequireFirefighterRequest(
    val id_empleado: Int,
    val id_brigada_destino: Int,
    val fecha: String,
    val turno: String
)

data class RequireFirefighterResponse(
    val asignacion_ida: FirefighterAssignment,
    val asignacion_vuelta: FirefighterAssignment? = null,
    val message: String
)

data class IncrementColumnRequest(
    val column: String,
    val increment: Int,
    val orderColumn2: String? = null
)

data class IncrementColumnResponse(
    val message: String,
    val user: User
)

data class ExtendWorkingDayRequest(
    val id_empleado: Int,
    val fecha_actual: String,
    val nueva_fecha: String,
    val nuevo_turno: String,
    val direccion: String
)

data class ExtendWorkingDayResponse(
    val message: String,
    val asignacion: FirefighterAssignment? = null
)

data class CreatePracticesRequest(
    val id_empleado: Int,
    val id_brigada_destino: Int,
    val fecha: String
)

data class CreatePracticesResponse(
    val asignacion_ida: FirefighterAssignment,
    val asignacion_vuelta: FirefighterAssignment,
    val message: String
)

data class CreateRTRequest(
    val id_empleado: Int,
    val id_brigada_destino: Int,
    val fecha: String
)

data class CreateRTResponse(
    val asignacion_ida: FirefighterAssignment,
    val asignacion_vuelta: FirefighterAssignment,
    val message: String
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

data class DeleteAssignmentsResponse(
    val message: String,
    val deleted_count: Int,
    val deleted_ids: List<Int>
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

data class UndoTransferResponse(
    val message: String,
    val deleted_count: Int,
    val deleted_ids: List<Int>,
    val horas_revertidas: Double
)

data class MoveResponse(
    val message: String,
    val orden: Int
)