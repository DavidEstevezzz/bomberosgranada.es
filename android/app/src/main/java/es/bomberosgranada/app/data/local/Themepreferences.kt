package es.bomberosgranada.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * Opciones de tema disponibles
 */
enum class ThemeMode {
    /** Seguir la configuración del sistema */
    SYSTEM,
    /** Siempre modo claro */
    LIGHT,
    /** Siempre modo oscuro */
    DARK
}

/**
 * Manager para gestionar las preferencias de tema usando DataStore
 *
 * Uso:
 * ```
 * val themePreferences = ThemePreferences.getInstance(context)
 *
 * // Observar cambios
 * themePreferences.themeMode.collect { mode ->
 *     // Aplicar tema
 * }
 *
 * // Cambiar tema
 * themePreferences.setThemeMode(ThemeMode.DARK)
 * ```
 */
class ThemePreferences private constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private const val DATASTORE_NAME = "theme_preferences"
        private val THEME_MODE_KEY = stringPreferencesKey("theme_mode")

        // Extension property para garantizar un único DataStore
        private val Context.themeDataStore: DataStore<Preferences> by preferencesDataStore(
            name = DATASTORE_NAME
        )

        @Volatile
        private var INSTANCE: ThemePreferences? = null

        fun getInstance(context: Context): ThemePreferences {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ThemePreferences(context.applicationContext.themeDataStore).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * Flow que emite el modo de tema actual
     * Por defecto es SYSTEM si no hay preferencia guardada
     */
    val themeMode: Flow<ThemeMode> = dataStore.data.map { preferences ->
        val modeName = preferences[THEME_MODE_KEY] ?: ThemeMode.SYSTEM.name
        try {
            ThemeMode.valueOf(modeName)
        } catch (e: IllegalArgumentException) {
            ThemeMode.SYSTEM
        }
    }

    /**
     * Guardar la preferencia de tema
     */
    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { preferences ->
            preferences[THEME_MODE_KEY] = mode.name
        }
    }

    /**
     * Verificar si está en modo oscuro según la preferencia actual
     * Útil para determinar el tema real cuando el modo es SYSTEM
     */
    fun isDarkMode(mode: ThemeMode, isSystemInDarkTheme: Boolean): Boolean {
        return when (mode) {
            ThemeMode.SYSTEM -> isSystemInDarkTheme
            ThemeMode.LIGHT -> false
            ThemeMode.DARK -> true
        }
    }
}