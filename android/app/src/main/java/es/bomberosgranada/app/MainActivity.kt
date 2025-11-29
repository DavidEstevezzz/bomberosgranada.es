package es.bomberosgranada.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.bomberosgranada.data.local.TokenManager
import es.bomberosgranada.app.ui.navigation.Screen
import es.bomberosgranada.app.ui.screens.DashboardScreen
import es.bomberosgranada.app.ui.screens.LoginScreen
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.size
import com.example.bomberosgranada.data.api.RetrofitClient

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        class MainActivity : ComponentActivity() {
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)

                // Inicializar RetrofitClient con contexto
                RetrofitClient.initialize(applicationContext)

                setContent {
                    BomberosGranadaTheme {
                        Surface(
                            modifier = Modifier.fillMaxSize(),
                            color = Color(0xFF0F172A)
                        ) {
                            AppNavigation()
                        }
                    }
                }
            }
        }
        setContent {
            BomberosGranadaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F172A)
                ) {
                    AppNavigation()
                }
            }
        }

    }
}

@Composable
fun BomberosGranadaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFEF4444),
            secondary = Color(0xFF3B82F6),
            background = Color(0xFF0F172A),
            surface = Color(0xFF1E293B),
        ),
        content = content
    )
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }
    val scope = rememberCoroutineScope()

    var startDestination by remember { mutableStateOf<String?>(null) }

    // Verificar si hay sesión activa al iniciar
    LaunchedEffect(Unit) {
        val token = tokenManager.token.first()
        startDestination = if (token != null) {
            Screen.Dashboard.route
        } else {
            Screen.Login.route
        }
    }

    // Mostrar pantalla solo cuando se determine el destino inicial
    if (startDestination != null) {
        NavHost(
            navController = navController,
            startDestination = startDestination!!
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(Screen.Dashboard.route) { inclusive = true }
                        }
                    }
                )
            }
        }
    } else {
        // Pantalla de carga mientras verifica la sesión
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
                color = Color(0xFFEF4444),
                strokeWidth = 4.dp
            )
        }
    }
}