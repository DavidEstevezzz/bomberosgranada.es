package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.ui.components.*
import es.bomberosgranada.app.viewmodels.DashboardUiState
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import es.bomberosgranada.app.viewmodels.BrigadeDisplayInfo
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*
import androidx.core.graphics.toColorInt

/**
 * 🔥 DASHBOARD PRINCIPAL - BOMBEROS GRANADA
 *
 * Diseño elegante estilo Apple/Nike/Adidas:
 * - Minimalismo y precisión
 * - Gradientes sutiles
 * - Bordes redondeados (24dp)
 * - Animaciones fluidas
 * - Espaciado generoso
 * - Tipografía clara y moderna
 */

private fun parseHexColor(hex: String): Color = Color(hex.toColorInt())

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()

    Scaffold(
        topBar = {
            DashboardTopBar(
                currentMonth = currentMonth,
                onPreviousMonth = { viewModel.changeMonth(currentMonth.minusMonths(1)) },
                onNextMonth = { viewModel.changeMonth(currentMonth.plusMonths(1)) },
                onRefresh = { viewModel.refresh() }
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
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
                    DashboardContent(
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
// TOP BAR ELEGANTE
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardTopBar(
    currentMonth: YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onRefresh: () -> Unit
) {
    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Bomberos Granada",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "$monthName ${currentMonth.year}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }
        },
        actions = {
            // Botón mes anterior
            IconButton(onClick = onPreviousMonth) {
                Icon(
                    imageVector = Icons.Default.ChevronLeft,
                    contentDescription = "Mes anterior",
                    tint = Color.White
                )
            }

            // Botón mes siguiente
            IconButton(onClick = onNextMonth) {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = "Mes siguiente",
                    tint = Color.White
                )
            }

            // Botón refrescar
            IconButton(onClick = onRefresh) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refrescar",
                    tint = Color.White
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.Transparent
        ),
        modifier = Modifier
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFFDC2626), // Rojo bomberos
                        Color(0xFFEF4444),
                        Color(0xFFF87171)
                    )
                )
            )
    )
}

// ============================================
// CONTENIDO PRINCIPAL
// ============================================

@Composable
fun DashboardContent(
    viewModel: DashboardViewModel,
    currentMonth: YearMonth,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Estadísticas del mes
        item {
            MonthStatsCard(viewModel = viewModel)
        }

        // Calendario Parque Norte
        item {
            ParkCalendarCard(
                title = "Parque Norte",
                parkId = 1,
                currentMonth = currentMonth,
                viewModel = viewModel,
                onNavigateToGuard = onNavigateToGuard
            )
        }

        // Calendario Parque Sur
        item {
            ParkCalendarCard(
                title = "Parque Sur",
                parkId = 2,
                currentMonth = currentMonth,
                viewModel = viewModel,
                onNavigateToGuard = onNavigateToGuard
            )
        }

        // Espacio al final
        item {
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

// ============================================
// CARD DE ESTADÍSTICAS (ELEGANTE)
// ============================================

@Composable
fun MonthStatsCard(viewModel: DashboardViewModel) {
    val stats = viewModel.getMonthStats()
    val brigadeMap by viewModel.brigadeMap.collectAsState()

    ElegantCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        // Header con icono
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Analytics,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(28.dp)
            )
            Text(
                text = "Resumen del Mes",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Total de guardias (destacado)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Total de Guardias",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Este mes",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
                Text(
                    text = "${stats.totalGuards}",
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        // Solo mostrar brigadas si hay datos
        if (stats.brigadeStats.isNotEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))

            // Divider elegante
            ElegantDivider()

            Spacer(modifier = Modifier.height(20.dp))

            // Guardias por brigada
            Text(
                text = "Por Brigada",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            stats.brigadeStats.entries.sortedByDescending { it.value }.forEach { (brigadeId, count) ->
                val displayInfo = viewModel.getBrigadeDisplayInfo(brigadeId)

                BrigadeStatRow(
                    brigadeName = brigadeMap[brigadeId] ?: "?",
                    brigadeColor = parseHexColor(displayInfo.colorHex),
                    count = count
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun BrigadeStatRow(
    brigadeName: String,
    brigadeColor: Color,
    count: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Indicador de color
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(brigadeColor)
            )
            Text(
                text = "Brigada $brigadeName",
                style = MaterialTheme.typography.bodyLarge
            )
        }

        // Badge con número
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.secondaryContainer
        ) {
            Text(
                text = "$count",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer
            )
        }
    }
}

// ============================================
// CARD DE CALENDARIO DE PARQUE
// ============================================

@Composable
fun ParkCalendarCard(
    title: String,
    parkId: Int,
    currentMonth: YearMonth,
    viewModel: DashboardViewModel,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    ElegantCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        // Header del parque
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.LocalFireDepartment,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(28.dp)
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Calendario mensual",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Grid del calendario
        CalendarGrid(
            yearMonth = currentMonth,
            parkId = parkId,
            viewModel = viewModel,
            onNavigateToGuard = onNavigateToGuard
        )
    }
}

// ============================================
// GRID DEL CALENDARIO
// ============================================

@Composable
fun CalendarGrid(
    yearMonth: YearMonth,
    parkId: Int,
    viewModel: DashboardViewModel,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val firstDayOfMonth = yearMonth.atDay(1)
    val lastDayOfMonth = yearMonth.atEndOfMonth()
    val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7

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
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

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
                        Spacer(modifier = Modifier.weight(1f))
                    } else {
                        val date = yearMonth.atDay(currentDay)
                        val guard = viewModel.getGuardForDate(date)
                        val brigadeInfo = guard?.let { viewModel.getBrigadeDisplayInfo(it.id_brigada) }


                        DayCell(
                            day = currentDay,
                            hasGuard = guard != null,
                            brigadeInfo = brigadeInfo,
                            isToday = date == LocalDate.now(),
                            onClick = {
                                guard?.let {
                                    val brigade = viewModel.getBrigadeForGuard(it, parkId)
                                    brigade?.let { b ->
                                        onNavigateToGuard(it.id, b.id_brigada, parkId, date.toString())
                                    }
                                }
                            },
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
// CELDA DE DÍA (ELEGANTE) - Sin parámetro date innecesario
// ============================================

@Composable
fun DayCell(
    day: Int,
    hasGuard: Boolean,
    brigadeInfo: BrigadeDisplayInfo?,
    isToday: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val brigadeColor = brigadeInfo?.colorHex?.let(::parseHexColor)
    val onBrigadeColor = brigadeInfo?.onColorHex?.let(::parseHexColor)
    val borderColor = brigadeInfo?.borderHex?.let(::parseHexColor)
    val badgeBackground = brigadeColor?.copy(alpha = 0.22f)
        ?: onBrigadeColor?.copy(alpha = 0.18f)
        ?: MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
    val badgeTextColor = onBrigadeColor ?: borderColor ?: MaterialTheme.colorScheme.onSurface
    val badgeLabel = brigadeInfo?.label
        ?.ifBlank { brigadeInfo.name.take(2) }
        ?.ifBlank { "?" }
        ?.uppercase(Locale.getDefault())

    val backgroundColor = when {
        brigadeColor != null -> brigadeColor
        isToday -> MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.12f)
    }

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(4.dp)
            .shadow(
                elevation = if (hasGuard) 2.dp else 0.dp,
                shape = RoundedCornerShape(14.dp)
            )
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .then(
                if (borderColor != null || isToday || brigadeColor != null) {
                    Modifier.border(
                        width = if (isToday) 2.dp else 1.dp,
                        color = borderColor ?: brigadeColor ?: MaterialTheme.colorScheme.primary,
                        shape = RoundedCornerShape(14.dp)
                    )
                } else Modifier
            )
            .clickable(enabled = hasGuard) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "$day",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = when {
                    isToday -> FontWeight.ExtraBold
                    hasGuard -> FontWeight.Bold
                    else -> FontWeight.Normal
                },
                color = when {
                    hasGuard && onBrigadeColor != null -> onBrigadeColor
                    isToday -> MaterialTheme.colorScheme.primary
                    hasGuard -> brigadeColor ?: MaterialTheme.colorScheme.onSurface
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
            )

            // Indicador visual si hay guardia
            if (hasGuard && brigadeInfo != null && badgeLabel != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = brigadeColor ?: Color.Gray,
                    tonalElevation = 0.dp
                ) {
                    Text(
                        text = badgeLabel,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        color = onBrigadeColor ?: Color.White  // El color de texto sobre la brigada
                    )
                }
            }
        }
    }
}
