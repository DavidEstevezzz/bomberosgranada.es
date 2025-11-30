package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class SuggestionsRepository {
    private val TAG = "SuggestionsRepository"
    private val suggestionsService = ApiClient.suggestions

    suspend fun getAllSuggestions(): Result<List<Suggestion>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODAS LAS SUGERENCIAS ===")
            val response = suggestionsService.getSuggestions()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} sugerencias obtenidas")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun getSuggestion(id: Int): Result<Suggestion> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SUGERENCIA $id ===")
            val response = suggestionsService.getSuggestion(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Sugerencia obtenida")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun createSuggestion(
        usuarioId: Int,
        titulo: String,
        descripcion: String? = null,
        estado: String? = "pendiente"
    ): Result<Suggestion> {
        return try {
            Log.d(TAG, "=== CREANDO SUGERENCIA ===")
            Log.d(TAG, "Usuario: $usuarioId, Título: $titulo")
            val request = CreateSuggestionRequest(
                usuario_id = usuarioId,
                titulo = titulo,
                descripcion = descripcion,
                estado = estado,
                conteo_votos = 0
            )
            val response = suggestionsService.createSuggestion(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Sugerencia creada")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updateSuggestion(
        id: Int,
        usuarioId: Int,
        titulo: String,
        descripcion: String? = null,
        estado: String? = null,
        conteoVotos: Int? = null
    ): Result<Suggestion> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SUGERENCIA $id ===")
            val request = UpdateSuggestionRequest(
                usuario_id = usuarioId,
                titulo = titulo,
                descripcion = descripcion,
                estado = estado,
                conteo_votos = conteoVotos
            )
            val response = suggestionsService.updateSuggestion(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Sugerencia actualizada")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun deleteSuggestion(id: Int): Result<String> {
        return try {
            Log.d(TAG, "=== ELIMINANDO SUGERENCIA $id ===")
            val response = suggestionsService.deleteSuggestion(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Sugerencia eliminada")
                Result.success(response.body()!!.message)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun addVote(suggestionId: Int): Result<VoteSuggestionResponse> {
        return try {
            Log.d(TAG, "=== INCREMENTANDO VOTOS DE SUGERENCIA $suggestionId ===")
            val response = suggestionsService.addVote(suggestionId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Voto incrementado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun voteSuggestion(suggestionId: Int, usuarioId: Int): Result<VoteSuggestionResponse> {
        return try {
            Log.d(TAG, "=== VOTANDO SUGERENCIA $suggestionId ===")
            Log.d(TAG, "Usuario: $usuarioId")
            val request = VoteSuggestionRequest(
                suggestion_id = suggestionId,
                usuario_id = usuarioId
            )
            val response = suggestionsService.voteSuggestion(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Voto registrado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun removeVote(suggestionId: Int, usuarioId: Int): Result<String> {
        return try {
            Log.d(TAG, "=== ELIMINANDO VOTO DE SUGERENCIA $suggestionId ===")
            Log.d(TAG, "Usuario: $usuarioId")
            val request = VoteSuggestionRequest(
                suggestion_id = suggestionId,
                usuario_id = usuarioId
            )
            val response = suggestionsService.removeVote(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Voto eliminado")
                Result.success(response.body()!!.message)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }
}