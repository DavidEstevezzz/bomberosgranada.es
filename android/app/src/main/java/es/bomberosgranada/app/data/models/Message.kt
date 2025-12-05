package es.bomberosgranada.app.data.models

data class Message(
    val id: Int,
    val subject: String,
    val body: String,
    val sender_id: Int,
    val receiver_id: Int?,
    val read: Boolean? = null,
    val created_at: String,
    val updated_at: String? = null,
    val deleted_at: String? = null,
    val attachment: String? = null,
    val attachment_filename: String? = null,
    val parent_id: Int? = null,
    val massive: String? = null,
    // Campos calculados para mensajes masivos
    val is_read: Int? = null,
    val read_count: Int? = null,
    val total_recipients: Int? = null,
    val read_percentage: Double? = null,
    // Relaciones
    val sender: User? = null,
    val receiver: User? = null,
    val parent: Message? = null,
    val replies: List<Message>? = null

) {
    val isReadBoolean: Boolean
    get() = is_read == 1
}

data class MessageThread(
    val message: Message
)

data class UserInfo(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val email: String
)

data class MarkAsReadResponse(
    val message: String,
    val is_read: Int
) {
    val isReadBoolean: Boolean
        get() = is_read == 1
}

data class MarkMassiveAsReadResponse(
    val message: String,
    val affected_users_count: Int,
    val total_users: Int
)