package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.ApiClient
import com.example.bomberosgranada.data.api.services.CreateShiftChangeRequest
import com.example.bomberosgranada.data.api.services.ShiftChangeRequest
import com.example.bomberosgranada.data.api.services.UpdateShiftChangeRequest

class ShiftChangeRequestsRepository {
    private val TAG = "ShiftChangeRequestsRepo"
    private val shiftChangeService = ApiClient.shiftChangeRequests

    suspend fun getShiftChangeRequests(): Result<List<ShiftChangeRequest>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SOLICITUDES DE CAMBIO DE GUARDIA ===")
            val response = shiftChangeService.getShiftChangeRequests()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} solicitudes obtenidas")
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

    suspend fun getShiftChangeRequest(id: Int): Result<ShiftChangeRequest> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SOLICITUD DE CAMBIO $id ===")
            val response = shiftChangeService.getShiftChangeRequest(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Solicitud obtenida")
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

    suspend fun createShiftChangeRequest(request: CreateShiftChangeRequest): Result<ShiftChangeRequest> {
        return try {
            Log.d(TAG, "=== CREANDO SOLICITUD DE CAMBIO DE GUARDIA ===")
            Log.d(TAG, "Fecha: ${request.fecha}, Turno: ${request.turno}")
            val response = shiftChangeService.createShiftChangeRequest(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Solicitud creada")
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

    suspend fun updateShiftChangeRequest(id: Int, request: UpdateShiftChangeRequest): Result<ShiftChangeRequest> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SOLICITUD DE CAMBIO $id ===")
            val response = shiftChangeService.updateShiftChangeRequest(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Solicitud actualizada")
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

    suspend fun deleteShiftChangeRequest(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO SOLICITUD DE CAMBIO $id ===")
            val response = shiftChangeService.deleteShiftChangeRequest(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Solicitud eliminada")
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