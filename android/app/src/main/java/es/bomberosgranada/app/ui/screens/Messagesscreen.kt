package es.bomberosgranada.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.*
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import es.bomberosgranada.app.data.models.Message
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.viewmodels.MessagesViewModel
import es.bomberosgranada.app.viewmodels.MessagesViewModel.*
import java.time.format.TextStyle
import java.util.*

// ============================================
// COLORES DEL DISEÑO
// ============================================
private val GradientStart = Color(0xFF1E3A5F)
private val GradientEnd = Color(0xFF2D5A87)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentPurple = Color(0xFF8B5CF6)
private val AccentGreen = Color(0xFF10B981)
private val AccentOrange = Color(0xFFFF6B35)
private val AccentAmber = Color(0xFFF59E0B)
private val AccentRose = Color(0xFFEF4444)
private val SurfaceElevated = Color(0xFFF8FAFC)
private val CardBackground = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF1A1A2E)
private val TextSecondary = Color(0xFF64748B)
private val UnreadBadge = Color(0xFF3B82F6)

// ============================================
// PANTALLA PRINCIPAL DE MENSAJES
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    viewModel: MessagesViewModel,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    unreadMessagesCount: Int = 0
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentView by viewModel.currentView.collectAsState()
    val currentMonth by viewModel.currentMonth.collectAsState()
    val filteredMessages by viewModel.filteredMessages.collectAsState()
    val composeState by viewModel.composeState.collectAsState()
    val messageDetailState by viewModel.messageDetailState.collectAsState()
    val users by viewModel.users.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    val isJefe = currentUser?.type == "jefe"

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

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

    if (composeState.isOpen) {
        ComposeMessageDialog(
            viewModel = viewModel,
            composeState = composeState,
            isJefe = isJefe,
            users = users
        )
    }

    if (messageDetailState.isOpen) {
        MessageDetailDialog(
            viewModel = viewModel,
            state = messageDetailState,
            currentUserId = currentUser?.id_empleado ?: 0
        )
    }

    AppScaffold(
        currentRoute = "messages",
        title = "Mensajes",
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
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    MessagesHeader(
                        currentMonth = currentMonth,
                        stats = viewModel.getStats(),
                        onPreviousMonth = { viewModel.previousMonth() },
                        onNextMonth = { viewModel.nextMonth() }
                    )
                }

                item {
                    ActionBar(
                        currentView = currentView,
                        onViewChange = { viewModel.setView(it) },
                        onCreateMessage = { viewModel.openCompose() }
                    )
                }

                when (uiState) {
                    is MessagesUiState.Loading -> {
                        item { LoadingCard() }
                    }
                    is MessagesUiState.Error -> {
                        item {
                            ErrorCard(
                                message = (uiState as MessagesUiState.Error).message,
                                onRetry = { viewModel.loadData() }
                            )
                        }
                    }
                    is MessagesUiState.Success -> {
                        if (filteredMessages.isEmpty()) {
                            item { EmptyMessagesCard(currentView) }
                        } else {
                            items(filteredMessages) { message ->
                                MessageCard(
                                    message = message,
                                    viewModel = viewModel,
                                    isInbox = currentView == MessageView.INBOX,
                                    onClick = { viewModel.openMessageDetail(message) }
                                )
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(32.dp)) }
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = if (successMessage != null) AccentGreen else AccentRose,
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
private fun MessagesHeader(
    currentMonth: java.time.YearMonth,
    stats: Stats,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        .replaceFirstChar { it.uppercase() }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column {
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
                        text = "CENTRO DE COMUNICACIONES",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.7f),
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Mensajes internos",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Consulta, responde y gestiona los mensajes de tu equipo",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }

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
                            onClick = onPreviousMonth,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronLeft,
                                contentDescription = "Mes anterior",
                                tint = TextPrimary
                            )
                        }

                        Text(
                            text = "$monthName ${currentMonth.year}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        IconButton(
                            onClick = onNextMonth,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(SurfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Mes siguiente",
                                tint = TextPrimary
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatChip(label = "Bandeja", value = stats.viewName, color = AccentBlue)
                        StatChip(label = "Mensajes", value = stats.totalCount.toString(), color = AccentPurple)
                        if (stats.unreadCount > 0) {
                            StatChip(label = "Sin leer", value = stats.unreadCount.toString(), color = AccentOrange)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(label: String, value: String, color: Color) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}

// ============================================
// BARRA DE ACCIONES
// ============================================

@Composable
private fun ActionBar(
    currentView: MessageView,
    onViewChange: (MessageView) -> Unit,
    onCreateMessage: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(SurfaceElevated)
            ) {
                ToggleButton(
                    text = "Entrada",
                    icon = Icons.Outlined.Inbox,
                    selected = currentView == MessageView.INBOX,
                    onClick = { onViewChange(MessageView.INBOX) }
                )
                ToggleButton(
                    text = "Salida",
                    icon = Icons.Outlined.Send,
                    selected = currentView == MessageView.SENT,
                    onClick = { onViewChange(MessageView.SENT) }
                )
            }

            Button(
                onClick = onCreateMessage,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Crear", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun ToggleButton(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = if (selected) AccentBlue else Color.Transparent
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (selected) Color.White else TextSecondary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                color = if (selected) Color.White else TextSecondary
            )
        }
    }
}

// ============================================
// TARJETA DE MENSAJE
// ============================================

@Composable
private fun MessageCard(
    message: Message,
    viewModel: MessagesViewModel,
    isInbox: Boolean,
    onClick: () -> Unit
) {
    val isRead = message.isReadBoolean
    val isMassive = message.massive != null && message.massive != "false"
    val massiveLabel = viewModel.getMassiveLabel(message.massive)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(if (isRead) 2.dp else 4.dp, RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (!isRead && isInbox) AccentBlue.copy(alpha = 0.05f) else CardBackground
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (isMassive) AccentPurple.copy(alpha = 0.15f)
                        else AccentBlue.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isMassive) {
                    Icon(
                        imageVector = Icons.Default.Campaign,
                        contentDescription = null,
                        tint = AccentPurple,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    val name = if (isInbox) {
                        message.sender?.nombre ?: "?"
                    } else {
                        message.receiver?.nombre ?: "?"
                    }
                    Text(
                        text = name.firstOrNull()?.uppercase() ?: "?",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = AccentBlue
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isInbox) {
                            message.sender?.let { "${it.nombre} ${it.apellido}" } ?: "Desconocido"
                        } else {
                            message.receiver?.let { "${it.nombre} ${it.apellido}" } ?: massiveLabel ?: "Desconocido"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (!isRead && isInbox) FontWeight.Bold else FontWeight.SemiBold,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Text(
                        text = viewModel.formatDate(message.created_at),
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = message.subject,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (!isRead && isInbox) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (!isRead && isInbox) TextPrimary else TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = message.body,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary.copy(alpha = 0.8f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (message.attachment != null) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = AccentAmber.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AttachFile,
                                    contentDescription = null,
                                    tint = AccentAmber,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Adjunto",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AccentAmber
                                )
                            }
                        }
                    }

                    if (isMassive && !isInbox) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = AccentPurple.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Groups,
                                    contentDescription = null,
                                    tint = AccentPurple,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "${message.read_count ?: 0}/${message.total_recipients ?: 0}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AccentPurple
                                )
                            }
                        }
                    }

                    if (!isRead && isInbox) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = UnreadBadge
                        ) {
                            Text(
                                text = "Nuevo",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
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
        shape = RoundedCornerShape(16.dp),
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
                    text = "Cargando mensajes...",
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
        shape = RoundedCornerShape(16.dp),
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
                tint = AccentRose,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = AccentRose,
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
private fun EmptyMessagesCard(currentView: MessageView) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = if (currentView == MessageView.INBOX) Icons.Outlined.Inbox else Icons.Outlined.Send,
                contentDescription = null,
                tint = TextSecondary,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (currentView == MessageView.INBOX)
                    "No hay mensajes en la bandeja de entrada"
                else
                    "No has enviado mensajes este mes",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Los mensajes aparecerán aquí",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

// ============================================
// DIÁLOGO DE COMPOSICIÓN DE MENSAJE
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ComposeMessageDialog(
    viewModel: MessagesViewModel,
    composeState: ComposeState,
    isJefe: Boolean,
    users: List<User>
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var showUserDropdown by remember { mutableStateOf(false) }

    val filteredUsers = remember(searchQuery, users) {
        if (searchQuery.isBlank()) users
        else users.filter { user ->
            val fullName = "${user.nombre} ${user.apellido}".lowercase()
            fullName.contains(searchQuery.lowercase())
        }
    }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val cursor = context.contentResolver.query(it, null, null, null, null)
            val nameIndex = cursor?.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            cursor?.moveToFirst()
            val fileName = nameIndex?.let { idx -> cursor.getString(idx) } ?: "archivo"
            cursor?.close()
            viewModel.updateComposeAttachment(it, fileName)
        }
    }

    Dialog(
        onDismissRequest = { if (!composeState.isSending) viewModel.closeCompose() },
        properties = DialogProperties(
            dismissOnBackPress = !composeState.isSending,
            dismissOnClickOutside = !composeState.isSending,
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = CardBackground)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header con gradiente
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(GradientStart, GradientEnd)
                            )
                        )
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "COMUNICACIONES",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f),
                                letterSpacing = 2.sp
                            )
                            Text(
                                text = if (composeState.isReply) "Responder mensaje" else "Nuevo mensaje",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        IconButton(
                            onClick = { viewModel.closeCompose() },
                            enabled = !composeState.isSending,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cerrar",
                                tint = Color.White
                            )
                        }
                    }
                }

                // Contenido scrollable
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Error
                    composeState.error?.let { error ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = AccentRose.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Error,
                                    contentDescription = null,
                                    tint = AccentRose,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = error,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AccentRose
                                )
                            }
                        }
                    }

                    // Info de respuesta
                    if (composeState.isReply && composeState.replyToMessage != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = AccentBlue.copy(alpha = 0.08f)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Reply,
                                    contentDescription = null,
                                    tint = AccentBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                                Column {
                                    Text(
                                        text = "Respondiendo a ${composeState.receiverName}",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = AccentBlue
                                    )
                                    Text(
                                        text = composeState.replyToMessage.subject,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    // Selector de alcance (solo jefes)
                    if (isJefe && !composeState.isReply) {
                        Text(
                            text = "Alcance del mensaje",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            MassiveScope.entries.forEach { scope ->
                                FilterChip(
                                    selected = composeState.massiveScope == scope,
                                    onClick = { viewModel.updateComposeMassiveScope(scope) },
                                    label = {
                                        Text(
                                            text = scope.label,
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    },
                                    leadingIcon = if (composeState.massiveScope == scope) {
                                        {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    } else null,
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AccentPurple.copy(alpha = 0.15f),
                                        selectedLabelColor = AccentPurple
                                    )
                                )
                            }
                        }
                    }

                    // Selector de destinatario
                    if (composeState.massiveScope == MassiveScope.INDIVIDUAL && !composeState.isReply) {
                        Text(
                            text = "Destinatario",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        ExposedDropdownMenuBox(
                            expanded = showUserDropdown,
                            onExpandedChange = { showUserDropdown = it }
                        ) {
                            OutlinedTextField(
                                value = if (composeState.receiverId != null) composeState.receiverName else searchQuery,
                                onValueChange = {
                                    searchQuery = it
                                    if (composeState.receiverId != null) {
                                        viewModel.updateComposeReceiver(0, "")
                                    }
                                    showUserDropdown = true
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(),
                                placeholder = { Text("Buscar por nombre...") },
                                leadingIcon = {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = TextSecondary)
                                },
                                trailingIcon = {
                                    if (composeState.receiverId != null) {
                                        IconButton(onClick = {
                                            viewModel.updateComposeReceiver(0, "")
                                            searchQuery = ""
                                        }) {
                                            Icon(Icons.Default.Clear, contentDescription = "Limpiar")
                                        }
                                    } else {
                                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = showUserDropdown)
                                    }
                                },
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            ExposedDropdownMenu(
                                expanded = showUserDropdown && filteredUsers.isNotEmpty(),
                                onDismissRequest = { showUserDropdown = false }
                            ) {
                                filteredUsers.take(10).forEach { user ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(
                                                    text = "${user.nombre} ${user.apellido}",
                                                    fontWeight = FontWeight.Medium
                                                )
                                                Text(
                                                    text = user.puesto ?: user.type,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = TextSecondary
                                                )
                                            }
                                        },
                                        onClick = {
                                            viewModel.updateComposeReceiver(
                                                user.id_empleado,
                                                "${user.nombre} ${user.apellido}"
                                            )
                                            searchQuery = ""
                                            showUserDropdown = false
                                        },
                                        leadingIcon = {
                                            Box(
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .clip(CircleShape)
                                                    .background(AccentBlue.copy(alpha = 0.1f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = user.nombre.firstOrNull()?.uppercase() ?: "?",
                                                    style = MaterialTheme.typography.labelMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    color = AccentBlue
                                                )
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Asunto
                    Text(
                        text = "Asunto",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )

                    OutlinedTextField(
                        value = composeState.subject,
                        onValueChange = { viewModel.updateComposeSubject(it) },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Escribe el asunto...") },
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        enabled = !composeState.isSending
                    )

                    // Cuerpo del mensaje
                    Text(
                        text = "Mensaje",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )

                    OutlinedTextField(
                        value = composeState.body,
                        onValueChange = { viewModel.updateComposeBody(it) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 120.dp),
                        placeholder = { Text("Escribe tu mensaje...") },
                        shape = RoundedCornerShape(12.dp),
                        enabled = !composeState.isSending,
                        maxLines = 8
                    )

                    // Adjunto
                    Text(
                        text = "Archivo adjunto (opcional)",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )

                    if (composeState.attachmentUri != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = AccentAmber.copy(alpha = 0.1f)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AttachFile,
                                        contentDescription = null,
                                        tint = AccentAmber,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = composeState.attachmentName ?: "Archivo",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                IconButton(
                                    onClick = { viewModel.clearComposeAttachment() },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Eliminar adjunto",
                                        tint = AccentRose,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    } else {
                        OutlinedButton(
                            onClick = { filePickerLauncher.launch("*/*") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !composeState.isSending
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.AttachFile,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Seleccionar archivo")
                        }

                        Text(
                            text = "PDF, JPG o PNG. Máximo 2 MB",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary
                        )
                    }
                }

                // Botones
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = SurfaceElevated,
                    shadowElevation = 8.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.closeCompose() },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !composeState.isSending
                        ) {
                            Text("Cancelar")
                        }

                        Button(
                            onClick = { viewModel.sendMessage(context) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !composeState.isSending,
                            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
                        ) {
                            if (composeState.isSending) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Send,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (composeState.isSending) "Enviando..." else "Enviar")
                        }
                    }
                }
            }
        }
    }
}

// ============================================
// DIÁLOGO DE DETALLE DE MENSAJE
// ============================================

@Composable
private fun MessageDetailDialog(
    viewModel: MessagesViewModel,
    state: MessageDetailState,
    currentUserId: Int
) {
    val context = LocalContext.current
    val message = state.message ?: return

    Dialog(
        onDismissRequest = { viewModel.closeMessageDetail() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = CardBackground)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(GradientStart, GradientEnd)
                            )
                        )
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "MENSAJE",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f),
                                letterSpacing = 2.sp
                            )
                            Text(
                                text = message.subject,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "De: ${message.sender?.let { "${it.nombre} ${it.apellido}" } ?: "Desconocido"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                            Text(
                                text = viewModel.formatDateTime(message.created_at),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.6f)
                            )
                        }

                        IconButton(
                            onClick = { viewModel.closeMessageDetail() },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cerrar",
                                tint = Color.White
                            )
                        }
                    }
                }

                // Contenido
                if (state.isLoading) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = AccentBlue)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            MessageBubble(
                                message = message,
                                isOwnMessage = message.sender_id == currentUserId,
                                viewModel = viewModel,
                                onDownloadAttachment = { fileName ->
                                    viewModel.downloadAttachment(context, message.id, fileName)
                                }
                            )
                        }

                        message.replies?.let { replies ->
                            items(replies) { reply ->
                                MessageBubble(
                                    message = reply,
                                    isOwnMessage = reply.sender_id == currentUserId,
                                    viewModel = viewModel,
                                    onDownloadAttachment = { fileName ->
                                        viewModel.downloadAttachment(context, reply.id, fileName)
                                    }
                                )

                                reply.replies?.forEach { nestedReply ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    MessageBubble(
                                        message = nestedReply,
                                        isOwnMessage = nestedReply.sender_id == currentUserId,
                                        viewModel = viewModel,
                                        onDownloadAttachment = { fileName ->
                                            viewModel.downloadAttachment(context, nestedReply.id, fileName)
                                        },
                                        isNested = true
                                    )
                                }
                            }
                        }
                    }
                }

                // Barra de acciones
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = SurfaceElevated,
                    shadowElevation = 8.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.deleteMessage(message.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentRose)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Eliminar")
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        Button(
                            onClick = {
                                viewModel.closeMessageDetail()
                                viewModel.openReply(message)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Reply,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Responder")
                        }
                    }
                }
            }
        }
    }
}

// ============================================
// BURBUJA DE MENSAJE
// ============================================

@Composable
private fun MessageBubble(
    message: Message,
    isOwnMessage: Boolean,
    viewModel: MessagesViewModel,
    onDownloadAttachment: (String) -> Unit,
    isNested: Boolean = false
) {
    val bubbleColor = if (isOwnMessage) AccentBlue.copy(alpha = 0.1f) else SurfaceElevated
    val alignment = if (isOwnMessage) Alignment.End else Alignment.Start

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = if (isNested) 24.dp else 0.dp),
        horizontalAlignment = alignment
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = if (isOwnMessage) 20.dp else 4.dp,
                bottomEnd = if (isOwnMessage) 4.dp else 20.dp
            ),
            color = bubbleColor,
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = message.sender?.let { "${it.nombre} ${it.apellido}" } ?: "Desconocido",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isOwnMessage) AccentBlue else TextPrimary
                )

                Text(
                    text = viewModel.formatDateTime(message.created_at),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = message.body,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary
                )

                if (message.attachment != null) {
                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        onClick = { onDownloadAttachment(message.attachment_filename ?: "archivo") },
                        shape = RoundedCornerShape(10.dp),
                        color = AccentAmber.copy(alpha = 0.15f)
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                tint = AccentAmber,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = message.attachment_filename ?: "Descargar adjunto",
                                style = MaterialTheme.typography.labelMedium,
                                color = AccentAmber,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}


