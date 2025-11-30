package es.bomberosgranada.app.data.models

data class BrigadeCompositionResponse(
    val brigade: Brigade,
    val firefighters: List<FirefighterComposition>,
    val guard_days: List<String>,
    val message: String? = null
)

data class FirefighterComposition(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val puesto: String?,
    val guard_status: Map<String, GuardStatus>? = null
)

data class GuardStatus(
    val available: Boolean,
    val reason: String?
)

data class CopyCompositionRequest(
    val year: Int,
    val month: Int
)

data class CopyCompositionResponse(
    val message: String,
    val copied: Int,
    val to: String
)

data class TransferFirefighterRequest(
    val user_id: Int,
    val from_brigade_id: Int,
    val from_id_parque: Int,
    val to_brigade_id: Int,
    val to_id_parque: Int,
    val year: Int,
    val month: Int
)

data class TransferFirefighterResponse(
    val message: String,
    val composition: BrigadeCompositionDetail
)

data class BrigadeCompositionDetail(
    val id: Int,
    val user_id: Int,
    val brigade_id: Int,
    val id_parque: Int,
    val year: Int,
    val month: Int,
    val created_at: String?,
    val updated_at: String?,
    val user: User? = null,
    val brigade: Brigade? = null,
    val parque: Park? = null
)