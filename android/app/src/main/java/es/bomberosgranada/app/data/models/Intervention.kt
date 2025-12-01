package es.bomberosgranada.app.data.models

data class Intervention(
    val parte: String,
    val id_guard: Int,
    val tipo: String,
    val mando: Int,
    val direccion: String? = null,
    val fecha_hora: String? = null,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class CreateInterventionRequest(
    val id_guard: Int,
    val parte: String,
    val tipo: String,
    val mando: Int,
    val direccion: String? = null,
    val fecha_hora: String? = null,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null
)

data class UpdateInterventionRequest(
    val id_guard: Int? = null,
    val tipo: String? = null,
    val mando: Int? = null,
    val direccion: String? = null,
    val fecha_hora: String? = null,
    val descripcion: String? = null,
    val observaciones: String? = null,
    val vehiculos_utilizados: String? = null
)