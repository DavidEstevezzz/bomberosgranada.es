package es.bomberosgranada.app.data.models

data class Vehicle(
    val matricula: String,
    val id_parque: Int,
    val tipo: String,
    val nombre: String,
    val año: Int,
    val created_at: String? = null,
    val updated_at: String? = null,
    // Relación
    val park: Park? = null
)

data class CreateVehicleRequest(
    val matricula: String,
    val nombre: String,
    val id_parque: Int,
    val tipo: String,
    val año: Int
)

data class UpdateVehicleRequest(
    val matricula: String,
    val nombre: String,
    val id_parque: Int,
    val tipo: String,
    val año: Int
)