package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody
import java.io.File

class RequestsRepository {
    private val TAG = "RequestsRepository"
    private val requestsService = ApiClient.requests

    suspend fun getRequests(): Result<List<RequestItem>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SOLICITUDES ===")
            val response = requestsService.getRequests()

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

    suspend fun getRequest(id: Int): Result<RequestShowResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SOLICITUD $id ===")
            val response = requestsService.getRequest(id)

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

    suspend fun createRequest(
        idEmpleado: Int,
        tipo: String,
        fechaInicio: String,
        fechaFin: String,
        estado: String = "Pendiente",
        motivo: String? = null,
        turno: String? = null,
        horas: Double? = null,
        file: File? = null
    ): Result<RequestItem> {
        return try {
            Log.d(TAG, "=== CREANDO SOLICITUD ===")
            Log.d(TAG, "Tipo: $tipo, Empleado: $idEmpleado")

            val idEmpleadoBody = idEmpleado.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val tipoBody = tipo.toRequestBody("text/plain".toMediaTypeOrNull())
            val fechaInicioBody = fechaInicio.toRequestBody("text/plain".toMediaTypeOrNull())
            val fechaFinBody = fechaFin.toRequestBody("text/plain".toMediaTypeOrNull())
            val estadoBody = estado.toRequestBody("text/plain".toMediaTypeOrNull())
            val motivoBody = motivo?.toRequestBody("text/plain".toMediaTypeOrNull())
            val turnoBody = turno?.toRequestBody("text/plain".toMediaTypeOrNull())
            val horasBody = horas?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

            val filePart = file?.let {
                val requestFile = it.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("file", it.name, requestFile)
            }

            val response = requestsService.createRequest(
                idEmpleadoBody,
                tipoBody,
                fechaInicioBody,
                fechaFinBody,
                estadoBody,
                motivoBody,
                turnoBody,
                horasBody,
                filePart
            )

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

    suspend fun updateRequest(id: Int, estado: String): Result<RequestItem> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SOLICITUD $id ===")
            Log.d(TAG, "Nuevo estado: $estado")
            val request = UpdateRequestRequest(estado = estado)
            val response = requestsService.updateRequest(id, request)

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

    suspend fun deleteRequest(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO SOLICITUD $id ===")
            val response = requestsService.deleteRequest(id)

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

    suspend fun downloadFile(id: Int): Result<ResponseBody> {
        return try {
            Log.d(TAG, "=== DESCARGANDO ARCHIVO DE SOLICITUD $id ===")
            val response = requestsService.downloadFile(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Archivo descargado")
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

    suspend fun getEmployees(): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO EMPLEADOS ===")
            val response = requestsService.getEmployees()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} empleados obtenidos")
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