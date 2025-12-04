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
import es.bomberosgranada.app.viewmodels.DashboardUiState
import es.bomberosgranada.app.viewmodels.DashboardViewModel
import es.bomberosgranada.app.viewmodels.BrigadeDisplayInfo
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

// ============================================
// COLORES DEL DISEÑO
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val GradientNorte = listOf(Color(0xFF1E3A5F), Color(0xFF2D5A87))
private val GradientSur = listOf(Color(0xFFB91C1C), Color(0xFFDC2626))
private val SurfaceCard = Color(0xFFFFFFFF)
private val BackgroundColor = Color(0xFFF1F5F9)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val AccentOrange = Color(0xFFFF6B35)

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
    unreadMessagesCount: Int = 0
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()

    AppScaffold(
        currentRoute = "dashboard",
        title = "Calendario",
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
// CONTENIDO PRINCIPAL
// ============================================

@Composable
private fun ModernDashboardContent(
    viewModel: DashboardViewModel,
    currentMonth: YearMonth,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Navegación de mes
        item {
            MonthNavigator(
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
                gradient = GradientNorte,
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
                gradient = GradientSur,
                icon = Icons.Default.South,
                onNavigateToGuard = onNavigateToGuard
            )
        }

        // Espaciado inferior
        item {
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

// ============================================
// NAVEGADOR DE MES
// ============================================

@Composable
private fun MonthNavigator(
    currentMonth: YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onPreviousMonth,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(BackgroundColor)
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
                    .background(BackgroundColor)
            ) {
                Icon(
                    imageVector = Icons.Rounded.ChevronRight,
                    contentDescription = "Mes siguiente",
                    tint = TextPrimary
                )
            }
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
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard)
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
// GRID DEL CALENDARIO
// ============================================

@Composable
private fun ModernCalendarGrid(
    yearMonth: YearMonth,
    parkId: Int,
    viewModel: DashboardViewModel,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val firstDayOfMonth = yearMonth.atDay(1)
    val lastDayOfMonth = yearMonth.atEndOfMonth()
    val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Días de la semana
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("D", "L", "M", "X", "J", "V", "S").forEach { day ->
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary,
                        letterSpacing = 1.sp
                    )
                }
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
                        Spacer(modifier = Modifier.weight(1f))
                    } else {
                        val date = yearMonth.atDay(currentDay)
                        val guard = viewModel.getGuardForDate(date, parkId)
                        val brigadeInfo = guard?.let { viewModel.getBrigadeDisplayInfo(it.id_brigada) }

                        ModernDayCell(
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
            Spacer(modifier = Modifier.height(4.dp))
        }
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
    val brigadeColor = brigadeInfo?.colorHex?.let(::parseHexColor)
    val brigadeLabel = brigadeInfo?.label
        ?.ifBlank { brigadeInfo.name.take(1) }
        ?.ifBlank { "?" }

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
                    Modifier.background(BackgroundColor)
                }
            )
            .then(
                if (isToday) {
                    Modifier.border(2.dp, AccentOrange, RoundedCornerShape(12.dp))
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
                    hasGuard && brigadeColor != null -> {
                        if (brigadeColor.luminance() > 0.5f) TextPrimary else Color.White
                    }
                    else -> TextPrimary
                }
            )

            if (hasGuard && brigadeLabel != null) {
                Text(
                    text = brigadeLabel,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        brigadeColor != null && brigadeColor.luminance() > 0.5f -> TextPrimary
                        else -> Color.White.copy(alpha = 0.9f)
                    }
                )
            }
        }
    }
}