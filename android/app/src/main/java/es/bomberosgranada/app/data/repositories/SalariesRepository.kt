package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class SalariesRepository {
    private val TAG = "SalariesRepository"
    private val salariesService = ApiClient.salaries

    suspend fun getAllSalaries(): Result<List<Salary>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODOS LOS SALARIOS ===")
            val response = salariesService.getSalaries()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} salarios obtenidos")
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

    suspend fun getSalary(id: Int): Result<Salary> {
        return try {
            Log.d(TAG, "=== OBTENIENDO SALARIO $id ===")
            val response = salariesService.getSalary(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Salario obtenido")
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

    suspend fun createSalary(
        tipo: String,
        fechaIni: String,
        precioDiurno: Double,
        precioNocturno: Double,
        horasDiurnas: Int,
        horasNocturnas: Int
    ): Result<Salary> {
        return try {
            Log.d(TAG, "=== CREANDO SALARIO ===")
            val request = CreateSalaryRequest(
                tipo = tipo,
                fecha_ini = fechaIni,
                precio_diurno = precioDiurno,
                precio_nocturno = precioNocturno,
                horas_diurnas = horasDiurnas,
                horas_nocturnas = horasNocturnas
            )
            val response = salariesService.createSalary(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Salario creado")
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

    suspend fun updateSalary(
        id: Int,
        tipo: String? = null,
        fechaIni: String? = null,
        precioDiurno: Double? = null,
        precioNocturno: Double? = null,
        horasDiurnas: Int? = null,
        horasNocturnas: Int? = null
    ): Result<Salary> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SALARIO $id ===")
            val request = UpdateSalaryRequest(
                tipo = tipo,
                fecha_ini = fechaIni,
                precio_diurno = precioDiurno,
                precio_nocturno = precioNocturno,
                horas_diurnas = horasDiurnas,
                horas_nocturnas = horasNocturnas
            )
            val response = salariesService.updateSalary(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Salario actualizado")
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

    suspend fun deleteSalary(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO SALARIO $id ===")
            val response = salariesService.deleteSalary(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Salario eliminado")
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