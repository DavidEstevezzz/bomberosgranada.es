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

data class BrigadeFirefighter(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val puesto: String?,
    val orden: Int?,
    val id_change_request: Int? = null,
    val type: String? = null,
    val turno: String? = null,
    val tipo_asignacion: String? = null
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