package es.bomberosgranada.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import es.bomberosgranada.app.data.local.TokenManager
import es.bomberosgranada.app.data.repositories.AuthRepository
import es.bomberosgranada.app.ui.screens.DashboardScreen
import es.bomberosgranada.app.ui.screens.LoginScreen
import es.bomberosgranada.app.ui.theme.BomberosGranadaTheme
import es.bomberosgranada.app.ui.viewmodels.AuthViewModel
import es.bomberosgranada.app.ui.viewmodels.AuthViewModelFactory
import es.bomberosgranada.app.ui.viewmodels.AuthState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val tokenManager = TokenManager(this)
        val authRepository = AuthRepository()

        setContent {
            BomberosGranadaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(
                        authRepository = authRepository,
                        tokenManager = tokenManager
                    )
                }
            }
        }
    }
}

@Composable
fun AppNavigation(
    authRepository: AuthRepository,
    tokenManager: TokenManager
) {
    val navController = rememberNavController()

    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModelFactory(authRepository, tokenManager)
    )

    val authState by authViewModel.authState.collectAsState()

    // Determinar ruta inicial basada en el estado de autenticación
    val startDestination = when (authState) {
        is AuthState.Authenticated -> "dashboard"
        else -> "login"
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable("login") {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("dashboard") {
            DashboardScreen(
                viewModel = authViewModel,
                onLogout = {
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
    }
}