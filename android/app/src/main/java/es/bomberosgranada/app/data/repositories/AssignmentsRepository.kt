package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

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

    suspend fun getFirefightersByAssignment(id: Int): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DE LA ASIGNACIÓN $id ===")
            val response = assignmentsService.getFirefightersByAssignment(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} bomberos obtenidos")
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
            Log.d(TAG, "Empleado: ${request.id_empleado}, Brigada destino: ${request.id_brigada_destino}")
            Log.d(TAG, "Fecha: ${request.fecha_ini}, Turno: ${request.turno}")

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

    // ===============================
    // DISPONIBILIDAD DE BOMBEROS
    // ===============================

    suspend fun getAvailableFirefighters(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefighters(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos disponibles")
                Result.success(firefighters)
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

    suspend fun getAvailableFirefightersWithoutMands(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES SIN MANDOS - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersWithoutMands(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos disponibles")
                Result.success(firefighters)
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

    suspend fun getAvailableFirefightersNoAdjacentDays(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES SIN DÍAS ADYACENTES - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoAdjacentDays(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos disponibles")
                Result.success(firefighters)
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

    suspend fun getAvailableFirefightersNoTodayAndTomorrow(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - NO HOY NI MAÑANA - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoTodayAndTomorrow(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos disponibles")
                Result.success(firefighters)
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

    suspend fun getAvailableFirefightersNoTodayAndYesterday(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS DISPONIBLES - NO HOY NI AYER - Fecha: $date ===")
            val response = assignmentsService.getAvailableFirefightersNoTodayAndYesterday(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos disponibles")
                Result.success(firefighters)
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

    suspend fun getWorkingFirefighters(date: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO BOMBEROS TRABAJANDO - Fecha: $date ===")
            val response = assignmentsService.getWorkingFirefighters(date)

            if (response.isSuccessful && response.body() != null) {
                val firefighters = response.body()!!.available_firefighters
                Log.d(TAG, "✅ ${firefighters.size} bomberos trabajando")
                Result.success(firefighters)
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

    // ===============================
    // VERIFICACIONES
    // ===============================

    suspend fun checkEspecialBrigade(idBrigada: Int, fecha: String): Result<CheckEspecialBrigadeResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO BRIGADA ESPECIAL $idBrigada EN $fecha ===")
            val response = assignmentsService.checkEspecialBrigade(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ Verificación completada: ${result.has_assignments}")
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

    // ===============================
    // OPERACIONES ESPECIALES
    // ===============================

    suspend fun moveToTop(id: Int, column: String): Result<MoveResponse> {
        return try {
            Log.d(TAG, "=== MOVIENDO AL PRINCIPIO - ID: $id, Columna: $column ===")
            val response = assignmentsService.moveToTop(id, column)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Movido al principio")
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

    suspend fun moveToBottom(id: Int, column: String): Result<MoveResponse> {
        return try {
            Log.d(TAG, "=== MOVIENDO AL FINAL - ID: $id, Columna: $column ===")
            val response = assignmentsService.moveToBottom(id, column)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Movido al final")
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

    suspend fun requireFirefighter(request: RequireFirefighterRequest): Result<RequireFirefighterResponse> {
        return try {
            Log.d(TAG, "=== REQUIRIENDO BOMBERO ===")
            Log.d(TAG, "Empleado: ${request.id_empleado}, Brigada: ${request.id_brigada_destino}")
            Log.d(TAG, "Fecha: ${request.fecha}, Turno: ${request.turno}")

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

    suspend fun incrementUserColumn(
        idAsignacion: Int,
        column: String,
        increment: Int,
        orderColumn2: String? = null
    ): Result<IncrementColumnResponse> {
        return try {
            Log.d(TAG, "=== INCREMENTANDO COLUMNA USUARIO ===")
            Log.d(TAG, "ID Asignación: $idAsignacion, Columna: $column, Incremento: $increment")

            val request = IncrementColumnRequest(
                column = column,
                increment = increment,
                orderColumn2 = orderColumn2
            )
            val response = assignmentsService.incrementUserColumn(idAsignacion, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Columna incrementada")
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

    suspend fun extendWorkingDay(request: ExtendWorkingDayRequest): Result<ExtendWorkingDayResponse> {
        return try {
            Log.d(TAG, "=== EXTENDIENDO JORNADA LABORAL ===")
            Log.d(TAG, "Empleado: ${request.id_empleado}")
            Log.d(TAG, "Fecha actual: ${request.fecha_actual}, Nueva fecha: ${request.nueva_fecha}")
            Log.d(TAG, "Nuevo turno: ${request.nuevo_turno}, Dirección: ${request.direccion}")

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

    // ===============================
    // PRÁCTICAS Y RETÉN
    // ===============================

    suspend fun createPracticesAssignments(request: CreatePracticesRequest): Result<CreatePracticesResponse> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIONES DE PRÁCTICAS ===")
            Log.d(TAG, "Empleado: ${request.id_empleado}, Brigada: ${request.id_brigada_destino}, Fecha: ${request.fecha}")

            val response = assignmentsService.createPracticesAssignments(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignaciones de prácticas creadas")
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

    suspend fun createRTAssignments(request: CreateRTRequest): Result<CreateRTResponse> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIONES DE RETÉN ===")
            Log.d(TAG, "Empleado: ${request.id_empleado}, Brigada: ${request.id_brigada_destino}, Fecha: ${request.fecha}")

            val response = assignmentsService.createRTAssignments(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Asignaciones de retén creadas")
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

    suspend fun deletePracticesAssignments(request: DeletePracticesRequest): Result<DeleteAssignmentsResponse> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIONES DE PRÁCTICAS ===")
            Log.d(TAG, "Brigada: ${request.id_brigada}, Fecha: ${request.fecha}, Usuario: ${request.id_usuario}")

            val response = assignmentsService.deletePracticesAssignments(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ ${result.deleted_count} asignaciones de prácticas eliminadas")
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

    suspend fun deleteRTAssignments(request: DeleteRTRequest): Result<DeleteAssignmentsResponse> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIONES DE RETÉN ===")
            Log.d(TAG, "Brigada: ${request.id_brigada}, Fecha: ${request.fecha}, Usuario: ${request.id_usuario}")

            val response = assignmentsService.deleteRTAssignments(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ ${result.deleted_count} asignaciones de retén eliminadas")
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

    // ===============================
    // TRASLADOS (LEGACY)
    // ===============================

    suspend fun getActiveTransfers(idBrigada: Int, fecha: String): Result<List<ActiveTransfer>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TRASLADOS ACTIVOS ===")
            Log.d(TAG, "Brigada: $idBrigada, Fecha: $fecha")

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

    suspend fun undoTransfer(idAsignacionIda: Int): Result<UndoTransferResponse> {
        return try {
            Log.d(TAG, "=== DESHACIENDO TRASLADO ===")
            Log.d(TAG, "ID Asignación Ida: $idAsignacionIda")

            val request = UndoTransferRequest(idAsignacionIda)
            val response = assignmentsService.undoTransfer(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ Traslado deshecho: ${result.deleted_count} asignaciones eliminadas")
                Log.d(TAG, "Horas revertidas: ${result.horas_revertidas}")
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