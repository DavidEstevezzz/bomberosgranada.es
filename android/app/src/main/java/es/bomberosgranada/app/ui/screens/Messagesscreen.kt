package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.data.models.Message
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.ui.components.AppScaffold
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.MessagesViewModel
import es.bomberosgranada.app.viewmodels.MessagesViewModel.*
import es.bomberosgranada.app.viewmodels.ThemeViewModel
import java.time.format.TextStyle
import java.util.*

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
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null
) {
    // Colores del tema
    val accentGreen = AppColors.accentGreen
    val accentRose = AppColors.accentRose

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
        unreadMessagesCount = unreadMessagesCount,
        themeViewModel = themeViewModel
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
                    containerColor = if (successMessage != null) accentGreen else accentRose,
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
    // Colores del tema
    val gradientColors = AppColors.gradientPrimary
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val textPrimary = AppColors.textPrimary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple
    val accentOrange = AppColors.accentOrange

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
                        brush = Brush.horizontalGradient(colors = gradientColors)
                    )
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "CENTRO DE COMUNICACIONES",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.7f),
                        letterSpacing = 2.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Mensajes internos",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Surface(color = cardBackground) {
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
                                .background(surfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronLeft,
                                contentDescription = "Mes anterior",
                                tint = textPrimary
                            )
                        }

                        Text(
                            text = "$monthName ${currentMonth.year}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )

                        IconButton(
                            onClick = onNextMonth,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(surfaceElevated)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Mes siguiente",
                                tint = textPrimary
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
                        StatChip(label = "Bandeja", value = stats.viewName, color = accentBlue)
                        StatChip(label = "Mensajes", value = stats.totalCount.toString(), color = accentPurple)
                        if (stats.unreadCount > 0) {
                            StatChip(label = "Sin leer", value = stats.unreadCount.toString(), color = accentOrange)
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
    val cardBackground = AppColors.cardBackground
    val surfaceElevated = AppColors.surfaceElevated
    val accentBlue = AppColors.accentBlue

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
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
                    .background(surfaceElevated)
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
                colors = ButtonDefaults.buttonColors(containerColor = accentBlue)
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
    val accentBlue = AppColors.accentBlue
    val textSecondary = AppColors.textSecondary

    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = if (selected) accentBlue else Color.Transparent
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (selected) Color.White else textSecondary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                color = if (selected) Color.White else textSecondary
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
    val cardBackground = AppColors.cardBackground
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue
    val accentPurple = AppColors.accentPurple

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
            containerColor = if (!isRead && isInbox) accentBlue.copy(alpha = 0.05f) else cardBackground
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
                        if (isMassive) accentPurple.copy(alpha = 0.15f)
                        else accentBlue.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isMassive) {
                    Icon(
                        imageVector = Icons.Default.Campaign,
                        contentDescription = null,
                        tint = accentPurple,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    val name = if (isInbox) {
                        viewModel.getUserName(message.sender_id)
                    } else {
                        viewModel.getUserName(message.receiver_id)
                    }
                    Text(
                        text = name.firstOrNull()?.uppercase() ?: "?",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = accentBlue
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
                    val receiverName = viewModel.getUserName(message.receiver_id)
                    val displayName = if (!isInbox && massiveLabel != null && receiverName == "Desconocido") {
                        massiveLabel
                    } else if (!isInbox) {
                        receiverName
                    } else {
                        viewModel.getUserName(message.sender_id)
                    }

                    Text(
                        text = displayName,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (!isRead && isInbox) FontWeight.Bold else FontWeight.SemiBold,
                        color = textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Text(
                        text = viewModel.formatDate(message.created_at),
                        style = MaterialTheme.typography.labelSmall,
                        color = textSecondary
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = message.subject.ifBlank { "(Sin asunto)" },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (!isRead && isInbox) FontWeight.SemiBold else FontWeight.Normal,
                    color = textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = message.body.take(50).let { if (message.body.length > 50) "$it..." else it },
                        style = MaterialTheme.typography.bodySmall,
                        color = textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!message.attachment.isNullOrBlank()) {
                            Icon(
                                imageVector = Icons.Default.AttachFile,
                                contentDescription = "Tiene adjunto",
                                tint = textSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        if (isMassive && !isInbox) {
                            Text(
                                text = "${message.read_count ?: 0}/${message.total_recipients ?: 0}",
                                style = MaterialTheme.typography.labelSmall,
                                color = accentPurple
                            )
                        }
                    }

                    if (!isRead && isInbox) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = accentBlue
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
    val cardBackground = AppColors.cardBackground
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(48.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = accentBlue)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Cargando mensajes...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = textSecondary
                )
            }
        }
    }
}

@Composable
private fun ErrorCard(message: String, onRetry: () -> Unit) {
    val cardBackground = AppColors.cardBackground
    val accentRose = AppColors.accentRose
    val accentOrange = AppColors.accentOrange

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
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
                tint = accentRose,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = accentRose,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = accentOrange)
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
    val cardBackground = AppColors.cardBackground
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val accentBlue = AppColors.accentBlue

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = if (currentView == MessageView.INBOX)
                    Icons.Outlined.Inbox else Icons.Outlined.Send,
                contentDescription = null,
                tint = accentBlue.copy(alpha = 0.5f),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (currentView == MessageView.INBOX)
                    "No hay mensajes recibidos" else "No hay mensajes enviados",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = textPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (currentView == MessageView.INBOX)
                    "Los mensajes que recibas aparecerán aquí"
                else "Los mensajes que envíes aparecerán aquí",
                style = MaterialTheme.typography.bodyMedium,
                color = textSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ============================================
// DIÁLOGO DE COMPOSICIÓN DE MENSAJE
// (Placeholder - importar desde MessagesDialogs.kt)
// ============================================

@Composable
fun ComposeMessageDialog(
    viewModel: MessagesViewModel,
    composeState: ComposeState,
    isJefe: Boolean,
    users: List<User>
) {
    // Este diálogo debería estar en MessagesDialogs.kt
    // Por ahora se mantiene la referencia
    es.bomberosgranada.app.ui.screens.messages.ComposeMessageDialog(
        viewModel = viewModel,
        composeState = composeState,
        isJefe = isJefe,
        users = users
    )
}

// ============================================
// DIÁLOGO DE DETALLE DE MENSAJE
// (Placeholder - importar desde MessagesDialogs.kt)
// ============================================

@Composable
fun MessageDetailDialog(
    viewModel: MessagesViewModel,
    state: MessageDetailState,
    currentUserId: Int
) {
    // Este diálogo debería estar en MessagesDialogs.kt
    // Por ahora se mantiene la referencia
    es.bomberosgranada.app.ui.screens.messages.MessageDetailDialog(
        viewModel = viewModel,
        state = state,
        currentUserId = currentUserId
    )
}