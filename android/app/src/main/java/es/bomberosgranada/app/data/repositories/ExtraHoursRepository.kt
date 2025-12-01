package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.api.services.*

class ExtraHoursRepository {
    private val TAG = "ExtraHoursRepository"
    private val extraHoursService = ApiClient.extraHours

    suspend fun getAllExtraHours(): Result<List<ExtraHour>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODAS LAS HORAS EXTRAS ===")
            val response = extraHoursService.getExtraHours()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} registros obtenidos")
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

    suspend fun getExtraHour(id: Int): Result<ExtraHour> {
        return try {
            Log.d(TAG, "=== OBTENIENDO HORA EXTRA $id ===")
            Log.w(TAG, "⚠️ ADVERTENCIA: Laravel usa clave compuesta (date+id_empleado), este endpoint puede no funcionar")
            val response = extraHoursService.getExtraHour(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Registro obtenido")
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

    suspend fun createExtraHour(
        idEmpleado: Int,
        date: String,
        idSalario: Int,
        horasDiurnas: Int,
        horasNocturnas: Int
    ): Result<ExtraHour> {
        return try {
            Log.d(TAG, "=== CREANDO HORA EXTRA ===")
            Log.d(TAG, "Empleado: $idEmpleado, Fecha: $date")
            Log.d(TAG, "Diurnas: $horasDiurnas, Nocturnas: $horasNocturnas")

            val request = CreateExtraHourRequest(
                id_empleado = idEmpleado,
                date = date,
                id_salario = idSalario,
                horas_diurnas = horasDiurnas,
                horas_nocturnas = horasNocturnas
            )
            val response = extraHoursService.createExtraHour(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Hora extra creada")
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

    suspend fun updateExtraHour(
        id: Int,
        idEmpleado: Int,
        date: String,
        horasDiurnas: Int,
        horasNocturnas: Int,
        idSalario: Int
    ): Result<ExtraHour> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO HORA EXTRA $id ===")
            val request = UpdateExtraHourRequest(
                id_empleado = idEmpleado,
                date = date,
                horas_diurnas = horasDiurnas,
                horas_nocturnas = horasNocturnas,
                id_salario = idSalario
            )
            val response = extraHoursService.updateExtraHour(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Hora extra actualizada")
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

    suspend fun deleteExtraHour(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO HORA EXTRA $id ===")
            val response = extraHoursService.deleteExtraHour(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Hora extra eliminada")
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

    suspend fun getExtraHoursByMonth(month: String): Result<List<ExtraHoursByMonthItem>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO HORAS EXTRAS DEL MES $month ===")
            val response = extraHoursService.getExtraHoursByMonth(month)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} empleados con horas extras")
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