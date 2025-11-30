package es.bomberosgranada.app.data.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val user: User,  // ← Usa el User de User.kt
    val role: String,
    val token: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val token: String,
    val password: String,
    val password_confirmation: String
)

data class LogoutResponse(
    val message: String
)