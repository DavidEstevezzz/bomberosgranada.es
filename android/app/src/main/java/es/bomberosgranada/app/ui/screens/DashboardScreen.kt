package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import es.bomberosgranada.app.ui.components.*
import es.bomberosgranada.app.ui.theme.ExtendedColors
import es.bomberosgranada.app.viewmodels.DashboardUiState
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

/**
 * Pantalla principal del Dashboard
 *
 * Muestra:
 * - Calendario del Parque Norte
 * - Calendario del Parque Sur
 * - Estadísticas del mes
 * - Navegación a detalles de guardias
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = viewModel(),
    onNavigateToBrigade: (brigadeId: Int, date: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val guards by viewModel.guards.collectAsState()
    val brigades by viewModel.brigades.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()

    Scaffold(
        topBar = {
            GradientHeader(
                title = "Bomberos Granada",
                subtitle = "Gestión de Guardias"
            )
        }
    ) { paddingValues ->

        when (uiState) {
            is DashboardUiState.Loading -> {
                LoadingScreen(message = "Cargando calendarios...")
            }

            is DashboardUiState.Error -> {
                ErrorScreen(
                    message = (uiState as DashboardUiState.Error).message,
                    onRetry = { viewModel.refresh() }
                )
            }

            is DashboardUiState.Success -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                        .padding(paddingValues),
                    contentPadding = PaddingValues(24.dp),
                    verticalArrangement = Arrangement.spacedBy(32.dp)
                ) {
                    // Estadísticas del mes
                    item {
                        MonthStatsCard(viewModel = viewModel)
                    }

                    // Calendario Parque Norte
                    item {
                        CalendarCard(
                            title = "Parque Norte",
                            parkId = 1,
                            currentMonth = currentMonth,
                            viewModel = viewModel,
                            onDateClick = { date ->
                                handleDateClick(
                                    date = date,
                                    parkId = 1,
                                    viewModel = viewModel,
                                    onNavigate = onNavigateToBrigade
                                )
                            },
                            onMonthChange = { newMonth ->
                                viewModel.changeMonth(newMonth)
                            }
                        )
                    }

                    // Calendario Parque Sur
                    item {
                        CalendarCard(
                            title = "Parque Sur",
                            parkId = 2,
                            currentMonth = currentMonth,
                            viewModel = viewModel,
                            onDateClick = { date ->
                                handleDateClick(
                                    date = date,
                                    parkId = 2,
                                    viewModel = viewModel,
                                    onNavigate = onNavigateToBrigade
                                )
                            },
                            onMonthChange = { newMonth ->
                                viewModel.changeMonth(newMonth)
                            }
                        )
                    }
                }
            }
        }
    }
}

// ============================================
// CARD DE ESTADÍSTICAS DEL MES
// ============================================

@Composable
fun MonthStatsCard(
    viewModel: DashboardViewModel
) {
    val stats = viewModel.getMonthStats()
    val brigadeMap by viewModel.brigadeMap.collectAsState()

    ElegantCard {
        Text(
            text = "Resumen del Mes",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Total de guardias
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Total de Guardias",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "${stats.totalGuards}",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
        ElegantDivider()
        Spacer(modifier = Modifier.height(16.dp))

        // Guardias por brigada
        Text(
            text = "Por Brigada",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(12.dp))

        stats.brigadeStats.forEach { (brigadeId, count) ->
            val brigadeName = brigadeMap[brigadeId] ?: "?"
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(Color(android.graphics.Color.parseColor(viewModel.getBrigadeColor(brigadeId))))
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Brigada $brigadeName",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Text(
                    text = "$count",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

// ============================================
// CARD DE CALENDARIO
// ============================================

@Composable
fun CalendarCard(
    title: String,
    parkId: Int,
    currentMonth: YearMonth,
    viewModel: DashboardViewModel,
    onDateClick: (LocalDate) -> Unit,
    onMonthChange: (YearMonth) -> Unit
) {
    ElegantCard {
        // Header del calendario
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
                        .replaceFirstChar { it.uppercase() } + " ${currentMonth.year}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(
                    onClick = { onMonthChange(currentMonth.minusMonths(1)) }
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = "Mes anterior",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                IconButton(
                    onClick = { onMonthChange(currentMonth.plusMonths(1)) }
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Mes siguiente",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Grid del calendario
        CalendarGrid(
            yearMonth = currentMonth,
            viewModel = viewModel,
            onDateClick = onDateClick
        )
    }
}

// ============================================
// GRID DEL CALENDARIO
// ============================================

@Composable
fun CalendarGrid(
    yearMonth: YearMonth,
    viewModel: DashboardViewModel,
    onDateClick: (LocalDate) -> Unit
) {
    val firstDayOfMonth = yearMonth.atDay(1)
    val lastDayOfMonth = yearMonth.atEndOfMonth()
    val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7 // 0 = Domingo

    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        // Días de la semana
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("D", "L", "M", "X", "J", "V", "S").forEach { day ->
                Text(
                    text = day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Días del mes
        var currentDay = 1
        var currentWeekDay = firstDayOfWeek

        while (currentDay <= lastDayOfMonth.dayOfMonth) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                for (i in 0..6) {
                    if (i < currentWeekDay || currentDay > lastDayOfMonth.dayOfMonth) {
                        // Espacio vacío
                        Box(modifier = Modifier.weight(1f))
                    } else {
                        val date = yearMonth.atDay(currentDay)
                        val guard = viewModel.getGuardForDate(date)
                        val brigadeColor = guard?.let {
                            Color(android.graphics.Color.parseColor(
                                viewModel.getBrigadeColor(it.id_brigada)
                            ))
                        }

                        DayCell(
                            day = currentDay,
                            date = date,
                            hasGuard = guard != null,
                            brigadeColor = brigadeColor,
                            isToday = date == LocalDate.now(),
                            onClick = { onDateClick(date) },
                            modifier = Modifier.weight(1f)
                        )
                        currentDay++
                    }
                }
                currentWeekDay = 0
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

// ============================================
// CELDA DE DÍA
// ============================================

@Composable
fun DayCell(
    day: Int,
    date: LocalDate,
    hasGuard: Boolean,
    brigadeColor: Color?,
    isToday: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(
                when {
                    isToday -> MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                    hasGuard -> brigadeColor?.copy(alpha = 0.15f) ?: Color.Transparent
                    else -> Color.Transparent
                }
            )
            .clickable(enabled = hasGuard) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "$day",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (hasGuard || isToday) FontWeight.SemiBold else FontWeight.Normal,
            color = when {
                isToday -> MaterialTheme.colorScheme.primary
                hasGuard -> brigadeColor ?: MaterialTheme.colorScheme.onSurface
                else -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            }
        )
    }
}

// ============================================
// LÓGICA DE NAVEGACIÓN
// ============================================

fun handleDateClick(
    date: LocalDate,
    parkId: Int,
    viewModel: DashboardViewModel,
    onNavigate: (brigadeId: Int, date: String) -> Unit
) {
    val guard = viewModel.getGuardForDate(date)

    if (guard != null) {
        val brigade = viewModel.getBrigadeForGuard(guard, parkId)

        if (brigade != null) {
            onNavigate(brigade.id_brigada, date.toString())
        }
    }
}