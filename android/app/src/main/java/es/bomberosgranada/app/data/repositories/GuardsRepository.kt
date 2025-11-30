package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.api.services.*

class GuardsRepository {
    private val TAG = "GuardsRepository"
    private val guardsService = ApiClient.guards

    suspend fun getGuards(): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS ===")
            val response = guardsService.getGuards()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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

    suspend fun getGuard(id: Int): Result<Guard> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIA $id ===")
            val response = guardsService.getGuard(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia obtenida")
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

    suspend fun getGuardsByDate(fecha: String): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS POR FECHA: $fecha ===")
            val response = guardsService.getGuardsByDate(fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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

    suspend fun getGuardByBrigadeAndDate(idBrigada: Int, fecha: String): Result<Guard> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIA - Brigada: $idBrigada, Fecha: $fecha ===")
            val response = guardsService.getGuardByBrigadeAndDate(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia obtenida")
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

    suspend fun updateDailyActivities(id: Int, activities: String): Result<Guard> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO ACTIVIDADES DIARIAS - Guardia: $id ===")
            val request = UpdateDailyActivitiesRequest(activities)
            val response = guardsService.updateDailyActivities(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Actividades actualizadas")
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

    suspend fun updateComments(id: Int, comments: String): Result<Guard> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO COMENTARIOS - Guardia: $id ===")
            val request = UpdateCommentsRequest(id, comments)
            val response = guardsService.updateComments(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Comentarios actualizados")
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
}