package es.bomberosgranada.app.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel.*
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.*

// ============================================
// COLORES DEL DISEÑO
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentGreen = Color(0xFF4CAF50)
private val AccentBlue = Color(0xFF2196F3)
private val SurfaceElevated = Color(0xFFF8FAFC)
private val BackgroundColor = Color(0xFFF1F5F9)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val CardBackground = Color(0xFFFFFFFF)
private val ErrorRed = Color(0xFFEF4444)
private val SuccessGreen = Color(0xFF22C55E)

// Colores para cada tipo de solicitud
private val RequestTypeColors = mapOf(
    RequestType.VACACIONES to Color(0xFF3B82F6),
    RequestType.ASUNTOS_PROPIOS to Color(0xFF8B5CF6),
    RequestType.HORAS_SINDICALES to Color(0xFFF59E0B),
    RequestType.SALIDAS_PERSONALES to Color(0xFF10B981),
    RequestType.MODULO to Color(0xFFEC4899),
    RequestType.VESTUARIO to Color(0xFF6366F1),
    RequestType.LICENCIAS_JORNADAS to Color(0xFF14B8A6),
    RequestType.LICENCIAS_DIAS to Color(0xFFF97316),
    RequestType.COMPENSACION_GRUPOS to Color(0xFF06B6D4)
)

// Iconos para cada tipo de solicitud
private val RequestTypeIcons = mapOf(
    RequestType.VACACIONES to Icons.Default.BeachAccess,
    RequestType.ASUNTOS_PROPIOS to Icons.Default.Person,
    RequestType.HORAS_SINDICALES to Icons.Default.Groups,
    RequestType.SALIDAS_PERSONALES to Icons.Default.DirectionsWalk,
    RequestType.MODULO to Icons.Default.CalendarMonth,
    RequestType.VESTUARIO to Icons.Default.Checkroom,
    RequestType.LICENCIAS_JORNADAS to Icons.Default.WorkOff,
    RequestType.LICENCIAS_DIAS to Icons.Default.EventBusy,
    RequestType.COMPENSACION_GRUPOS to Icons.Default.Diversity3
)

// ============================================
// PANTALLA PRINCIPAL
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateRequestScreen(
    viewModel: CreateRequestViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedType by viewModel.selectedType.collectAsState()
    val fechaInicio by viewModel.fechaInicio.collectAsState()
    val fechaFin by viewModel.fechaFin.collectAsState()
    val horaInicio by viewModel.horaInicio.collectAsState()
    val horaFin by viewModel.horaFin.collectAsState()
    val turnoSeleccionado by viewModel.turnoSeleccionado.collectAsState()
    val motivo by viewModel.motivo.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()

    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    // Mostrar mensajes de error/éxito
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(
                message = it,
                duration = SnackbarDuration.Long
            )
            viewModel.clearError()
        }
    }

    LaunchedEffect(successMessage) {
        successMessage?.let {
            snackbarHostState.showSnackbar(
                message = it,
                duration = SnackbarDuration.Short
            )
            viewModel.clearSuccess()
        }
    }

    AppScaffold(
        currentRoute = "create-request",
        title = "Nueva Solicitud",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        showBackButton = true,
        onBack = onBack,
        unreadMessagesCount = unreadMessagesCount
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            if (currentUser == null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    LoadingIndicator(message = "Cargando usuario...")
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header con información del usuario
                    item {
                        UserBalanceCard(
                            user = currentUser,
                            selectedType = selectedType,
                            viewModel = viewModel
                        )
                    }

                    // Selector de tipo de solicitud
                    item {
                        RequestTypeSelector(
                            selectedType = selectedType,
                            onTypeSelected = { viewModel.setSelectedType(it) }
                        )
                    }

                    // Formulario dinámico según el tipo
                    item {
                        RequestFormCard(
                            viewModel = viewModel,
                            selectedType = selectedType,
                            fechaInicio = fechaInicio,
                            fechaFin = fechaFin,
                            horaInicio = horaInicio,
                            horaFin = horaFin,
                            turnoSeleccionado = turnoSeleccionado,
                            motivo = motivo,
                            context = context
                        )
                    }

                    // Botón de envío
                    item {
                        SubmitButton(
                            uiState = uiState,
                            onSubmit = { viewModel.submitRequest(currentUser) }
                        )
                    }

                    // Espaciado inferior
                    item {
                        Spacer(modifier = Modifier.height(32.dp))
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
// TARJETA DE SALDO DEL USUARIO
// ============================================

@Composable
private fun UserBalanceCard(
    user: User,
    selectedType: RequestType,
    viewModel: CreateRequestViewModel
) {
    val typeColor = RequestTypeColors[selectedType] ?: AccentBlue
    val balance = viewModel.getCurrentBalance(user)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
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
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "${user.nombre} ${user.apellido}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = user.puesto ?: "Bombero",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Saldo para el tipo seleccionado
                AnimatedContent(
                    targetState = balance,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(300)) togetherWith
                                fadeOut(animationSpec = tween(300))
                    },
                    label = "balance"
                ) { currentBalance ->
                    if (currentBalance.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White.copy(alpha = 0.15f))
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = RequestTypeIcons[selectedType] ?: Icons.Default.Event,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = selectedType.displayName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.White
                                )
                            }
                            Text(
                                text = currentBalance,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

// ============================================
// SELECTOR DE TIPO DE SOLICITUD
// ============================================

@Composable
private fun RequestTypeSelector(
    selectedType: RequestType,
    onTypeSelected: (RequestType) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Tipo de Solicitud",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(RequestType.entries) { type ->
                    RequestTypeChip(
                        type = type,
                        isSelected = type == selectedType,
                        onClick = { onTypeSelected(type) }
                    )
                }
            }
        }
    }
}

@Composable
private fun RequestTypeChip(
    type: RequestType,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val typeColor = RequestTypeColors[type] ?: AccentBlue
    val icon = RequestTypeIcons[type] ?: Icons.Default.Event

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) typeColor else Color.Transparent,
        animationSpec = tween(200),
        label = "chipBackground"
    )

    val contentColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else typeColor,
        animationSpec = tween(200),
        label = "chipContent"
    )

    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = backgroundColor,
        border = if (!isSelected) {
            androidx.compose.foundation.BorderStroke(1.5.dp, typeColor.copy(alpha = 0.5f))
        } else null
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = contentColor,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = type.displayName,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = contentColor
            )
        }
    }
}

// ============================================
// FORMULARIO DE SOLICITUD
// ============================================

@Composable
private fun RequestFormCard(
    viewModel: CreateRequestViewModel,
    selectedType: RequestType,
    fechaInicio: LocalDate?,
    fechaFin: LocalDate?,
    horaInicio: LocalTime?,
    horaFin: LocalTime?,
    turnoSeleccionado: Turno?,
    motivo: String,
    context: android.content.Context
) {
    val typeColor = RequestTypeColors[selectedType] ?: AccentBlue
    val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Título del formulario
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(typeColor.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.EditCalendar,
                        contentDescription = null,
                        tint = typeColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = "Datos de la Solicitud",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            HorizontalDivider(color = SurfaceElevated)

            // Fecha Inicio
            DatePickerField(
                label = "Fecha de Inicio",
                value = fechaInicio,
                formatter = dateFormatter,
                accentColor = typeColor,
                context = context,
                onDateSelected = { viewModel.setFechaInicio(it) }
            )

            // Fecha Fin
            AnimatedVisibility(
                visible = viewModel.requiresFechaFin(),
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                DatePickerField(
                    label = "Fecha de Fin",
                    value = fechaFin,
                    formatter = dateFormatter,
                    accentColor = typeColor,
                    context = context,
                    onDateSelected = { viewModel.setFechaFin(it) }
                )
            }

            // Selector de turno
            AnimatedVisibility(
                visible = viewModel.requiresTurno(),
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                TurnoSelector(
                    turnos = viewModel.getAvailableTurnos(),
                    selectedTurno = turnoSeleccionado,
                    accentColor = typeColor,
                    onTurnoSelected = { viewModel.setTurno(it) }
                )
            }

            // Horas inicio/fin
            AnimatedVisibility(
                visible = viewModel.requiresHoras(),
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    TimePickerField(
                        label = "Hora de Inicio",
                        value = horaInicio,
                        formatter = timeFormatter,
                        accentColor = typeColor,
                        context = context,
                        onTimeSelected = { viewModel.setHoraInicio(it) }
                    )
                    TimePickerField(
                        label = "Hora de Fin",
                        value = horaFin,
                        formatter = timeFormatter,
                        accentColor = typeColor,
                        context = context,
                        onTimeSelected = { viewModel.setHoraFin(it) }
                    )
                }
            }

            // Campo de motivo
            OutlinedTextField(
                value = motivo,
                onValueChange = { viewModel.setMotivo(it) },
                label = { Text("Motivo (opcional)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = typeColor,
                    focusedLabelColor = typeColor,
                    cursorColor = typeColor
                ),
                minLines = 2,
                maxLines = 4
            )
        }
    }
}

// ============================================
// COMPONENTES DE FECHA Y HORA
// ============================================

@Composable
private fun DatePickerField(
    label: String,
    value: LocalDate?,
    formatter: DateTimeFormatter,
    accentColor: Color,
    context: android.content.Context,
    onDateSelected: (LocalDate) -> Unit
) {
    val calendar = Calendar.getInstance()

    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = TextSecondary,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .clickable {
                    DatePickerDialog(
                        context,
                        { _, year, month, dayOfMonth ->
                            onDateSelected(LocalDate.of(year, month + 1, dayOfMonth))
                        },
                        value?.year ?: calendar.get(Calendar.YEAR),
                        value?.monthValue?.minus(1) ?: calendar.get(Calendar.MONTH),
                        value?.dayOfMonth ?: calendar.get(Calendar.DAY_OF_MONTH)
                    ).show()
                },
            shape = RoundedCornerShape(16.dp),
            color = SurfaceElevated,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (value != null) accentColor.copy(alpha = 0.5f) else Color.Transparent
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = null,
                        tint = if (value != null) accentColor else TextSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = value?.format(formatter) ?: "Seleccionar fecha",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (value != null) TextPrimary else TextSecondary
                    )
                }
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun TimePickerField(
    label: String,
    value: LocalTime?,
    formatter: DateTimeFormatter,
    accentColor: Color,
    context: android.content.Context,
    onTimeSelected: (LocalTime) -> Unit
) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = TextSecondary,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .clickable {
                    TimePickerDialog(
                        context,
                        { _, hour, minute ->
                            onTimeSelected(LocalTime.of(hour, minute))
                        },
                        value?.hour ?: 8,
                        value?.minute ?: 0,
                        true
                    ).show()
                },
            shape = RoundedCornerShape(16.dp),
            color = SurfaceElevated,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (value != null) accentColor.copy(alpha = 0.5f) else Color.Transparent
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = if (value != null) accentColor else TextSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = value?.format(formatter) ?: "Seleccionar hora",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (value != null) TextPrimary else TextSecondary
                    )
                }
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = TextSecondary
                )
            }
        }
    }
}

// ============================================
// SELECTOR DE TURNO
// ============================================

@Composable
private fun TurnoSelector(
    turnos: List<Turno>,
    selectedTurno: Turno?,
    accentColor: Color,
    onTurnoSelected: (Turno) -> Unit
) {
    Column {
        Text(
            text = "Turno",
            style = MaterialTheme.typography.labelMedium,
            color = TextSecondary,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(12.dp))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            turnos.chunked(3).forEach { rowTurnos ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    rowTurnos.forEach { turno ->
                        TurnoChip(
                            turno = turno,
                            isSelected = turno == selectedTurno,
                            accentColor = accentColor,
                            onClick = { onTurnoSelected(turno) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    repeat(3 - rowTurnos.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun TurnoChip(
    turno: Turno,
    isSelected: Boolean,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) accentColor else SurfaceElevated,
        animationSpec = tween(200),
        label = "turnoBackground"
    )

    val contentColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else TextPrimary,
        animationSpec = tween(200),
        label = "turnoContent"
    )

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = backgroundColor
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = turno.displayName,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = contentColor,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ============================================
// BOTÓN DE ENVÍO
// ============================================

@Composable
private fun SubmitButton(
    uiState: CreateRequestUiState,
    onSubmit: () -> Unit
) {
    val isLoading = uiState is CreateRequestUiState.Loading ||
            uiState is CreateRequestUiState.Validating

    Button(
        onClick = onSubmit,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .shadow(8.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        enabled = !isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = AccentOrange,
            disabledContainerColor = AccentOrange.copy(alpha = 0.5f)
        )
    ) {
        AnimatedContent(
            targetState = isLoading,
            transitionSpec = {
                fadeIn(animationSpec = tween(200)) togetherWith
                        fadeOut(animationSpec = tween(200))
            },
            label = "buttonContent"
        ) { loading ->
            if (loading) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Text(
                        text = if (uiState is CreateRequestUiState.Validating)
                            "Validando..." else "Enviando...",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            } else {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Send,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = "Enviar Solicitud",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }
}