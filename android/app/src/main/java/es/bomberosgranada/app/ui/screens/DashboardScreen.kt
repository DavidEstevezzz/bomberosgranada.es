package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.toColorInt
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
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()

    Scaffold(
        topBar = {
            ModernDashboardTopBar(
                currentMonth = currentMonth,
                onPreviousMonth = { viewModel.changeMonth(currentMonth.minusMonths(1)) },
                onNextMonth = { viewModel.changeMonth(currentMonth.plusMonths(1)) },
                onRefresh = { viewModel.refresh() }
            )
        },
        containerColor = BackgroundColor
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
// TOP BAR MODERNO
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ModernDashboardTopBar(
    currentMonth: YearMonth,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onRefresh: () -> Unit
) {
    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // Título y botón refresh
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Calendario",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Guardias de bomberos",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                IconButton(
                    onClick = onRefresh,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(BackgroundColor)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Refresh,
                        contentDescription = "Actualizar",
                        tint = TextPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Selector de mes
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onPreviousMonth,
                    modifier = Modifier
                        .size(36.dp)
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
                        .size(36.dp)
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

        // Espacio al final
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

// ============================================
// CARD DE CALENDARIO DE PARQUE (MODERNA)
// ============================================

@Composable
private fun ModernParkCalendarCard(
    title: String,
    parkId: Int,
    currentMonth: YearMonth,
    viewModel: DashboardViewModel,
    gradient: List<Color>,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onNavigateToGuard: (guardId: Int, brigadeId: Int, parkId: Int, date: String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(24.dp),
                spotColor = gradient.first().copy(alpha = 0.25f)
            ),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column {
            // Header con gradiente
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(colors = gradient)
                    )
                    .padding(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Icono en círculo
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
// GRID DEL CALENDARIO (MODERNO)
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
// CELDA DE DÍA (MODERNA)
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
        ?.uppercase(Locale.getDefault())

    val backgroundColor = when {
        brigadeColor != null -> brigadeColor
        isToday -> MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
        else -> Color.Transparent
    }

    val textColor = when {
        brigadeColor != null -> {
            if (brigadeColor.luminance() < 0.5f) {
                Color.White      // fondo oscuro → texto blanco
            } else {
                Color.Black      // fondo claro → texto negro
            }
        }
        isToday -> MaterialTheme.colorScheme.primary
        else -> TextPrimary
    }

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .then(
                if (hasGuard && brigadeColor != null) {
                    Modifier.shadow(
                        elevation = 4.dp,
                        shape = RoundedCornerShape(10.dp),
                        spotColor = brigadeColor.copy(alpha = 0.4f)
                    )
                } else Modifier
            )
            .clip(RoundedCornerShape(10.dp))
            .background(backgroundColor)
            .then(
                if (isToday && !hasGuard) {
                    Modifier.border(
                        width = 2.dp,
                        color = MaterialTheme.colorScheme.primary,
                        shape = RoundedCornerShape(10.dp)
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
            // Número del día
            Text(
                text = "$day",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = when {
                    isToday -> FontWeight.ExtraBold
                    hasGuard -> FontWeight.Bold
                    else -> FontWeight.Normal
                },
                color = textColor,
                fontSize = 13.sp
            )

            // Letra de brigada
            if (hasGuard && brigadeLabel != null) {
                Text(
                    text = brigadeLabel,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = textColor.copy(alpha = 0.9f),
                    fontSize = 9.sp
                )
            }
        }
    }
}

// ============================================
// PANTALLA DE ERROR (MODERNA)
// ============================================

@Composable
private fun ModernErrorScreen(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = 8.dp,
                    shape = RoundedCornerShape(24.dp)
                ),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.errorContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ErrorOutline,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "Error al cargar",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onRetry,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = GradientStart
                    )
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Reintentar")
                }
            }
        }
    }
}