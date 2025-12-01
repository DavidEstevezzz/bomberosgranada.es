package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.local.TokenManager
import es.bomberosgranada.app.data.models.LoginResponse
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.repositories.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val TAG = "AuthViewModel"

    // Estado de autenticación
    private val _authState = MutableStateFlow<AuthState>(AuthState.Initial)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    // Usuario actual
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    // Estado de si está autenticado (para navegación)
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    init {
        checkAuthStatus()
    }

    /**
     * Verificar si hay sesión activa al iniciar
     */
    private fun checkAuthStatus() {
        viewModelScope.launch {
            tokenManager.getToken().collect { token ->
                if (!token.isNullOrEmpty()) {
                    Log.d(TAG, "Token encontrado, obteniendo datos del usuario")
                    getUserByToken()
                } else {
                    Log.d(TAG, "No hay token guardado")
                    _isAuthenticated.value = false
                    _authState.value = AuthState.Unauthenticated
                }
            }
        }
    }

    /**
     * Login
     */
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            val result = authRepository.login(email, password)

            result.fold(
                onSuccess = { loginResponse ->
                    Log.d(TAG, "✅ Login exitoso")

                    // Guardar token
                    tokenManager.saveToken(loginResponse.token)

                    // Actualizar estado
                    _currentUser.value = loginResponse.user
                    _isAuthenticated.value = true
                    _authState.value = AuthState.Authenticated(loginResponse)
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error en login: ${error.message}")
                    _isAuthenticated.value = false
                    _authState.value = AuthState.Error(error.message ?: "Error desconocido")
                }
            )
        }
    }

    /**
     * Logout
     */
    fun logout() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            val result = authRepository.logout()

            result.fold(
                onSuccess = {
                    Log.d(TAG, "✅ Logout exitoso")

                    // Limpiar token
                    tokenManager.clearToken()

                    // Limpiar estado
                    _currentUser.value = null
                    _isAuthenticated.value = false
                    _authState.value = AuthState.Unauthenticated
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error en logout: ${error.message}")

                    // Aunque falle el API, limpiamos localmente
                    tokenManager.clearToken()
                    _currentUser.value = null
                    _isAuthenticated.value = false
                    _authState.value = AuthState.Unauthenticated
                }
            )
        }
    }

    /**
     * Obtener datos del usuario por token
     */
    fun getUserByToken() {
        viewModelScope.launch {
            val result = authRepository.getUserByToken()

            result.fold(
                onSuccess = { userResponse ->
                    Log.d(TAG, "✅ Usuario obtenido: ${userResponse.user.nombre}")
                    _currentUser.value = userResponse.user
                    _isAuthenticated.value = true
                    _authState.value = AuthState.Authenticated(
                        LoginResponse(
                            user = userResponse.user,
                            role = userResponse.role,
                            token = "" // El token ya está guardado
                        )
                    )
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error obteniendo usuario: ${error.message}")

                    // Si falla, probablemente el token expiró
                    tokenManager.clearToken()
                    _currentUser.value = null
                    _isAuthenticated.value = false
                    _authState.value = AuthState.Unauthenticated
                }
            )
        }
    }

    /**
     * Forgot password
     */
    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            val result = authRepository.forgotPassword(email)

            result.fold(
                onSuccess = {
                    Log.d(TAG, "✅ Email de recuperación enviado")
                    _authState.value = AuthState.PasswordResetSent
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error enviando email: ${error.message}")
                    _authState.value = AuthState.Error(error.message ?: "Error desconocido")
                }
            )
        }
    }

    /**
     * Reset password
     */
    fun resetPassword(
        email: String,
        token: String,
        password: String,
        passwordConfirmation: String
    ) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            val result = authRepository.resetPassword(
                email,
                token,
                password,
                passwordConfirmation
            )

            result.fold(
                onSuccess = {
                    Log.d(TAG, "✅ Contraseña restablecida")
                    _authState.value = AuthState.PasswordResetSuccess
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error restableciendo contraseña: ${error.message}")
                    _authState.value = AuthState.Error(error.message ?: "Error desconocido")
                }
            )
        }
    }

    /**
     * Limpiar estado de error
     */
    fun clearError() {
        if (_authState.value is AuthState.Error) {
            _authState.value = AuthState.Initial
        }
    }

    /**
     * Limpiar todo el estado de autenticación
     */
    fun clearAuthState() {
        _authState.value = AuthState.Initial
    }
}

/**
 * Estados de autenticación
 */
sealed class AuthState {
    object Initial : AuthState()
    object Loading : AuthState()
    data class Authenticated(val loginResponse: LoginResponse) : AuthState()
    object Unauthenticated : AuthState()
    data class Error(val message: String) : AuthState()
    object PasswordResetSent : AuthState()
    object PasswordResetSuccess : AuthState()
}