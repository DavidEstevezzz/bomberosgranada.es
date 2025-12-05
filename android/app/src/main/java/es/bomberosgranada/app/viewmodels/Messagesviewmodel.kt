package es.bomberosgranada.app.viewmodels

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.Message
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.repositories.MessagesRepository
import es.bomberosgranada.app.data.repositories.UsersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

/**
 * ViewModel para la pantalla de Mensajes
 *
 * Funcionalidades:
 * - Bandeja de entrada y salida
 * - Navegación por mes
 * - Ver detalle de mensaje con hilo de respuestas
 * - Crear mensaje (individual o masivo para jefes)
 * - Responder mensaje
 * - Adjuntar archivos
 * - Marcar como leído
 * - Eliminar mensajes
 */
class MessagesViewModel(
    private val messagesRepository: MessagesRepository,
    private val usersRepository: UsersRepository
) : ViewModel() {

    companion object {
        private const val TAG = "MessagesViewModel"
    }

    // ==========================================
    // ENUMS Y DATA CLASSES
    // ==========================================

    enum class MessageView {
        INBOX,
        SENT
    }

    enum class MassiveScope(val value: String, val label: String) {
        INDIVIDUAL("false", "Individual"),
        TODA("toda", "Toda la plantilla"),
        MANDOS("mandos", "Solo mandos"),
        BOMBEROS("bomberos", "Solo bomberos")
    }

    data class ComposeState(
        val isOpen: Boolean = false,
        val isReply: Boolean = false,
        val replyToMessage: Message? = null,
        val receiverId: Int? = null,
        val receiverName: String = "",
        val subject: String = "",
        val body: String = "",
        val attachmentUri: Uri? = null,
        val attachmentName: String? = null,
        val massiveScope: MassiveScope = MassiveScope.INDIVIDUAL,
        val isSending: Boolean = false,
        val error: String? = null
    )

    data class MessageDetailState(
        val isOpen: Boolean = false,
        val message: Message? = null,
        val isLoading: Boolean = false,
        val error: String? = null
    )

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<MessagesUiState>(MessagesUiState.Loading)
    val uiState: StateFlow<MessagesUiState> = _uiState.asStateFlow()

    private val _currentView = MutableStateFlow(MessageView.INBOX)
    val currentView: StateFlow<MessageView> = _currentView.asStateFlow()

    private val _currentMonth = MutableStateFlow(YearMonth.now())
    val currentMonth: StateFlow<YearMonth> = _currentMonth.asStateFlow()

    private val _inboxMessages = MutableStateFlow<List<Message>>(emptyList())
    val inboxMessages: StateFlow<List<Message>> = _inboxMessages.asStateFlow()

    private val _sentMessages = MutableStateFlow<List<Message>>(emptyList())
    val sentMessages: StateFlow<List<Message>> = _sentMessages.asStateFlow()

    private val _filteredMessages = MutableStateFlow<List<Message>>(emptyList())
    val filteredMessages: StateFlow<List<Message>> = _filteredMessages.asStateFlow()

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    private val _composeState = MutableStateFlow(ComposeState())
    val composeState: StateFlow<ComposeState> = _composeState.asStateFlow()

    private val _messageDetailState = MutableStateFlow(MessageDetailState())
    val messageDetailState: StateFlow<MessageDetailState> = _messageDetailState.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // ==========================================
    // SEALED CLASS PARA ESTADO UI
    // ==========================================

    sealed class MessagesUiState {
        object Loading : MessagesUiState()
        object Success : MessagesUiState()
        data class Error(val message: String) : MessagesUiState()
    }

    // ==========================================
    // CARGA DE DATOS
    // ==========================================

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = MessagesUiState.Loading
            Log.d(TAG, "=== CARGANDO MENSAJES ===")

            try {
                // Cargar usuarios para el selector de destinatarios
                val usersResult = usersRepository.getUsers()
                usersResult.onSuccess { usersList ->
                    _users.value = usersList
                    Log.d(TAG, "✅ ${usersList.size} usuarios cargados")
                }

                // Cargar mensajes de entrada
                val inboxResult = messagesRepository.getInboxMessages()
                inboxResult.onSuccess { messages ->
                    _inboxMessages.value = messages
                    Log.d(TAG, "✅ ${messages.size} mensajes en bandeja de entrada")
                }.onFailure { error ->
                    Log.e(TAG, "❌ Error cargando bandeja de entrada: ${error.message}")
                }

                // Cargar mensajes enviados
                val sentResult = messagesRepository.getSentMessages()
                sentResult.onSuccess { messages ->
                    _sentMessages.value = messages
                    Log.d(TAG, "✅ ${messages.size} mensajes enviados")
                }.onFailure { error ->
                    Log.e(TAG, "❌ Error cargando bandeja de salida: ${error.message}")
                }

                filterMessagesByMonth()
                _uiState.value = MessagesUiState.Success

            } catch (e: Exception) {
                Log.e(TAG, "❌ Error general: ${e.message}")
                _uiState.value = MessagesUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    /**
     * Filtra los mensajes por el mes actual seleccionado
     */
    private fun filterMessagesByMonth() {
        val month = _currentMonth.value
        val messages = when (_currentView.value) {
            MessageView.INBOX -> _inboxMessages.value
            MessageView.SENT -> _sentMessages.value
        }

        val filtered = messages.filter { message ->
            try {
                val messageDate = LocalDate.parse(
                    message.created_at.substring(0, 10),
                    DateTimeFormatter.ISO_LOCAL_DATE
                )
                YearMonth.from(messageDate) == month
            } catch (e: Exception) {
                false
            }
        }

        _filteredMessages.value = filtered
        Log.d(TAG, "📅 ${filtered.size} mensajes filtrados para ${month.month}/${month.year}")
    }

    // ==========================================
    // NAVEGACIÓN
    // ==========================================

    fun setView(view: MessageView) {
        _currentView.value = view
        filterMessagesByMonth()
    }

    fun previousMonth() {
        _currentMonth.value = _currentMonth.value.minusMonths(1)
        filterMessagesByMonth()
    }

    fun nextMonth() {
        _currentMonth.value = _currentMonth.value.plusMonths(1)
        filterMessagesByMonth()
    }

    // ==========================================
    // DETALLE DE MENSAJE
    // ==========================================

    fun openMessageDetail(message: Message) {
        viewModelScope.launch {
            _messageDetailState.value = MessageDetailState(
                isOpen = true,
                message = message,
                isLoading = true
            )

            // Marcar como leído si no lo está
            if (message.is_read != true && _currentView.value == MessageView.INBOX) {
                markAsRead(message.id)
            }

            // Cargar hilo completo
            val result = messagesRepository.getMessageThread(message.id)
            result.fold(
                onSuccess = { fullMessage ->
                    _messageDetailState.value = _messageDetailState.value.copy(
                        message = fullMessage,
                        isLoading = false
                    )
                },
                onFailure = { error ->
                    _messageDetailState.value = _messageDetailState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
            )
        }
    }

    fun closeMessageDetail() {
        _messageDetailState.value = MessageDetailState()
    }

    // ==========================================
    // MARCAR COMO LEÍDO
    // ==========================================

    private fun markAsRead(messageId: Int) {
        viewModelScope.launch {
            val result = messagesRepository.markAsRead(messageId)
            result.onSuccess {
                // Actualizar el mensaje en la lista local
                _inboxMessages.value = _inboxMessages.value.map { msg ->
                    if (msg.id == messageId) msg.copy(is_read = true) else msg
                }
                filterMessagesByMonth()
                Log.d(TAG, "✅ Mensaje $messageId marcado como leído")
            }.onFailure { error ->
                Log.e(TAG, "❌ Error marcando como leído: ${error.message}")
            }
        }
    }

    // ==========================================
    // COMPOSICIÓN DE MENSAJES
    // ==========================================

    fun openCompose() {
        _composeState.value = ComposeState(isOpen = true)
    }

    fun openReply(message: Message) {
        val senderName = message.sender?.let { "${it.nombre} ${it.apellido}" } ?: "Usuario"
        val subject = if (message.subject.startsWith("Re:")) {
            message.subject
        } else {
            "Re: ${message.subject}"
        }

        _composeState.value = ComposeState(
            isOpen = true,
            isReply = true,
            replyToMessage = message,
            receiverId = message.sender_id,
            receiverName = senderName,
            subject = subject
        )
    }

    fun closeCompose() {
        _composeState.value = ComposeState()
    }

    fun updateComposeReceiver(userId: Int, userName: String) {
        _composeState.value = _composeState.value.copy(
            receiverId = userId,
            receiverName = userName
        )
    }

    fun updateComposeSubject(subject: String) {
        _composeState.value = _composeState.value.copy(subject = subject)
    }

    fun updateComposeBody(body: String) {
        _composeState.value = _composeState.value.copy(body = body)
    }

    fun updateComposeMassiveScope(scope: MassiveScope) {
        _composeState.value = _composeState.value.copy(
            massiveScope = scope,
            // Limpiar receptor si es masivo
            receiverId = if (scope != MassiveScope.INDIVIDUAL) null else _composeState.value.receiverId,
            receiverName = if (scope != MassiveScope.INDIVIDUAL) "" else _composeState.value.receiverName
        )
    }

    fun updateComposeAttachment(uri: Uri?, name: String?) {
        _composeState.value = _composeState.value.copy(
            attachmentUri = uri,
            attachmentName = name
        )
    }

    fun clearComposeAttachment() {
        _composeState.value = _composeState.value.copy(
            attachmentUri = null,
            attachmentName = null
        )
    }

    /**
     * Envía el mensaje
     */
    fun sendMessage(context: Context) {
        val state = _composeState.value

        // Validaciones
        if (state.subject.isBlank()) {
            _composeState.value = state.copy(error = "El asunto es obligatorio")
            return
        }
        if (state.body.isBlank()) {
            _composeState.value = state.copy(error = "El mensaje es obligatorio")
            return
        }
        if (state.massiveScope == MassiveScope.INDIVIDUAL && state.receiverId == null) {
            _composeState.value = state.copy(error = "Debe seleccionar un destinatario")
            return
        }

        viewModelScope.launch {
            _composeState.value = state.copy(isSending = true, error = null)

            try {
                // Preparar archivo adjunto si existe
                val attachmentFile = state.attachmentUri?.let { uri ->
                    uriToFile(context, uri, state.attachmentName ?: "attachment")
                }

                val result = messagesRepository.sendMessage(
                    receiverId = if (state.massiveScope == MassiveScope.INDIVIDUAL) state.receiverId else null,
                    subject = state.subject,
                    body = state.body,
                    attachmentFile = attachmentFile,
                    parentId = state.replyToMessage?.let { it.parent_id ?: it.id },
                    massive = if (state.massiveScope != MassiveScope.INDIVIDUAL) state.massiveScope.value else null
                )

                result.fold(
                    onSuccess = {
                        _successMessage.value = "Mensaje enviado correctamente"
                        closeCompose()
                        loadData() // Recargar mensajes
                    },
                    onFailure = { error ->
                        _composeState.value = _composeState.value.copy(
                            isSending = false,
                            error = error.message ?: "Error al enviar el mensaje"
                        )
                    }
                )
            } catch (e: Exception) {
                _composeState.value = _composeState.value.copy(
                    isSending = false,
                    error = e.message ?: "Error al enviar el mensaje"
                )
            }
        }
    }

    /**
     * Convierte un Uri a File para enviar como adjunto
     */
    private fun uriToFile(context: Context, uri: Uri, fileName: String): File? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val tempFile = File(context.cacheDir, fileName)
            tempFile.outputStream().use { outputStream ->
                inputStream.copyTo(outputStream)
            }
            inputStream.close()
            tempFile
        } catch (e: Exception) {
            Log.e(TAG, "Error convirtiendo Uri a File: ${e.message}")
            null
        }
    }

    // ==========================================
    // ELIMINAR MENSAJE
    // ==========================================

    fun deleteMessage(messageId: Int) {
        viewModelScope.launch {
            val result = messagesRepository.deleteMessage(messageId)
            result.fold(
                onSuccess = {
                    _successMessage.value = "Mensaje eliminado"
                    closeMessageDetail()
                    loadData()
                },
                onFailure = { error ->
                    _errorMessage.value = error.message ?: "Error al eliminar"
                }
            )
        }
    }

    // ==========================================
    // DESCARGAR ADJUNTO
    // ==========================================

    fun downloadAttachment(context: Context, messageId: Int, fileName: String) {
        viewModelScope.launch {
            val result = messagesRepository.downloadAttachment(messageId)
            result.fold(
                onSuccess = { responseBody ->
                    try {
                        // Guardar en Downloads
                        val downloadsDir = context.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS)
                        val file = File(downloadsDir, fileName)
                        file.outputStream().use { outputStream ->
                            responseBody.byteStream().copyTo(outputStream)
                        }
                        _successMessage.value = "Archivo descargado: $fileName"
                    } catch (e: Exception) {
                        _errorMessage.value = "Error guardando archivo: ${e.message}"
                    }
                },
                onFailure = { error ->
                    _errorMessage.value = "Error descargando: ${error.message}"
                }
            )
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

    fun clearError() {
        _errorMessage.value = null
    }

    fun clearSuccess() {
        _successMessage.value = null
    }

    fun clearComposeError() {
        _composeState.value = _composeState.value.copy(error = null)
    }

    /**
     * Obtiene estadísticas de la bandeja actual
     */
    fun getStats(): Stats {
        val messages = _filteredMessages.value
        val unreadCount = if (_currentView.value == MessageView.INBOX) {
            messages.count { it.is_read != true }
        } else 0

        return Stats(
            viewName = if (_currentView.value == MessageView.INBOX) "Entrada" else "Salida",
            totalCount = messages.size,
            unreadCount = unreadCount
        )
    }

    data class Stats(
        val viewName: String,
        val totalCount: Int,
        val unreadCount: Int
    )

    /**
     * Obtiene el nombre de un usuario por su ID
     */
    fun getUserName(userId: Int?): String {
        if (userId == null) return "Desconocido"
        val user = _users.value.find { it.id_empleado == userId }
        return user?.let { "${it.nombre} ${it.apellido}" } ?: "Desconocido"
    }

    /**
     * Formatea una fecha para mostrar
     */
    fun formatDate(dateString: String): String {
        return try {
            val date = LocalDate.parse(dateString.substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE)
            date.format(DateTimeFormatter.ofPattern("d MMM yyyy"))
        } catch (e: Exception) {
            dateString
        }
    }

    /**
     * Formatea fecha y hora
     */
    fun formatDateTime(dateString: String): String {
        return try {
            // Formato: "2024-01-15 10:30:45" o "2024-01-15T10:30:45"
            val parts = dateString.replace("T", " ").split(" ")
            if (parts.size >= 2) {
                val datePart = parts[0].split("-")
                val timePart = parts[1].split(":")
                if (datePart.size >= 3 && timePart.size >= 2) {
                    "${datePart[2]}/${datePart[1]}/${datePart[0]} ${timePart[0]}:${timePart[1]}"
                } else {
                    dateString
                }
            } else {
                dateString
            }
        } catch (e: Exception) {
            dateString
        }
    }

    /**
     * Obtiene el label para mensajes masivos
     */
    fun getMassiveLabel(massive: String?): String? {
        return when (massive?.lowercase()) {
            "toda" -> "📢 Toda la plantilla"
            "mandos" -> "👔 Solo mandos"
            "bomberos" -> "🚒 Solo bomberos"
            else -> null
        }
    }
}