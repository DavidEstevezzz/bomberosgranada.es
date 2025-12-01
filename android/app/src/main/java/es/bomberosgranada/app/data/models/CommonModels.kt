package es.bomberosgranada.app.data.models

/**
 * Respuesta genérica con mensaje
 */
data class MessageResponse(
    val message: String
)

/**
 * Respuesta genérica con datos
 */
data class DataResponse<T>(
    val data: T,
    val message: String? = null
)

/**
 * Respuesta de error
 */
data class ErrorResponse(
    val message: String,
    val errors: Map<String, List<String>>? = null
)