package es.bomberosgranada.app.data.models

data class Suggestion(
    val id: Int,
    val usuario_id: Int,
    val titulo: String,
    val descripcion: String? = null,
    val estado: String? = null,
    val conteo_votos: Int,
    val fecha_creacion: String,
    val fecha_actualizacion: String? = null,
    val userVoted: Boolean? = null,
    // Relación
    val user: User? = null
)

data class CreateSuggestionRequest(
    val usuario_id: Int,
    val titulo: String,
    val descripcion: String? = null,
    val estado: String? = "pendiente",
    val conteo_votos: Int? = 0
)

data class UpdateSuggestionRequest(
    val usuario_id: Int,
    val titulo: String,
    val descripcion: String? = null,
    val estado: String? = null,
    val conteo_votos: Int? = null
)

data class VoteSuggestionRequest(
    val suggestion_id: Int,
    val usuario_id: Int
)

data class VoteSuggestionResponse(
    val message: String,
    val conteo_votos: Int? = null,
    val vote: SuggestionVote? = null
)

data class SuggestionVote(
    val id: Int,
    val suggestion_id: Int,
    val usuario_id: Int,
    val created_at: String,
    val updated_at: String? = null
)