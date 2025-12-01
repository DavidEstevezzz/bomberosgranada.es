package es.bomberosgranada.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

/**
 * Manager para gestionar el token de autenticación usando DataStore
 */
class TokenManager private constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private const val DATASTORE_NAME = "auth_preferences"
        private val TOKEN_KEY = stringPreferencesKey("auth_token")


        // Extension property a nivel de archivo para garantizar un único DataStore
        private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
            name = DATASTORE_NAME
        )

        @Volatile
        private var INSTANCE: TokenManager? = null

        fun getInstance(context: Context): TokenManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: TokenManager(context.applicationContext.dataStore).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * Propiedad para acceder al token como Flow
     * (Compatible con RetrofitClient)
     */
    val tokenFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    /**
     * Obtener el token como Flow
     */
    fun getToken(): Flow<String?> = tokenFlow

    /**
     * Guardar el token
     */
    suspend fun saveToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    /**
     * Limpiar el token (logout)
     */
    suspend fun clearToken() {
        dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
        }
    }

    suspend fun getTokenSync(): String? = dataStore.data.first()[TOKEN_KEY]

}