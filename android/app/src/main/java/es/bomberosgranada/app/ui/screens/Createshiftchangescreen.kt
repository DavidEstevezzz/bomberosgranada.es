package es.bomberosgranada.app.ui.screens

import android.app.DatePickerDialog
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.components.LoadingIndicator
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.CreateShiftChangeViewModel
import es.bomberosgranada.app.viewmodels.CreateShiftChangeViewModel.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*

// ============================================
// PANTALLA PRINCIPAL
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateShiftChangeScreen(
    viewModel: CreateShiftChangeViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0
) {
    val uiState by viewModel.uiState.collectAsState()
    val changeType by viewModel.changeType.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val searchTerm1 by viewModel.searchTerm1.collectAsState()
    val searchTerm2 by viewModel.searchTerm2.collectAsState()
    val selectedEmployee1 by viewModel.selectedEmployee1.collectAsState()
    val selectedEmployee2 by viewModel.selectedEmployee2.collectAsState()
    val fecha1 by viewModel.fecha1.collectAsState()
    val fecha2 by viewModel.fecha2.collectAsState()
    val turnoSeleccionado by viewModel.turnoSeleccionado.collectAsState()
    val motivo by viewModel.motivo.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()
    val loadingEmployees by viewModel.loadingEmployees.collectAsState()

    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    val isJefe = viewModel.isJefe(currentUser)

    // Cargar empleados cuando el usuario está disponible
    LaunchedEffect(currentUser) {
        currentUser?.let {
            if (employees.isEmpty()) {
                viewModel.loadEmployees(it)
            }
        }
    }

    // Mostrar mensajes
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
        currentRoute = "shift-changes",
        title = "Cambio de Guardia",
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
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingIndicator(message = "Cargando usuario...")
                    }
                }
                loadingEmployees -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingIndicator(message = "Cargando compañeros...")
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Header con icono
                        item {
                            ShiftChangeHeader()
                        }

                        // Selector de tipo de cambio
                        item {
                            ChangeTypeSelector(
                                selectedType = changeType,
                                onTypeSelected = { viewModel.setChangeType(it) }
                            )
                        }

                        // Selector de empleado 1 (solo si es jefe)
                        if (isJefe) {
                            item {
                                EmployeeSelector(
                                    title = "Primer Bombero",
                                    subtitle = "Selecciona el bombero que solicita el cambio",
                                    searchTerm = searchTerm1,
                                    onSearchTermChange = { viewModel.setSearchTerm1(it) },
                                    selectedEmployee = selectedEmployee1,
                                    onEmployeeSelected = { viewModel.selectEmployee1(it) },
                                    filteredEmployees = viewModel.getFilteredEmployees1(),
                                    accentColor = AppColors.accentBlue,
                                    icon = Icons.Default.Person
                                )
                            }
                        } else {
                            // Mostrar card del usuario actual
                            item {
                                CurrentUserCard(user = currentUser)
                            }
                        }

                        // Selector de empleado 2
                        item {
                            EmployeeSelector(
                                title = "Segundo Bombero",
                                subtitle = "Selecciona el compañero para el intercambio",
                                searchTerm = searchTerm2,
                                onSearchTermChange = { viewModel.setSearchTerm2(it) },
                                selectedEmployee = selectedEmployee2,
                                onEmployeeSelected = { viewModel.selectEmployee2(it) },
                                filteredEmployees = viewModel.getFilteredEmployees2(),
                                accentColor = AppColors.accentPurple,
                                icon = Icons.Default.PersonAdd
                            )
                        }

                        // Fechas y turno
                        item {
                            DatesAndTurnoCard(
                                changeType = changeType,
                                fecha1 = fecha1,
                                fecha2 = fecha2,
                                turnoSeleccionado = turnoSeleccionado,
                                onFecha1Selected = { viewModel.setFecha1(it) },
                                onFecha2Selected = { viewModel.setFecha2(it) },
                                onTurnoSelected = { viewModel.setTurno(it) },
                                availableTurnos = viewModel.getAvailableTurnos(),
                                context = context
                            )
                        }

                        // Motivo
                        item {
                            MotivoCard(
                                motivo = motivo,
                                onMotivoChange = { viewModel.setMotivo(it) }
                            )
                        }

                        // Botón de envío
                        item {
                            SubmitButton(
                                uiState = uiState,
                                onSubmit = { viewModel.submitRequest(currentUser) }
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(32.dp))
                        }
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
                    containerColor = if (errorMessage != null) AppColors.error else AppColors.success,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

// ============================================
// HEADER
// ============================================

@Composable
private fun ShiftChangeHeader() {
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
                        colors = AppColors.gradientPrimary
                    )
                )
                .padding(24.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(AppColors.surface.copy(alpha = 0.25f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Rounded.SwapHoriz,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Column {
                    Text(
                        text = "Solicitar Cambio",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                }
            }
        }
    }
}

// ============================================
// SELECTOR DE TIPO DE CAMBIO
// ============================================

@Composable
private fun ChangeTypeSelector(
    selectedType: ChangeType,
    onTypeSelected: (ChangeType) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Tipo de Cambio",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )

            ChangeType.entries.forEach { type ->
                ChangeTypeOption(
                    type = type,
                    isSelected = type == selectedType,
                    onClick = { onTypeSelected(type) }
                )
            }
        }
    }
}

@Composable
private fun ChangeTypeOption(
    type: ChangeType,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) AppColors.accentBlue.copy(alpha = 0.1f) else AppColors.surfaceElevated,
        animationSpec = tween(200),
        label = "typeBackground"
    )

    val borderColor by animateColorAsState(
        targetValue = if (isSelected) AppColors.accentBlue else Color.Transparent,
        animationSpec = tween(200),
        label = "typeBorder"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .border(2.dp, borderColor, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        color = backgroundColor
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            RadioButton(
                selected = isSelected,
                onClick = onClick,
                colors = RadioButtonDefaults.colors(
                    selectedColor = AppColors.accentBlue,
                    unselectedColor = AppColors.textSecondary
                )
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = type.displayName,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isSelected) AppColors.accentBlue else AppColors.textPrimary
                )
                Text(
                    text = type.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = AppColors.textSecondary
                )
            }
        }
    }
}

// ============================================
// CARD DEL USUARIO ACTUAL (NO JEFE)
// ============================================

@Composable
private fun CurrentUserCard(user: User) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(AppColors.accentBlue.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = AppColors.accentBlue,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = "Tu Solicitud",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textPrimary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Información del usuario
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = AppColors.accentBlue.copy(alpha = 0.08f)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(AppColors.accentBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${user.nombre.first()}${user.apellido.first()}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Column {
                        Text(
                            text = "${user.nombre} ${user.apellido}",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = AppColors.textPrimary
                        )
                        Text(
                            text = user.puesto ?: "Bombero",
                            style = MaterialTheme.typography.bodySmall,
                            color = AppColors.textSecondary
                        )
                    }
                }
            }
        }
    }
}

// ============================================
// SELECTOR DE EMPLEADO
// ============================================

@Composable
private fun EmployeeSelector(
    title: String,
    subtitle: String,
    searchTerm: String,
    onSearchTermChange: (String) -> Unit,
    selectedEmployee: User?,
    onEmployeeSelected: (User?) -> Unit,
    filteredEmployees: List<User>,
    accentColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    var isExpanded by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.textPrimary
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = AppColors.textSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Empleado seleccionado
            if (selectedEmployee != null) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    color = accentColor.copy(alpha = 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.4f))
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
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(accentColor.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${selectedEmployee.nombre.first()}${selectedEmployee.apellido.first()}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = accentColor
                                )
                            }
                            Column {
                                Text(
                                    text = "${selectedEmployee.nombre} ${selectedEmployee.apellido}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = AppColors.textPrimary
                                )
                                Text(
                                    text = selectedEmployee.puesto ?: "Bombero",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AppColors.textSecondary
                                )
                            }
                        }
                        IconButton(
                            onClick = { onEmployeeSelected(null) },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cambiar",
                                tint = AppColors.textSecondary
                            )
                        }
                    }
                }
            } else {
                // Campo de búsqueda
                OutlinedTextField(
                    value = searchTerm,
                    onValueChange = {
                        onSearchTermChange(it)
                        isExpanded = it.isNotEmpty()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { isExpanded = it.isFocused && searchTerm.isNotEmpty() },
                    placeholder = { Text("Buscar por nombre o DNI...") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = AppColors.textSecondary
                        )
                    },
                    trailingIcon = {
                        if (searchTerm.isNotEmpty()) {
                            IconButton(onClick = { onSearchTermChange("") }) {
                                Icon(
                                    imageVector = Icons.Default.Clear,
                                    contentDescription = "Limpiar",
                                    tint = AppColors.textSecondary
                                )
                            }
                        }
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = accentColor,
                        focusedLabelColor = accentColor,
                        cursorColor = accentColor,
                        unfocusedBorderColor = AppColors.outline,
                        focusedContainerColor = AppColors.surface,
                        unfocusedContainerColor = AppColors.surface,
                        focusedTextColor = AppColors.textPrimary,
                        unfocusedTextColor = AppColors.textPrimary,
                        unfocusedLabelColor = AppColors.textSecondary,
                        focusedPlaceholderColor = AppColors.textSecondary,
                        unfocusedPlaceholderColor = AppColors.textSecondary
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(
                        onDone = { focusManager.clearFocus() }
                    )
                )

                // Lista de resultados
                AnimatedVisibility(
                    visible = isExpanded && filteredEmployees.isNotEmpty(),
                    enter = fadeIn() + expandVertically(),
                    exit = fadeOut() + shrinkVertically()
                ) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = AppColors.surfaceElevated
                    ) {
                        Column(
                            modifier = Modifier.padding(8.dp)
                        ) {
                            filteredEmployees.forEach { employee ->
                                EmployeeListItem(
                                    employee = employee,
                                    accentColor = accentColor,
                                    onClick = {
                                        onEmployeeSelected(employee)
                                        isExpanded = false
                                        focusManager.clearFocus()
                                    }
                                )
                            }
                        }
                    }
                }

                // Mensaje cuando no hay resultados
                AnimatedVisibility(
                    visible = isExpanded && searchTerm.isNotEmpty() && filteredEmployees.isEmpty(),
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Text(
                        text = "No se encontraron compañeros",
                        style = MaterialTheme.typography.bodyMedium,
                        color = AppColors.textSecondary,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmployeeListItem(
    employee: User,
    accentColor: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${employee.nombre.first()}${employee.apellido.first()}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = accentColor
                )
            }
            Column {
                Text(
                    text = "${employee.nombre} ${employee.apellido}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = AppColors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = employee.puesto ?: "Bombero",
                    style = MaterialTheme.typography.bodySmall,
                    color = AppColors.textSecondary
                )
            }
        }
    }
}

// ============================================
// FECHAS Y TURNO
// ============================================

@Composable
private fun DatesAndTurnoCard(
    changeType: ChangeType,
    fecha1: LocalDate?,
    fecha2: LocalDate?,
    turnoSeleccionado: Turno,
    onFecha1Selected: (LocalDate) -> Unit,
    onFecha2Selected: (LocalDate) -> Unit,
    onTurnoSelected: (Turno) -> Unit,
    availableTurnos: List<Turno>,
    context: android.content.Context
) {
    val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    val calendar = Calendar.getInstance()

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
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(AppColors.accentGreen.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = AppColors.accentGreen,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = "Fechas del Cambio",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textPrimary
                )
            }

            HorizontalDivider(color = AppColors.divider)

            // Fecha 1
            DateField(
                label = if (changeType == ChangeType.ESPEJO) "Primera Fecha" else "Fecha del Cambio",
                value = fecha1,
                formatter = dateFormatter,
                accentColor = AppColors.accentGreen,
                context = context,
                calendar = calendar,
                onDateSelected = onFecha1Selected
            )

            // Fecha 2 (solo para cambio espejo)
            AnimatedVisibility(
                visible = changeType == ChangeType.ESPEJO,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                DateField(
                    label = "Segunda Fecha",
                    value = fecha2,
                    formatter = dateFormatter,
                    accentColor = AppColors.accentPurple,
                    context = context,
                    calendar = calendar,
                    onDateSelected = onFecha2Selected
                )
            }

            // Selector de turno (solo para cambio simple)
            AnimatedVisibility(
                visible = changeType == ChangeType.SIMPLE,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column {
                    Text(
                        text = "Turno",
                        style = MaterialTheme.typography.labelMedium,
                        color = AppColors.textSecondary,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Grid de turnos
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        availableTurnos.chunked(3).forEach { rowTurnos ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                rowTurnos.forEach { turno ->
                                    TurnoChip(
                                        turno = turno,
                                        isSelected = turno == turnoSeleccionado,
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
        }
    }
}

@Composable
private fun DateField(
    label: String,
    value: LocalDate?,
    formatter: DateTimeFormatter,
    accentColor: Color,
    context: android.content.Context,
    calendar: Calendar,
    onDateSelected: (LocalDate) -> Unit
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
            border = if (value != null) {
                androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.5f))
            } else null
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
private fun TurnoChip(
    turno: Turno,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) AppColors.accentGreen else AppColors.surfaceElevated,
        animationSpec = tween(200),
        label = "turnoBackground"
    )

    val contentColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else AppColors.textPrimary,
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
                .padding(vertical = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = turno.displayName,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = contentColor,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }
    }
}

// ============================================
// MOTIVO
// ============================================

@Composable
private fun MotivoCard(
    motivo: String,
    onMotivoChange: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.cardBackground)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(AppColors.accentOrange.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        tint = AppColors.accentOrange,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = "Motivo (Opcional)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textPrimary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = motivo,
                onValueChange = onMotivoChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Describe el motivo del cambio...") },
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AppColors.accentOrange,
                    focusedLabelColor = AppColors.accentOrange,
                    cursorColor = AppColors.accentOrange,
                    unfocusedBorderColor = AppColors.outline,
                    focusedContainerColor = AppColors.surface,
                    unfocusedContainerColor = AppColors.surface,
                    focusedTextColor = AppColors.textPrimary,
                    unfocusedTextColor = AppColors.textPrimary,
                    unfocusedLabelColor = AppColors.textSecondary,
                    focusedPlaceholderColor = AppColors.textSecondary,
                    unfocusedPlaceholderColor = AppColors.textSecondary
                ),
                minLines = 3,
                maxLines = 5
            )
        }
    }
}

// ============================================
// BOTÓN DE ENVÍO
// ============================================

@Composable
private fun SubmitButton(
    uiState: CreateShiftChangeUiState,
    onSubmit: () -> Unit
) {
    val isLoading = uiState is CreateShiftChangeUiState.Loading

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
                        text = "Enviando...",
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
