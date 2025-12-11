package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel.MyRequestsUiState
import es.bomberosgranada.app.viewmodels.MyRequestsViewModel.ShiftChangeActions
import es.bomberosgranada.app.viewmodels.ThemeViewModel
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyRequestsScreen(
    viewModel: MyRequestsViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null
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
    val accentGreen = AppColors.accentGreen
    val accentRose = AppColors.accentRose

    LaunchedEffect(Unit) {
        currentUser?.let { viewModel.loadData(it) }
    }

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
        unreadMessagesCount = unreadMessagesCount,
        themeViewModel = themeViewModel
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    MonthHeader(
                        currentMonth = currentMonth,
                        stats = viewModel.getStats(),
                        onPreviousMonth = { currentUser?.let { viewModel.previousMonth(it) } },
                        onNextMonth = { currentUser?.let { viewModel.nextMonth(it) } }
                    )
                }

                when (uiState) {
                    is MyRequestsUiState.Loading -> {
                        item { LoadingIndicator(message = "Cargando solicitudes...") }
                    }
                    is MyRequestsUiState.Error -> {
                        item {
                            ErrorContent(
                                message = (uiState as MyRequestsUiState.Error).message,
                                onRetry = { currentUser?.let { viewModel.loadData(it) } }
                            )
                        }
                    }
                    is MyRequestsUiState.Success -> {
                        // Solicitudes
                        item {
                            SectionHeader(
                                title = "Solicitudes de Permisos",
                                icon = Icons.Default.Description,
                                count = requests.size
                            )
                        }

                        if (requests.isEmpty()) {
                            item { EmptyStateCard("No hay solicitudes este mes", Icons.Outlined.Description) }
                        } else {
                            item {
                                RequestsTable(requests, currentUser, viewModel, updatingItemId)
                            }
                        }

                        // Cambios Simples
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader("Cambios Simples", Icons.Default.SwapHoriz, simpleShiftChanges.size)
                        }

                        if (simpleShiftChanges.isEmpty()) {
                            item { EmptyStateCard("No hay cambios simples este mes", Icons.Outlined.SwapHoriz) }
                        } else {
                            item {
                                ShiftChangesTable(simpleShiftChanges, false, currentUser, viewModel, updatingItemId)
                            }
                        }

                        // Cambios Espejo
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            SectionHeader("Cambios Espejo", Icons.Default.CompareArrows, mirrorShiftChanges.size)
                        }

                        if (mirrorShiftChanges.isEmpty()) {
                            item { EmptyStateCard("No hay cambios espejo este mes", Icons.Outlined.CompareArrows) }
                        } else {
                            item {
                                ShiftChangesTable(mirrorShiftChanges, true, currentUser, viewModel, updatingItemId)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(32.dp)) }
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = if (successMessage != null) accentGreen else accentRose,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
private fun MonthHeader(
    currentMonth: YearMonth,
    stats: MyRequestsViewModel.Stats,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val gradientColors = AppColors.gradientPrimary
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val textPrimary = AppColors.textPrimary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple
    val accentOrange = AppColors.accentOrange

    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Card(
        modifier = Modifier.fillMaxWidth().shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(brush = Brush.horizontalGradient(colors = gradientColors))
                    .padding(24.dp)
            ) {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "MIS SOLICITUDES",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.7f),
                        letterSpacing = 2.sp
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Control de permisos y cambios",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Surface(color = cardBackground) {
                Column {
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onPreviousMonth,
                            modifier = Modifier.size(40.dp).clip(CircleShape).background(surfaceElevated)
                        ) {
                            Icon(Icons.Rounded.ChevronLeft, "Mes anterior", tint = textPrimary)
                        }

                        Text(
                            "$monthName ${currentMonth.year}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )

                        IconButton(
                            onClick = onNextMonth,
                            modifier = Modifier.size(40.dp).clip(CircleShape).background(surfaceElevated)
                        ) {
                            Icon(Icons.Rounded.ChevronRight, "Mes siguiente", tint = textPrimary)
                        }
                    }

                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatChip("Solicitudes", stats.requestsCount.toString(), accentBlue)
                        StatChip("Simples", stats.simpleChangesCount.toString(), accentPurple)
                        StatChip("Espejo", stats.mirrorChangesCount.toString(), accentOrange)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(label: String, value: String, color: Color) {
    Surface(shape = RoundedCornerShape(12.dp), color = color.copy(alpha = 0.1f)) {
        Row(
            Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = color)
            Text(label, style = MaterialTheme.typography.labelSmall, color = color)
        }
    }
}

@Composable
private fun SectionHeader(title: String, icon: ImageVector, count: Int) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue

    Row(
        Modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(Modifier.size(4.dp, 24.dp).clip(RoundedCornerShape(2.dp)).background(accentBlue))
        Icon(icon, null, tint = textPrimary, modifier = Modifier.size(20.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = textPrimary)
        Text("($count)", style = MaterialTheme.typography.bodyMedium, color = textSecondary)
    }
}

@Composable
private fun RequestsTable(
    requests: List<RequestItem>,
    currentUser: User?,
    viewModel: MyRequestsViewModel,
    updatingItemId: Int?
) {
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val textSecondary = AppColors.textSecondary
    val dividerColor = AppColors.divider

    Card(
        modifier = Modifier.fillMaxWidth().shadow(6.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column {
            Surface(
                color = surfaceElevated,
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
            ) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Tipo",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(1.5f),
                        textAlign = TextAlign.Start   // <- o simplemente quita textAlign
                    )
                    Text(
                        "Fecha",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "Estado",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.End
                    )
                }
            }


            requests.forEachIndexed { index, request ->
                RequestTableRow(request, currentUser, viewModel, updatingItemId == request.id)
                if (index < requests.lastIndex) {
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), thickness = 1.dp, color = dividerColor)
                }
            }
        }
    }
}

@Composable
private fun RequestTableRow(
    request: RequestItem,
    currentUser: User?,
    viewModel: MyRequestsViewModel,
    isUpdating: Boolean
) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentRose = AppColors.accentRose
    val canCancel = request.estado == "Pendiente"

    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1.5f)) {
                Text(
                    request.tipo.replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center

                )
                request.turno?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.labelSmall, color = textSecondary)
                }
            }
            Text(
                formatDate(request.fecha_ini),
                style = MaterialTheme.typography.bodySmall,
                color = textSecondary,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )

            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.CenterEnd
            ) {
                StatusBadge(request.estado)
            }
        }

        if (canCancel) {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                SmallActionButton("Cancelar", Icons.Default.Close, accentRose, isUpdating) {
                    currentUser?.let { viewModel.cancelRequest(request.id, it) }
                }
            }
        }
    }
}

@Composable
private fun ShiftChangesTable(
    changes: List<ShiftChangeRequest>,
    isMirror: Boolean,
    currentUser: User?,
    viewModel: MyRequestsViewModel,
    updatingItemId: Int?
) {
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val textSecondary = AppColors.textSecondary
    val dividerColor = AppColors.divider

    Card(
        modifier = Modifier.fillMaxWidth().shadow(6.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column {
            Surface(
                color = surfaceElevated,
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Empleados",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(2f),
                        textAlign = TextAlign.Start
                    )
                    Text(
                        if (isMirror) "Fechas" else "Fecha",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "Estado",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textSecondary,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.End
                    )
                }
            }

            changes.forEachIndexed { index, change ->
                ShiftChangeTableRow(change, isMirror, currentUser, viewModel, updatingItemId == change.id)
                if (index < changes.lastIndex) {
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), thickness = 1.dp, color = dividerColor)
                }
            }
        }
    }
}

@Composable
private fun ShiftChangeTableRow(
    change: ShiftChangeRequest,
    isMirror: Boolean,
    currentUser: User?,
    viewModel: MyRequestsViewModel,
    isUpdating: Boolean
) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple
    val accentGreen = AppColors.accentGreen
    val accentRose = AppColors.accentRose

    val actions = currentUser?.let { viewModel.getShiftChangeActions(change, it) } ?: ShiftChangeActions.NONE

    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(2f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(accentBlue))
                    Text(
                        change.empleado1?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado 1",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = if (change.id_empleado1 == currentUser?.id_empleado) FontWeight.Bold else FontWeight.Normal,
                        color = if (change.id_empleado1 == currentUser?.id_empleado) accentBlue else textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(accentPurple))
                    Text(
                        change.empleado2?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado 2",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = if (change.id_empleado2 == currentUser?.id_empleado) FontWeight.Bold else FontWeight.Normal,
                        color = if (change.id_empleado2 == currentUser?.id_empleado) accentPurple else textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    formatDate(change.fecha),
                    style = MaterialTheme.typography.bodySmall,
                    color = textSecondary,
                    textAlign = TextAlign.Center
                )
                if (isMirror && change.fecha2 != null) {
                    Text(
                        formatDate(change.fecha2),
                        style = MaterialTheme.typography.bodySmall,
                        color = textSecondary,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.CenterEnd
            ) {
                StatusBadge(change.estado)
            }
        }

        if (actions != ShiftChangeActions.NONE) {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                when (actions) {
                    ShiftChangeActions.CAN_ACCEPT_REJECT -> {
                        SmallActionButton("Aceptar", Icons.Default.Check, accentGreen, isUpdating) {
                            currentUser?.let { viewModel.acceptShiftChange(change.id, it) }
                        }
                        Spacer(Modifier.width(8.dp))
                        SmallActionButton("Rechazar", Icons.Default.Close, accentRose, isUpdating) {
                            currentUser?.let { viewModel.rejectShiftChange(change.id, it) }
                        }
                    }
                    ShiftChangeActions.CAN_REJECT -> {
                        SmallActionButton("Cancelar", Icons.Default.Close, accentRose, isUpdating) {
                            currentUser?.let { viewModel.rejectShiftChange(change.id, it) }
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
private fun StatusBadge(estado: String) {
    val (backgroundColor, textColor) = getStatusColors(estado)
    Surface(shape = RoundedCornerShape(8.dp), color = backgroundColor) {
        Text(
            getStatusLabel(estado),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

private fun getStatusLabel(estado: String): String = when (estado.lowercase()) {
    "aceptado_por_empleados" -> "Por jefe"
    "en_tramite" -> "En trámite"
    else -> estado.replaceFirstChar { it.uppercase() }
}

@Composable
private fun getStatusColors(estado: String): Pair<Color, Color> {
    val accentGreen = AppColors.accentGreen
    val accentAmber = AppColors.accentAmber
    val accentRose = AppColors.accentRose
    val accentBlue = AppColors.accentBlue
    val textSecondary = AppColors.textSecondary
    val surfaceElevated = AppColors.surfaceElevated

    return when (estado.lowercase()) {
        "confirmada", "aceptado" -> accentGreen.copy(alpha = 0.15f) to accentGreen
        "aceptado_por_empleados" -> accentBlue.copy(alpha = 0.15f) to accentBlue
        "pendiente", "en_tramite" -> accentAmber.copy(alpha = 0.15f) to accentAmber
        "cancelada", "denegada", "rechazado" -> accentRose.copy(alpha = 0.15f) to accentRose
        else -> surfaceElevated to textSecondary
    }
}

@Composable
private fun SmallActionButton(text: String, icon: ImageVector, color: Color, isLoading: Boolean, onClick: () -> Unit) {
    Surface(onClick = onClick, enabled = !isLoading, shape = RoundedCornerShape(8.dp), color = color) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            if (isLoading) {
                CircularProgressIndicator(Modifier.size(14.dp), color = Color.White, strokeWidth = 2.dp)
            } else {
                Icon(icon, null, tint = Color.White, modifier = Modifier.size(14.dp))
                Text(text, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold, color = Color.White)
            }
        }
    }
}

@Composable
private fun EmptyStateCard(message: String, icon: ImageVector) {
    val surfaceElevated = AppColors.surfaceElevated
    val textSecondary = AppColors.textSecondary

    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = surfaceElevated)) {
        Row(Modifier.fillMaxWidth().padding(20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            Icon(icon, null, tint = textSecondary, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(12.dp))
            Text(message, style = MaterialTheme.typography.bodyMedium, color = textSecondary)
        }
    }
}

@Composable
private fun ErrorContent(message: String, onRetry: () -> Unit) {
    val cardBackground = AppColors.cardBackground
    val accentRose = AppColors.accentRose
    val accentOrange = AppColors.accentOrange

    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = cardBackground)) {
        Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.ErrorOutline, null, tint = accentRose, modifier = Modifier.size(48.dp))
            Spacer(Modifier.height(16.dp))
            Text(message, style = MaterialTheme.typography.bodyMedium, color = accentRose, textAlign = TextAlign.Center)
            Spacer(Modifier.height(16.dp))
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = accentOrange)) {
                Icon(Icons.Rounded.Refresh, null)
                Spacer(Modifier.width(8.dp))
                Text("Reintentar")
            }
        }
    }
}

private fun formatDate(dateString: String): String = try {
    val inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    val outputFormatter = DateTimeFormatter.ofPattern("d MMM", Locale("es", "ES"))
    java.time.LocalDate.parse(dateString, inputFormatter).format(outputFormatter)
} catch (e: Exception) {
    dateString
}