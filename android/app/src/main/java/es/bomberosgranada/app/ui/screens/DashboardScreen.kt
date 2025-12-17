package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.toColorInt
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.DashboardUiState
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import es.bomberosgranada.app.viewmodels.BrigadeDisplayInfo
import es.bomberosgranada.app.viewmodels.ThemeViewModel
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

// ============================================
// FUNCIÓN HELPER PARA PARSEAR COLORES HEX
// ============================================
private fun parseHexColor(hex: String): Color = Color(hex.toColorInt())

// ============================================
// DASHBOARD SCREEN PRINCIPAL
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit,
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()

    AppScaffold(
        currentRoute = "dashboard",
        title = "Calendario",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        unreadMessagesCount = unreadMessagesCount,
        themeViewModel = themeViewModel
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is DashboardUiState.Loading -> {
                    LoadingIndicator(message = "Cargando calendarios...")
                }

                is DashboardUiState.Error -> {
                    ModernErrorScreen(
                        message = (uiState as DashboardUiState.Error).message,
                        onRetry = { viewModel.refresh() }
                    )
                }

                is DashboardUiState.Success -> {
                    ModernDashboardContent(
                        viewModel = viewModel,
                        currentMonth = currentMonth,
                        onNavigateToGuard = onNavigateToGuard
                    )
                }
            }
        }
    }
}

// ============================================
// PANTALLA DE ERROR
// ============================================

@Composable
fun ModernErrorScreen(
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
// CONTENIDO PRINCIPAL
// ============================================

@Composable
private fun ModernDashboardContent(
    viewModel: DashboardViewModel,
    currentMonth: YearMonth,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val gradientNorte = AppColors.gradientNorte
    val gradientSur = AppColors.gradientSur

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Navegación de mes
        item {
            DashboardMonthNavigator(
                currentMonth = currentMonth,
                onPreviousMonth = { viewModel.changeMonth(currentMonth.minusMonths(1)) },
                onNextMonth = { viewModel.changeMonth(currentMonth.plusMonths(1)) }
            )
        }

        // Calendario Parque Norte
        item {
            ModernParkCalendarCard(
                title = "Parque Norte",
                parkId = 1,
                currentMonth = currentMonth,
                viewModel = viewModel,
                gradient = gradientNorte,
                icon = Icons.Default.North,
                onNavigateToGuard = onNavigateToGuard
            )
        }

        // Calendario Parque Sur
        item {
            ModernParkCalendarCard(
                title = "Parque Sur",
                parkId = 2,
                currentMonth = currentMonth,
                viewModel = viewModel,
                gradient = gradientSur,
                icon = Icons.Default.South,
                onNavigateToGuard = onNavigateToGuard
            )
        }

        // Espacio extra al final
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

// ============================================
// NAVEGADOR DE MES
// ============================================

@Composable
private fun DashboardMonthNavigator(
    currentMonth: YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val circleButtonBackground = AppColors.circleButtonBackground

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onPreviousMonth,
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(circleButtonBackground)
        ) {
            Icon(
                imageVector = Icons.Rounded.ChevronLeft,
                contentDescription = "Mes anterior",
                tint = textPrimary
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
                    .replaceFirstChar { it.uppercase() },
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
                .background(circleButtonBackground)
        ) {
            Icon(
                imageVector = Icons.Rounded.ChevronRight,
                contentDescription = "Mes siguiente",
                tint = textPrimary
            )
        }
    }
}

// ============================================
// CARD DE CALENDARIO POR PARQUE
// ============================================

@Composable
private fun ModernParkCalendarCard(
    title: String,
    parkId: Int,
    currentMonth: YearMonth,
    viewModel: DashboardViewModel,
    gradient: List<Color>,
    icon: ImageVector,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val cardBackground = AppColors.cardBackground

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column {
            // Header con gradiente
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.horizontalGradient(colors = gradient)
                    )
                    .padding(20.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Calendario de guardias",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Calendario
            ModernCalendarGrid(
                yearMonth = currentMonth,
                parkId = parkId,
                viewModel = viewModel,
                onNavigateToGuard = onNavigateToGuard
            )
        }
    }
}

// ============================================
// DATA CLASS PARA INFORMACIÓN DE DÍA DEL CALENDARIO (DASHBOARD)
// Nombre único para evitar conflicto con ProfileScreen
// ============================================

private data class DashboardCalendarDayInfo(
    val date: LocalDate,
    val dayOfMonth: Int,
    val isCurrentMonth: Boolean
)

// ============================================
// FUNCIÓN PARA GENERAR DÍAS DEL CALENDARIO (Lunes como primer día)
// ============================================

private fun generateDashboardCalendarDays(yearMonth: YearMonth): List<DashboardCalendarDayInfo> {
    val days = mutableListOf<DashboardCalendarDayInfo>()
    val firstDayOfMonth = yearMonth.atDay(1)
    val lastDayOfMonth = yearMonth.atEndOfMonth()

    // Calcular cuántos días del mes anterior necesitamos mostrar
    // Lunes = 0, Martes = 1, ..., Domingo = 6
    val daysFromPreviousMonth = when (firstDayOfMonth.dayOfWeek) {
        DayOfWeek.MONDAY -> 0
        DayOfWeek.TUESDAY -> 1
        DayOfWeek.WEDNESDAY -> 2
        DayOfWeek.THURSDAY -> 3
        DayOfWeek.FRIDAY -> 4
        DayOfWeek.SATURDAY -> 5
        DayOfWeek.SUNDAY -> 6
    }

    // Añadir días del mes anterior
    val previousMonth = yearMonth.minusMonths(1)
    val lastDayOfPreviousMonth = previousMonth.atEndOfMonth()
    for (i in daysFromPreviousMonth downTo 1) {
        val date = lastDayOfPreviousMonth.minusDays(i.toLong() - 1)
        days.add(DashboardCalendarDayInfo(date, date.dayOfMonth, isCurrentMonth = false))
    }

    // Añadir días del mes actual
    var currentDate = firstDayOfMonth
    while (!currentDate.isAfter(lastDayOfMonth)) {
        days.add(DashboardCalendarDayInfo(currentDate, currentDate.dayOfMonth, isCurrentMonth = true))
        currentDate = currentDate.plusDays(1)
    }

    // Añadir días del mes siguiente para completar 42 celdas (6 semanas)
    val daysToAdd = 42 - days.size
    val nextMonth = yearMonth.plusMonths(1)
    for (i in 1..daysToAdd) {
        val date = nextMonth.atDay(i)
        days.add(DashboardCalendarDayInfo(date, i, isCurrentMonth = false))
    }

    return days
}

// ============================================
// GRID DEL CALENDARIO (Lunes como primer día)
// ============================================

@Composable
private fun ModernCalendarGrid(
    yearMonth: YearMonth,
    parkId: Int,
    viewModel: DashboardViewModel,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val textSecondary = AppColors.textSecondary

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Días de la semana - Formato europeo: Lunes a Domingo
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("L", "M", "X", "J", "V", "S", "D").forEach { day ->
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = textSecondary,
                        letterSpacing = 1.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Generar días del calendario
        val calendarDays = generateDashboardCalendarDays(yearMonth)
        val today = LocalDate.now()

        // Mostrar días en filas de 7
        calendarDays.chunked(7).forEach { week ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                week.forEach { dayInfo ->
                    if (dayInfo.isCurrentMonth) {
                        val guard = viewModel.getGuardForDate(dayInfo.date, parkId)
                        val brigadeInfo = guard?.let { viewModel.getBrigadeDisplayInfo(it.id_brigada) }

                        ModernDayCell(
                            day = dayInfo.dayOfMonth,
                            hasGuard = guard != null,
                            brigadeInfo = brigadeInfo,
                            isToday = dayInfo.date == today,
                            onClick = {
                                guard?.let {
                                    val brigade = viewModel.getBrigadeForGuard(it, parkId)
                                    brigade?.let { b ->
                                        onNavigateToGuard(it.id, b.id_brigada, parkId, dayInfo.date.toString())
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        // Celda vacía para días de otros meses
                        DashboardEmptyDayCell(
                            day = dayInfo.dayOfMonth,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

// ============================================
// CELDA DE DÍA VACÍA (para días de otros meses)
// ============================================

@Composable
private fun DashboardEmptyDayCell(
    day: Int,
    modifier: Modifier = Modifier
) {
    val textSecondary = AppColors.textSecondary

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = day.toString(),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Normal,
            color = textSecondary.copy(alpha = 0.3f)
        )
    }
}

// ============================================
// CELDA DE DÍA
// ============================================

@Composable
private fun ModernDayCell(
    day: Int,
    hasGuard: Boolean,
    brigadeInfo: BrigadeDisplayInfo?,
    isToday: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val textPrimary = AppColors.textPrimary
    val accentOrange = AppColors.accentOrange
    val surfaceElevated = AppColors.surfaceElevated

    val brigadeColor = brigadeInfo?.colorHex?.let(::parseHexColor)
    val brigadeLabel = brigadeInfo?.label
        ?.ifBlank { brigadeInfo.name.take(1) }
        ?.ifBlank { "?" }
    val brigadeTextColor = brigadeInfo?.onColorHex?.let(::parseHexColor)

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(RoundedCornerShape(12.dp))
            .then(
                if (hasGuard && brigadeColor != null) {
                    Modifier
                        .background(brigadeColor)
                        .clickable(onClick = onClick)
                } else {
                    Modifier.background(surfaceElevated)
                }
            )
            .then(
                if (isToday) {
                    Modifier.border(2.dp, accentOrange, RoundedCornerShape(12.dp))
                } else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = day.toString(),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Medium,
                color = when {
                    hasGuard && brigadeColor != null -> brigadeTextColor
                        ?: if (brigadeColor.luminance() > 0.5f) Color(0xFF0F172A) else Color.White
                    else -> textPrimary
                }
            )

            if (hasGuard && brigadeLabel != null) {
                Text(
                    text = brigadeLabel,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        brigadeColor != null -> brigadeTextColor
                            ?: if (brigadeColor.luminance() > 0.5f) Color(0xFF0F172A) else Color.White.copy(alpha = 0.9f)
                        else -> textPrimary
                    }
                )
            }
        }
    }
}