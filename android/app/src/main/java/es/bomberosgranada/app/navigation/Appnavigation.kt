package es.bomberosgranada.app.navigation

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import es.bomberosgranada.app.data.repositories.*
import es.bomberosgranada.app.ui.screens.CreateRequestScreen
import es.bomberosgranada.app.ui.screens.DashboardScreen
import es.bomberosgranada.app.ui.screens.GuardDetailScreen
import es.bomberosgranada.app.ui.screens.LoginScreen
import es.bomberosgranada.app.viewmodels.AuthViewModel
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import es.bomberosgranada.app.viewmodels.GuardDetailViewModel
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Construction
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp

/**
 * Navigation Host principal de la aplicación
 *
 * Maneja todas las rutas y la navegación entre pantallas.
 * Ahora con soporte para navegación por drawer lateral.
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
    guardAssignmentsRepository: GuardAssignmentsRepository,
    extraHoursRepository: ExtraHoursRepository
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()
    val currentUser by authViewModel.currentUser.collectAsState()

    // Estado para mensajes no leídos (ejemplo, conectar con repo real)
    var unreadMessagesCount by remember { mutableStateOf(0) }

    // Cargar conteo de mensajes no leídos
    LaunchedEffect(currentUser) {
        currentUser?.let {
            // TODO: Conectar con messagesRepository.getUnreadCount()
            // unreadMessagesCount = messagesRepository.getUnreadCount()
        }
    }

    // Determinar ruta inicial
    val startDestination = if (isAuthenticated) {
        Screen.Dashboard.route
    } else {
        Screen.Login.route
    }

    // Función de navegación común
    val onNavigate: (String) -> Unit = { route ->
        navController.navigate(route) {
            // Evitar múltiples copias en el back stack
            launchSingleTop = true
            // Restaurar estado si existe
            restoreState = true
        }
    }

    // Función de logout
    val onLogout: () -> Unit = {
        authViewModel.logout()
        navController.navigate(Screen.Login.route) {
            popUpTo(0) { inclusive = true }
        }
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
        // DASHBOARD (INICIO)
        // ==========================================

        composable(route = Screen.Dashboard.route) {
            val dashboardViewModel = remember {
                DashboardViewModel(
                    guardsRepository = guardsRepository,
                    brigadesRepository = brigadesRepository
                )
            }

            DashboardScreen(
                viewModel = dashboardViewModel,
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                onNavigateToGuard = { guardId, brigadeId, parkId, date ->
                    navController.navigate(
                        Screen.GuardAttendance.createRoute(guardId, brigadeId, parkId, date)
                    )
                },
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // CREAR SOLICITUD
        // ==========================================

        composable(route = Screen.CreateRequest.route) {
            val createRequestViewModel = remember {
                CreateRequestViewModel(
                    requestsRepository = requestsRepository,
                    guardsRepository = guardsRepository,
                    assignmentsRepository = assignmentsRepository
                )
            }

            CreateRequestScreen(
                viewModel = createRequestViewModel,
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                onBack = { navController.popBackStack() },
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // DETALLE DE GUARDIA
        // ==========================================

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

            val guardDetailViewModel = remember {
                GuardDetailViewModel(
                    guardsRepository = guardsRepository,
                    brigadeCompositionRepository = brigadeCompositionRepository,
                    brigadesRepository = brigadesRepository,
                    guardAssignmentsRepository = guardAssignmentsRepository
                )
            }

            GuardDetailScreen(
                guardId = guardId,
                brigadeId = brigadeId,
                parkId = parkId,
                date = date,
                viewModel = guardDetailViewModel,
                currentUser = currentUser,
                onBack = { navController.popBackStack() }
            )
        }

        // ==========================================
        // MENSAJES (Placeholder)
        // ==========================================

        composable(route = Screen.Messages.route) {
            // TODO: Implementar MessagesScreen con AppScaffold
            PlaceholderScreen(
                title = "Mensajes",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // SOLICITUDES (Lista)
        // ==========================================

        composable(route = Screen.Requests.route) {
            // TODO: Implementar RequestsListScreen con AppScaffold
            PlaceholderScreen(
                title = "Mis Solicitudes",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // CAMBIOS DE TURNO
        // ==========================================

        composable(route = Screen.ShiftChanges.route) {
            // TODO: Implementar ShiftChangesScreen con AppScaffold
            PlaceholderScreen(
                title = "Cambios de Guardia",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // SUGERENCIAS
        // ==========================================

        composable(route = "suggestions") {
            // TODO: Implementar SuggestionsScreen con AppScaffold
            PlaceholderScreen(
                title = "Sugerencias",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // PERFIL
        // ==========================================

        composable(route = Screen.Profile.route) {
            // TODO: Implementar ProfileScreen con AppScaffold
            PlaceholderScreen(
                title = "Mi Perfil",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }

        // ==========================================
        // AJUSTES
        // ==========================================

        composable(route = Screen.Settings.route) {
            // TODO: Implementar SettingsScreen con AppScaffold
            PlaceholderScreen(
                title = "Ajustes",
                currentUser = currentUser,
                onNavigate = onNavigate,
                onLogout = onLogout,
                unreadMessagesCount = unreadMessagesCount
            )
        }
    }
}

// ==========================================
// PLACEHOLDER SCREEN
// ==========================================

@Composable
private fun PlaceholderScreen(
    title: String,
    currentUser: es.bomberosgranada.app.data.models.User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    unreadMessagesCount: Int
) {
    es.bomberosgranada.app.ui.components.AppScaffold(
        currentRoute = title.lowercase().replace(" ", "-"),
        title = title,
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        unreadMessagesCount = unreadMessagesCount
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Construction,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = androidx.compose.ui.graphics.Color(0xFF64748B)
                )
                Text(
                    text = "Próximamente",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                    color = androidx.compose.ui.graphics.Color(0xFF1A1A2E)
                )
                Text(
                    text = "Esta sección está en desarrollo",
                    style = MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.ui.graphics.Color(0xFF64748B)
                )
            }
        }
    }
}


