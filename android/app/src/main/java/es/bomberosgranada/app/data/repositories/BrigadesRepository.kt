package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.api.services.*
import es.bomberosgranada.app.data.models.*


class BrigadesRepository {
    private val TAG = "BrigadesRepository"
    private val brigadesService = ApiClient.brigades

    suspend fun getAllBrigades(): Result<List<Brigade>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODAS LAS BRIGADAS ===")
            val response = brigadesService.getBrigades()

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

    suspend fun getBrigade(id: Int): Result<Brigade> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BRIGADA $id ===")
            val response = brigadesService.getBrigade(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Brigada obtenida: ${response.body()!!.nombre}")
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

    suspend fun getEspecialBrigades(): Result<List<Brigade>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BRIGADAS ESPECIALES ===")
            val response = brigadesService.getEspecialBrigades()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} brigadas especiales obtenidas")
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

    suspend fun checkBrigadaEspecial(id: Int): Result<CheckEspecialResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO SI BRIGADA $id ES ESPECIAL ===")
            val response = brigadesService.checkBrigadaEspecial(id)

            if (response.isSuccessful && response.body() != null) {
                val isEspecial = response.body()!!.especial
                Log.d(TAG, "✅ Brigada es especial: $isEspecial")
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

    suspend fun getFirefightersByBrigade(
        brigadeId: Int,
        fecha: String
    ): Result<BrigadeFirefightersResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DE LA BRIGADA $brigadeId PARA FECHA $fecha ===")
            val response = brigadesService.getFirefightersByBrigade(brigadeId, fecha)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos obtenidos")
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

    suspend fun createBrigade(
        idParque: Int,
        nombre: String,
        especial: Boolean? = null
    ): Result<Brigade> {
        return try {
            Log.d(TAG, "=== CREANDO BRIGADA ===")
            val request = CreateBrigadeRequest(
                id_parque = idParque,
                nombre = nombre,
                especial = especial
            )
            val response = brigadesService.createBrigade(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Brigada creada: ${response.body()!!.nombre}")
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

    suspend fun updateBrigade(
        id: Int,
        idParque: Int,
        nombre: String,
        especial: Boolean? = null
    ): Result<Brigade> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO BRIGADA $id ===")
            val request = UpdateBrigadeRequest(
                id_parque = idParque,
                nombre = nombre,
                especial = especial
            )
            val response = brigadesService.updateBrigade(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Brigada actualizada: ${response.body()!!.nombre}")
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

    suspend fun deleteBrigade(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO BRIGADA $id ===")
            val response = brigadesService.deleteBrigade(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Brigada eliminada")
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