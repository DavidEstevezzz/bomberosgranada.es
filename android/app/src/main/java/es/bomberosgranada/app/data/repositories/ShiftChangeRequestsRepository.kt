package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

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

    suspend fun createShiftChangeRequest(
        idEmpleado1: Int,
        idEmpleado2: Int,
        fecha: String,
        fecha2: String? = null,
        turno: String,
        motivo: String,
        estado: String = "aceptado_por_empleados"
    ): Result<ShiftChangeRequest> {
        return try {
            Log.d(TAG, "=== CREANDO SOLICITUD DE CAMBIO DE GUARDIA ===")
            Log.d(TAG, "Empleados: $idEmpleado1 <-> $idEmpleado2, Fecha: $fecha, Turno: $turno")
            val request = CreateShiftChangeRequest(
                id_empleado1 = idEmpleado1,
                id_empleado2 = idEmpleado2,
                fecha = fecha,
                fecha2 = fecha2,
                turno = turno,
                motivo = motivo,
                estado = estado
            )
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

    suspend fun updateShiftChangeRequest(id: Int, estado: String): Result<ShiftChangeRequest> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SOLICITUD DE CAMBIO $id ===")
            Log.d(TAG, "Nuevo estado: $estado")
            val request = UpdateShiftChangeRequest(estado = estado)
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