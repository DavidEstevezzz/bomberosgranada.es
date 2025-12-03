package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

/**
 * Repositorio para gestionar las asignaciones de guardia (B1, B2, C1, etc.)
 */
class GuardAssignmentsRepository {
    private val TAG = "GuardAssignmentsRepo"
    private val service = ApiClient.guardAssignments

    /**
     * Obtiene todas las asignaciones de guardia
     */
    suspend fun getAllAssignments(): Result<List<GuardAssignment>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODAS LAS ASIGNACIONES ===")
            val response = service.getGuardAssignments()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} asignaciones obtenidas")
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

    /**
     * Obtiene las asignaciones de una guardia específica
     */
    suspend fun getAssignmentsByGuard(guardId: Int): Result<List<GuardAssignment>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO ASIGNACIONES PARA GUARDIA $guardId ===")
            val allResult = getAllAssignments()

            if (allResult.isSuccess) {
                val filtered = allResult.getOrThrow().filter { it.id_guard == guardId }
                Log.d(TAG, "✅ ${filtered.size} asignaciones para guardia $guardId")
                Result.success(filtered)
            } else {
                allResult
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Obtiene una asignación específica
     */
    suspend fun getAssignment(id: Int): Result<GuardAssignment> {
        return try {
            Log.d(TAG, "=== OBTENIENDO ASIGNACIÓN $id ===")
            val response = service.getGuardAssignment(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignación obtenida")
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

    /**
     * Crea una nueva asignación de guardia
     */
    suspend fun createAssignment(request: CreateGuardAssignmentRequest): Result<GuardAssignment> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIÓN ===")
            Log.d(TAG, "Guard: ${request.id_guard}, Empleado: ${request.id_empleado}")
            Log.d(TAG, "Turno: ${request.turno}, Asignación: ${request.asignacion}")

            val response = service.createGuardAssignment(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignación creada")
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

    /**
     * Actualiza o crea una asignación (upsert)
     * Este es el método principal para cambiar asignaciones desde la UI
     */
    suspend fun updateOrCreateAssignment(
        guardId: Int,
        employeeId: Int,
        shift: String,
        assignment: String
    ): Result<GuardAssignment> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO/CREANDO ASIGNACIÓN ===")
            Log.d(TAG, "Guard: $guardId, Empleado: $employeeId")
            Log.d(TAG, "Turno: $shift, Asignación: $assignment")

            val request = UpdateOrCreateGuardAssignmentRequest(
                id_guard = guardId,
                id_empleado = employeeId,
                turno = shift,
                asignacion = assignment
            )

            val response = service.updateOrCreateAssignment(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignación actualizada/creada")
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

    /**
     * Actualiza una asignación existente
     */
    suspend fun updateAssignment(id: Int, request: UpdateGuardAssignmentRequest): Result<GuardAssignment> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO ASIGNACIÓN $id ===")
            val response = service.updateGuardAssignment(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignación actualizada")
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

    /**
     * Elimina una asignación
     */
    suspend fun deleteAssignment(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIÓN $id ===")
            val response = service.deleteGuardAssignment(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Asignación eliminada")
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

    /**
     * Obtiene las asignaciones organizadas por turno para una guardia
     * Retorna un Map<String, Map<Int, String>> donde:
     * - La clave externa es el turno (Mañana, Tarde, Noche)
     * - La clave interna es el id_empleado
     * - El valor es la asignación (B1, B2, C1, etc.)
     */
    suspend fun getAssignmentsByShift(guardId: Int): Result<Map<String, Map<Int, String>>> {
        return try {
            val assignmentsResult = getAssignmentsByGuard(guardId)

            if (assignmentsResult.isSuccess) {
                val assignments = assignmentsResult.getOrThrow()
                val byShift = mutableMapOf<String, MutableMap<Int, String>>()

                // Inicializar los turnos
                byShift["Mañana"] = mutableMapOf()
                byShift["Tarde"] = mutableMapOf()
                byShift["Noche"] = mutableMapOf()

                // Organizar por turno
                assignments.forEach { assignment ->
                    byShift[assignment.turno]?.put(
                        assignment.id_empleado,
                        assignment.asignacion
                    )
                }

                Log.d(TAG, "✅ Asignaciones organizadas por turno")
                Result.success(byShift.toMap())
            } else {
                assignmentsResult.map { emptyMap() }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }
}