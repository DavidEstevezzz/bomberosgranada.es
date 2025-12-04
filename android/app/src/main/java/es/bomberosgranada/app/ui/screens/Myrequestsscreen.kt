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

// Type alias
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel.*
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*
private typealias Request = RequestItem

// ============================================
// COLORES DEL DISEÑO
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentPurple = Color(0xFF8B5CF6)
private val AccentGreen = Color(0xFF10B981)
private val AccentAmber = Color(0xFFF59E0B)
private val AccentRose = Color(0xFFEF4444)
private val AccentSky = Color(0xFF0EA5E9)
private val AccentEmerald = Color(0xFF059669)
private val SurfaceElevated = Color(0xFFF8FAFC)
private val BackgroundColor = Color(0xFFF1F5F9)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val CardBackground = Color(0xFFFFFFFF)
private val ErrorRed = Color(0xFFEF4444)
private val SuccessGreen = Color(0xFF22C55E)

// Colores por estado
private val StatusColors = mapOf(
    "Pendiente" to AccentBlue,
    "En trámite" to AccentAmber,
    "Aceptado por empleados" to AccentSky,
    "Aceptado" to AccentEmerald,
    "Confirmada" to AccentEmerald,
    "Rechazado" to AccentRose,
    "Cancelada" to Color(0xFF64748B),
    "Denegada" to AccentRose
)

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

    // Mostrar mensajes
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(message = it, duration = SnackbarDuration.Long)
            viewModel.clearError()
        }
    }

    LaunchedEffect(successMessage) {
        successMessage?.let {
            snackbarHostState.showSnackbar(message = it, duration = SnackbarDuration.Short)
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
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                currentUser == null -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingIndicator(message = "Cargando usuario...")
                    }
                }
                uiState is MyRequestsUiState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingIndicator(message = "Cargando solicitudes...")
                    }
                }
                uiState is MyRequestsUiState.Error -> {
                    ErrorContent(
                        message = (uiState as MyRequestsUiState.Error).message,
                        onRetry = { viewModel.loadData(currentUser) },
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Header con navegación de mes
                        item {
                            MonthHeader(
                                currentMonth = currentMonth,
                                stats = viewModel.getStats(),
                                onPreviousMonth = { viewModel.previousMonth(currentUser) },
                                onNextMonth = { viewModel.nextMonth(currentUser) }
                            )
                        }

                        // Sección de Solicitudes de Permisos
                        item {
                            SectionHeader(
                                title = "Solicitudes de Permisos",
                                subtitle = "Vacaciones, asuntos propios y otros permisos",
                                icon = Icons.Rounded.Description,
                                accentColor = AccentBlue,
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
                                    onCancel = { viewModel.cancelRequest(request.id, currentUser) }
                                )
                            }
                        }

                        // Sección de Cambios de Guardia Simples
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader(
                                title = "Cambios de Guardia Simples",
                                subtitle = "Intercambio de una guardia con un compañero",
                                icon = Icons.Rounded.SwapHoriz,
                                accentColor = AccentPurple,
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
                                ShiftChangeCard(
                                    change = change,
                                    isMirror = false,
                                    viewModel = viewModel,
                                    currentUser = currentUser,
                                    isUpdating = updatingItemId == change.id,
                                    onAccept = { viewModel.acceptShiftChange(change.id, currentUser) },
                                    onReject = { viewModel.rejectShiftChange(change.id, currentUser) }
                                )
                            }
                        }

                        // Sección de Cambios de Guardia Espejo
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader(
                                title = "Cambios de Guardia Espejo",
                                subtitle = "Intercambio doble entre dos fechas",
                                icon = Icons.Rounded.CompareArrows,
                                accentColor = AccentOrange,
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
                                ShiftChangeCard(
                                    change = change,
                                    isMirror = true,
                                    viewModel = viewModel,
                                    currentUser = currentUser,
                                    isUpdating = updatingItemId == change.id,
                                    onAccept = { viewModel.acceptShiftChange(change.id, currentUser) },
                                    onReject = { viewModel.rejectShiftChange(change.id, currentUser) }
                                )
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
                    containerColor = if (errorMessage != null) ErrorRed else SuccessGreen,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
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
                        brush = Brush.horizontalGradient(
                            colors = listOf(GradientStart, GradientEnd)
                        )
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
                    Text(
                        text = "Consulta y gestiona tus solicitudes del mes",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }

            // Navegación de mes
            Surface(
                color = CardBackground
            ) {
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
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronLeft,
                                contentDescription = "Mes anterior",
                                tint = TextPrimary
                            )
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = monthName,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "${currentMonth.year}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }

                        IconButton(
                            onClick = onNextMonth,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Mes siguiente",
                                tint = TextPrimary
                            )
                        }
                    }

                    // Estadísticas
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatChip(
                            label = "Permisos",
                            value = stats.requestsCount,
                            color = AccentBlue
                        )
                        StatChip(
                            label = "Simples",
                            value = stats.simpleChangesCount,
                            color = AccentPurple
                        )
                        StatChip(
                            label = "Espejo",
                            value = stats.mirrorChangesCount,
                            color = AccentOrange
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(
    label: String,
    value: Int,
    color: Color
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = value.toString(),
                style = MaterialTheme.typography.titleMedium,
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
                color = TextPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
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
    val statusNormalized = viewModel.normalizeState(request.estado)
    val statusColor = StatusColors[statusNormalized] ?: TextSecondary
    val canCancel = viewModel.canCancelRequest(request)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
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
                    color = AccentBlue.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = request.tipo.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = AccentBlue,
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
                        color = TextSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Botón de cancelar
            if (canCancel) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = SurfaceElevated)
                Spacer(modifier = Modifier.height(12.dp))

                ActionButton(
                    text = "Cancelar",
                    icon = Icons.Default.Close,
                    color = AccentRose,
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
    val statusNormalized = viewModel.normalizeState(change.estado)
    val statusColor = StatusColors[statusNormalized] ?: TextSecondary
    val actions = viewModel.getShiftChangeActions(change, currentUser)
    val accentColor = if (isMirror) AccentOrange else AccentPurple

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
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
                    color = AccentBlue
                )

                Icon(
                    imageVector = Icons.Default.SwapHoriz,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(24.dp)
                )

                // Empleado 2
                EmployeeChip(
                    name = change.empleado2?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado 2",
                    isCurrentUser = change.id_empleado2 == currentUser.id_empleado,
                    color = AccentPurple
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Fechas
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                InfoItem(
                    icon = Icons.Default.CalendarToday,
                    label = "Fecha",
                    value = formatDate(change.fecha)
                )
                if (isMirror && change.fecha2 != null) {
                    InfoItem(
                        icon = Icons.Default.Event,
                        label = "Fecha 2",
                        value = formatDate(change.fecha2)
                    )
                }
            }

            // Turno
            Spacer(modifier = Modifier.height(8.dp))
            InfoItem(
                icon = Icons.Default.Schedule,
                label = "Turno",
                value = change.turno
            )

            // Motivo si existe
            if (change.motivo.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = change.motivo,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Acciones
            if (actions != ShiftChangeActions.NONE) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = SurfaceElevated)
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (actions == ShiftChangeActions.CAN_ACCEPT_REJECT) {
                        ActionButton(
                            text = "Aceptar",
                            icon = Icons.Default.Check,
                            color = AccentEmerald,
                            isLoading = isUpdating,
                            onClick = onAccept,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    ActionButton(
                        text = "Rechazar",
                        icon = Icons.Default.Close,
                        color = AccentRose,
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
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = TextSecondary,
            modifier = Modifier.size(16.dp)
        )
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = TextPrimary
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
    val initials = name.split(" ")
        .take(2)
        .mapNotNull { it.firstOrNull()?.uppercase() }
        .joinToString("")

    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(if (isCurrentUser) color else color.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initials,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = if (isCurrentUser) Color.White else color
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = name.split(" ").first(),
            style = MaterialTheme.typography.labelSmall,
            color = if (isCurrentUser) color else TextSecondary,
            fontWeight = if (isCurrentUser) FontWeight.SemiBold else FontWeight.Normal
        )
        if (isCurrentUser) {
            Text(
                text = "(Tú)",
                style = MaterialTheme.typography.labelSmall,
                color = color,
                fontWeight = FontWeight.Bold
            )
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
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
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
                tint = TextSecondary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = AccentRose,
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                color = AccentRose,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = AccentOrange)
            ) {
                Icon(Icons.Rounded.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Reintentar")
            }
        }
    }
}

// ============================================
// HELPERS
// ============================================

private fun formatDate(dateString: String): String {
    return try {
        val date = java.time.LocalDate.parse(dateString, DateTimeFormatter.ISO_LOCAL_DATE)
        date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    } catch (e: Exception) {
        dateString
    }
}

