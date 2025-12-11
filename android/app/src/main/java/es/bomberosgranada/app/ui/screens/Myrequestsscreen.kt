package es.bomberosgranada.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.RequestItem
import es.bomberosgranada.app.data.models.ShiftChangeRequest
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel.*
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

// Type alias
private typealias Request = RequestItem

// ============================================
// PANTALLA PRINCIPAL
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyRequestsScreen(
    viewModel: MyRequestsViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0
) {
    // Colores del tema
    val errorColor = AppColors.error
    val successColor = AppColors.success

    val uiState by viewModel.uiState.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()
    val requests by viewModel.requests.collectAsState()
    val simpleShiftChanges by viewModel.simpleShiftChanges.collectAsState()
    val mirrorShiftChanges by viewModel.mirrorShiftChanges.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()
    val updatingItemId by viewModel.updatingItemId.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    // Cargar datos cuando el usuario está disponible
    LaunchedEffect(currentUser, currentMonth) {
        currentUser?.let {
            viewModel.loadData(it)
        }
    }

    // Mostrar mensajes de error/éxito
    LaunchedEffect(errorMessage, successMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
        successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSuccess()
        }
    }

    AppScaffold(
        currentRoute = "my-requests",
        title = "Mis Solicitudes",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        showBackButton = true,
        onBack = onBack,
        unreadMessagesCount = unreadMessagesCount
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is MyRequestsViewModel.MyRequestsUiState.Loading -> {
                    LoadingIndicator(message = "Cargando solicitudes...")
                }

                is MyRequestsViewModel.MyRequestsUiState.Error -> {
                    ErrorContent(
                        message = (uiState as MyRequestsViewModel.MyRequestsUiState.Error).message,
                        onRetry = { currentUser?.let { viewModel.loadData(it) } }
                    )
                }

                is MyRequestsViewModel.MyRequestsUiState.Success -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Header con navegación de mes
                        item {
                            MonthHeader(
                                currentMonth = currentMonth,
                                stats = viewModel.getStats(),
                                onPreviousMonth = { currentUser?.let { viewModel.previousMonth(it) } },
                                onNextMonth = { currentUser?.let { viewModel.nextMonth(it) } }
                            )
                        }

                        // Sección de Solicitudes de Permisos
                        item {
                            SectionHeader(
                                title = "Solicitudes de Permisos",
                                subtitle = "Vacaciones, asuntos propios y otros permisos",
                                icon = Icons.Rounded.Description,
                                accentColor = AppColors.accentBlue,
                                count = requests.size
                            )
                        }

                        if (requests.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "No hay solicitudes de permisos este mes",
                                    icon = Icons.Rounded.EventBusy
                                )
                            }
                        } else {
                            items(requests, key = { it.id }) { request ->
                                RequestCard(
                                    request = request,
                                    viewModel = viewModel,
                                    isUpdating = updatingItemId == request.id,
                                    onCancel = { currentUser?.let { viewModel.cancelRequest(request.id, it) } }                                )
                            }
                        }

                        // Sección de Cambios de Guardia Simples
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader(
                                title = "Cambios de Guardia Simples",
                                subtitle = "Intercambio de una guardia con un compañero",
                                icon = Icons.Rounded.SwapHoriz,
                                accentColor = AppColors.accentPurple,
                                count = simpleShiftChanges.size
                            )
                        }

                        if (simpleShiftChanges.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "No hay cambios de guardia simples este mes",
                                    icon = Icons.Rounded.SyncDisabled
                                )
                            }
                        } else {
                            items(simpleShiftChanges, key = { it.id }) { change ->
                                currentUser?.let { user ->
                                    ShiftChangeCard(
                                        change = change,
                                        isMirror = false,
                                        viewModel = viewModel,
                                        currentUser = user,
                                        isUpdating = updatingItemId == change.id,
                                        onAccept = { viewModel.acceptShiftChange(change.id, user) },
                                        onReject = { viewModel.rejectShiftChange(change.id, user) }
                                    )
                                }
                            }
                        }

                        // Sección de Cambios de Guardia Espejo
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader(
                                title = "Cambios de Guardia Espejo",
                                subtitle = "Intercambio doble entre dos fechas",
                                icon = Icons.Rounded.CompareArrows,
                                accentColor = AppColors.accentOrange,
                                count = mirrorShiftChanges.size
                            )
                        }

                        if (mirrorShiftChanges.isEmpty()) {
                            item {
                                EmptyStateCard(
                                    message = "No hay cambios de guardia espejo este mes",
                                    icon = Icons.Rounded.SyncDisabled
                                )
                            }
                        } else {
                            items(mirrorShiftChanges, key = { it.id }) { change ->
                                currentUser?.let { user ->
                                    ShiftChangeCard(
                                        change = change,
                                        isMirror = true,
                                        viewModel = viewModel,
                                        currentUser = user,
                                        isUpdating = updatingItemId == change.id,
                                        onAccept = { viewModel.acceptShiftChange(change.id, user) },
                                        onReject = { viewModel.rejectShiftChange(change.id, user) }
                                    )
                                }
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(32.dp))
                        }
                    }
                }
            }

            // Snackbar
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = if (errorMessage != null) errorColor else successColor,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

// ============================================
// CONTENIDO DE ERROR
// ============================================

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    val accentOrange = AppColors.accentOrange

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = accentOrange)
            ) {
                Icon(Icons.Rounded.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Reintentar")
            }
        }
    }
}

// ============================================
// HEADER CON NAVEGACIÓN DE MES
// ============================================

@Composable
private fun MonthHeader(
    currentMonth: YearMonth,
    stats: MyRequestsViewModel.Stats,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    // Colores del tema
    val gradientColors = AppColors.gradientPrimary
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple
    val accentOrange = AppColors.accentOrange

    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column {
            // Gradiente con título
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.horizontalGradient(colors = gradientColors)
                    )
                    .padding(24.dp)
            ) {
                Column {
                    Text(
                        text = "SEGUIMIENTO MENSUAL",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.7f),
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Mis Solicitudes",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            // Navegación de mes
            Surface(color = cardBackground) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onPreviousMonth,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(surfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronLeft,
                                contentDescription = "Mes anterior",
                                tint = textPrimary
                            )
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = monthName,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                            Text(
                                text = "${currentMonth.year}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = textSecondary
                            )
                        }

                        IconButton(
                            onClick = onNextMonth,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(surfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Mes siguiente",
                                tint = textPrimary
                            )
                        }
                    }

                    // Stats
                    HorizontalDivider(color = surfaceElevated)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatItem(
                            value = stats.requestsCount.toString(),
                            label = "Permisos",
                            color = accentBlue
                        )
                        StatItem(
                            value = stats.simpleChangesCount.toString(),
                            label = "Simples",
                            color = accentPurple
                        )
                        StatItem(
                            value = stats.mirrorChangesCount.toString(),
                            label = "Espejo",
                            color = accentOrange
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    value: String,
    label: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = color
        )
    }
}

// ============================================
// HEADERS DE SECCIÓN
// ============================================

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    count: Int
) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(accentColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(24.dp)
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = textPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = textSecondary
            )
        }
        Surface(
            shape = CircleShape,
            color = accentColor
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
            )
        }
    }
}

// ============================================
// CARD DE SOLICITUD DE PERMISO
// ============================================

@Composable
private fun RequestCard(
    request: Request,
    viewModel: MyRequestsViewModel,
    isUpdating: Boolean,
    onCancel: () -> Unit
) {
    val cardBackground = AppColors.cardBackground
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue
    val accentRose = AppColors.accentRose
    val dividerColor = AppColors.divider

    val statusNormalized = viewModel.normalizeState(request.estado)
    val statusColor = AppColors.getStatusColor(statusNormalized)
    val canCancel = viewModel.canCancelRequest(request)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Tipo y estado
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Tipo de solicitud
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = accentBlue.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = request.tipo.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = accentBlue,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                // Estado
                StatusBadge(status = statusNormalized, color = statusColor)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Fechas
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                InfoItem(
                    icon = Icons.Default.CalendarToday,
                    label = "Fecha inicio",
                    value = formatDate(request.fecha_ini)
                )
                request.fecha_fin?.let {
                    InfoItem(
                        icon = Icons.Default.Event,
                        label = "Fecha fin",
                        value = formatDate(it)
                    )
                }
            }

            // Turno si aplica
            request.turno?.let { turno ->
                if (turno.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoItem(
                        icon = Icons.Default.Schedule,
                        label = "Turno",
                        value = turno
                    )
                }
            }

            // Motivo si existe
            request.motivo?.let { motivo ->
                if (motivo.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = motivo,
                        style = MaterialTheme.typography.bodySmall,
                        color = textSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Botón de cancelar
            if (canCancel) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = dividerColor)
                Spacer(modifier = Modifier.height(12.dp))

                ActionButton(
                    text = "Cancelar",
                    icon = Icons.Default.Close,
                    color = accentRose,
                    isLoading = isUpdating,
                    onClick = onCancel
                )
            }
        }
    }
}

// ============================================
// CARD DE CAMBIO DE GUARDIA
// ============================================

@Composable
private fun ShiftChangeCard(
    change: ShiftChangeRequest,
    isMirror: Boolean,
    viewModel: MyRequestsViewModel,
    currentUser: User,
    isUpdating: Boolean,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    val cardBackground = AppColors.cardBackground
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple
    val accentOrange = AppColors.accentOrange
    val accentEmerald = AppColors.accentEmerald
    val accentRose = AppColors.accentRose
    val dividerColor = AppColors.divider

    val statusNormalized = viewModel.normalizeState(change.estado)
    val statusColor = AppColors.getStatusColor(statusNormalized)
    val actions = viewModel.getShiftChangeActions(change, currentUser)
    val accentColor = if (isMirror) accentOrange else accentPurple

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header con tipo y estado
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = accentColor.copy(alpha = 0.1f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = if (isMirror) Icons.Default.CompareArrows else Icons.Default.SwapHoriz,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = if (isMirror) "Espejo" else "Simple",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = accentColor
                        )
                    }
                }

                StatusBadge(status = statusNormalized, color = statusColor)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Empleados
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Empleado 1
                EmployeeChip(
                    name = change.empleado1?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado 1",
                    isCurrentUser = change.id_empleado1 == currentUser.id_empleado,
                    color = accentBlue
                )

                Icon(
                    imageVector = Icons.Default.SwapHoriz,
                    contentDescription = null,
                    tint = textSecondary,
                    modifier = Modifier.size(24.dp)
                )

                // Empleado 2
                EmployeeChip(
                    name = change.empleado2?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado 2",
                    isCurrentUser = change.id_empleado2 == currentUser.id_empleado,
                    color = accentPurple
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Fechas
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                InfoItem(
                    icon = Icons.Default.CalendarToday,
                    label = "Fecha 1",
                    value = formatDate(change.fecha)
                )
                if (isMirror) {
                    change.fecha2?.let {
                        InfoItem(
                            icon = Icons.Default.Event,
                            label = "Fecha 2",
                            value = formatDate(it)
                        )
                    }
                }
            }

            // Acciones
            if (actions != ShiftChangeActions.NONE) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = dividerColor)
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (actions == ShiftChangeActions.CAN_ACCEPT_REJECT) {
                        ActionButton(
                            text = "Aceptar",
                            icon = Icons.Default.Check,
                            color = accentEmerald,
                            isLoading = isUpdating,
                            onClick = onAccept,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    ActionButton(
                        text = "Rechazar",
                        icon = Icons.Default.Close,
                        color = accentRose,
                        isLoading = isUpdating,
                        onClick = onReject,
                        modifier = if (actions == ShiftChangeActions.CAN_ACCEPT_REJECT) {
                            Modifier.weight(1f)
                        } else Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

@Composable
private fun StatusBadge(
    status: String,
    color: Color
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Text(
            text = status,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = color,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun InfoItem(
    icon: ImageVector,
    label: String,
    value: String
) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = textSecondary,
            modifier = Modifier.size(16.dp)
        )
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = textSecondary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = textPrimary
            )
        }
    }
}

@Composable
private fun EmployeeChip(
    name: String,
    isCurrentUser: Boolean,
    color: Color
) {
    val textPrimary = AppColors.textPrimary

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isCurrentUser) color.copy(alpha = 0.15f) else color.copy(alpha = 0.05f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                tint = if (isCurrentUser) color else textPrimary,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = name.split(" ").firstOrNull() ?: name,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (isCurrentUser) FontWeight.Bold else FontWeight.Normal,
                color = if (isCurrentUser) color else textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (isCurrentUser) {
                Text(
                    text = "(Tú)",
                    style = MaterialTheme.typography.labelSmall,
                    color = color
                )
            }
        }
    }
}

@Composable
private fun ActionButton(
    text: String,
    icon: ImageVector,
    color: Color,
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(40.dp),
        enabled = !isLoading,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = color,
            disabledContainerColor = color.copy(alpha = 0.5f)
        ),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(16.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun EmptyStateCard(
    message: String,
    icon: ImageVector
) {
    val surfaceElevated = AppColors.surfaceElevated
    val textSecondary = AppColors.textSecondary

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = surfaceElevated)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textSecondary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = textSecondary
            )
        }
    }
}

// ============================================
// UTILIDADES
// ============================================

private fun formatDate(dateString: String): String {
    return try {
        val inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val outputFormatter = DateTimeFormatter.ofPattern("d MMM", Locale("es", "ES"))
        val date = java.time.LocalDate.parse(dateString, inputFormatter)
        date.format(outputFormatter)
    } catch (e: Exception) {
        dateString
    }
}