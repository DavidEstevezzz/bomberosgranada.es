package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class ParksRepository {
    private val TAG = "ParksRepository"
    private val parksService = ApiClient.parks

    suspend fun getAllParks(): Result<List<Park>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODOS LOS PARQUES ===")
            val response = parksService.getParks()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} parques obtenidos")
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

    suspend fun getPark(id: Int): Result<Park> {
        return try {
            Log.d(TAG, "=== OBTENIENDO PARQUE $id ===")
            val response = parksService.getPark(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Parque obtenido")
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

    suspend fun createPark(
        idParque: String,
        nombre: String,
        ubicacion: String,
        telefono: String,
        parque: Int? = null
    ): Result<Park> {
        return try {
            Log.d(TAG, "=== CREANDO PARQUE ===")
            Log.d(TAG, "ID: $idParque, Nombre: $nombre")
            val request = CreateParkRequest(
                id_parque = idParque,
                nombre = nombre,
                ubicacion = ubicacion,
                telefono = telefono,
                parque = parque
            )
            val response = parksService.createPark(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Parque creado")
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

    suspend fun updatePark(
        id: Int,
        nombre: String? = null,
        ubicacion: String? = null,
        telefono: String? = null,
        parque: Int? = null
    ): Result<Park> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO PARQUE $id ===")
            val request = UpdateParkRequest(
                nombre = nombre,
                ubicacion = ubicacion,
                telefono = telefono,
                parque = parque
            )
            val response = parksService.updatePark(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Parque actualizado")
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

    suspend fun deletePark(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO PARQUE $id ===")
            val response = parksService.deletePark(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Parque eliminado")
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