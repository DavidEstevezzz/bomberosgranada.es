package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*
import java.time.YearMonth


class GuardsRepository {
    private val TAG = "GuardsRepository"
    private val guardsService = ApiClient.guards

    suspend fun getGuards(): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS ===")
            val response = guardsService.getGuards()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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

    suspend fun getGuardsByDateRange(
        brigadeIds: List<Int>,
        startDate: String,
        endDate: String
    ): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS POR RANGO: $startDate - $endDate ===")
            val brigadesParam = brigadeIds.joinToString(",")
            val response = guardsService.getGuardsByBrigades(
                brigades = brigadesParam,
                startDate = startDate,
                endDate = endDate
            )

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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
     * Obtiene las guardias solo para el mes indicado (rango primer día - último día).
     */
    suspend fun getGuardsForMonth(
        brigadeIds: List<Int>,
        month: YearMonth
    ): Result<List<Guard>> {
        val startDate = month.atDay(1).toString()
        val endDate = month.atEndOfMonth().toString()

        return getGuardsByDateRange(
            brigadeIds = brigadeIds,
            startDate = startDate,
            endDate = endDate
        )
    }

    suspend fun getGuard(id: Int): Result<Guard> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIA $id ===")
            val response = guardsService.getGuard(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia obtenida")
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

    suspend fun getGuardsByDate(fecha: String): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS POR FECHA: $fecha ===")
            val response = guardsService.getGuardsByDate(fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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
     * ✅ CORREGIDO: Devuelve GuardByBrigadeAndDateResponse en lugar de Guard
     */
    suspend fun getGuardByBrigadeAndDate(idBrigada: Int, fecha: String): Result<GuardByBrigadeAndDateResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIA - Brigada: $idBrigada, Fecha: $fecha ===")
            val response = guardsService.getGuardByBrigadeAndDate(idBrigada, fecha)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia obtenida")
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

    suspend fun createGuard(guard: CreateGuardRequest): Result<Guard> {
        return try {
            Log.d(TAG, "=== CREANDO GUARDIA ===")
            val response = guardsService.createGuard(guard)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia creada")
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

    suspend fun updateGuard(id: Int, guard: UpdateGuardRequest): Result<UpdateGuardResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO GUARDIA $id ===")
            val response = guardsService.updateGuard(id, guard)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Guardia actualizada")
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

    suspend fun updateSchedule(id: Int, schedule: UpdateScheduleRequest): Result<UpdateGuardResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO HORARIO - Guardia: $id ===")
            val response = guardsService.updateSchedule(id, schedule)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Horario actualizado")
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
     * ✅ CORREGIDO: Devuelve UpdateGuardResponse en lugar de Guard
     */
    suspend fun updateDailyActivities(
        id: Int,
        activities: UpdateDailyActivitiesRequest
    ): Result<UpdateGuardResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO ACTIVIDADES DIARIAS - Guardia: $id ===")
            val response = guardsService.updateDailyActivities(id, activities)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Actividades actualizadas")
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
     * ✅ CORREGIDO:
     * - Devuelve UpdateCommentsResponse en lugar de Guard
     * - UpdateCommentsRequest necesita 3 parámetros: id_brigada, date, comentarios
     */
    suspend fun updateComments(
        idBrigada: Int,
        date: String,
        comments: String
    ): Result<UpdateCommentsResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO COMENTARIOS - Brigada: $idBrigada, Fecha: $date ===")
            val request = UpdateCommentsRequest(
                id_brigada = idBrigada,
                date = date,
                comentarios = comments
            )
            val response = guardsService.updateComments(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Comentarios actualizados")
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

    suspend fun updatePersonalIncidents(
        idBrigada: Int,
        date: String,
        incidents: String
    ): Result<UpdatePersonalIncidentsResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO INCIDENCIAS PERSONALES - Brigada: $idBrigada, Fecha: $date ===")
            val request = UpdatePersonalIncidentsRequest(
                id_brigada = idBrigada,
                date = date,
                incidencias_personal = incidents
            )
            val response = guardsService.updatePersonalIncidents(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencias personales actualizadas")
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

    suspend fun updateGeneralIncidents(
        idBrigada: Int,
        date: String,
        incidents: String
    ): Result<UpdateGeneralIncidentsResponse> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO INCIDENCIAS GENERALES - Brigada: $idBrigada, Fecha: $date ===")
            val request = UpdateGeneralIncidentsRequest(
                id_brigada = idBrigada,
                date = date,
                incidencias_generales = incidents
            )
            val response = guardsService.updateGeneralIncidents(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencias generales actualizadas")
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

    suspend fun deleteGuard(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO GUARDIA $id ===")
            val response = guardsService.deleteGuard(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Guardia eliminada")
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

    suspend fun getEspecialGuards(): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS ESPECIALES ===")
            val response = guardsService.getEspecialGuards()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias especiales obtenidas")
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

    suspend fun getGuardsByBrigades(
        brigades: String,
        startDate: String,
        endDate: String
    ): Result<List<Guard>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO GUARDIAS POR BRIGADAS ===")
            Log.d(TAG, "Brigadas: $brigades, Inicio: $startDate, Fin: $endDate")
            val response = guardsService.getGuardsByBrigades(brigades, startDate, endDate)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} guardias obtenidas")
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