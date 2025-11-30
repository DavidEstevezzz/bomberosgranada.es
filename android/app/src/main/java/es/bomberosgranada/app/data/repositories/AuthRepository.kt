package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*

/**
 * Repository para autenticación
 *
 * Maneja:
 * - Login
 * - Logout
 * - Obtener usuario por token
 * - Recuperación de contraseña
 * - Reseteo de contraseña
 */
class AuthRepository {
    private val TAG = "AuthRepository"
    private val authService = ApiClient.auth

    /**
     * Login con email y contraseña
     */
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            Log.d(TAG, "=== INICIANDO LOGIN ===")
            Log.d(TAG, "Email: $email")

            val request = LoginRequest(email = email, password = password)
            val response = authService.login(request)

            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                Log.d(TAG, "✅ Login exitoso")
                Log.d(TAG, "Usuario: ${loginResponse.user.nombre} ${loginResponse.user.apellido}")
                Log.d(TAG, "Role: ${loginResponse.role}")
                Log.d(TAG, "Token: ${loginResponse.token.take(20)}...")

                Result.success(loginResponse)
            } else {
                val errorMsg = when (response.code()) {
                    401 -> "Credenciales incorrectas"
                    404 -> "Usuario no encontrado"
                    else -> "Error: ${response.code()}"
                }
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN en login: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Logout - Revocar token actual
     */
    suspend fun logout(): Result<LogoutResponse> {
        return try {
            Log.d(TAG, "=== CERRANDO SESIÓN ===")

            val response = authService.logout()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Logout exitoso")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error al cerrar sesión: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN en logout: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Obtener datos del usuario autenticado por token
     */
    suspend fun getUserByToken(): Result<UserByTokenResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIO POR TOKEN ===")

            val response = authService.getUserByToken()

            if (response.isSuccessful && response.body() != null) {
                val user = response.body()!!
                Log.d(TAG, "✅ Usuario obtenido: ${user.nombre} ${user.apellido}")

                // Laravel devuelve directamente el User, necesitamos crear UserByTokenResponse
                val userResponse = UserByTokenResponse(
                    user = user,
                    role = user.role_name ?: "bombero" // Usa role_name del User
                )

                Result.success(userResponse)
            } else {
                val errorMsg = when (response.code()) {
                    401 -> "Token inválido o expirado"
                    else -> "Error: ${response.code()}"
                }
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN obteniendo usuario: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    suspend fun forgotPassword(email: String): Result<MessageResponse> {
        return try {
            Log.d(TAG, "=== SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA ===")
            Log.d(TAG, "Email: $email")

            val request = ForgotPasswordRequest(email = email)
            val response = authService.forgotPassword(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Email de recuperación enviado")
                Result.success(response.body()!!)
            } else {
                val errorMsg = when (response.code()) {
                    404 -> "Email no encontrado"
                    else -> "Error: ${response.code()}"
                }
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN en forgot password: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Resetear contraseña con token
     */
    suspend fun resetPassword(
        email: String,
        token: String,
        password: String,
        passwordConfirmation: String
    ): Result<MessageResponse> {
        return try {
            Log.d(TAG, "=== RESETEO DE CONTRASEÑA ===")
            Log.d(TAG, "Email: $email")

            val request = ResetPasswordRequest(
                token = token,
                password = password,
                password_confirmation = passwordConfirmation
            )

            val response = authService.resetPassword(request)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Contraseña restablecida correctamente")
                Result.success(response.body()!!)
            } else {
                val errorMsg = when (response.code()) {
                    400 -> "Token inválido o expirado"
                    422 -> "Las contraseñas no coinciden"
                    else -> "Error: ${response.code()}"
                }
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN en reset password: ${e.message}", e)
            Result.failure(e)
        }
    }
}

/**
 * Response para getUserByToken
 * Laravel devuelve solo el User, pero necesitamos el role también
 */
data class UserByTokenResponse(
    val user: User,
    val role: String
)