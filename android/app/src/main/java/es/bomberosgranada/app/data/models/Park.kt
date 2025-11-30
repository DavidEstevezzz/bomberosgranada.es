package es.bomberosgranada.app.data.models

data class Park(
    val id_parque: Int,
    val nombre: String,
    val ubicacion: String,
    val telefono: String,
    val parque: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class CreateParkRequest(
    val id_parque: String,
    val nombre: String,
    val ubicacion: String,
    val telefono: String,
    val parque: Int? = null
)

data class UpdateParkRequest(
    val nombre: String? = null,
    val ubicacion: String? = null,
    val telefono: String? = null,
    val parque: Int? = null
)