package es.bomberosgranada.app.ui.screens.messages

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
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import es.bomberosgranada.app.data.models.Message
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.viewmodels.MessagesViewModel
import es.bomberosgranada.app.viewmodels.MessagesViewModel.*
import androidx.compose.material3.surfaceColorAtElevation

// ============================================
// PALETA DEPENDIENTE DEL TEMA
// ============================================
private data class MessageColors(
    val gradientStart: Color,
    val gradientEnd: Color,
    val onGradient: Color,
    val accentBlue: Color,
    val accentPurple: Color,
    val accentGreen: Color,
    val accentOrange: Color,
    val accentAmber: Color,
    val accentRose: Color,
    val surfaceElevated: Color,
    val cardBackground: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val dividerColor: Color
)

@Composable
private fun messageColors(): MessageColors {
    val colorScheme = MaterialTheme.colorScheme
    return MessageColors(
        gradientStart = colorScheme.primary,
        gradientEnd = colorScheme.primaryContainer,
        onGradient = colorScheme.onPrimary,
        accentBlue = colorScheme.primary,
        accentPurple = colorScheme.secondary,
        accentGreen = colorScheme.tertiary,
        accentOrange = colorScheme.secondaryContainer,
        accentAmber = colorScheme.tertiaryContainer,
        accentRose = colorScheme.error,
        surfaceElevated = colorScheme.surfaceColorAtElevation(6.dp),
        cardBackground = colorScheme.surface,
        textPrimary = colorScheme.onSurface,
        textSecondary = colorScheme.onSurfaceVariant,
        dividerColor = colorScheme.outlineVariant
    )
}

// ============================================
// DIÁLOGO DE COMPOSICIÓN DE MENSAJE
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeMessageDialog(
    viewModel: MessagesViewModel,
    composeState: ComposeState,
    isJefe: Boolean,
    users: List<User>
) {
    val colors = messageColors()
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var showUserDropdown by remember { mutableStateOf(false) }

    // Filtrar usuarios por búsqueda
    val filteredUsers = remember(searchQuery, users) {
        if (searchQuery.isBlank()) users
        else users.filter { user ->
            val fullName = "${user.nombre} ${user.apellido}".lowercase()
            fullName.contains(searchQuery.lowercase())
        }
    }

    // Launcher para seleccionar archivo
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            // Obtener nombre del archivo
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
            colors = CardDefaults.cardColors(containerColor = colors.cardBackground)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header con gradiente
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(colors.gradientStart, colors.gradientEnd)
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
                                color = colors.onGradient.copy(alpha = 0.7f),
                                letterSpacing = 2.sp
                            )
                            Text(
                                text = if (composeState.isReply) "Responder mensaje" else "Nuevo mensaje",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = colors.onGradient
                            )
                        }

                        IconButton(
                            onClick = { viewModel.closeCompose() },
                            enabled = !composeState.isSending,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.onGradient.copy(alpha = 0.15f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cerrar",
                                tint = colors.onGradient
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
                    // Error message
                    composeState.error?.let { error ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = colors.accentRose.copy(alpha = 0.1f)
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
                                    tint = colors.accentRose,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = error,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.accentRose
                                )
                            }
                        }
                    }

                    // Info de respuesta
                    if (composeState.isReply && composeState.replyToMessage != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = colors.accentBlue.copy(alpha = 0.08f)
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
                                    tint = colors.accentBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                                Column {
                                    Text(
                                        text = "Respondiendo a ${composeState.receiverName}",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = colors.accentBlue
                                    )
                                    Text(
                                        text = composeState.replyToMessage.subject,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.textSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    // Selector de alcance (solo jefes y no respuesta)
                    if (isJefe && !composeState.isReply) {
                        Text(
                            text = "Alcance del mensaje",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
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
                                        selectedContainerColor = colors.accentPurple.copy(alpha = 0.15f),
                                        selectedLabelColor = colors.accentPurple
                                    )
                                )
                            }
                        }
                    }

                    // Selector de destinatario (solo si es individual y no respuesta)
                    if (composeState.massiveScope == MassiveScope.INDIVIDUAL && !composeState.isReply) {
                        Text(
                            text = "Destinatario",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
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
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = null,
                                        tint = colors.textSecondary
                                    )
                                },
                                trailingIcon = {
                                    if (composeState.receiverId != null) {
                                        IconButton(onClick = {
                                            viewModel.updateComposeReceiver(0, "")
                                            searchQuery = ""
                                        }) {
                                            Icon(
                                                imageVector = Icons.Default.Clear,
                                                contentDescription = "Limpiar"
                                            )
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
                                                    color = colors.textSecondary
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
                                                    .background(colors.accentBlue.copy(alpha = 0.1f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = user.nombre.firstOrNull()?.uppercase() ?: "?",
                                                    style = MaterialTheme.typography.labelMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    color = colors.accentBlue
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
                        color = colors.textPrimary
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
                        color = colors.textPrimary
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
                        color = colors.textPrimary
                    )

                    if (composeState.attachmentUri != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = colors.accentAmber.copy(alpha = 0.1f)
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
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AttachFile,
                                        contentDescription = null,
                                        tint = colors.accentAmber,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = composeState.attachmentName ?: "Archivo",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.textPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f, fill = false)
                                    )
                                }

                                IconButton(
                                    onClick = { viewModel.clearComposeAttachment() },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Eliminar adjunto",
                                        tint = colors.accentRose,
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
                            color = colors.textSecondary
                        )
                    }
                }

                // Botón enviar
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = colors.surfaceElevated,
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
                            colors = ButtonDefaults.buttonColors(containerColor = colors.accentBlue)
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
fun MessageDetailDialog(
    viewModel: MessagesViewModel,
    state: MessageDetailState,
    currentUserId: Int
) {
    val colors = messageColors()
    val context = LocalContext.current
    val message = state.message ?: return

    Dialog(
        onDismissRequest = { viewModel.closeMessageDetail() },
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = colors.cardBackground)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(colors.gradientStart, colors.gradientEnd)
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
                                color = colors.onGradient.copy(alpha = 0.7f),
                                letterSpacing = 2.sp
                            )
                            Text(
                                text = message.subject,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = colors.onGradient,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "De: ${viewModel.getUserName(message.sender_id)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.onGradient.copy(alpha = 0.8f)
                            )
                            Text(
                                text = viewModel.formatDateTime(message.created_at),
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.onGradient.copy(alpha = 0.6f)
                            )
                        }

                        IconButton(
                            onClick = { viewModel.closeMessageDetail() },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.onGradient.copy(alpha = 0.15f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cerrar",
                                tint = colors.onGradient
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
                        CircularProgressIndicator(color = colors.accentBlue)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Mensaje principal
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

                        // Respuestas (hilo)
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

                                // Respuestas anidadas
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
                    color = colors.surfaceElevated,
                    shadowElevation = 8.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Botón eliminar
                        OutlinedButton(
                            onClick = { viewModel.deleteMessage(message.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = colors.accentRose
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Eliminar")
                        }

                        // Botón responder
                        Button(
                            onClick = {
                                viewModel.closeMessageDetail()
                                viewModel.openReply(message)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.accentBlue)
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
// BURBUJA DE MENSAJE (ESTILO CHAT)
// ============================================

@Composable
private fun MessageBubble(
    message: Message,
    isOwnMessage: Boolean,
    viewModel: MessagesViewModel,
    onDownloadAttachment: (String) -> Unit,
    isNested: Boolean = false
) {
    val colors = messageColors()
    val bubbleColor = if (isOwnMessage) {
        colors.accentBlue.copy(alpha = 0.1f)
    } else {
        colors.surfaceElevated
    }

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
                // Remitente + fecha
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val senderName = viewModel.getUserName(message.sender_id)

                    Text(
                        text = senderName,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isOwnMessage) colors.accentBlue else colors.textPrimary
                    )
                }

                Text(
                    text = viewModel.formatDateTime(message.created_at),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.textSecondary
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Cuerpo
                Text(
                    text = message.body,
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.textPrimary
                )

                // Adjunto
                if (message.attachment != null) {
                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        onClick = {
                            onDownloadAttachment(message.attachment_filename ?: "archivo")
                        },
                        shape = RoundedCornerShape(10.dp),
                        color = colors.accentAmber.copy(alpha = 0.15f)
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                tint = colors.accentAmber,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = message.attachment_filename ?: "Descargar adjunto",
                                style = MaterialTheme.typography.labelMedium,
                                color = colors.accentAmber,
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
