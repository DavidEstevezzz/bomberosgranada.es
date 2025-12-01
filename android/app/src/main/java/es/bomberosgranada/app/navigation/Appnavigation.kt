package es.bomberosgranada.app.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import es.bomberosgranada.app.data.repositories.*
import es.bomberosgranada.app.ui.screens.DashboardScreen
import es.bomberosgranada.app.ui.screens.GuardDetailScreen
import es.bomberosgranada.app.ui.screens.LoginScreen
import es.bomberosgranada.app.viewmodels.AuthViewModel
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import es.bomberosgranada.app.viewmodels.GuardDetailViewModel

/**
 * Navigation Host principal de la aplicación
 *
 * Maneja todas las rutas y la navegación entre pantallas
 */
@Composable
fun AppNavigation(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    // Repositories
    guardsRepository: GuardsRepository,
    brigadesRepository: BrigadesRepository,
    messagesRepository: MessagesRepository,
    assignmentsRepository: AssignmentsRepository,
    requestsRepository: RequestsRepository,
    shiftChangeRepository: ShiftChangeRequestsRepository,
    incidentsRepository: IncidentsRepository,
    interventionsRepository: InterventionsRepository,
    vehiclesRepository: VehiclesRepository,
    parksRepository: ParksRepository,
    usersRepository: UsersRepository,
    suggestionsRepository: SuggestionsRepository,
    transfersRepository: TransfersRepository,
    personalEquipmentRepository: PersonalEquipmentRepository,
    clothingItemsRepository: ClothingItemsRepository,
    brigadeCompositionRepository: BrigadeCompositionRepository,
    brigadeUsersRepository: BrigadeUsersRepository,
    extraHoursRepository: ExtraHoursRepository
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    // Determinar ruta inicial
    val startDestination = if (isAuthenticated) {
        Screen.Dashboard.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // ==========================================
        // AUTENTICACIÓN
        // ==========================================

        composable(route = Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // ==========================================
        // DASHBOARD
        // ==========================================

        composable(route = Screen.Dashboard.route) {
            val dashboardViewModel = DashboardViewModel(
                guardsRepository = guardsRepository,
                brigadesRepository = brigadesRepository
            )

            DashboardScreen(
                viewModel = dashboardViewModel,
                onNavigateToGuard = { guardId, brigadeId, parkId, date ->
                    navController.navigate(
                        Screen.GuardAttendance.createRoute(guardId, brigadeId, parkId, date)
                    )
                }
            )
        }

        // ==========================================
        // DETALLE DE BRIGADA
        // ==========================================

        composable(
            route = Screen.BrigadeDetail.route,
            arguments = listOf(
                navArgument("brigadeId") { type = NavType.IntType },
                navArgument("date") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val brigadeId = backStackEntry.arguments?.getInt("brigadeId") ?: 0
            val date = backStackEntry.arguments?.getString("date")

            // TODO: Crear BrigadeDetailScreen cuando tengamos el ViewModel
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Detalle de Brigada $brigadeId\nFecha: $date",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // GUARDIAS
        // ==========================================

        composable(route = Screen.Guards.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Guardias",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        composable(
            route = Screen.GuardAttendance.route,
            arguments = listOf(
                navArgument("guardId") { type = NavType.IntType },
                navArgument("brigadeId") { type = NavType.IntType },
                navArgument("parkId") { type = NavType.IntType },
                navArgument("date") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val guardId = backStackEntry.arguments?.getInt("guardId") ?: 0
            val brigadeId = backStackEntry.arguments?.getInt("brigadeId") ?: 0
            val parkId = backStackEntry.arguments?.getInt("parkId") ?: 0
            val date = backStackEntry.arguments?.getString("date") ?: ""

            val guardDetailViewModel = GuardDetailViewModel(
                guardsRepository = guardsRepository,
                brigadeCompositionRepository = brigadeCompositionRepository
            )

            GuardDetailScreen(
                guardId = guardId,
                brigadeId = brigadeId,
                parkId = parkId,
                date = date,
                viewModel = guardDetailViewModel,
                onBack = { navController.popBackStack() }
            )
        }


        composable(
            route = Screen.GuardDetail.route,
            arguments = listOf(
                navArgument("guardId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val guardId = backStackEntry.arguments?.getInt("guardId") ?: 0

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Detalle de Guardia $guardId",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // MENSAJES
        // ==========================================

        composable(route = Screen.Messages.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Mensajes",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        composable(
            route = Screen.MessageDetail.route,
            arguments = listOf(
                navArgument("messageId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val messageId = backStackEntry.arguments?.getInt("messageId") ?: 0

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Detalle de Mensaje $messageId",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // SOLICITUDES
        // ==========================================

        composable(route = Screen.Requests.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Solicitudes",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // CAMBIOS DE TURNO
        // ==========================================

        composable(route = Screen.ShiftChanges.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Cambios de Turno",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // INCIDENCIAS
        // ==========================================

        composable(route = Screen.Incidents.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Incidencias",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // INTERVENCIONES
        // ==========================================

        composable(route = Screen.Interventions.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Intervenciones",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // USUARIOS
        // ==========================================

        composable(route = Screen.Users.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Usuarios",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // PERFIL
        // ==========================================

        composable(route = Screen.Profile.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Perfil",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }

        // ==========================================
        // CONFIGURACIÓN
        // ==========================================

        composable(route = Screen.Settings.route) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Pantalla de Configuración",
                    style = MaterialTheme.typography.titleLarge
                )
            }
        }
    }
}