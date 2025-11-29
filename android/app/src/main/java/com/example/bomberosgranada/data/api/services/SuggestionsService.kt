package com.example.bomberosgranada.data.api.services

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface SuggestionsService {

    @GET("suggestions")
    suspend fun getSuggestions(): Response<List<Suggestion>>

    @GET("suggestions/{id}")
    suspend fun getSuggestion(@Path("id") id: Int): Response<Suggestion>

    @Multipart
    @POST("suggestions")
    suspend fun createSuggestion(
        @Part("titulo") titulo: RequestBody,
        @Part("descripcion") descripcion: RequestBody,
        @Part file: MultipartBody.Part? = null
    ): Response<Suggestion>

    @PUT("suggestions/{id}")
    suspend fun updateSuggestion(
        @Path("id") id: Int,
        @Body suggestion: UpdateSuggestionRequest
    ): Response<Suggestion>

    @DELETE("suggestions/{id}")
    suspend fun deleteSuggestion(@Path("id") id: Int): Response<Unit>

    @POST("suggestions/{id}/vote")
    suspend fun addVote(@Path("id") id: Int): Response<Unit>

    @DELETE("suggestions/vote")
    suspend fun removeVote(@Query("id_sugerencia") idSugerencia: Int): Response<Unit>
}

// Models
data class Suggestion(
    val id: Int,
    val titulo: String,
    val descripcion: String,
    val id_empleado: Int,
    val empleado_nombre: String,
    val votos_favor: Int,
    val votos_contra: Int,
    val user_voted: String? = null, // "favor", "contra", null
    val created_at: String
)

data class UpdateSuggestionRequest(
    val titulo: String? = null,
    val descripcion: String? = null
)