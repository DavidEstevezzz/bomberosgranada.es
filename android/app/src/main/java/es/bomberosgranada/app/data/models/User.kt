package es.bomberosgranada.app.data.models

/**
 * Modelo User - Coincide con Laravel User model
 * Tabla: users
 * Primary Key: id_empleado
 */
data class User(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val email: String,
    val email2: String? = null,
    val dni: String,
    val telefono: String,
    val type: String,  // bombero, mando, jefe, empleado
    val puesto: String? = null,
    val AP: Int? = null,  // Asuntos Propios
    val SP: Int? = null,  // Salidas Personales
    val vacaciones: Int? = null,
    val modulo: Int? = null,
    val compensacion_grupos: Int? = null,
    val horas_sindicales: Int? = null,
    val traslados: Int? = null,
    val basura: String? = null,
    val fecha_basura: String? = null,
    val practicas: Int? = null,
    val mando_especial: Boolean? = null,
    val id_parque: Int? = null,

    // Campos para listas de requerimientos
    val horas_ofrecidas: Double? = null,
    val horas_aceptadas: Double? = null,
    val fecha_req: String? = null,  // Timestamp de última actualización en lista de requerimientos

    val created_at: String? = null,
    val updated_at: String? = null,
    val email_verified_at: String? = null,

    // Relaciones (cuando Laravel las incluye con ->with())
    val roles: List<Role>? = null,
    val role_name: String? = null  // Laravel appends esto
) {
    /**
     * Nombre completo del usuario
     */
    val nombreCompleto: String
        get() = "$nombre $apellido"

    /**
     * Iniciales del usuario (para avatares)
     */
    val iniciales: String
        get() = "${nombre.firstOrNull()?.uppercase() ?: ""}${apellido.firstOrNull()?.uppercase() ?: ""}"
}

/**
 * Modelo Role - Para Spatie Permissions
 */
data class Role(
    val id: Int,
    val name: String,  // jefe, mando, bombero, empleado
    val guard_name: String? = null
)

// ===============================
// USER REQUEST MODELS
// ===============================

data class CreateUserRequest(
    val nombre: String,
    val apellido: String,
    val dni: String,
    val type: String,  // bombero, mando, jefe, empleado
    val email: String,
    val email2: String? = null,
    val telefono: String,
    val puesto: String? = null,
    val AP: Int? = null,
    val vacaciones: Int,
    val modulo: Int,
    val SP: Int? = null,
    val compensacion_grupos: Int? = null,
    val horas_sindicales: Int? = null
)

data class UpdateUserRequest(
    val nombre: String? = null,
    val apellido: String? = null,
    val email: String? = null,
    val email2: String? = null,
    val telefono: String? = null,
    val dni: String? = null,
    val puesto: String? = null,
    val type: String? = null,
    val AP: Int? = null,
    val vacaciones: Int? = null,
    val modulo: Int? = null,
    val SP: Int? = null,
    val compensacion_grupos: Int? = null,
    val horas_sindicales: Int? = null,
    val practicas: Int? = null,
    val current_password: String? = null,  // Para cambio de contraseña
    val password: String? = null,
    val password_confirmation: String? = null
)

data class UpdateUserAPRequest(
    val AP: Int
)

data class UpdateUserSPRequest(
    val SP: Int
)

data class UpdateUserTrasladoRequest(
    val traslado: Int
)

data class MandoEspecialResponse(
    val mando_especial: Boolean
)