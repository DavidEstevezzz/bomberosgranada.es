package es.bomberosgranada.app.data.api

import android.content.Context
import es.bomberosgranada.app.data.local.TokenManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Cliente Retrofit para todas las llamadas a la API
 *
 * Configuración:
 * - Base URL: api.bomberosgranada.es
 * - Timeout: 60 segundos
 * - Logging: BODY level (desarrollo)
 * - Auth: Interceptor automático con token
 */
object RetrofitClient {
    private const val BASE_URL = "https://api.bomberosgranada.es/"

    private var tokenManager: TokenManager? = null

    /**
     * Inicializar con contexto para acceder al TokenManager
     */
    fun initialize(context: Context) {
        tokenManager = TokenManager(context)
    }

    /**
     * Interceptor de autenticación
     * Añade el token Bearer automáticamente a todas las peticiones
     */
    private val authInterceptor = Interceptor { chain: Interceptor.Chain ->
        val originalRequest: Request = chain.request()

        val token: String? = runBlocking {
            tokenManager?.getToken()?.first()
        }

        val newRequest: Request = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Accept", "application/json")
                .build()
        } else {
            originalRequest.newBuilder()
                .header("Accept", "application/json")
                .build()
        }

        chain.proceed(newRequest)
    }

    /**
     * Interceptor de logging
     * Muestra detalles de las peticiones HTTP en Logcat
     */
    private val loggingInterceptor: HttpLoggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    /**
     * Cliente HTTP con interceptores
     */
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    /**
     * Instancia de Retrofit
     * Usada por ApiClient para crear servicios
     */
    internal val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(httpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}