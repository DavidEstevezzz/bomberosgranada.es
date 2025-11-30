package es.bomberosgranada.app.data.models

data class PersonalEquipment(
    val id: Int,
    val nombre: String,
    val categoria: String,
    val parque: Int? = null,
    val disponible: Boolean,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class CreatePersonalEquipmentRequest(
    val nombre: String,
    val categoria: String,
    val disponible: Boolean = true
)

data class UpdatePersonalEquipmentRequest(
    val nombre: String? = null,
    val categoria: String? = null,
    val disponible: Boolean? = null
)

data class CheckAvailabilityResponse(
    val available: Boolean,
    val equipment_number: String,
    val unavailable_equipment: List<String>
)

data class CheckAndAssignEquipmentRequest(
    val id_empleado: Int,
    val categoria: String,
    val id_parque: Int
)

data class CheckAndAssignEquipmentResponse(
    val success: Boolean,
    val message: String,
    val equipoAsignado: Map<String, Int>? = null,
    val equiposNoDisponibles: List<String>? = null,
    val equiposNoExistentes: List<String>? = null
)

data class ResetEquipmentAssignmentsRequest(
    val parkId: Int,
    val date: String? = null
)

data class ResetEquipmentAssignmentsResponse(
    val success: Boolean,
    val message: String,
    val park_id: Int,
    val date: String
)