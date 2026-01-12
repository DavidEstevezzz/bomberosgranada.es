package es.bomberosgranada.app.data.models

import com.google.gson.annotations.JsonAdapter
import es.bomberosgranada.app.data.serialization.BooleanAsIntAdapter

data class Brigade(
    val id_brigada: Int,
    val id_parque: Int,
    val nombre: String,
    @JsonAdapter(BooleanAsIntAdapter::class)
    val especial: Boolean? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val park: Park? = null
)

data class CheckEspecialResponse(
    @JsonAdapter(BooleanAsIntAdapter::class)
    val especial: Boolean
)

data class BrigadeFirefightersResponse(
    val brigade: Brigade,
    val firefighters: List<BrigadeFirefighter>
)

/**
 * Modelo de bombero asignado a una brigada
 * Incluye información de requerimiento y cambio de guardia.
 */
data class BrigadeFirefighter(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val puesto: String?,
    val orden: Int?,
    val type: String? = null,
    val turno: String? = null,
    val tipo_asignacion: String? = null,
    // Campos para indicadores de R y CG
    val id_change_request: Int? = null,      // ID del cambio de guardia (si existe)
    @JsonAdapter(BooleanAsIntAdapter::class)
    val requerimiento: Boolean? = null,       // True si viene por requerimiento
    val cambio_con: String? = null            // Nombre completo del otro bombero en CG
)

data class CreateBrigadeRequest(
    val id_parque: Int,
    val nombre: String,
    @JsonAdapter(BooleanAsIntAdapter::class)
    val especial: Boolean? = null
)

data class UpdateBrigadeRequest(
    val id_parque: Int,
    val nombre: String,
    @JsonAdapter(BooleanAsIntAdapter::class)
    val especial: Boolean? = null
)