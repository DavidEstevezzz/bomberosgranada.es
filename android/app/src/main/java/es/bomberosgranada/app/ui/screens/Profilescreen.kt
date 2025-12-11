package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.*
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.viewmodels.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

// ==========================================
// COLORES
// ==========================================

private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentPurple = Color(0xFF8B5CF6)
private val AccentGreen = Color(0xFF10B981)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentAmber = Color(0xFFF59E0B)
private val AccentRose = Color(0xFFEF4444)
private val SurfaceElevated = Color(0xFFF8FAFC)
private val CardBackground = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val DividerColor = Color(0xFFE2E8F0)

// ==========================================
// PANTALLA PRINCIPAL
// ==========================================

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int
) {
    val uiState by viewModel.uiState.collectAsState()
    val user by viewModel.user.collectAsState()

    // Meses de cada sección
    val calendarMonth by viewModel.calendarMonth.collectAsState()
    val requestsMonth by viewModel.requestsMonth.collectAsState()
    val shiftChangesMonth by viewModel.shiftChangesMonth.collectAsState()
    val extraHoursMonth by viewModel.extraHoursMonth.collectAsState()

    // Datos
    val monthRequests by viewModel.monthRequests.collectAsState()
    val monthShiftChanges by viewModel.monthShiftChanges.collectAsState()
    val monthExtraHours by viewModel.monthExtraHours.collectAsState()

    // Cambio contraseña
    val isChangingPassword by viewModel.isChangingPassword.collectAsState()
    val passwordChangeSuccess by viewModel.passwordChangeSuccess.collectAsState()
    val passwordChangeError by viewModel.passwordChangeError.collectAsState()

    // Mensajes
    val successMessage by viewModel.successMessage.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    // Cargar datos al inicio
    LaunchedEffect(currentUser) {
        currentUser?.let { viewModel.loadProfile(it) }
    }

    // Mostrar mensajes
    LaunchedEffect(successMessage, errorMessage, passwordChangeSuccess, passwordChangeError) {
        successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSuccessMessage()
        }
        errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearErrorMessage()
        }
        passwordChangeSuccess?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearPasswordMessages()
        }
        passwordChangeError?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearPasswordMessages()
        }
    }

    AppScaffold(
        currentRoute = "profile",
        title = "Mi Perfil",
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
                    LoadingContent(modifier = Modifier.padding(paddingValues))
                }

                uiState is ProfileUiState.Loading -> {
                    LoadingContent(modifier = Modifier.padding(paddingValues))
                }

                uiState is ProfileUiState.Error -> {
                    ErrorContent(
                        message = (uiState as ProfileUiState.Error).message,
                        onRetry = { viewModel.loadProfile(currentUser) },
                        modifier = Modifier.padding(paddingValues)
                    )
                }

                uiState is ProfileUiState.Success -> {
                    val displayUser = user ?: currentUser

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .background(SurfaceElevated),
                        contentPadding = PaddingValues(bottom = 24.dp)
                    ) {
                        // Header con avatar y nombre
                        item { ProfileHeader(user = displayUser) }

                        // Información personal
                        item { PersonalInfoSection(user = displayUser) }

                        // Permisos restantes
                        item { PermissionsSection(stats = viewModel.getPermissionStats(displayUser)) }

                        // Calendario de guardias
                        item {
                            CalendarSection(
                                month = calendarMonth,
                                viewModel = viewModel,
                                currentUser = currentUser,
                                onPreviousMonth = { viewModel.previousCalendarMonth(currentUser) },
                                onNextMonth = { viewModel.nextCalendarMonth(currentUser) }
                            )
                        }

                        // Solicitudes del mes
                        item {
                            RequestsSummarySection(
                                month = requestsMonth,
                                requests = monthRequests,
                                stats = viewModel.getRequestsStats(),
                                viewModel = viewModel,
                                onPreviousMonth = { viewModel.previousRequestsMonth(currentUser) },
                                onNextMonth = { viewModel.nextRequestsMonth(currentUser) }
                            )
                        }

                        // Cambios de guardia del mes
                        item {
                            ShiftChangesSummarySection(
                                month = shiftChangesMonth,
                                shiftChanges = monthShiftChanges,
                                stats = viewModel.getShiftChangesStats(),
                                viewModel = viewModel,
                                currentUser = currentUser,
                                onPreviousMonth = { viewModel.previousShiftChangesMonth(currentUser) },
                                onNextMonth = { viewModel.nextShiftChangesMonth(currentUser) }
                            )
                        }

                        // Horas extra del mes
                        item {
                            ExtraHoursSummarySection(
                                month = extraHoursMonth,
                                extraHours = monthExtraHours,
                                totalDiurnas = viewModel.getTotalDiurnas(),
                                totalNocturnas = viewModel.getTotalNocturnas(),
                                totalSalary = viewModel.getTotalExtraHoursSalary(),
                                onPreviousMonth = { viewModel.previousExtraHoursMonth(currentUser) },
                                onNextMonth = { viewModel.nextExtraHoursMonth(currentUser) }
                            )
                        }

                        // Cambio de contraseña
                        item {
                            ChangePasswordSection(
                                isLoading = isChangingPassword,
                                error = passwordChangeError,
                                success = passwordChangeSuccess,
                                onChangePassword = { current, new, confirm ->
                                    viewModel.changePassword(currentUser, current, new, confirm)
                                }
                            )
                        }
                    }
                }
            }

            // SnackbarHost para mensajes
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}

// ==========================================
// HEADER
// ==========================================

@Composable
private fun ProfileHeader(user: User) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Brush.horizontalGradient(listOf(GradientStart, GradientEnd)))
            .padding(24.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${user.nombre.firstOrNull() ?: ""}${user.apellido.firstOrNull() ?: ""}",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Column {
                Text(
                    text = "PERFIL PROFESIONAL",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.7f),
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${user.nombre} ${user.apellido}",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = user.type ?: "Bombero",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White
                    )
                }
            }
        }
    }
}

// ==========================================
// INFORMACIÓN PERSONAL
// ==========================================

@Composable
private fun PersonalInfoSection(user: User) {
    SectionCard(title = "INFORMACIÓN PERSONAL", subtitle = "Datos de contacto y puesto") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                InfoCard(Icons.Rounded.Email, "Email", user.email, Modifier.weight(1f))
                InfoCard(Icons.Rounded.Phone, "Teléfono", user.telefono ?: "-", Modifier.weight(1f))
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                InfoCard(Icons.Rounded.Badge, "DNI", user.dni, Modifier.weight(1f))
                InfoCard(Icons.Rounded.Work, "Puesto", user.puesto ?: "-", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun InfoCard(icon: ImageVector, label: String, value: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(12.dp), color = SurfaceElevated) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = AccentBlue, modifier = Modifier.size(20.dp))
            Column {
                Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Text(
                    value,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

// ==========================================
// PERMISOS RESTANTES
// ==========================================

@Composable
private fun PermissionsSection(stats: List<PermissionStat>) {
    SectionCard(title = "PERMISOS RESTANTES", subtitle = "Saldo disponible de permisos") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            for (rowIndex in 0 until 2) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    for (colIndex in 0 until 3) {
                        val index = rowIndex * 3 + colIndex
                        if (index < stats.size) {
                            PermissionCard(stats[index], Modifier.weight(1f))
                        } else {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionCard(stat: PermissionStat, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(12.dp), color = SurfaceElevated) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                stat.label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(stat.value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AccentBlue)
            Text(stat.unit, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        }
    }
}

// ==========================================
// CALENDARIO DE GUARDIAS
// ==========================================

@Composable
private fun CalendarSection(
    month: YearMonth,
    viewModel: ProfileViewModel,
    currentUser: User,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "CALENDARIO DE GUARDIAS", subtitle = "Guardias y permisos del mes") {
        Column {
            MonthNavigator(month, onPreviousMonth, onNextMonth)
            Spacer(modifier = Modifier.height(16.dp))

            // Días de la semana
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                listOf("L", "M", "X", "J", "V", "S", "D").forEach { day ->
                    Text(
                        day,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextSecondary,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            val calendarDays = generateCalendarDays(month)
            val today = LocalDate.now()

            Column {
                for (week in calendarDays.chunked(7)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        for (dayInfo in week) {
                            val event = if (dayInfo.monthOffset == 0) {
                                viewModel.getEventForDate(dayInfo.date, currentUser)
                            } else null

                            CalendarDayCell(
                                dayInfo = dayInfo,
                                event = event,
                                isToday = dayInfo.date == today,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            CalendarLegend(viewModel.getCalendarLegend())
        }
    }
}

@Composable
private fun CalendarDayCell(dayInfo: CalendarDayInfo, event: CalendarEvent?, isToday: Boolean, modifier: Modifier = Modifier) {
    val backgroundColor = if (event != null) {
        Color(android.graphics.Color.parseColor(event.color.hex))
    } else Color.Transparent

    val textColor = when {
        event != null -> {
            // Asegurar contraste: texto oscuro sobre fondos claros y blanco sobre fondos oscuros
            val luminance = backgroundColor.luminance()
            if (luminance > 0.6f) TextPrimary else Color.White
        }
        dayInfo.monthOffset != 0 -> TextSecondary.copy(alpha = 0.4f)
        else -> TextPrimary
    }

    val borderModifier = if (isToday && event == null) {
        Modifier.border(2.dp, AccentBlue, RoundedCornerShape(8.dp))
    } else Modifier

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .then(borderModifier)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                dayInfo.date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                color = textColor
            )
            if (event != null) {
                Text(event.label, style = MaterialTheme.typography.labelSmall, fontSize = 8.sp, color = textColor)
            }
        }
    }
}

@Composable
private fun CalendarLegend(items: List<LegendItem>) {
    Surface(shape = RoundedCornerShape(12.dp), color = SurfaceElevated) {
        Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
            Text("Leyenda", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold, color = TextSecondary)
            Spacer(modifier = Modifier.height(8.dp))

            val chunked = items.chunked(3)
            for (row in chunked) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (item in row) {
                        LegendChip(item, Modifier.weight(1f))
                    }
                    repeat(3 - row.size) { Spacer(modifier = Modifier.weight(1f)) }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
private fun LegendChip(item: LegendItem, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(modifier = Modifier.size(12.dp).clip(CircleShape).background(Color(android.graphics.Color.parseColor(item.color.hex))))
        Text(item.label, style = MaterialTheme.typography.labelSmall, color = TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

// ==========================================
// SOLICITUDES DEL MES
// ==========================================

@Composable
private fun RequestsSummarySection(
    month: YearMonth,
    requests: List<RequestItem>,
    stats: RequestsStats,
    viewModel: ProfileViewModel,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "SOLICITUDES DEL MES", subtitle = "Resumen de permisos solicitados") {
        Column {
            MonthNavigator(month, onPreviousMonth, onNextMonth)
            Spacer(modifier = Modifier.height(16.dp))

            // Estadísticas
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Confirmadas", stats.confirmed.toString(), AccentGreen, Modifier.weight(1f))
                StatCard("Pendientes", stats.pending.toString(), AccentAmber, Modifier.weight(1f))
                StatCard("Total", stats.total.toString(), AccentBlue, Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (requests.isEmpty()) {
                EmptyStateBox("No hay solicitudes este mes")
            } else {
                // Cabecera
                TableHeader(listOf("Tipo" to 1.5f, "Fecha" to 1f, "Estado" to 1f))

                // Filas
                val displayRequests = requests.take(5)
                displayRequests.forEachIndexed { index, request ->
                    val isLast = index == displayRequests.lastIndex && requests.size <= 5
                    TableRow(
                        isLast = isLast,
                        content = {
                            Text(
                                request.tipo.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                modifier = Modifier.weight(1.5f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                formatDate(request.fecha_ini),
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                            StatusBadge(request.estado, viewModel.getEstadoColor(request.estado), Modifier.weight(1f))
                        }
                    )
                }

                if (requests.size > 5) {
                    MoreItemsIndicator(requests.size - 5)
                }
            }
        }
    }
}

// ==========================================
// CAMBIOS DE GUARDIA DEL MES
// ==========================================

@Composable
private fun ShiftChangesSummarySection(
    month: YearMonth,
    shiftChanges: List<ShiftChangeRequest>,
    stats: ShiftChangesStats,
    viewModel: ProfileViewModel,
    currentUser: User,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "CAMBIOS DE GUARDIA", subtitle = "Intercambios de turno del mes") {
        Column {
            MonthNavigator(month, onPreviousMonth, onNextMonth)
            Spacer(modifier = Modifier.height(16.dp))

            // Estadísticas
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCard("Aceptados", stats.accepted.toString(), AccentGreen, Modifier.weight(1.1f))
                StatCard("Pendientes", stats.pending.toString(), AccentAmber, Modifier.weight(1.2f))
                StatCard("Simples", stats.simple.toString(), AccentPurple, Modifier.weight(1f))
                StatCard("Espejo", stats.mirror.toString(), AccentOrange, Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (shiftChanges.isEmpty()) {
                EmptyStateBox("No hay cambios de guardia este mes")
            } else {
                // Cabecera
                TableHeader(listOf("Compañero" to 1.2f, "Fecha" to 0.8f, "Tipo" to 0.6f, "Estado" to 1f))

                // Filas
                val displayChanges = shiftChanges.take(5)
                displayChanges.forEachIndexed { index, change ->
                    val isLast = index == displayChanges.lastIndex && shiftChanges.size <= 5
                    val isMirror = !change.fecha2.isNullOrEmpty()

                    val companionName = if (change.id_empleado1 == currentUser.id_empleado) {
                        change.empleado2?.let { "${it.nombre} ${it.apellido}" } ?: "Compañero"
                    } else {
                        change.empleado1?.let { "${it.nombre} ${it.apellido}" } ?: "Compañero"
                    }

                    TableRow(
                        isLast = isLast,
                        content = {
                            Text(
                                companionName,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                modifier = Modifier.weight(1.2f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                formatDate(change.fecha),
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                modifier = Modifier.weight(0.8f),
                                textAlign = TextAlign.Center
                            )
                            TypeBadge(isMirror, Modifier.weight(0.6f))
                            StatusBadge(change.estado, viewModel.getEstadoColor(change.estado), Modifier.weight(1f))
                        }
                    )
                }

                if (shiftChanges.size > 5) {
                    MoreItemsIndicator(shiftChanges.size - 5)
                }
            }
        }
    }
}

// ==========================================
// HORAS EXTRA DEL MES
// ==========================================

@Composable
private fun ExtraHoursSummarySection(
    month: YearMonth,
    extraHours: List<ExtraHour>,
    totalDiurnas: Double,
    totalNocturnas: Double,
    totalSalary: Double,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "HORAS EXTRA", subtitle = "Horas extra realizadas en el mes") {
        Column {
            MonthNavigator(month, onPreviousMonth, onNextMonth)
            Spacer(modifier = Modifier.height(16.dp))

            // Estadísticas
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Diurnas", String.format("%.1f h", totalDiurnas), AccentAmber, Modifier.weight(1f))
                StatCard("Nocturnas", String.format("%.1f h", totalNocturnas), AccentPurple, Modifier.weight(1f))
                StatCard("Total €", String.format("%.2f €", totalSalary), AccentGreen, Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (extraHours.isEmpty()) {
                EmptyStateBox("No hay horas extra este mes")
            } else {
                // Cabecera
                TableHeader(listOf("Fecha" to 1f, "Diurnas" to 0.8f, "Nocturnas" to 0.8f, "Retrib." to 1f))

                // Filas
                val displayHours = extraHours.take(5)
                displayHours.forEachIndexed { index, hour ->
                    val isLast = index == displayHours.lastIndex && extraHours.size <= 5

                    val diurnas = hour.horas_diurnas.toDouble()
                    val nocturnas = hour.horas_nocturnas.toDouble()
                    val precioDiurno = hour.salarie?.precio_diurno ?: 0.0
                    val precioNocturno = hour.salarie?.precio_nocturno ?: 0.0
                    val retribucion = (diurnas * precioDiurno) + (nocturnas * precioNocturno)

                    TableRow(
                        isLast = isLast,
                        content = {
                            Text(
                                formatDate(hour.date),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                String.format("%.1f", diurnas),
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                modifier = Modifier.weight(0.8f),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                String.format("%.1f", nocturnas),
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                modifier = Modifier.weight(0.8f),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                String.format("%.2f €", retribucion),
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = AccentGreen,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.End
                            )
                        }
                    )
                }

                if (extraHours.size > 5) {
                    MoreItemsIndicator(extraHours.size - 5)
                }
            }
        }
    }
}

// ==========================================
// CAMBIO DE CONTRASEÑA
// ==========================================

@Composable
private fun ChangePasswordSection(
    isLoading: Boolean,
    error: String?,
    success: String?,
    onChangePassword: (current: String, new: String, confirm: String) -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showCurrentPassword by remember { mutableStateOf(false) }
    var showNewPassword by remember { mutableStateOf(false) }
    var showConfirmPassword by remember { mutableStateOf(false) }

    SectionCard(title = "CAMBIO DE CONTRASEÑA", subtitle = "Actualiza tu contraseña de acceso") {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            PasswordTextField(
                value = currentPassword,
                onValueChange = { currentPassword = it },
                label = "Contraseña actual",
                showPassword = showCurrentPassword,
                onToggleVisibility = { showCurrentPassword = !showCurrentPassword }
            )

            PasswordTextField(
                value = newPassword,
                onValueChange = { newPassword = it },
                label = "Nueva contraseña",
                showPassword = showNewPassword,
                onToggleVisibility = { showNewPassword = !showNewPassword },
                supportingText = "Mínimo 6 caracteres"
            )

            PasswordTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = "Confirmar contraseña",
                showPassword = showConfirmPassword,
                onToggleVisibility = { showConfirmPassword = !showConfirmPassword },
                isError = confirmPassword.isNotEmpty() && confirmPassword != newPassword,
                errorText = if (confirmPassword.isNotEmpty() && confirmPassword != newPassword) "Las contraseñas no coinciden" else null
            )

            error?.let { MessageBox(it, AccentRose) }
            success?.let { MessageBox(it, AccentGreen) }

            Button(
                onClick = {
                    onChangePassword(currentPassword, newPassword, confirmPassword)
                    if (success != null) {
                        currentPassword = ""
                        newPassword = ""
                        confirmPassword = ""
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading && currentPassword.isNotBlank() && newPassword.length >= 6 && newPassword == confirmPassword,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(if (isLoading) "Actualizando..." else "Cambiar contraseña", modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

@Composable
private fun PasswordTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    showPassword: Boolean,
    onToggleVisibility: () -> Unit,
    supportingText: String? = null,
    isError: Boolean = false,
    errorText: String? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        visualTransformation = if (showPassword) {
            androidx.compose.ui.text.input.VisualTransformation.None
        } else {
            androidx.compose.ui.text.input.PasswordVisualTransformation()
        },
        trailingIcon = {
            IconButton(onClick = onToggleVisibility) {
                Icon(
                    if (showPassword) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = if (showPassword) "Ocultar" else "Mostrar"
                )
            }
        },
        isError = isError,
        supportingText = {
            when {
                errorText != null -> Text(errorText, color = AccentRose)
                supportingText != null -> Text(supportingText)
            }
        },
        shape = RoundedCornerShape(12.dp)
    )
}

// ==========================================
// COMPONENTES COMUNES
// ==========================================

@Composable
private fun SectionCard(title: String, subtitle: String, content: @Composable () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        color = CardBackground,
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold, color = AccentBlue, letterSpacing = 1.sp)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            Spacer(modifier = Modifier.height(16.dp))
            content()
        }
    }
}

@Composable
private fun MonthNavigator(month: YearMonth, onPrevious: () -> Unit, onNext: () -> Unit) {
    val monthName = month.month.getDisplayName(TextStyle.FULL, Locale("es", "ES")).replaceFirstChar { it.uppercase() }

    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onPrevious, modifier = Modifier.size(40.dp).clip(CircleShape).background(SurfaceElevated)) {
            Icon(Icons.Rounded.ChevronLeft, "Mes anterior", tint = TextPrimary)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(monthName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("${month.year}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }
        IconButton(onClick = onNext, modifier = Modifier.size(40.dp).clip(CircleShape).background(SurfaceElevated)) {
            Icon(Icons.Rounded.ChevronRight, "Mes siguiente", tint = TextPrimary)
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(12.dp), color = color.copy(alpha = 0.1f)) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary, textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun TableHeader(columns: List<Pair<String, Float>>) {
    Surface(shape = RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp), color = SurfaceElevated) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            columns.forEach { (title, weight) ->
                Text(
                    title,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextSecondary,
                    modifier = Modifier.weight(weight),
                    textAlign = if (title == columns.last().first) TextAlign.End else TextAlign.Start
                )
            }
        }
    }
}

@Composable
private fun TableRow(isLast: Boolean, content: @Composable RowScope.() -> Unit) {
    Surface(
        shape = if (isLast) RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp) else RoundedCornerShape(0.dp),
        color = CardBackground
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                content = content
            )
            if (!isLast) HorizontalDivider(color = DividerColor)
        }
    }
}

@Composable
private fun StatusBadge(status: String, color: StatusColor, modifier: Modifier = Modifier) {
    val bgColor = Color(android.graphics.Color.parseColor(color.hex))
    Box(modifier = modifier, contentAlignment = Alignment.CenterEnd) {
        Surface(shape = RoundedCornerShape(8.dp), color = bgColor.copy(alpha = 0.1f)) {
            Text(
                status.replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.labelSmall,
                color = bgColor,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
private fun TypeBadge(isMirror: Boolean, modifier: Modifier = Modifier) {
    val color = if (isMirror) AccentOrange else AccentPurple
    Surface(modifier = modifier, shape = RoundedCornerShape(8.dp), color = color.copy(alpha = 0.1f)) {
        Text(
            if (isMirror) "Espejo" else "Simple",
            style = MaterialTheme.typography.labelSmall,
            color = color,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun MoreItemsIndicator(count: Int) {
    Surface(shape = RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp), color = SurfaceElevated) {
        Text("+$count más", style = MaterialTheme.typography.labelMedium, color = AccentBlue, modifier = Modifier.fillMaxWidth().padding(12.dp), textAlign = TextAlign.Center)
    }
}

@Composable
private fun EmptyStateBox(message: String) {
    Surface(shape = RoundedCornerShape(12.dp), color = SurfaceElevated) {
        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Rounded.EventBusy, null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Text(message, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun MessageBox(message: String, color: Color) {
    Surface(shape = RoundedCornerShape(8.dp), color = color.copy(alpha = 0.1f)) {
        Text(message, color = color, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(12.dp))
    }
}

@Composable
private fun LoadingContent(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = AccentBlue, modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Cargando perfil...", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
    }
}

@Composable
private fun ErrorContent(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Rounded.Error, null, tint = AccentRose, modifier = Modifier.size(64.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text(message, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, textAlign = TextAlign.Center)
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry, shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)) {
                Text("Reintentar")
            }
        }
    }
}

// ==========================================
// HELPERS
// ==========================================

private fun formatDate(dateStr: String?): String {
    if (dateStr.isNullOrBlank()) return "-"
    return try {
        val date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE)
        date.format(DateTimeFormatter.ofPattern("dd/MM"))
    } catch (e: Exception) {
        dateStr.take(10)
    }
}

data class CalendarDayInfo(val date: LocalDate, val monthOffset: Int)

private fun generateCalendarDays(month: YearMonth): List<CalendarDayInfo> {
    val days = mutableListOf<CalendarDayInfo>()
    val firstDayOfMonth = month.atDay(1)
    val lastDayOfMonth = month.atEndOfMonth()

    val daysFromPreviousMonth = when (firstDayOfMonth.dayOfWeek) {
        DayOfWeek.MONDAY -> 0
        DayOfWeek.TUESDAY -> 1
        DayOfWeek.WEDNESDAY -> 2
        DayOfWeek.THURSDAY -> 3
        DayOfWeek.FRIDAY -> 4
        DayOfWeek.SATURDAY -> 5
        DayOfWeek.SUNDAY -> 6
    }

    val previousMonth = month.minusMonths(1)
    val lastDayOfPreviousMonth = previousMonth.atEndOfMonth()
    for (i in daysFromPreviousMonth downTo 1) {
        days.add(CalendarDayInfo(lastDayOfPreviousMonth.minusDays(i.toLong() - 1), -1))
    }

    var currentDate: LocalDate = firstDayOfMonth
    while (!currentDate.isAfter(lastDayOfMonth)) {
        days.add(CalendarDayInfo(currentDate, 0))
        currentDate = currentDate.plusDays(1)
    }

    val daysToAdd = 42 - days.size
    val nextMonth = month.plusMonths(1)
    for (i in 1..daysToAdd) {
        days.add(CalendarDayInfo(nextMonth.atDay(i), 1))
    }

    return days
}