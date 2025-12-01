package es.bomberosgranada.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import es.bomberosgranada.app.data.local.TokenManager
import es.bomberosgranada.app.data.repositories.AuthRepository

class AuthViewModelFactory(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            return AuthViewModel(authRepository, tokenManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}