package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.ApiClient
import com.example.bomberosgranada.data.api.services.*

class AssignmentsRepository {
    private val TAG = "AssignmentsRepository"
    private val assignmentsService = ApiClient.firefighterAssignments

    suspend fun getAssignments(): Result<List<FirefighterAssignment>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO ASIGNACIONES ===")
            val response = assignmentsService.getAssignments()

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

    suspend fun getAssignment(id: Int): Result<FirefighterAssignment> {
        return try {
            Log.d(TAG, "=== OBTENIENDO ASIGNACIÓN $id ===")
            val response = assignmentsService.getAssignment(id)

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

    suspend fun createAssignment(request: CreateAssignmentRequest): Result<FirefighterAssignment> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIÓN ===")
            val response = assignmentsService.createAssignment(request)

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

    suspend fun updateAssignment(id: Int, request: UpdateAssignmentRequest): Result<FirefighterAssignment> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO ASIGNACIÓN $id ===")
            val response = assignmentsService.updateAssignment(id, request)

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

    suspend fun deleteAssignment(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIÓN $id ===")
            val response = assignmentsService.deleteAssignment(id)

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

    suspend fun getAvailableFirefighters(date: String): Result<List<AvailableFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefighters(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos disponibles")
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

    suspend fun getAvailableFirefightersWithoutMands(date: String): Result<List<AvailableFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES SIN MANDOS - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersWithoutMands(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos disponibles")
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

    suspend fun getAvailableFirefightersNoAdjacentDays(date: String): Result<List<AvailableFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES SIN DÍAS ADYACENTES - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoAdjacentDays(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos disponibles")
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

    suspend fun getAvailableFirefightersNoTodayAndTomorrow(date: String): Result<List<AvailableFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - NO HOY NI MAÑANA - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoTodayAndTomorrow(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos disponibles")
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

    suspend fun getAvailableFirefightersNoTodayAndYesterday(date: String): Result<List<AvailableFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - NO HOY NI AYER - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoTodayAndYesterday(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos disponibles")
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

    suspend fun getWorkingFirefighters(date: String): Result<List<WorkingFirefighter>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS TRABAJANDO - Fecha: $date ===")
            val response = assignmentsService.getWorkingFirefighters(date)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos trabajando")
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

    suspend fun checkEspecialUser(idBrigada: Int, fecha: String, idUsuario: Int): Result<EspecialCheckResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO USUARIO ESPECIAL ===")
            val response = assignmentsService.checkEspecialUser(idBrigada, fecha, idUsuario)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Verificación completada")
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

    suspend fun checkEspecialBrigade(idBrigada: Int, fecha: String): Result<EspecialCheckResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO BRIGADA ESPECIAL ===")
            val response = assignmentsService.checkEspecialBrigade(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Verificación completada")
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

    suspend fun moveToTop(id: Int, column: String): Result<Unit> {
        return try {
            Log.d(TAG, "=== MOVIENDO AL PRINCIPIO - ID: $id, Columna: $column ===")
            val response = assignmentsService.moveToTop(id, column)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Movido al principio")
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

    suspend fun moveToBottom(id: Int, column: String): Result<Unit> {
        return try {
            Log.d(TAG, "=== MOVIENDO AL FINAL - ID: $id, Columna: $column ===")
            val response = assignmentsService.moveToBottom(id, column)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Movido al final")
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

    suspend fun requireFirefighter(request: RequireFirefighterRequest): Result<FirefighterAssignment> {
        return try {
            Log.d(TAG, "=== REQUIRIENDO BOMBERO ===")
            val response = assignmentsService.requireFirefighter(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Bombero requerido")
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

    suspend fun incrementUserColumn(id: Int, column: String, value: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== INCREMENTANDO COLUMNA USUARIO ===")
            val request = IncrementColumnRequest(column, value)
            val response = assignmentsService.incrementUserColumn(id, request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Columna incrementada")
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

    suspend fun extendWorkingDay(request: ExtendWorkingDayRequest): Result<FirefighterAssignment> {
        return try {
            Log.d(TAG, "=== EXTENDIENDO JORNADA LABORAL ===")
            val response = assignmentsService.extendWorkingDay(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Jornada extendida")
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

    suspend fun createPracticesAssignments(request: CreatePracticesRequest): Result<Unit> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIONES DE PRÁCTICAS ===")
            val response = assignmentsService.createPracticesAssignments(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Asignaciones de prácticas creadas")
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

    suspend fun createRTAssignments(request: CreateRTRequest): Result<Unit> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIONES DE RETÉN ===")
            val response = assignmentsService.createRTAssignments(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Asignaciones de retén creadas")
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

    suspend fun deletePracticesAssignments(request: DeletePracticesRequest): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIONES DE PRÁCTICAS ===")
            val response = assignmentsService.deletePracticesAssignments(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Asignaciones de prácticas eliminadas")
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

    suspend fun deleteRTAssignments(request: DeleteRTRequest): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIONES DE RETÉN ===")
            val response = assignmentsService.deleteRTAssignments(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Asignaciones de retén eliminadas")
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

    suspend fun getActiveTransfers(idBrigada: Int, fecha: String): Result<List<ActiveTransfer>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TRASLADOS ACTIVOS ===")
            val response = assignmentsService.getActiveTransfers(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} traslados activos")
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

    suspend fun undoTransfer(idAsignacionIda: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== DESHACIENDO TRASLADO ===")
            val request = UndoTransferRequest(idAsignacionIda)
            val response = assignmentsService.undoTransfer(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Traslado deshecho")
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