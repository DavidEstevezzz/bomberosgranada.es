package com.example.bomberosgranada.data.api.services

import com.example.bomberosgranada.data.models.LoginRequest
import com.example.bomberosgranada.data.models.LoginResponse
import com.example.bomberosgranada.data.models.User
import retrofit2.Response
import retrofit2.http.*

interface AuthService {

    @POST("login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("logout")
    suspend fun logout(): Response<Unit>

    @GET("user")
    suspend fun getUserByToken(): Response<UserByTokenResponse>

    @POST("users/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<Unit>

    @POST("users/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<Unit>
}

// Response Models
data class UserByTokenResponse(
    val user: User,
    val role: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val email: String,
    val token: String,
    val password: String,
    val password_confirmation: String
)