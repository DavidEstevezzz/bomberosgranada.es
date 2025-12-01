package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class VehiclesRepository {
    private val TAG = "VehiclesRepository"
    private val vehiclesService = ApiClient.vehicles

    suspend fun getAllVehicles(): Result<List<Vehicle>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODOS LOS VEHÍCULOS ===")
            val response = vehiclesService.getVehicles()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} vehículos obtenidos")
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

    suspend fun getVehicle(matricula: String): Result<Vehicle> {
        return try {
            Log.d(TAG, "=== OBTENIENDO VEHÍCULO $matricula ===")
            val response = vehiclesService.getVehicle(matricula)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Vehículo obtenido")
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

    suspend fun createVehicle(
        matricula: String,
        nombre: String,
        idParque: Int,
        tipo: String,
        año: Int
    ): Result<Vehicle> {
        return try {
            Log.d(TAG, "=== CREANDO VEHÍCULO ===")
            Log.d(TAG, "Matrícula: $matricula, Nombre: $nombre, Parque: $idParque")
            val request = CreateVehicleRequest(
                matricula = matricula,
                nombre = nombre,
                id_parque = idParque,
                tipo = tipo,
                año = año
            )
            val response = vehiclesService.createVehicle(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Vehículo creado")
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

    suspend fun updateVehicle(
        matricula: String,
        nombre: String,
        idParque: Int,
        tipo: String,
        año: Int
    ): Result<Vehicle> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO VEHÍCULO $matricula ===")
            val request = UpdateVehicleRequest(
                matricula = matricula,
                nombre = nombre,
                id_parque = idParque,
                tipo = tipo,
                año = año
            )
            val response = vehiclesService.updateVehicle(matricula, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Vehículo actualizado")
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

    suspend fun deleteVehicle(matricula: String): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO VEHÍCULO $matricula ===")
            val response = vehiclesService.deleteVehicle(matricula)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Vehículo eliminado")
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