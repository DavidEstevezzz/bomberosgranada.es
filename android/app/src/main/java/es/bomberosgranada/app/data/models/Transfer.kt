package es.bomberosgranada.app.data.models

data class Transfer(
    val id_transfer: Int,
    val id_empleado: Int,
    val id_brigada_origen: Int,
    val id_brigada_destino: Int,
    val fecha_traslado: String,
    val turno_seleccionado: String,
    val horas_traslado: Double,
    val created_at: String,
    val updated_at: String? = null,
    // Relaciones
    val firefighter: User? = null,
    val brigadeOrigin: Brigade? = null,
    val brigadeDestination: Brigade? = null,
    val assignments: List<FirefighterAssignment>? = null
)

data class TransfersByBrigadeResponse(
    val transfers: List<Transfer>,
    val count: Int
)

data class CreateTransferRequest(
    val id_empleado: Int,
    val id_brigada_origen: Int,
    val id_brigada_destino: Int,
    val fecha_traslado: String,
    val turno_seleccionado: String,
    val horas_traslado: Double
)

data class CreateTransferResponse(
    val message: String,
    val transfer: Transfer,
    val asignacion_ida: FirefighterAssignment,
    val asignacion_vuelta: FirefighterAssignment
)

data class UpdateTransferRequest(
    val turno_seleccionado: String? = null,
    val horas_traslado: Double? = null
)

data class UpdateTransferResponse(
    val message: String,
    val transfer: Transfer
)

data class DeleteTransferResponse(
    val message: String,
    val horas_revertidas: Double,
    val asignaciones_eliminadas: Int
)