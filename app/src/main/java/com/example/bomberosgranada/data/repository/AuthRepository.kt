package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.RetrofitClient
import com.example.bomberosgranada.data.models.LoginRequest
import com.example.bomberosgranada.data.models.LoginResponse

class AuthRepository {

    private val TAG = "AuthRepository"
    private val apiService = RetrofitClient.apiService

    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            Log.d(TAG, "=== INICIO LOGIN ===")
            Log.d(TAG, "Email: $email")
            Log.d(TAG, "Password: ${password.take(3)}***") // Solo primeros 3 caracteres

            val request = LoginRequest(email, password)
            Log.d(TAG, "Request creado: $request")

            Log.d(TAG, "Llamando a API...")
            val response = apiService.login(request)
            Log.d(TAG, "Respuesta recibida!")
            Log.d(TAG, "Código: ${response.code()}")
            Log.d(TAG, "Es exitoso: ${response.isSuccessful}")
            Log.d(TAG, "Body: ${response.body()}")
            Log.d(TAG, "Error body: ${response.errorBody()?.string()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ LOGIN EXITOSO")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()} - ${response.message()}"
                Log.e(TAG, "❌ LOGIN FALLIDO: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN EN LOGIN: ${e.message}", e)
            Result.failure(e)
        }
    }
}