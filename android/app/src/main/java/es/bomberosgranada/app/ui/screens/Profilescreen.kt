package es.bomberosgranada.app.ui.screens

import android.graphics.Color as AndroidColor
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.*
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.viewmodels.ProfileViewModel
import es.bomberosgranada.app.viewmodels.ProfileViewModel.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

// Colores
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

@OptIn(ExperimentalMaterial3Api::class)
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
    val passwordState by viewModel.passwordState.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()

    // Calendario
    val calendarMonth by viewModel.calendarMonth.collectAsState()
    val calendarEvents by viewModel.calendarEvents.collectAsState()

    // Solicitudes
    val requestsMonth by viewModel.requestsMonth.collectAsState()
    val monthRequests by viewModel.monthRequests.collectAsState()

    // Cambios de guardia
    val shiftChangesMonth by viewModel.shiftChangesMonth.collectAsState()
    val monthShiftChanges by viewModel.monthShiftChanges.collectAsState()

    // Horas extra
    val extraHoursMonth by viewModel.extraHoursMonth.collectAsState()
    val monthExtraHours by viewModel.monthExtraHours.collectAsState()

    // Resumen económico
    val salaryMonth by viewModel.salaryMonth.collectAsState()
    val monthGuards by viewModel.monthGuards.collectAsState()
    val totalSalary by viewModel.totalSalary.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(currentUser) {
        viewModel.loadProfile(currentUser)
    }

    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            scope.launch {
                snackbarHostState.showSnackbar(it)
                viewModel.clearError()
            }
        }
    }

    LaunchedEffect(successMessage) {
        successMessage?.let {
            scope.launch {
                snackbarHostState.showSnackbar(it)
                viewModel.clearSuccess()
            }
        }
    }

    AppScaffold(
        currentRoute = "profile",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        unreadMessagesCount = unreadMessagesCount
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is ProfileUiState.Loading -> LoadingContent()
                is ProfileUiState.Error -> ErrorContent(
                    message = (uiState as ProfileUiState.Error).message,
                    onRetry = { viewModel.loadProfile(currentUser) }
                )
                is ProfileUiState.Success -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // 1. Header con avatar
                        item {
                            ProfileHeader(user = user)
                        }

                        // 2. Información personal
                        item {
                            PersonalInfoSection(user = user)
                        }

                        // 3. Permisos disponibles
                        item {
                            PermissionsSection(stats = viewModel.getPermissionStats())
                        }

                        // 4. Calendario de guardias
                        item {
                            CalendarSection(
                                currentMonth = calendarMonth,
                                events = calendarEvents,
                                legend = viewModel.getCalendarLegend(),
                                onPreviousMonth = { viewModel.previousCalendarMonth() },
                                onNextMonth = { viewModel.nextCalendarMonth() },
                                getEventForDate = { viewModel.getEventForDate(it) }
                            )
                        }

                        // 5. Resumen de solicitudes del mes
                        item {
                            RequestsSummarySection(
                                currentMonth = requestsMonth,
                                requests = monthRequests,
                                onPreviousMonth = { viewModel.previousRequestsMonth() },
                                onNextMonth = { viewModel.nextRequestsMonth() },
                                formatEstado = { viewModel.formatEstado(it) }
                            )
                        }

                        // 6. Cambios de guardia del mes
                        item {
                            ShiftChangesSummarySection(
                                currentMonth = shiftChangesMonth,
                                shiftChanges = monthShiftChanges,
                                currentUserId = user?.id_empleado ?: 0,
                                onPreviousMonth = { viewModel.previousShiftChangesMonth() },
                                onNextMonth = { viewModel.nextShiftChangesMonth() },
                                formatEstado = { viewModel.formatEstado(it) }
                            )
                        }

                        // 7. Horas extra del mes
                        item {
                            ExtraHoursSummarySection(
                                currentMonth = extraHoursMonth,
                                extraHours = monthExtraHours,
                                totalDiurnas = viewModel.getTotalDiurnas(),
                                totalNocturnas = viewModel.getTotalNocturnas(),
                                totalSalary = viewModel.getTotalExtraHoursSalary(),
                                onPreviousMonth = { viewModel.previousExtraHoursMonth() },
                                onNextMonth = { viewModel.nextExtraHoursMonth() }
                            )
                        }

                        // 8. Resumen económico de guardias
                        item {
                            SalarySummarySection(
                                currentMonth = salaryMonth,
                                guards = monthGuards,
                                totalSalary = totalSalary,
                                onPreviousMonth = { viewModel.previousSalaryMonth() },
                                onNextMonth = { viewModel.nextSalaryMonth() }
                            )
                        }

                        // 9. Cambio de contraseña
                        item {
                            ChangePasswordSection(
                                state = passwordState,
                                onCurrentPasswordChange = { viewModel.updateCurrentPassword(it) },
                                onNewPasswordChange = { viewModel.updateNewPassword(it) },
                                onConfirmPasswordChange = { viewModel.updateConfirmPassword(it) },
                                onChangePassword = { viewModel.changePassword() }
                            )
                        }

                        // Espacio final
                        item { Spacer(modifier = Modifier.height(32.dp)) }
                    }
                }
            }

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
private fun ProfileHeader(user: User?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
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
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Avatar
                Surface(
                    modifier = Modifier.size(80.dp),
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.2f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = user?.let { "${it.nombre.firstOrNull() ?: ""}${it.apellido.firstOrNull() ?: ""}" } ?: "?",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "PERFIL PROFESIONAL",
                    style = MaterialTheme.typography.labelSmall,
                    letterSpacing = 3.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = user?.nombreCompleto ?: "Cargando...",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.White.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = user?.role_name?.uppercase() ?: user?.type?.uppercase() ?: "BOMBERO",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
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
private fun PersonalInfoSection(user: User?) {
    SectionCard(title = "Información personal", subtitle = "Datos de contacto y puesto") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                InfoCard(
                    label = "EMAIL",
                    value = user?.email ?: "-",
                    modifier = Modifier.weight(1f)
                )
                InfoCard(
                    label = "TELÉFONO",
                    value = user?.telefono ?: "-",
                    modifier = Modifier.weight(1f)
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                InfoCard(
                    label = "DNI",
                    value = user?.dni ?: "-",
                    modifier = Modifier.weight(1f)
                )
                InfoCard(
                    label = "PUESTO",
                    value = user?.puesto ?: "-",
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun InfoCard(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = SurfaceElevated
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = AccentBlue,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }
    }
}

// ==========================================
// PERMISOS
// ==========================================

@Composable
private fun PermissionsSection(stats: List<PermissionStat>) {
    SectionCard(title = "Permisos y disponibilidades", subtitle = "Saldo actual de permisos") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            stats.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { stat ->
                        PermissionCard(
                            label = stat.label,
                            value = stat.value,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (row.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionCard(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = SurfaceElevated
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }
    }
}

// ==========================================
// CALENDARIO
// ==========================================

@Composable
private fun CalendarSection(
    currentMonth: YearMonth,
    events: List<CalendarEvent>,
    legend: List<LegendItem>,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    getEventForDate: (LocalDate) -> CalendarEvent?
) {
    SectionCard(title = "Calendario de guardias", subtitle = "Visualiza tus guardias y permisos") {
        Column {
            // Navegación del mes
            MonthNavigator(
                currentMonth = currentMonth,
                onPrevious = onPreviousMonth,
                onNext = onNextMonth
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Días de la semana
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("L", "M", "X", "J", "V", "S", "D").forEach { day ->
                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Calendario
            val calendarDays = generateCalendarDays(currentMonth)
            calendarDays.chunked(7).forEach { week ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp)
                ) {
                    week.forEach { dayInfo ->
                        CalendarDayCell(
                            dayInfo = dayInfo,
                            event = if (dayInfo.monthOffset == 0) getEventForDate(dayInfo.date) else null,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Leyenda
            CalendarLegend(legend = legend)
        }
    }
}

@Composable
private fun CalendarDayCell(
    dayInfo: CalendarDayInfo,
    event: CalendarEvent?,
    modifier: Modifier = Modifier
) {
    val isToday = dayInfo.date == LocalDate.now()
    val isCurrentMonth = dayInfo.monthOffset == 0

    val backgroundColor = when {
        event != null -> Color(AndroidColor.parseColor(event.color.colorHex))
        isToday -> AccentBlue.copy(alpha = 0.1f)
        else -> Color.Transparent
    }

    val textColor = when {
        event != null -> Color(AndroidColor.parseColor(event.color.textColorHex))
        !isCurrentMonth -> TextSecondary.copy(alpha = 0.4f)
        isToday -> AccentBlue
        else -> TextPrimary
    }

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(1.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .then(
                if (isToday && event == null) {
                    Modifier.border(1.dp, AccentBlue, RoundedCornerShape(8.dp))
                } else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = dayInfo.date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (isToday || event != null) FontWeight.Bold else FontWeight.Normal,
                color = textColor
            )
            if (event != null) {
                Text(
                    text = event.label,
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 8.sp,
                    color = textColor
                )
            }
        }
    }
}

@Composable
private fun CalendarLegend(legend: List<LegendItem>) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        legend.chunked(3).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { item ->
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(Color(AndroidColor.parseColor(item.color.colorHex)))
                        )
                        Text(
                            text = item.label,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            maxLines = 1
                        )
                    }
                }
                repeat(3 - row.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

// ==========================================
// SOLICITUDES
// ==========================================

@Composable
private fun RequestsSummarySection(
    currentMonth: YearMonth,
    requests: List<RequestItem>,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    formatEstado: (String) -> String
) {
    SectionCard(title = "Solicitudes del mes", subtitle = "Permisos y licencias solicitados") {
        Column {
            MonthNavigator(
                currentMonth = currentMonth,
                onPrevious = onPreviousMonth,
                onNext = onNextMonth
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (requests.isEmpty()) {
                EmptyStateBox("No hay solicitudes en este mes")
            } else {
                // Estadísticas
                val confirmed = requests.count { it.estado.lowercase() == "confirmada" }
                val pending = requests.count { it.estado.lowercase() == "pendiente" }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(
                        label = "Confirmadas",
                        value = confirmed.toString(),
                        color = AccentGreen,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        label = "Pendientes",
                        value = pending.toString(),
                        color = AccentAmber,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        label = "Total",
                        value = requests.size.toString(),
                        color = AccentBlue,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Lista de solicitudes
                requests.take(5).forEach { request ->
                    RequestRow(request = request, formatEstado = formatEstado)
                    if (request != requests.take(5).last()) {
                        HorizontalDivider(color = DividerColor, modifier = Modifier.padding(vertical = 8.dp))
                    }
                }

                if (requests.size > 5) {
                    Text(
                        text = "+${requests.size - 5} más",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun RequestRow(request: RequestItem, formatEstado: (String) -> String) {
    val statusColor = when (request.estado.lowercase()) {
        "confirmada" -> AccentGreen
        "pendiente" -> AccentAmber
        "denegada", "cancelada" -> AccentRose
        else -> TextSecondary
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = request.tipo,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = request.fecha_ini,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
        }
        StatusBadge(text = formatEstado(request.estado), color = statusColor)
    }
}

// ==========================================
// CAMBIOS DE GUARDIA
// ==========================================

@Composable
private fun ShiftChangesSummarySection(
    currentMonth: YearMonth,
    shiftChanges: List<ShiftChangeRequest>,
    currentUserId: Int,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    formatEstado: (String) -> String
) {
    SectionCard(title = "Cambios de guardia", subtitle = "Intercambios de guardia solicitados") {
        Column {
            MonthNavigator(
                currentMonth = currentMonth,
                onPrevious = onPreviousMonth,
                onNext = onNextMonth
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (shiftChanges.isEmpty()) {
                EmptyStateBox("No hay cambios de guardia en este mes")
            } else {
                shiftChanges.forEach { change ->
                    ShiftChangeRow(
                        change = change,
                        currentUserId = currentUserId,
                        formatEstado = formatEstado
                    )
                    if (change != shiftChanges.last()) {
                        HorizontalDivider(color = DividerColor, modifier = Modifier.padding(vertical = 8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ShiftChangeRow(
    change: ShiftChangeRequest,
    currentUserId: Int,
    formatEstado: (String) -> String
) {
    val statusColor = when (change.estado.lowercase()) {
        "aceptado" -> AccentGreen
        "aceptado_por_empleados" -> AccentBlue
        "en_tramite" -> AccentAmber
        "rechazado" -> AccentRose
        else -> TextSecondary
    }

    val otherEmployee = if (change.id_empleado1 == currentUserId) {
        change.empleado2?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado ${change.id_empleado2}"
    } else {
        change.empleado1?.let { "${it.nombre} ${it.apellido}" } ?: "Empleado ${change.id_empleado1}"
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Cambio con $otherEmployee",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = change.fecha,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )
                Text(
                    text = "• ${change.turno}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )
            }
        }
        StatusBadge(text = formatEstado(change.estado), color = statusColor)
    }
}

// ==========================================
// HORAS EXTRA
// ==========================================

@Composable
private fun ExtraHoursSummarySection(
    currentMonth: YearMonth,
    extraHours: List<ExtraHour>,
    totalDiurnas: Double,
    totalNocturnas: Double,
    totalSalary: Double,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "Horas extra", subtitle = "Servicios adicionales del mes") {
        Column {
            MonthNavigator(
                currentMonth = currentMonth,
                onPrevious = onPreviousMonth,
                onNext = onNextMonth
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Estadísticas
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    label = "Diurnas",
                    value = String.format("%.1f h", totalDiurnas),
                    color = AccentOrange,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Nocturnas",
                    value = String.format("%.1f h", totalNocturnas),
                    color = AccentPurple,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Total",
                    value = String.format("%.2f €", totalSalary),
                    color = AccentGreen,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (extraHours.isEmpty()) {
                EmptyStateBox("No hay horas extra registradas en este mes")
            } else {
                extraHours.take(5).forEach { hour ->
                    ExtraHourRow(hour = hour)
                    if (hour != extraHours.take(5).last()) {
                        HorizontalDivider(color = DividerColor, modifier = Modifier.padding(vertical = 8.dp))
                    }
                }

                if (extraHours.size > 5) {
                    Text(
                        text = "+${extraHours.size - 5} más",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ExtraHourRow(hour: ExtraHour) {
    val salary = ((hour.horas_diurnas ?: 0.0) * (hour.salarie?.precio_diurno ?: 0.0)) +
            ((hour.horas_nocturnas ?: 0.0) * (hour.salarie?.precio_nocturno ?: 0.0))

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = hour.date ?: "-",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = "Diurnas: ${hour.horas_diurnas ?: 0}h · Nocturnas: ${hour.horas_nocturnas ?: 0}h",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
        }
        Text(
            text = String.format("%.2f €", salary),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = AccentGreen
        )
    }
}

// ==========================================
// RESUMEN ECONÓMICO
// ==========================================

@Composable
private fun SalarySummarySection(
    currentMonth: YearMonth,
    guards: List<Guard>,
    totalSalary: Double,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    SectionCard(title = "Resumen económico", subtitle = "Guardias y retribución estimada") {
        Column {
            MonthNavigator(
                currentMonth = currentMonth,
                onPrevious = onPreviousMonth,
                onNext = onNextMonth
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Estadísticas
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    label = "Guardias",
                    value = guards.size.toString(),
                    color = AccentBlue,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Total estimado",
                    value = String.format("%.2f €", totalSalary),
                    color = AccentGreen,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (guards.isEmpty()) {
                EmptyStateBox("No hay guardias registradas en este mes")
            } else {
                guards.take(5).forEach { guard ->
                    GuardRow(guard = guard)
                    if (guard != guards.take(5).last()) {
                        HorizontalDivider(color = DividerColor, modifier = Modifier.padding(vertical = 8.dp))
                    }
                }

                if (guards.size > 5) {
                    Text(
                        text = "+${guards.size - 5} más",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun GuardRow(guard: Guard) {
    val salary = guard.salary?.let {
        (it.precio_diurno * it.horas_diurnas) + (it.precio_nocturno * it.horas_nocturnas)
    } ?: 0.0

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = guard.date,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = guard.brigade?.nombre ?: "Brigada ${guard.id_brigada}",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
        }
        Text(
            text = String.format("%.2f €", salary),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = AccentGreen
        )
    }
}

// ==========================================
// CAMBIO DE CONTRASEÑA
// ==========================================

@Composable
private fun ChangePasswordSection(
    state: PasswordState,
    onCurrentPasswordChange: (String) -> Unit,
    onNewPasswordChange: (String) -> Unit,
    onConfirmPasswordChange: (String) -> Unit,
    onChangePassword: () -> Unit
) {
    var showCurrentPassword by remember { mutableStateOf(false) }
    var showNewPassword by remember { mutableStateOf(false) }
    var showConfirmPassword by remember { mutableStateOf(false) }

    SectionCard(title = "Seguridad de la cuenta", subtitle = "Cambia tu contraseña de acceso") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            state.error?.let { error ->
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AccentRose.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodySmall,
                        color = AccentRose,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            state.success?.let { success ->
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AccentGreen.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = success,
                        style = MaterialTheme.typography.bodySmall,
                        color = AccentGreen,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            PasswordField(
                label = "Contraseña actual",
                value = state.currentPassword,
                onValueChange = onCurrentPasswordChange,
                showPassword = showCurrentPassword,
                onToggleVisibility = { showCurrentPassword = !showCurrentPassword }
            )

            PasswordField(
                label = "Nueva contraseña",
                value = state.newPassword,
                onValueChange = onNewPasswordChange,
                showPassword = showNewPassword,
                onToggleVisibility = { showNewPassword = !showNewPassword }
            )

            PasswordField(
                label = "Confirmar contraseña",
                value = state.confirmPassword,
                onValueChange = onConfirmPasswordChange,
                showPassword = showConfirmPassword,
                onToggleVisibility = { showConfirmPassword = !showConfirmPassword }
            )

            Button(
                onClick = onChangePassword,
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.isLoading,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Cambiar contraseña", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun PasswordField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    showPassword: Boolean,
    onToggleVisibility: () -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = {
            IconButton(onClick = onToggleVisibility) {
                Icon(
                    imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = if (showPassword) "Ocultar" else "Mostrar"
                )
            }
        },
        shape = RoundedCornerShape(12.dp)
    )
}

// ==========================================
// COMPONENTES COMUNES
// ==========================================

@Composable
private fun SectionCard(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                letterSpacing = 2.sp,
                color = AccentBlue,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(16.dp))
            content()
        }
    }
}

@Composable
private fun MonthNavigator(
    currentMonth: YearMonth,
    onPrevious: () -> Unit,
    onNext: () -> Unit
) {
    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onPrevious) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                contentDescription = "Mes anterior",
                tint = AccentBlue
            )
        }
        Text(
            text = "$monthName ${currentMonth.year}",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary
        )
        IconButton(onClick = onNext) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = "Mes siguiente",
                tint = AccentBlue
            )
        }
    }
}

@Composable
private fun StatCard(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun StatusBadge(text: String, color: Color) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = color,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun EmptyStateBox(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = SurfaceElevated
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(24.dp)
        )
    }
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = AccentBlue)
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Cargando perfil...",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun ErrorContent(message: String, onRetry: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = AccentRose,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                Text("Reintentar")
            }
        }
    }
}

// ==========================================
// HELPERS
// ==========================================

private data class CalendarDayInfo(
    val date: LocalDate,
    val monthOffset: Int // -1 = mes anterior, 0 = mes actual, 1 = mes siguiente
)

private fun generateCalendarDays(month: YearMonth): List<CalendarDayInfo> {
    val days = mutableListOf<CalendarDayInfo>()
    val firstDay = month.atDay(1)
    val lastDay = month.atEndOfMonth()

    // Ajustar para que la semana empiece en lunes
    val startDayOfWeek = firstDay.dayOfWeek.value // 1 = Lunes, 7 = Domingo
    val daysFromPrevMonth = startDayOfWeek - 1

    // Días del mes anterior
    for (i in daysFromPrevMonth downTo 1) {
        days.add(CalendarDayInfo(firstDay.minusDays(i.toLong()), -1))
    }

    // Días del mes actual
    var currentDay = firstDay
    while (!currentDay.isAfter(lastDay)) {
        days.add(CalendarDayInfo(currentDay, 0))
        currentDay = currentDay.plusDays(1)
    }

    // Días del mes siguiente para completar 42 (6 semanas)
    val remaining = 42 - days.size
    var nextDay = lastDay.plusDays(1)
    for (i in 0 until remaining) {
        days.add(CalendarDayInfo(nextDay, 1))
        nextDay = nextDay.plusDays(1)
    }

    return days
}