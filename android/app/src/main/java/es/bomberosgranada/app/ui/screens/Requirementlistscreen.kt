package es.bomberosgranada.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.viewmodels.RequirementListViewModel
import es.bomberosgranada.app.viewmodels.RequirementListViewModel.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

// ============================================
// COLORES DEL DISEÑO
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentPurple = Color(0xFF8B5CF6)
private val AccentGreen = Color(0xFF10B981)
private val AccentAmber = Color(0xFFF59E0B)
private val AccentTeal = Color(0xFF14B8A6)
private val SurfaceElevated = Color(0xFFF8FAFC)
private val BackgroundColor = Color(0xFFF1F5F9)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val CardBackground = Color(0xFFFFFFFF)
private val DividerColor = Color(0xFFE2E8F0)

// ============================================
// PANTALLA PRINCIPAL
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequirementListScreen(
    listType: ListType,
    viewModel: RequirementListViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0
) {
    val uiState by viewModel.uiState.collectAsState()
    val firefighters by viewModel.filteredFirefighters.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val filters by viewModel.filters.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    val focusManager = LocalFocusManager.current

    var showFilterMenu by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }

    // Cargar datos al iniciar
    LaunchedEffect(listType) {
        viewModel.loadData(listType)
    }

    // Mostrar errores
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(message = it, duration = SnackbarDuration.Long)
            viewModel.clearError()
        }
    }

    // DatePicker Dialog
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedDate.toEpochDay() * 24 * 60 * 60 * 1000
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val newDate = LocalDate.ofEpochDay(millis / (24 * 60 * 60 * 1000))
                            viewModel.setDate(newDate, listType)
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    AppScaffold(
        currentRoute = listType.route,
        title = listType.title,
        currentUser = currentUser,
        onNavigate = onNavigate,
        onLogout = onLogout,
        showBackButton = true,
        onBack = onBack,
        unreadMessagesCount = unreadMessagesCount
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .clickable(
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                        indication = null
                    ) { focusManager.clearFocus() },
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header con navegación de fecha
                item {
                    HeaderCard(
                        listType = listType,
                        selectedDate = selectedDate,
                        stats = viewModel.getStats(),
                        onPreviousDay = { viewModel.previousDay(listType) },
                        onNextDay = { viewModel.nextDay(listType) },
                        onDateClick = { showDatePicker = true }
                    )
                }

                // Filtros
                item {
                    FiltersSection(
                        filters = filters,
                        availableFilterTypes = viewModel.getAvailableFilterTypes(),
                        showFilterMenu = showFilterMenu,
                        onShowFilterMenuChange = { showFilterMenu = it },
                        onAddFilter = { viewModel.addFilter(it) },
                        onUpdateFilter = { id, value -> viewModel.updateFilter(id, value) },
                        onRemoveFilter = { viewModel.removeFilter(it) },
                        onClearFilters = { viewModel.clearFilters() }
                    )
                }

                // Estado de carga
                when (uiState) {
                    is RequirementListUiState.Loading -> {
                        item {
                            LoadingCard()
                        }
                    }
                    is RequirementListUiState.Error -> {
                        item {
                            ErrorCard(
                                message = (uiState as RequirementListUiState.Error).message,
                                onRetry = { viewModel.loadData(listType) }
                            )
                        }
                    }
                    is RequirementListUiState.Success -> {
                        if (firefighters.isEmpty()) {
                            item {
                                EmptyCard()
                            }
                        } else {
                            // Tabla de bomberos
                            item {
                                FirefightersTable(
                                    firefighters = firefighters,
                                    viewModel = viewModel
                                )
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }

            // Snackbar
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = Color(0xFFEF4444),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

// ============================================
// HEADER CON NAVEGACIÓN DE FECHA
// ============================================

@Composable
private fun HeaderCard(
    listType: ListType,
    selectedDate: LocalDate,
    stats: Stats,
    onPreviousDay: () -> Unit,
    onNextDay: () -> Unit,
    onDateClick: () -> Unit
) {
    val dayName = selectedDate.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }
    val formattedDate = selectedDate.format(DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale("es", "ES")))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column {
            // Gradiente con título
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
                    Text(
                        text = "GESTIÓN DE DISPONIBILIDAD",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.7f),
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = listType.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = listType.subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }

            // Navegación de fecha
            Surface(color = CardBackground) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onPreviousDay,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronLeft,
                                contentDescription = "Día anterior",
                                tint = TextPrimary
                            )
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable { onDateClick() }
                        ) {
                            Text(
                                text = dayName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = formattedDate,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary
                                )
                                Icon(
                                    imageVector = Icons.Default.CalendarMonth,
                                    contentDescription = "Seleccionar fecha",
                                    tint = AccentBlue,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = onNextDay,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Día siguiente",
                                tint = TextPrimary
                            )
                        }
                    }

                    // Estadísticas
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatChip(
                            label = "Registrados",
                            value = stats.total,
                            color = AccentBlue
                        )
                        StatChip(
                            label = "Filtrados",
                            value = stats.filtered,
                            color = AccentGreen
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(
    label: String,
    value: Int,
    color: Color
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = value.toString(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = color
            )
        }
    }
}

// ============================================
// SECCIÓN DE FILTROS
// ============================================

@Composable
private fun FiltersSection(
    filters: List<Filter>,
    availableFilterTypes: List<FilterType>,
    showFilterMenu: Boolean,
    onShowFilterMenuChange: (Boolean) -> Unit,
    onAddFilter: (FilterType) -> Unit,
    onUpdateFilter: (Int, String) -> Unit,
    onRemoveFilter: (Int) -> Unit,
    onClearFilters: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header de filtros
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.FilterList,
                        contentDescription = null,
                        tint = AccentPurple,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Filtros",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Botón añadir filtro
                    if (availableFilterTypes.isNotEmpty()) {
                        Box {
                            Surface(
                                onClick = { onShowFilterMenuChange(true) },
                                shape = RoundedCornerShape(8.dp),
                                color = AccentBlue.copy(alpha = 0.1f)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = null,
                                        tint = AccentBlue,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Añadir",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = AccentBlue
                                    )
                                }
                            }

                            DropdownMenu(
                                expanded = showFilterMenu,
                                onDismissRequest = { onShowFilterMenuChange(false) }
                            ) {
                                availableFilterTypes.forEach { type ->
                                    DropdownMenuItem(
                                        text = { Text(type.label) },
                                        onClick = {
                                            onAddFilter(type)
                                            onShowFilterMenuChange(false)
                                        },
                                        leadingIcon = {
                                            Icon(
                                                imageVector = when (type) {
                                                    FilterType.PUESTO -> Icons.Default.Badge
                                                    FilterType.NOMBRE -> Icons.Default.Person
                                                    FilterType.DNI -> Icons.Default.Numbers
                                                },
                                                contentDescription = null
                                            )
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Botón limpiar
                    if (filters.any { it.value.isNotBlank() }) {
                        Surface(
                            onClick = onClearFilters,
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFFEF4444).copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Clear,
                                    contentDescription = null,
                                    tint = Color(0xFFEF4444),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Limpiar",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFFEF4444)
                                )
                            }
                        }
                    }
                }
            }

            // Lista de filtros activos
            filters.forEach { filter ->
                FilterChip(
                    filter = filter,
                    canRemove = filters.size > 1,
                    onValueChange = { onUpdateFilter(filter.id, it) },
                    onRemove = { onRemoveFilter(filter.id) }
                )
            }
        }
    }
}

@Composable
private fun FilterChip(
    filter: Filter,
    canRemove: Boolean,
    onValueChange: (String) -> Unit,
    onRemove: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Label del filtro
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = AccentPurple.copy(alpha = 0.1f)
        ) {
            Text(
                text = filter.type.label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = AccentPurple,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }

        // Input
        OutlinedTextField(
            value = filter.value,
            onValueChange = onValueChange,
            modifier = Modifier.weight(1f),
            placeholder = {
                Text(
                    text = filter.type.placeholder,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            },
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AccentPurple,
                unfocusedBorderColor = DividerColor
            ),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
            trailingIcon = {
                if (filter.value.isNotBlank()) {
                    IconButton(onClick = { onValueChange("") }) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Limpiar",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        )

        // Botón eliminar
        if (canRemove) {
            IconButton(
                onClick = onRemove,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEF4444).copy(alpha = 0.1f))
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Eliminar filtro",
                    tint = Color(0xFFEF4444),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

// ============================================
// TABLA DE BOMBEROS
// ============================================

@Composable
private fun FirefightersTable(
    firefighters: List<User>,
    viewModel: RequirementListViewModel
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column {
            // Header de la tabla - Sin scroll horizontal
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceElevated)
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // # columna
                Text(
                    text = "#",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary,
                    modifier = Modifier.width(36.dp),
                    textAlign = TextAlign.Center
                )

                // Nombre (con puesto incluido)
                Text(
                    text = "Nombre",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary,
                    modifier = Modifier.weight(1f)
                )

                // Horas
                Text(
                    text = "Horas",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary,
                    modifier = Modifier.width(56.dp),
                    textAlign = TextAlign.Center
                )
            }

            HorizontalDivider(color = DividerColor)

            // Filas de datos
            firefighters.forEachIndexed { index, firefighter ->
                FirefighterRow(
                    position = index + 1,
                    firefighter = firefighter,
                    viewModel = viewModel,
                    isEven = index % 2 == 0
                )
                if (index < firefighters.size - 1) {
                    HorizontalDivider(color = DividerColor.copy(alpha = 0.5f))
                }
            }
        }
    }
}

@Composable
private fun FirefighterRow(
    position: Int,
    firefighter: User,
    viewModel: RequirementListViewModel,
    isEven: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isEven) Color.Transparent else SurfaceElevated.copy(alpha = 0.5f))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Posición con medalla para top 3
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(
                    when (position) {
                        1 -> AccentAmber  // Oro
                        2 -> Color(0xFF94A3B8)  // Plata
                        3 -> Color(0xFFCD7F32)  // Bronce
                        else -> AccentBlue.copy(alpha = 0.1f)
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = position.toString(),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = if (position <= 3) Color.White else AccentBlue
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Nombre + Badge de puesto debajo
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "${firefighter.nombre} ${firefighter.apellido}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Badge de puesto compacto
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = AccentTeal.copy(alpha = 0.12f)
            ) {
                Text(
                    text = firefighter.puesto ?: "-",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = AccentTeal,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    maxLines = 1
                )
            }
        }

        // Horas ofrecidas con destaque
        Surface(
            shape = RoundedCornerShape(10.dp),
            color = AccentOrange.copy(alpha = 0.12f),
            modifier = Modifier.width(64.dp)
        ) {
            Text(
                text = viewModel.formatHoras(firefighter.horas_ofrecidas),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = AccentOrange,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

// ============================================
// ESTADOS ESPECIALES
// ============================================

@Composable
private fun LoadingCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(48.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = AccentBlue)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Cargando datos...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun ErrorCard(message: String, onRetry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = Color(0xFFEF4444),
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFFEF4444),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
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

@Composable
private fun EmptyCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Rounded.PersonOff,
                contentDescription = null,
                tint = TextSecondary,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "No hay bomberos disponibles",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Text(
                text = "Prueba a cambiar la fecha o los filtros",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

