package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class InterventionsRepository {
    private val TAG = "InterventionsRepository"
    private val interventionsService = ApiClient.interventions

    suspend fun getInterventions(): Result<List<Intervention>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO INTERVENCIONES ===")
            val response = interventionsService.getInterventions()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} intervenciones obtenidas")
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

    suspend fun getIntervention(parte: String): Result<Intervention> {
        return try {
            Log.d(TAG, "=== OBTENIENDO INTERVENCIÓN: $parte ===")
            val response = interventionsService.getIntervention(parte)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Intervención obtenida")
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

    suspend fun getInterventionsByGuard(idGuard: Int): Result<List<Intervention>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO INTERVENCIONES DE GUARDIA $idGuard ===")
            val response = interventionsService.getInterventionsByGuard(idGuard)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} intervenciones obtenidas")
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

    suspend fun createIntervention(intervention: CreateInterventionRequest): Result<Intervention> {
        return try {
            Log.d(TAG, "=== CREANDO INTERVENCIÓN ===")
            Log.d(TAG, "Parte: ${intervention.parte}, Tipo: ${intervention.tipo}, Mando: ${intervention.mando}")
            val response = interventionsService.createIntervention(intervention)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Intervención creada")
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

    suspend fun updateIntervention(parte: String, intervention: UpdateInterventionRequest): Result<Intervention> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO INTERVENCIÓN: $parte ===")
            val response = interventionsService.updateIntervention(parte, intervention)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Intervención actualizada")
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

    suspend fun deleteIntervention(parte: String): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO INTERVENCIÓN: $parte ===")
            val response = interventionsService.deleteIntervention(parte)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Intervención eliminada")
                Result.success(Unit)
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