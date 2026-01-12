package es.bomberosgranada.app.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.GuardDetailViewModel
import es.bomberosgranada.app.viewmodels.GuardDetailViewModel.*
import es.bomberosgranada.app.viewmodels.ThemeViewModel
import java.time.format.DateTimeFormatter
import java.util.Locale

// ============================================
// COLORES DEL DISEÑO (ACENTOS)
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentGreen = Color(0xFF4CAF50)
private val AccentPurple = Color(0xFF7C3AED)  // Para Requerimiento (si lo necesitas)
private val AccentAmber = Color(0xFFF59E0B)   // Para Cambio de Guardia

/**
 * Tipo de asignación especial del bombero
 */
enum class SpecialAssignmentType {
    NONE,           // Normal
    REQUERIMIENTO,  // Viene por requerimiento (R)
    CAMBIO_GUARDIA  // Viene por cambio de guardia (CG)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuardDetailScreen(
    guardId: Int,
    brigadeId: Int,
    parkId: Int,
    date: String,
    viewModel: GuardDetailViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val assignments by viewModel.assignments.collectAsState()
    val savingState by viewModel.savingAssignment.collectAsState()

    val canEdit = currentUser?.let { user ->
        user.type.lowercase() in listOf("jefe", "mando") || user.mando_especial == true
    } ?: false

    LaunchedEffect(guardId, brigadeId, parkId, date) {
        viewModel.loadGuardDetails(guardId, brigadeId, parkId, date)
    }

    AppScaffold(
        currentRoute = "guard-attendance",
        title = "Detalle de Guardia",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        showBackButton = true,
        onBack = onBack,
        unreadMessagesCount = unreadMessagesCount,
        themeViewModel = themeViewModel
    ) { paddingValues ->
        when (val state = uiState) {
            is GuardDetailUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    LoadingIndicator()
                }
            }

            is GuardDetailUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    ErrorState(message = state.message)
                }
            }

            is GuardDetailUiState.Success -> {
                val dateFormatter = DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", Locale("es", "ES"))
                val dateLabel = state.date.format(dateFormatter).replaceFirstChar { it.uppercase() }

                ModernGuardDetailContent(
                    paddingValues = paddingValues,
                    dateLabel = dateLabel,
                    brigadeName = state.brigadeName,
                    parkName = state.parkName,
                    guardType = state.guard.tipo,
                    attendees = state.attendees,
                    assignments = assignments,
                    canEdit = canEdit,
                    savingState = savingState,
                    viewModel = viewModel
                )
            }
        }
    }
}

@Composable
private fun ErrorState(message: String) {
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
                modifier = Modifier.size(56.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ModernGuardDetailContent(
    paddingValues: PaddingValues,
    dateLabel: String,
    brigadeName: String,
    parkName: String,
    guardType: String,
    attendees: List<Attendee>,
    assignments: Map<String, Map<Int, String>>,
    canEdit: Boolean,
    savingState: SavingState,
    viewModel: GuardDetailViewModel
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Header Card con gradiente
        item {
            HeaderCard(
                brigadeName = brigadeName,
                dateLabel = dateLabel,
                parkName = parkName,
                guardType = guardType,
                canEdit = canEdit
            )
        }

        // Leyenda de badges
        item {
            BadgeLegend()
        }

        // Turnos
        val shifts = listOf("Mañana", "Tarde", "Noche")
        val positionOrder = listOf("Subinspector", "Oficial", "Operador", "Conductor", "Bombero")

        shifts.forEach { shiftKey ->
            val shiftAttendees = attendees.filter { it.matchesShift(shiftKey) }
                .sortedWith(
                    compareBy<Attendee> {
                        val index = positionOrder.indexOf(it.position)
                        if (index == -1) Int.MAX_VALUE else index
                    }.thenBy { it.name }
                )

            if (shiftAttendees.isNotEmpty()) {
                item {
                    ShiftSection(
                        shiftName = shiftKey,
                        attendees = shiftAttendees,
                        assignments = assignments[shiftKey] ?: emptyMap(),
                        canEdit = canEdit,
                        savingState = savingState,
                        viewModel = viewModel
                    )
                }
            }
        }

        // Espaciado final
        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun HeaderCard(
    brigadeName: String,
    dateLabel: String,
    parkName: String,
    guardType: String,
    canEdit: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(20.dp),
                spotColor = GradientStart.copy(alpha = 0.25f)
            ),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(GradientStart, GradientEnd)
                    )
                )
                .padding(20.dp)
        ) {
            Column {
                Text(
                    text = brigadeName,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    InfoChip(
                        icon = Icons.Default.CalendarMonth,
                        text = dateLabel,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    InfoChip(
                        icon = Icons.Default.LocationOn,
                        text = parkName.ifEmpty { "Sin especificar" }
                    )
                    InfoChip(
                        icon = Icons.Default.Groups,
                        text = guardType
                    )
                }

                if (canEdit) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            tint = AccentOrange,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "Modo edición activo",
                            style = MaterialTheme.typography.labelSmall,
                            color = AccentOrange,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

/**
 * Leyenda explicativa de los badges R y CG
 */
@Composable
private fun BadgeLegend() {
    val textSecondary = AppColors.textSecondary

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Badge R
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            SpecialBadge(type = SpecialAssignmentType.REQUERIMIENTO)
            Text(
                text = "Requerimiento",
                style = MaterialTheme.typography.labelSmall,
                color = textSecondary
            )
        }

        // Badge CG
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            SpecialBadge(type = SpecialAssignmentType.CAMBIO_GUARDIA)
            Text(
                text = "Cambio guardia",
                style = MaterialTheme.typography.labelSmall,
                color = textSecondary
            )
        }
    }
}

@Composable
private fun InfoChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = Color.White.copy(alpha = 0.15f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.9f),
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = Color.White.copy(alpha = 0.95f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ShiftSection(
    shiftName: String,
    attendees: List<Attendee>,
    assignments: Map<Int, String>,
    canEdit: Boolean,
    savingState: SavingState,
    viewModel: GuardDetailViewModel
) {
    val shiftColor = when (shiftName) {
        "Mañana" -> Color(0xFFFFB74D)
        "Tarde" -> Color(0xFF64B5F6)
        "Noche" -> Color(0xFF9575CD)
        else -> MaterialTheme.colorScheme.primary
    }

    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val cardBackground = AppColors.cardBackground
    val dividerColor = AppColors.divider

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
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
                    .size(4.dp, 24.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(shiftColor)
            )
            Text(
                text = shiftName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = textPrimary
            )
            Text(
                text = "(${attendees.size})",
                style = MaterialTheme.typography.bodyMedium,
                color = textSecondary
            )
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = 6.dp,
                    shape = RoundedCornerShape(16.dp),
                    spotColor = Color.Black.copy(alpha = 0.08f)
                ),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = cardBackground)
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                attendees.forEachIndexed { index, attendee ->
                    CompactAttendeeRow(
                        attendee = attendee,
                        shift = shiftName,
                        currentAssignment = assignments[attendee.id] ?: "",
                        canEdit = canEdit,
                        isSaving = savingState is SavingState.Saving &&
                                savingState.employeeId == attendee.id &&
                                savingState.shift == shiftName,
                        options = viewModel.getFilteredOptions(attendee.position),
                        onAssignmentChange = { newAssignment ->
                            viewModel.updateAssignment(shiftName, attendee.id, newAssignment)
                        }
                    )

                    if (index < attendees.size - 1) {
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 6.dp),
                            thickness = 1.dp,
                            color = dividerColor
                        )
                    }
                }
            }
        }
    }
}

/**
 * Badge especial para indicar Requerimiento (R) o Cambio de Guardia (CG)
 */
@Composable
private fun SpecialBadge(
    type: SpecialAssignmentType,
    modifier: Modifier = Modifier
) {
    if (type == SpecialAssignmentType.NONE) return

    val (backgroundColor, text) = when (type) {
        SpecialAssignmentType.REQUERIMIENTO -> AccentAmber to "R"
        SpecialAssignmentType.CAMBIO_GUARDIA -> AccentAmber to "CG"
        else -> return
    }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(4.dp),
        color = backgroundColor,
        shadowElevation = 2.dp
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            fontSize = 9.sp
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CompactAttendeeRow(
    attendee: Attendee,
    shift: String,
    currentAssignment: String,
    canEdit: Boolean,
    isSaving: Boolean,
    options: List<String>,
    onAssignmentChange: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var showCgDialog by remember { mutableStateOf(false) }

    // Determinar tipo de asignación especial
    val specialType = attendee.getSpecialAssignmentType()
    val isCambioGuardia = specialType == SpecialAssignmentType.CAMBIO_GUARDIA

    // Colores de texto del tema
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary

    // Color del badge de turno
    val shiftBadgeColor = when {
        attendee.shift.contains("Mañana", ignoreCase = true) -> Color(0xFFFFB74D)
        attendee.shift.contains("Tarde", ignoreCase = true) -> Color(0xFF64B5F6)
        attendee.shift.contains("Noche", ignoreCase = true) -> Color(0xFF9575CD)
        attendee.shift == "Día completo" -> Color(0xFF4CAF50)
        else -> Color(0xFF78909C)
    }

    // Color del badge de puesto
    val positionColor = when (attendee.position) {
        "Subinspector", "Oficial" -> Color(0xFFE53935)
        "Conductor" -> Color(0xFF1E88E5)
        "Operador" -> Color(0xFF43A047)
        "Bombero" -> Color(0xFFFF9800)
        else -> Color(0xFF78909C)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Avatar con inicial
        Box(
            modifier = Modifier
                .size(36.dp)
                .shadow(2.dp, CircleShape)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            positionColor,
                            positionColor.copy(alpha = 0.7f)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = attendee.name.take(1).uppercase(),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Nombre, puesto y badge especial
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = attendee.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Puesto
                Text(
                    text = attendee.position,
                    style = MaterialTheme.typography.labelSmall,
                    color = positionColor,
                    fontWeight = FontWeight.Medium
                )

                // Badge R o CG si aplica
                SpecialBadge(
                    type = specialType,
                    modifier = if (isCambioGuardia) {
                        Modifier.clickable { showCgDialog = true }
                    } else {
                        Modifier
                    }
                )

                // Indicador si no está disponible
                if (!attendee.available) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.error)
                    )
                }
            }
        }

        // Badge de turno compacto
        Surface(
            shape = RoundedCornerShape(6.dp),
            color = shiftBadgeColor,
            shadowElevation = 2.dp
        ) {
            Text(
                text = getShortShiftLabel(attendee.shift),
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 10.sp
            )
        }

        // Asignación (dropdown o texto)
        if (canEdit) {
            Box {
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { if (!isSaving) expanded = !expanded }
                ) {
                    Surface(
                        modifier = Modifier
                            .menuAnchor()
                            .width(72.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = if (currentAssignment.isNotEmpty())
                            AccentGreen.copy(alpha = 0.1f)
                        else
                            MaterialTheme.colorScheme.surfaceVariant,
                        border = BorderStroke(
                            1.dp,
                            if (currentAssignment.isNotEmpty())
                                AccentGreen.copy(alpha = 0.3f)
                            else
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.6f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = currentAssignment.ifEmpty { "—" },
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (currentAssignment.isNotEmpty())
                                    AccentGreen
                                else
                                    textSecondary,
                                maxLines = 1
                            )
                            if (isSaving) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(12.dp),
                                    strokeWidth = 1.5.dp,
                                    color = AccentGreen
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = textSecondary
                                )
                            }
                        }
                    }

                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        options.forEach { option ->
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        text = option,
                                        fontWeight = if (option == currentAssignment)
                                            FontWeight.Bold
                                        else
                                            FontWeight.Normal,
                                        fontSize = 13.sp
                                    )
                                },
                                onClick = {
                                    expanded = false
                                    if (option != currentAssignment) {
                                        onAssignmentChange(option)
                                    }
                                },
                                leadingIcon = if (option == currentAssignment) {
                                    {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = null,
                                            tint = AccentGreen,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                } else null,
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }
        } else {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (currentAssignment.isNotEmpty())
                    AccentGreen.copy(alpha = 0.1f)
                else
                    MaterialTheme.colorScheme.surfaceVariant
            ) {
                Text(
                    text = currentAssignment.ifEmpty { "—" },
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (currentAssignment.isNotEmpty())
                        AccentGreen
                    else
                        textSecondary
                )
            }
        }
    }

    if (showCgDialog && isCambioGuardia) {
        AlertDialog(
            onDismissRequest = { showCgDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.CompareArrows,
                    contentDescription = null,
                    tint = AccentAmber
                )
            },
            title = {
                Text(
                    text = "Cambio de guardia",
                    color = AccentAmber,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Acude: ${attendee.name}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = textPrimary
                    )
                    Text(
                        text = "Pide cambio: ${attendee.cambioConNombre?.takeIf { it.isNotBlank() } ?: "Sin especificar"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = textPrimary
                    )
                    Text(
                        text = "Turno intercambiado: ${attendee.shift}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = textPrimary
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showCgDialog = false }) {
                    Text(
                        text = "Cerrar",
                        color = AccentAmber,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        )
    }
}

/**
 * Determina el tipo de asignación especial del bombero
 */
private fun Attendee.getSpecialAssignmentType(): SpecialAssignmentType {
    return when {
        isRequerimiento == true -> SpecialAssignmentType.REQUERIMIENTO
        hasChangeRequest && tipoAsignacion == "ida" -> SpecialAssignmentType.CAMBIO_GUARDIA
        else -> SpecialAssignmentType.NONE
    }
}

private fun getShortShiftLabel(shift: String): String {
    return when {
        shift == "Día completo" -> "DÍA"
        shift == "Mañana y tarde" -> "M+T"
        shift == "Mañana y noche" -> "M+N"
        shift == "Tarde y noche" -> "T+N"
        shift == "Mañana" -> "MAÑ"
        shift == "Tarde" -> "TAR"
        shift == "Noche" -> "NOC"
        else -> shift.take(3).uppercase()
    }
}

private fun Attendee.matchesShift(targetShift: String): Boolean {
    return shift == targetShift ||
            shift == "Día completo" ||
            (targetShift == "Mañana" && (shift == "Mañana y tarde" || shift == "Mañana y noche")) ||
            (targetShift == "Tarde" && (shift == "Mañana y tarde" || shift == "Tarde y noche")) ||
            (targetShift == "Noche" && (shift == "Tarde y noche" || shift == "Mañana y noche"))
}
