package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

class UsersRepository {
    private val TAG = "UsersRepository"
    private val usersService = ApiClient.users

    suspend fun getAllUsers(): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO TODOS LOS USUARIOS ===")
            val response = usersService.getUsers()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} usuarios obtenidos")
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

    suspend fun getUser(id: Int): Result<User> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIO $id ===")
            val response = usersService.getUser(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Usuario obtenido")
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

    suspend fun createUser(user: CreateUserRequest): Result<User> {
        return try {
            Log.d(TAG, "=== CREANDO USUARIO ===")
            val response = usersService.createUser(user)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Usuario creado")
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

    suspend fun updateUser(id: Int, user: UpdateUserRequest): Result<User> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO USUARIO $id ===")
            val response = usersService.updateUser(id, user)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Usuario actualizado")
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

    suspend fun deleteUser(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO USUARIO $id ===")
            val response = usersService.deleteUser(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Usuario eliminado")
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
     * CORREGIDO: Laravel devuelve User, no MessageResponse
     */
    suspend fun updateUserAP(id: Int, newAP: Int): Result<User> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO AP DEL USUARIO $id ===")
            val request = UpdateUserAPRequest(AP = newAP)
            val response = usersService.updateUserAP(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ AP actualizado")
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
     * CORREGIDO: Laravel devuelve User, no MessageResponse
     */
    suspend fun updateUserSP(id: Int, newSP: Int): Result<User> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO SP DEL USUARIO $id ===")
            val request = UpdateUserSPRequest(SP = newSP)
            val response = usersService.updateUserSP(id, request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ SP actualizado")
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
     * CORREGIDO: traslado es Int, no String
     * Laravel devuelve User, no MessageResponse
     */
    suspend fun updateUserTraslado(id: Int, traslado: Int): Result<User> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO TRASLADO DEL USUARIO $id ===")
            val request = UpdateUserTrasladoRequest(traslado = traslado)
            val response = usersService.updateUserTraslado(id, request)

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

    suspend fun checkMandoEspecial(id: Int): Result<MandoEspecialResponse> {
        return try {
            Log.d(TAG, "=== VERIFICANDO MANDO ESPECIAL $id ===")
            val response = usersService.checkMandoEspecial(id)

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

    suspend fun getUsersByPosition(position: String): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIOS POR PUESTO: $position ===")
            val response = usersService.getUsersByPosition(position)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} usuarios obtenidos")
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