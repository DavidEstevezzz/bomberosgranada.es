package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.api.services.*

class ClothingItemsRepository {
    private val TAG = "ClothingItemsRepository"
    private val clothingService = ApiClient.clothingItems

    suspend fun getAllClothingItems(): Result<List<ClothingItem>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODAS LAS PRENDAS ===")
            val response = clothingService.getClothingItems()

            if (response.isSuccessful && response.body() != null) {
                val items = response.body()!!.data
                Log.d(TAG, "✅ ${items.size} prendas obtenidas")
                Result.success(items)
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

    suspend fun getClothingItem(id: Int): Result<ClothingItem> {
        return try {
            Log.d(TAG, "=== OBTENIENDO PRENDA $id ===")
            val response = clothingService.getClothingItem(id)

            if (response.isSuccessful && response.body() != null) {
                val item = response.body()!!.data
                Log.d(TAG, "✅ Prenda obtenida: ${item.name}")
                Result.success(item)
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

    suspend fun createClothingItem(name: String): Result<ClothingItem> {
        return try {
            Log.d(TAG, "=== CREANDO PRENDA ===")
            val request = CreateClothingItemRequest(name = name)
            val response = clothingService.createClothingItem(request)

            if (response.isSuccessful && response.body() != null) {
                val item = response.body()!!.data
                Log.d(TAG, "✅ Prenda creada: ${item.name}")
                Result.success(item)
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

    suspend fun updateClothingItem(id: Int, name: String): Result<ClothingItem> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO PRENDA $id ===")
            val request = UpdateClothingItemRequest(name = name)
            val response = clothingService.updateClothingItem(id, request)

            if (response.isSuccessful && response.body() != null) {
                val item = response.body()!!.data
                Log.d(TAG, "✅ Prenda actualizada: ${item.name}")
                Result.success(item)
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

    suspend fun deleteClothingItem(id: Int): Result<String> {
        return try {
            Log.d(TAG, "=== ELIMINANDO PRENDA $id ===")
            val response = clothingService.deleteClothingItem(id)

            if (response.isSuccessful && response.body() != null) {
                val message = response.body()!!.message
                Log.d(TAG, "✅ Prenda eliminada")
                Result.success(message)
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