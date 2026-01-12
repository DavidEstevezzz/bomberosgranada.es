package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.RequestItem
import es.bomberosgranada.app.data.models.ShiftChangeRequest
import es.bomberosgranada.app.data.models.User


import es.bomberosgranada.app.data.repositories.RequestsRepository
import es.bomberosgranada.app.data.repositories.ShiftChangeRequestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
// Type alias para mayor claridad
typealias Request = RequestItem
/**
 * ViewModel para la pantalla de Mis Solicitudes
 *
 * Muestra:
 * - Solicitudes de permisos del usuario
 * - Cambios de guardia simples donde participa el usuario
 * - Cambios de guardia espejo donde participa el usuario
 *
 * Permite:
 * - Navegar entre meses
 * - Cancelar solicitudes pendientes
 * - Aceptar/Rechazar cambios de guardia (si es empleado2)
 */
class MyRequestsViewModel(
    private val requestsRepository: RequestsRepository,
    private val shiftChangeRepository: ShiftChangeRequestsRepository
) : ViewModel() {

    companion object {
        private const val TAG = "MyRequestsViewModel"
    }

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<MyRequestsUiState>(MyRequestsUiState.Loading)
    val uiState: StateFlow<MyRequestsUiState> = _uiState.asStateFlow()

    private val _currentMonth = MutableStateFlow(YearMonth.now())
    val currentMonth: StateFlow<YearMonth> = _currentMonth.asStateFlow()

    // Solicitudes de permisos
    private val _requests = MutableStateFlow<List<Request>>(emptyList())
    val requests: StateFlow<List<Request>> = _requests.asStateFlow()

    // Cambios de guardia simples (sin fecha2)
    private val _simpleShiftChanges = MutableStateFlow<List<ShiftChangeRequest>>(emptyList())
    val simpleShiftChanges: StateFlow<List<ShiftChangeRequest>> = _simpleShiftChanges.asStateFlow()

    // Cambios de guardia espejo (con fecha2)
    private val _mirrorShiftChanges = MutableStateFlow<List<ShiftChangeRequest>>(emptyList())
    val mirrorShiftChanges: StateFlow<List<ShiftChangeRequest>> = _mirrorShiftChanges.asStateFlow()

    // Mensajes
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // Estado de actualización de un item específico
    private val _updatingItemId = MutableStateFlow<Int?>(null)
    val updatingItemId: StateFlow<Int?> = _updatingItemId.asStateFlow()

    // ==========================================
    // ENUMS Y SEALED CLASSES
    // ==========================================

    sealed class MyRequestsUiState {
        object Loading : MyRequestsUiState()
        object Success : MyRequestsUiState()
        data class Error(val message: String) : MyRequestsUiState()
    }

    /**
     * Estados posibles para solicitudes de permisos
     */
    enum class RequestStatus(val apiValue: String, val displayName: String) {
        PENDIENTE("Pendiente", "Pendiente"),
        CONFIRMADA("Confirmada", "Confirmada"),
        CANCELADA("Cancelada", "Cancelada"),
        DENEGADA("Denegada", "Denegada")
    }

    /**
     * Estados posibles para cambios de guardia
     */
    enum class ShiftChangeStatus(val apiValue: String, val displayName: String) {
        EN_TRAMITE("en_tramite", "En trámite"),
        ACEPTADO_POR_EMPLEADOS("aceptado_por_empleados", "Aceptado por empleados"),
        ACEPTADO("aceptado", "Aceptado"),
        RECHAZADO("rechazado", "Rechazado")
    }

    // ==========================================
    // CARGA DE DATOS
    // ==========================================

    fun loadData(currentUser: User) {
        viewModelScope.launch {
            _uiState.value = MyRequestsUiState.Loading

            try {
                // Cargar ambos tipos de datos en paralelo
                val requestsResult = requestsRepository.getRequests()
                val shiftChangesResult = shiftChangeRepository.getShiftChangeRequests()

                var hasError = false
                var errorMsg = ""

                // Procesar solicitudes
                requestsResult.fold(
                    onSuccess = { allRequests ->
                        val filtered = filterRequestsForUser(allRequests, currentUser)
                        _requests.value = filtered
                        Log.d(TAG, "✅ ${filtered.size} solicitudes cargadas")
                    },
                    onFailure = { error ->
                        Log.e(TAG, "❌ Error cargando solicitudes: ${error.message}")
                        hasError = true
                        errorMsg = error.message ?: "Error desconocido"
                    }
                )

                // Procesar cambios de guardia
                shiftChangesResult.fold(
                    onSuccess = { allShiftChanges ->
                        val (simple, mirror) = filterShiftChangesForUser(allShiftChanges, currentUser)
                        _simpleShiftChanges.value = simple
                        _mirrorShiftChanges.value = mirror
                        Log.d(TAG, "✅ ${simple.size} cambios simples, ${mirror.size} cambios espejo")
                    },
                    onFailure = { error ->
                        Log.e(TAG, "❌ Error cargando cambios: ${error.message}")
                        if (!hasError) {
                            hasError = true
                            errorMsg = error.message ?: "Error desconocido"
                        }
                    }
                )

                _uiState.value = if (hasError) {
                    MyRequestsUiState.Error(errorMsg)
                } else {
                    MyRequestsUiState.Success
                }

            } catch (e: Exception) {
                Log.e(TAG, "❌ Excepción: ${e.message}", e)
                _uiState.value = MyRequestsUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    /**
     * Filtra solicitudes del usuario para el mes actual
     */
    private fun filterRequestsForUser(allRequests: List<Request>, user: User): List<Request> {
        val month = _currentMonth.value
        val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

        return allRequests.filter { request ->
            // Es del usuario actual
            val isUserRequest = request.id_empleado == user.id_empleado

            // Está en el mes actual
            val requestDate = try {
                LocalDate.parse(request.fecha_ini, dateFormatter)
            } catch (e: Exception) {
                null
            }
            val isInMonth = requestDate?.let {
                YearMonth.from(it) == month
            } ?: false

            isUserRequest && isInMonth
        }.sortedByDescending { it.fecha_ini }
    }

    /**
     * Filtra cambios de guardia donde participa el usuario
     * Devuelve un par (simples, espejo)
     */
    private fun filterShiftChangesForUser(
        allChanges: List<ShiftChangeRequest>,
        user: User
    ): Pair<List<ShiftChangeRequest>, List<ShiftChangeRequest>> {
        val month = _currentMonth.value
        val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

        val userChanges = allChanges.filter { change ->
            // Participa el usuario
            val involvesUser = change.id_empleado1 == user.id_empleado ||
                    change.id_empleado2 == user.id_empleado

            // Está en el mes actual
            val changeDate = try {
                LocalDate.parse(change.fecha, dateFormatter)
            } catch (e: Exception) {
                null
            }
            val isInMonth = changeDate?.let {
                YearMonth.from(it) == month
            } ?: false

            involvesUser && isInMonth
        }

        // Separar simples (sin fecha2) y espejo (con fecha2)
        val simple = userChanges.filter { it.fecha2.isNullOrEmpty() }
            .sortedByDescending { it.fecha }
        val mirror = userChanges.filter { !it.fecha2.isNullOrEmpty() }
            .sortedByDescending { it.fecha }

        return Pair(simple, mirror)
    }

    // ==========================================
    // NAVEGACIÓN DE MES
    // ==========================================

    fun previousMonth(currentUser: User) {
        _currentMonth.value = _currentMonth.value.minusMonths(1)
        loadData(currentUser)
    }

    fun nextMonth(currentUser: User) {
        _currentMonth.value = _currentMonth.value.plusMonths(1)
        loadData(currentUser)
    }

    // ==========================================
    // ACCIONES SOBRE SOLICITUDES
    // ==========================================

    /**
     * Cancela una solicitud de permiso (solo si está Pendiente)
     */
    fun cancelRequest(requestId: Int, currentUser: User) {
        viewModelScope.launch {
            _updatingItemId.value = requestId

            val result = requestsRepository.updateRequest(requestId, "Cancelada")

            result.fold(
                onSuccess = {
                    Log.d(TAG, "✅ Solicitud $requestId cancelada")
                    _successMessage.value = "Solicitud cancelada"
                    // Actualizar lista local
                    _requests.value = _requests.value.map { req ->
                        if (req.id == requestId) req.copy(estado = "Cancelada") else req
                    }
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error cancelando solicitud: ${error.message}")
                    _errorMessage.value = "Error al cancelar: ${error.message}"
                }
            )

            _updatingItemId.value = null
        }
    }

    // ==========================================
    // ACCIONES SOBRE CAMBIOS DE GUARDIA
    // ==========================================

    /**
     * Acepta un cambio de guardia (solo si el usuario es empleado2 y está en_tramite)
     */
    fun acceptShiftChange(changeId: Int, currentUser: User) {
        updateShiftChangeStatus(changeId, ShiftChangeStatus.ACEPTADO_POR_EMPLEADOS.apiValue)
    }

    /**
     * Rechaza un cambio de guardia
     */
    fun rejectShiftChange(changeId: Int, currentUser: User) {
        updateShiftChangeStatus(changeId, ShiftChangeStatus.RECHAZADO.apiValue)
    }

    private fun updateShiftChangeStatus(changeId: Int, newStatus: String) {
        viewModelScope.launch {
            _updatingItemId.value = changeId

            val result = shiftChangeRepository.updateShiftChangeRequest(changeId, newStatus)

            result.fold(
                onSuccess = {
                    Log.d(TAG, "✅ Cambio $changeId actualizado a $newStatus")
                    _successMessage.value = when (newStatus) {
                        ShiftChangeStatus.ACEPTADO_POR_EMPLEADOS.apiValue -> "Cambio aceptado"
                        ShiftChangeStatus.RECHAZADO.apiValue -> "Cambio rechazado"
                        else -> "Estado actualizado"
                    }
                    // Actualizar listas locales
                    updateLocalShiftChange(changeId, newStatus)
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error actualizando cambio: ${error.message}")
                    _errorMessage.value = "Error: ${error.message}"
                }
            )

            _updatingItemId.value = null
        }
    }

    private fun updateLocalShiftChange(changeId: Int, newStatus: String) {
        _simpleShiftChanges.value = _simpleShiftChanges.value.map { change ->
            if (change.id == changeId) change.copy(estado = newStatus) else change
        }
        _mirrorShiftChanges.value = _mirrorShiftChanges.value.map { change ->
            if (change.id == changeId) change.copy(estado = newStatus) else change
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

    /**
     * Normaliza el estado para mostrar
     */
    fun normalizeState(state: String): String {
        return when (state.lowercase()) {
            "en_tramite" -> "En trámite"
            "rechazado" -> "Rechazado"
            "aceptado_por_empleados" -> "Aceptado por empleados"
            "aceptado" -> "Aceptado"
            "cancelada" -> "Cancelada"
            "denegada" -> "Denegada"
            "confirmada" -> "Confirmada"
            "pendiente" -> "Pendiente"
            else -> state
        }
    }

    /**
     * Determina si el usuario puede cancelar una solicitud
     */
    fun canCancelRequest(request: Request): Boolean {
        return request.estado == "Pendiente"
    }

    /**
     * Determina las acciones disponibles para un cambio de guardia
     */
    fun getShiftChangeActions(change: ShiftChangeRequest, currentUser: User): ShiftChangeActions {
        // Si ya está rechazado, no hay acciones
        if (change.estado == ShiftChangeStatus.RECHAZADO.apiValue) {
            return ShiftChangeActions.NONE
        }

        // Si el usuario es empleado1, puede rechazar
        if (change.id_empleado1 == currentUser.id_empleado) {
            return ShiftChangeActions.CAN_REJECT
        }

        // Si el usuario es empleado2 y está en_tramite, puede aceptar o rechazar
        if (change.id_empleado2 == currentUser.id_empleado &&
            change.estado == ShiftChangeStatus.EN_TRAMITE.apiValue) {
            return ShiftChangeActions.CAN_ACCEPT_REJECT
        }

        return ShiftChangeActions.NONE
    }

    enum class ShiftChangeActions {
        NONE,
        CAN_REJECT,
        CAN_ACCEPT_REJECT
    }

    /**
     * Obtiene estadísticas del mes actual
     */
    fun getStats(): Stats {
        return Stats(
            requestsCount = _requests.value.size,
            simpleChangesCount = _simpleShiftChanges.value.size,
            mirrorChangesCount = _mirrorShiftChanges.value.size
        )
    }

    data class Stats(
        val requestsCount: Int,
        val simpleChangesCount: Int,
        val mirrorChangesCount: Int
    )
}