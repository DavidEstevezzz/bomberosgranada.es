package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class TransfersRepository {
    private val TAG = "TransfersRepository"
    private val transfersService = ApiClient.transfers

    suspend fun getTransfersByBrigadeAndDate(
        idBrigada: Int,
        fecha: String
    ): Result<TransfersByBrigadeResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TRASLADOS POR BRIGADA Y FECHA ===")
            Log.d(TAG, "Brigada: $idBrigada, Fecha: $fecha")
            val response = transfersService.getTransfersByBrigadeAndDate(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.count} traslados obtenidos")
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

    suspend fun getTransfer(id: Int): Result<Transfer> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TRASLADO $id ===")
            val response = transfersService.getTransfer(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Traslado obtenido")
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

    suspend fun createTransfer(
        idEmpleado: Int,
        idBrigadaOrigen: Int,
        idBrigadaDestino: Int,
        fechaTraslado: String,
        turnoSeleccionado: String,
        horasTraslado: Double
    ): Result<CreateTransferResponse> {
        return try {
            Log.d(TAG, "=== CREANDO TRASLADO ===")
            Log.d(TAG, "Empleado: $idEmpleado, De: $idBrigadaOrigen → A: $idBrigadaDestino")
            Log.d(TAG, "Fecha: $fechaTraslado, Turno: $turnoSeleccionado, Horas: $horasTraslado")
            val request = CreateTransferRequest(
                id_empleado = idEmpleado,
                id_brigada_origen = idBrigadaOrigen,
                id_brigada_destino = idBrigadaDestino,
                fecha_traslado = fechaTraslado,
                turno_seleccionado = turnoSeleccionado,
                horas_traslado = horasTraslado
            )
            val response = transfersService.createTransfer(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Traslado creado con asignaciones automáticas")
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

    suspend fun updateTransfer(
        id: Int,
        turnoSeleccionado: String? = null,
        horasTraslado: Double? = null
    ): Result<UpdateTransferResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO TRASLADO $id ===")
            if (turnoSeleccionado != null) Log.d(TAG, "Nuevo turno: $turnoSeleccionado")
            if (horasTraslado != null) Log.d(TAG, "Nuevas horas: $horasTraslado")
            val request = UpdateTransferRequest(
                turno_seleccionado = turnoSeleccionado,
                horas_traslado = horasTraslado
            )
            val response = transfersService.updateTransfer(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Traslado actualizado")
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

    suspend fun deleteTransfer(id: Int): Result<DeleteTransferResponse> {
        return try {
            Log.d(TAG, "=== ELIMINANDO TRASLADO $id ===")
            val response = transfersService.deleteTransfer(id)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ Traslado eliminado")
                Log.d(TAG, "Horas revertidas: ${result.horas_revertidas}")
                Log.d(TAG, "Asignaciones eliminadas: ${result.asignaciones_eliminadas}")
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
}