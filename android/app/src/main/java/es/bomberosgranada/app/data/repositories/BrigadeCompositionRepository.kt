package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class BrigadeCompositionRepository {
    private val TAG = "BrigadeCompositionRepo"
    private val brigadeCompositionService = ApiClient.brigadeComposition

    suspend fun getBrigades(): Result<List<Brigade>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BRIGADAS ===")
            val response = brigadeCompositionService.getBrigades()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} brigadas obtenidas")
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

    suspend fun getBrigadeComposition(
        brigadeId: Int,
        idParque: Int,
        year: Int,
        month: Int
    ): Result<BrigadeCompositionResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO COMPOSICIÓN DE BRIGADA $brigadeId ===")
            Log.d(TAG, "Parque: $idParque, Año: $year, Mes: $month")
            val response = brigadeCompositionService.getBrigadeComposition(
                brigadeId, idParque, year, month
            )

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Composición obtenida: ${response.body()!!.firefighters.size} bomberos")
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

    suspend fun copyToNextMonth(year: Int, month: Int): Result<CopyCompositionResponse> {
        return try {
            Log.d(TAG, "=== COPIANDO COMPOSICIONES AL MES SIGUIENTE ===")
            Log.d(TAG, "Desde: $year-$month")
            val request = CopyCompositionRequest(year, month)
            val response = brigadeCompositionService.copyToNextMonth(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ ${result.copied} composiciones copiadas a ${result.to}")
                Result.success(result)
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

    suspend fun transferFirefighter(request: TransferFirefighterRequest): Result<TransferFirefighterResponse> {
        return try {
            Log.d(TAG, "=== TRASLADANDO BOMBERO ===")
            Log.d(TAG, "Usuario: ${request.user_id}, De: ${request.from_brigade_id} → A: ${request.to_brigade_id}")
            val response = brigadeCompositionService.transferFirefighter(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Bombero trasladado exitosamente")
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