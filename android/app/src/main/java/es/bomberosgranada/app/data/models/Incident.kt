package es.bomberosgranada.app.data.models

data class Incident(
    val id_incidencia: Int,
    val fecha: String,
    val id_empleado: Int,
    val tipo: String,
    val estado: String,
    val descripcion: String,
    val nivel: String,
    val id_parque: Int,
    val leido: Boolean,
    val resolviendo: String? = null,
    val matricula: String? = null,
    val id_empleado2: Int? = null,
    val equipo: String? = null,
    val id_vestuario: Int? = null,
    val resulta_por: Int? = null,
    val resolucion: String? = null,
    val created_at: String,
    val updated_at: String? = null,
    // Relaciones
    val creator: User? = null,
    val employee2: User? = null,
    val vehicle: Vehicle? = null,
    val park: Park? = null,
    val resolver: User? = null,
    val clothing_item: ClothingItem? = null,
    val equipment: PersonalEquipment? = null
)

data class CreateIncidentRequest(
    val fecha: String,
    val id_empleado: Int,
    val tipo: String,
    val estado: String,
    val descripcion: String,
    val nivel: String,
    val id_parque: Int,
    val leido: Boolean = false,
    val resolviendo: String? = null,
    val matricula: String? = null,
    val id_empleado2: Int? = null,
    val equipo: String? = null,
    val id_vestuario: Int? = null
)

data class UpdateIncidentRequest(
    val fecha: String? = null,
    val id_empleado: Int? = null,
    val tipo: String? = null,
    val estado: String? = null,
    val descripcion: String? = null,
    val nivel: String? = null,
    val id_parque: Int? = null,
    val leido: Boolean? = null,
    val resolviendo: String? = null,
    val matricula: String? = null,
    val id_empleado2: Int? = null,
    val equipo: String? = null,
    val id_vestuario: Int? = null
)

data class ResolveIncidentRequest(
    val resulta_por: Int,
    val resolucion: String
)

data class CountResponseIncident(
    val pending: Int
)

data class Vehicle(
    val id: Int,
    val matricula: String,
    val tipo: String? = null
)

