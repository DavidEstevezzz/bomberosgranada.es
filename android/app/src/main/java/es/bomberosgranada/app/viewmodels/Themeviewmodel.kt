package es.bomberosgranada.app.viewmodels

import android.util.Log
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
 */
class ThemeViewModel(
    private val themePreferences: ThemePreferences
) : ViewModel() {

    companion object {
        private const val TAG = "ThemeViewModel"
    }

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    init {
        Log.d(TAG, "🎨 ThemeViewModel inicializado")
        viewModelScope.launch {
            themePreferences.themeMode.collect { mode ->
                Log.d(TAG, "🎨 Tema cargado desde preferencias: $mode")
                _themeMode.value = mode
            }
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        Log.d(TAG, "🎨 Cambiando tema a: $mode")
        viewModelScope.launch {
            themePreferences.setThemeMode(mode)
            Log.d(TAG, "🎨 Tema guardado en preferencias: $mode")
        }
    }

    fun cycleThemeMode() {
        val currentMode = _themeMode.value
        val nextMode = when (currentMode) {
            ThemeMode.SYSTEM -> ThemeMode.LIGHT
            ThemeMode.LIGHT -> ThemeMode.DARK
            ThemeMode.DARK -> ThemeMode.SYSTEM
        }
        Log.d(TAG, "🎨 Ciclando tema: $currentMode -> $nextMode")
        setThemeMode(nextMode)
    }

    fun isDarkMode(isSystemInDarkTheme: Boolean): Boolean {
        return themePreferences.isDarkMode(_themeMode.value, isSystemInDarkTheme)
    }
}

class ThemeViewModelFactory(
    private val themePreferences: ThemePreferences
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ThemeViewModel::class.java)) {
            return ThemeViewModel(themePreferences) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}