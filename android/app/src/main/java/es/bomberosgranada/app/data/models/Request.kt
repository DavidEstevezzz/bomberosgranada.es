package es.bomberosgranada.app.data.models

data class RequestItem(
    val id: Int,
    val id_empleado: Int,
    val tipo: String,
    val motivo: String? = null,
    val fecha_ini: String,
    val fecha_fin: String,
    val estado: String,
    val turno: String? = null,
    val horas: Double? = null,
    val file: String? = null,
    val creacion: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class RequestShowResponse(
    val request: RequestItem,
    val file_url: String?
)

data class CreateRequestRequest(
    val id_empleado: Int,
    val tipo: String,
    val fecha_ini: String,
    val fecha_fin: String,
    val estado: String = "Pendiente",
    val motivo: String? = null,
    val turno: String? = null,
    val horas: Double? = null
)

data class UpdateRequestRequest(
    val estado: String
)

data class Employee(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val email: String,
    val brigada: String? = null
)