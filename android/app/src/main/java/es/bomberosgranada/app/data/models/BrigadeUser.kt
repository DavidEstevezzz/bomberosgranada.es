package es.bomberosgranada.app.data.models

data class BrigadeUser(
    val id: Int,
    val id_usuario: Int,
    val id_brigada: Int,
    val practicas: Int?,
    val created_at: String?,
    val updated_at: String?,
    val brigade: Brigade? = null,
    val user: User? = null
)

data class BrigadeUsersByBrigadeResponse(
    val brigade: String,
    val users: List<User>,
    val brigadeUsers: List<BrigadeUser>
)

data class UserPracticasResponse(
    val empleado: EmployeeInfo,
    val brigadas: List<BrigadePracticas>,
    val total_practicas: Int
)

data class EmployeeInfo(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String
)

data class BrigadePracticas(
    val id_brigada: Int,
    val practicas: Int?,
    val brigade: Brigade?
)

data class CreateBrigadeUserRequest(
    val id_brigada: Int,
    val id_usuario: Int,
    val practicas: Int = 0
)

data class UpdateBrigadeUserRequest(
    val id_brigada: Int? = null,
    val id_usuario: Int? = null,
    val practicas: Int? = null
)

data class UpdateBrigadeUserResponse(
    val message: String,
    val brigadeUser: BrigadeUser
)

data class UpdatePracticasRequest(
    val id_brigada: Int,
    val id_usuario: Int,
    val practicas: Int
)

data class IncrementPracticasRequest(
    val id_brigada: Int,
    val id_usuario: Int,
    val increment: Int
)

data class PracticasUpdateResponse(
    val message: String,
    val practicas: Int
)