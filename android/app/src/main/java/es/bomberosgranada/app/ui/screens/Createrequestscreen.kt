package es.bomberosgranada.app.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.BeachAccess
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Checkroom
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Diversity3
import androidx.compose.material.icons.filled.EditCalendar
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.WorkOff
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel.CreateRequestUiState
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel.RequestType
import es.bomberosgranada.app.viewmodels.CreateRequestViewModel.Turno
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.Locale
import es.bomberosgranada.app.viewmodels.ThemeViewModel

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateRequestScreen(
    viewModel: CreateRequestViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null
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
        currentRoute = "create-request",
        title = "Nueva Solicitud",
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        showBackButton = true,
        onBack = onBack,
        unreadMessagesCount = unreadMessagesCount,
        themeViewModel = themeViewModel
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(AppColors.background)
        ) {
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
                    item {
                        UserBalanceCard(
                            user = currentUser,
                            selectedType = selectedType,
                            viewModel = viewModel
                        )
                    }

                    item {
                        RequestTypeSelector(
                            selectedType = selectedType,
                            onTypeSelected = { viewModel.setSelectedType(it) }
                        )
                    }

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

                    item {
                        SubmitButton(
                            uiState = uiState,
                            onSubmit = { viewModel.submitRequest(currentUser) }
                        )
                    }

                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = if (errorMessage != null) MaterialTheme.colorScheme.error else AppColors.accentGreen,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
private fun UserBalanceCard(
    user: User,
    selectedType: RequestType,
    viewModel: CreateRequestViewModel
) {
    val typeColor = requestTypeColor(selectedType)
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
                .background(brush = AppColors.gradientPrimaryBrush)
                .padding(24.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
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
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Tipo de Solicitud",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
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
    val typeColor = requestTypeColor(type)
    val icon = RequestTypeIcons[type] ?: Icons.Default.Event

    val backgroundColor by androidx.compose.animation.animateColorAsState(
        targetValue = if (isSelected) typeColor else AppColors.surfaceElevated,
        animationSpec = tween(200),
        label = "chipBackground"
    )

    val contentColor by androidx.compose.animation.animateColorAsState(
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
        border = if (!isSelected) BorderStroke(1.5.dp, typeColor.copy(alpha = 0.5f)) else null
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
    context: Context
) {
    val typeColor = requestTypeColor(selectedType)
    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.getDefault()) }
    val timeFormatter = remember { DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault()) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
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
                    color = AppColors.textPrimary
                )
            }

            HorizontalDivider(color = AppColors.surfaceElevated)

            DatePickerField(
                label = "Fecha de Inicio",
                value = fechaInicio,
                formatter = dateFormatter,
                accentColor = typeColor,
                context = context,
                onDateSelected = { viewModel.setFechaInicio(it) }
            )

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

@Composable
private fun DatePickerField(
    label: String,
    value: LocalDate?,
    formatter: DateTimeFormatter,
    accentColor: Color,
    context: Context,
    onDateSelected: (LocalDate) -> Unit
) {
    val calendar = remember { Calendar.getInstance() }

    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = AppColors.textSecondary,
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
            color = AppColors.surfaceElevated,
            border = BorderStroke(
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
                        tint = if (value != null) accentColor else AppColors.textSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = value?.format(formatter) ?: "Seleccionar fecha",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (value != null) AppColors.textPrimary else AppColors.textSecondary
                    )
                }
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = AppColors.textSecondary
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
    context: Context,
    onTimeSelected: (LocalTime) -> Unit
) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = AppColors.textSecondary,
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
            color = AppColors.surfaceElevated,
            border = BorderStroke(
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
                        tint = if (value != null) accentColor else AppColors.textSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = value?.format(formatter) ?: "Seleccionar hora",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (value != null) AppColors.textPrimary else AppColors.textSecondary
                    )
                }
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = AppColors.textSecondary
                )
            }
        }
    }
}

@Composable
private fun TurnoSelector(
    turnos: List<Turno>,
    selectedTurno: Turno?,
    accentColor: Color,
    onTurnoSelected: (Turno) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Turno",
            style = MaterialTheme.typography.labelMedium,
            color = AppColors.textSecondary,
            fontWeight = FontWeight.Medium
        )

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
                    repeat(3 - rowTurnos.size) { Spacer(modifier = Modifier.weight(1f)) }
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
    val backgroundColor by androidx.compose.animation.animateColorAsState(
        targetValue = if (isSelected) accentColor else AppColors.surfaceElevated,
        animationSpec = tween(200),
        label = "turnoBackground"
    )

    val contentColor by androidx.compose.animation.animateColorAsState(
        targetValue = if (isSelected) Color.White else AppColors.textPrimary,
        animationSpec = tween(200),
        label = "turnoContent"
    )

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = backgroundColor,
        border = if (isSelected) null else BorderStroke(1.dp, AppColors.surfaceElevated)
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

@Composable
private fun SubmitButton(
    uiState: CreateRequestUiState,
    onSubmit: () -> Unit
) {
    val isLoading = uiState is CreateRequestUiState.Loading || uiState is CreateRequestUiState.Validating

    Button(
        onClick = onSubmit,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .shadow(8.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        enabled = !isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = AppColors.accentOrange,
            disabledContainerColor = AppColors.accentOrange.copy(alpha = 0.5f)
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
                        text = if (uiState is CreateRequestUiState.Validating) "Validando..." else "Enviando...",
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

@Composable
private fun requestTypeColor(type: RequestType): Color {
    return when (type) {
        RequestType.VACACIONES -> AppColors.accentBlue
        RequestType.ASUNTOS_PROPIOS -> AppColors.accentPurple
        RequestType.HORAS_SINDICALES -> AppColors.accentAmber
        RequestType.SALIDAS_PERSONALES -> AppColors.accentGreen
        RequestType.MODULO -> MaterialTheme.colorScheme.primary
        RequestType.VESTUARIO -> AppColors.accentPurple
        RequestType.LICENCIAS_JORNADAS -> AppColors.accentEmerald
        RequestType.LICENCIAS_DIAS -> AppColors.accentOrange
        RequestType.COMPENSACION_GRUPOS -> AppColors.accentSky
    }
}
