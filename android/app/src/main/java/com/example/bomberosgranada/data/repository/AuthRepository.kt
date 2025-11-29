package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.ApiClient
import com.example.bomberosgranada.data.api.services.ForgotPasswordRequest
import com.example.bomberosgranada.data.api.services.ResetPasswordRequest
import com.example.bomberosgranada.data.api.services.UserByTokenResponse
import com.example.bomberosgranada.data.models.LoginRequest
import com.example.bomberosgranada.data.models.LoginResponse

class AuthRepository {
    private val TAG = "AuthRepository"
    private val authService = ApiClient.auth

    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            Log.d(TAG, "=== INICIO LOGIN ===")
            Log.d(TAG, "Email: $email")

            val request = LoginRequest(email, password)
            val response = authService.login(request)

            Log.d(TAG, "Respuesta recibida!")
            Log.d(TAG, "Código: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ LOGIN EXITOSO")
                Result.success(response.body()!!)
            } else {
                val errorMsg = when (response.code()) {
                    404 -> "Credenciales incorrectas"
                    500 -> "Error del servidor"
                    else -> "Error: ${response.code()}"
                }
                Log.e(TAG, "❌ LOGIN FALLIDO: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN EN LOGIN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> {
        return try {
            Log.d(TAG, "=== INICIO LOGOUT ===")

            val response = authService.logout()

            if (response.isSuccessful) {
                Log.d(TAG, "✅ LOGOUT EXITOSO")
                Result.success(Unit)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ LOGOUT FALLIDO: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN EN LOGOUT: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun getUserByToken(): Result<UserByTokenResponse> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIO POR TOKEN ===")

            val response = authService.getUserByToken()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ USUARIO OBTENIDO: ${response.body()!!.user.name}")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ ERROR AL OBTENER USUARIO: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun forgotPassword(email: String): Result<Unit> {
        return try {
            Log.d(TAG, "=== SOLICITUD RECUPERAR CONTRASEÑA ===")
            Log.d(TAG, "Email: $email")

            val request = ForgotPasswordRequest(email)
            val response = authService.forgotPassword(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ EMAIL ENVIADO")
                Result.success(Unit)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ ERROR: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun resetPassword(
        email: String,
        token: String,
        password: String,
        passwordConfirmation: String
    ): Result<Unit> {
        return try {
            Log.d(TAG, "=== RESETEAR CONTRASEÑA ===")
            Log.d(TAG, "Email: $email")

            val request = ResetPasswordRequest(email, token, password, passwordConfirmation)
            val response = authService.resetPassword(request)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ CONTRASEÑA RESETEADA")
                Result.success(Unit)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ ERROR: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }
}