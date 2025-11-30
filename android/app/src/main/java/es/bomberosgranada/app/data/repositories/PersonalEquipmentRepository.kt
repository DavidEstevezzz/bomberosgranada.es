package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class PersonalEquipmentRepository {
    private val TAG = "PersonalEquipmentRepo"
    private val equipmentService = ApiClient.personalEquipment

    suspend fun getAllEquipment(): Result<List<PersonalEquipment>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODO EL EQUIPO PERSONAL ===")
            val response = equipmentService.getPersonalEquipments()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} equipos obtenidos")
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

    suspend fun getEquipment(id: Int): Result<PersonalEquipment> {
        return try {
            Log.d(TAG, "=== OBTENIENDO EQUIPO $id ===")
            val response = equipmentService.getPersonalEquipment(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Equipo obtenido")
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

    suspend fun createEquipment(
        nombre: String,
        categoria: String,
        disponible: Boolean = true
    ): Result<PersonalEquipment> {
        return try {
            Log.d(TAG, "=== CREANDO EQUIPO PERSONAL ===")
            Log.d(TAG, "Nombre: $nombre, Categoría: $categoria")
            val request = CreatePersonalEquipmentRequest(
                nombre = nombre,
                categoria = categoria,
                disponible = disponible
            )
            val response = equipmentService.createPersonalEquipment(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Equipo creado")
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

    suspend fun updateEquipment(
        id: Int,
        nombre: String? = null,
        categoria: String? = null,
        disponible: Boolean? = null
    ): Result<PersonalEquipment> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO EQUIPO $id ===")
            val request = UpdatePersonalEquipmentRequest(
                nombre = nombre,
                categoria = categoria,
                disponible = disponible
            )
            val response = equipmentService.updatePersonalEquipment(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Equipo actualizado")
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

    suspend fun deleteEquipment(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO EQUIPO $id ===")
            val response = equipmentService.deletePersonalEquipment(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Equipo eliminado")
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

    suspend fun toggleDisponibilidad(id: Int): Result<PersonalEquipment> {
        return try {
            Log.d(TAG, "=== ALTERNANDO DISPONIBILIDAD DEL EQUIPO $id ===")
            val response = equipmentService.toggleDisponibilidad(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Disponibilidad actualizada")
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

    suspend fun getEquipmentByPark(parkId: Int): Result<List<PersonalEquipment>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO EQUIPOS DEL PARQUE $parkId ===")
            val response = equipmentService.getEquipmentsByPark(parkId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} equipos obtenidos")
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

    suspend fun checkEquipmentAvailability(equipmentNumber: String): Result<CheckAvailabilityResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO DISPONIBILIDAD DEL EQUIPO $equipmentNumber ===")
            val response = equipmentService.checkEquipmentAvailability(equipmentNumber)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Disponibilidad verificada")
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

    suspend fun checkAndAssignEquipment(
        idEmpleado: Int,
        categoria: String,
        idParque: Int
    ): Result<CheckAndAssignEquipmentResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO Y ASIGNANDO EQUIPO ===")
            Log.d(TAG, "Empleado: $idEmpleado, Categoría: $categoria, Parque: $idParque")
            val request = CheckAndAssignEquipmentRequest(
                id_empleado = idEmpleado,
                categoria = categoria,
                id_parque = idParque
            )
            val response = equipmentService.checkAndAssignEquipment(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Equipo verificado/asignado")
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

    suspend fun resetEquipmentAssignments(parkId: Int, date: String? = null): Result<ResetEquipmentAssignmentsResponse> {
        return try {
            Log.d(TAG, "=== RESETEANDO ASIGNACIONES DE EQUIPOS ===")
            Log.d(TAG, "Parque: $parkId, Fecha: ${date ?: "hoy"}")
            val request = ResetEquipmentAssignmentsRequest(
                parkId = parkId,
                date = date
            )
            val response = equipmentService.resetEquipmentAssignments(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignaciones reseteadas")
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

    suspend fun getCategories(): Result<List<String>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO CATEGORÍAS DE EQUIPOS ===")
            val response = equipmentService.getCategories()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} categorías obtenidas")
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