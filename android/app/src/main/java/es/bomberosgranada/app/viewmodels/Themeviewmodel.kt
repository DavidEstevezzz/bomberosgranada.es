package es.bomberosgranada.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.local.ThemeMode
import es.bomberosgranada.app.data.local.ThemePreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel para manejar el estado del tema de la aplicación
 *
 * Uso en composables:
 * ```
 * val themeViewModel: ThemeViewModel = viewModel(
 *     factory = ThemeViewModelFactory(themePreferences)
 * )
 * val themeMode by themeViewModel.themeMode.collectAsState()
 * ```
 */
class ThemeViewModel(
    private val themePreferences: ThemePreferences
) : ViewModel() {

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    init {
        // Observar cambios en las preferencias
        viewModelScope.launch {
            themePreferences.themeMode.collect { mode ->
                _themeMode.value = mode
            }
        }
    }

    /**
     * Cambiar el modo de tema
     */
    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch {
            themePreferences.setThemeMode(mode)
        }
    }

    /**
     * Ciclar entre los modos de tema: SYSTEM -> LIGHT -> DARK -> SYSTEM
     */
    fun cycleThemeMode() {
        val nextMode = when (_themeMode.value) {
            ThemeMode.SYSTEM -> ThemeMode.LIGHT
            ThemeMode.LIGHT -> ThemeMode.DARK
            ThemeMode.DARK -> ThemeMode.SYSTEM
        }
        setThemeMode(nextMode)
    }

    /**
     * Determinar si está en modo oscuro según la preferencia y el sistema
     */
    fun isDarkMode(isSystemInDarkTheme: Boolean): Boolean {
        return themePreferences.isDarkMode(_themeMode.value, isSystemInDarkTheme)
    }
}

/**
 * Factory para crear ThemeViewModel con las dependencias necesarias
 */
class ThemeViewModelFactory(
    private val themePreferences: ThemePreferences
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ThemeViewModel::class.java)) {
            return ThemeViewModel(themePreferences) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}