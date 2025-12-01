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
 * Manager para gestionar el token de autenticación usando DataStore
 */
class TokenManager(private val context: Context) {

    companion object {
        private const val DATASTORE_NAME = "auth_preferences"
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
    }

    // Extension property para crear el DataStore
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
        name = DATASTORE_NAME
    )

    /**
     * Obtener el token como Flow
     */
    fun getToken(): Flow<String?> {
        return context.dataStore.data.map { preferences ->
            preferences[TOKEN_KEY]
        }
    }

    /**
     * Guardar el token
     */
    suspend fun saveToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    /**
     * Limpiar el token (logout)
     */
    suspend fun clearToken() {
        context.dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
        }
    }

    /**
     * Obtener el token de forma síncrona (para el Interceptor)
     */
    suspend fun getTokenSync(): String? {
        var token: String? = null
        context.dataStore.data.map { preferences ->
            token = preferences[TOKEN_KEY]
        }.collect { }
        return token
    }
}