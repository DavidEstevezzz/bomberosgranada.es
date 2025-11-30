package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface SuggestionsService {

    /**
     * GET /suggestions
     * Laravel devuelve: List<Suggestion> con userVoted (atributo calculado)
     */
    @GET("suggestions")
    suspend fun getSuggestions(): Response<List<Suggestion>>

    /**
     * GET /suggestions/{id}
     * Laravel devuelve: Suggestion
     */
    @GET("suggestions/{id}")
    suspend fun getSuggestion(@Path("id") id: Int): Response<Suggestion>

    /**
     * POST /suggestions
     * Laravel espera: { usuario_id, titulo, descripcion?, estado?, conteo_votos? }
     * Laravel devuelve: Suggestion
     */
    @POST("suggestions")
    suspend fun createSuggestion(@Body suggestion: CreateSuggestionRequest): Response<Suggestion>

    /**
     * PUT /suggestions/{id}
     * Laravel espera: { usuario_id, titulo, descripcion?, estado?, conteo_votos? }
     * NOTA: Laravel requiere usuario_id y titulo (no son opcionales en update)
     * Laravel devuelve: Suggestion
     */
    @PUT("suggestions/{id}")
    suspend fun updateSuggestion(
        @Path("id") id: Int,
        @Body suggestion: UpdateSuggestionRequest
    ): Response<Suggestion>

    /**
     * DELETE /suggestions/{id}
     * Laravel devuelve: { message }
     */
    @DELETE("suggestions/{id}")
    suspend fun deleteSuggestion(@Path("id") id: Int): Response<MessageResponse>

    /**
     * POST /suggestions/{id}/vote
     * Incrementa conteo_votos
     * Laravel devuelve: { message, conteo_votos }
     */
    @POST("suggestions/{id}/vote")
    suspend fun addVote(@Path("id") id: Int): Response<VoteSuggestionResponse>

    /**
     * POST /suggestions/vote
     * Crea un voto en la tabla suggestion_votes
     * Laravel espera: { suggestion_id, usuario_id }
     * Laravel devuelve: { message, vote }
     */
    @POST("suggestions/vote")
    suspend fun voteSuggestion(@Body request: VoteSuggestionRequest): Response<VoteSuggestionResponse>

    /**
     * DELETE /suggestions/vote
     * Elimina un voto de la tabla suggestion_votes
     * Laravel espera: { suggestion_id, usuario_id }
     * Laravel devuelve: { message }
     */
    @HTTP(method = "DELETE", path = "suggestions/vote", hasBody = true)
    suspend fun removeVote(@Body request: VoteSuggestionRequest): Response<MessageResponse>
}