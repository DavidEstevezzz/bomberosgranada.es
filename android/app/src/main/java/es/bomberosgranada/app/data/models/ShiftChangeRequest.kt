package es.bomberosgranada.app.data.models

data class ShiftChangeRequest(
    val id: Int,
    val id_empleado1: Int,
    val id_empleado2: Int,
    val id_empleado3: Int? = null,
    val brigada1: Int,
    val brigada2: Int,
    val fecha: String,
    val fecha2: String? = null,
    val turno: String,
    val motivo: String,
    val estado: String,
    val created_at: String,
    val updated_at: String? = null,
    // Relaciones
    val empleado1: User? = null,
    val empleado2: User? = null,
    val empleado3: User? = null,
    val brigada1Obj: Brigade? = null,
    val brigada2Obj: Brigade? = null
)

data class CreateShiftChangeRequest(
    val id_empleado1: Int,
    val id_empleado2: Int,
    val fecha: String,
    val fecha2: String? = null,
    val turno: String,
    val motivo: String,
    val estado: String
)

data class UpdateShiftChangeRequest(
    val estado: String
)