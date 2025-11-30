package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.api.services.*

class BrigadeUsersRepository {
    private val TAG = "BrigadeUsersRepository"
    private val brigadeUsersService = ApiClient.brigadeUsers

    suspend fun getAllBrigadeUsers(): Result<List<BrigadeUser>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODOS LOS USUARIOS DE BRIGADAS ===")
            val response = brigadeUsersService.getBrigadeUsers()

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

    suspend fun getBrigadeUser(id: Int): Result<BrigadeUser> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIO DE BRIGADA $id ===")
            val response = brigadeUsersService.getBrigadeUser(id)

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

    suspend fun createBrigadeUser(
        idBrigada: Int,
        idUsuario: Int,  // ✅ Cambio de idEmpleado a idUsuario
        practicas: Int = 0
    ): Result<BrigadeUser> {
        return try {
            Log.d(TAG, "=== CREANDO ASIGNACIÓN DE USUARIO A BRIGADA ===")
            val request = CreateBrigadeUserRequest(
                id_brigada = idBrigada,
                id_usuario = idUsuario,  // ✅ Cambio
                practicas = practicas
            )
            val response = brigadeUsersService.createBrigadeUser(request)

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

    suspend fun updateBrigadeUser(
        id: Int,
        idBrigada: Int? = null,
        idUsuario: Int? = null,  // ✅ Cambio de idEmpleado a idUsuario
        practicas: Int? = null
    ): Result<UpdateBrigadeUserResponse> {  // ✅ Cambio de tipo de retorno
        return try {
            Log.d(TAG, "=== ACTUALIZANDO ASIGNACIÓN $id ===")
            val request = UpdateBrigadeUserRequest(
                id_brigada = idBrigada,
                id_usuario = idUsuario,  // ✅ Cambio
                practicas = practicas
            )
            val response = brigadeUsersService.updateBrigadeUser(id, request)

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

    suspend fun deleteBrigadeUser(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO ASIGNACIÓN $id ===")
            val response = brigadeUsersService.deleteBrigadeUser(id)

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

    suspend fun getUsersByBrigade(brigadeId: Int): Result<BrigadeUsersByBrigadeResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIOS DE LA BRIGADA $brigadeId ===")
            val response = brigadeUsersService.getUsersByBrigade(brigadeId)

            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                Log.d(TAG, "✅ Brigada: ${data.brigade}, ${data.brigadeUsers.size} usuarios obtenidos")
                Result.success(data)
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

    suspend fun getUserPracticas(employeeId: Int): Result<UserPracticasResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO PRÁCTICAS DEL USUARIO $employeeId ===")
            val response = brigadeUsersService.getUserPracticas(employeeId)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Prácticas obtenidas")
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

    suspend fun updatePracticas(
        idUsuario: Int,  // ✅ Cambio de idEmpleado a idUsuario
        idBrigada: Int,
        practicas: Int
    ): Result<PracticasUpdateResponse> {  // ✅ Cambio de tipo de retorno
        return try {
            Log.d(TAG, "=== ACTUALIZANDO PRÁCTICAS ===")
            val request = UpdatePracticasRequest(
                id_usuario = idUsuario,  // ✅ Cambio
                id_brigada = idBrigada,
                practicas = practicas
            )
            val response = brigadeUsersService.updatePracticas(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Prácticas actualizadas")
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

    suspend fun incrementPracticas(
        idUsuario: Int,  // ✅ Cambio de idEmpleado a idUsuario
        idBrigada: Int,
        increment: Int = 1
    ): Result<PracticasUpdateResponse> {  // ✅ Cambio de tipo de retorno
        return try {
            Log.d(TAG, "=== INCREMENTANDO PRÁCTICAS ===")
            val request = IncrementPracticasRequest(
                id_usuario = idUsuario,  // ✅ Cambio
                id_brigada = idBrigada,
                increment = increment
            )
            val response = brigadeUsersService.incrementPracticas(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Prácticas incrementadas")
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