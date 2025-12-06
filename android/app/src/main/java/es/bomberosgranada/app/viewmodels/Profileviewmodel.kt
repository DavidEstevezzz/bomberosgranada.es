package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.*
import es.bomberosgranada.app.data.repositories.AssignmentsRepository
import es.bomberosgranada.app.data.repositories.BrigadesRepository
import es.bomberosgranada.app.data.repositories.ExtraHoursRepository
import es.bomberosgranada.app.data.repositories.GuardsRepository
import es.bomberosgranada.app.data.repositories.RequestsRepository
import es.bomberosgranada.app.data.repositories.ShiftChangeRequestsRepository
import es.bomberosgranada.app.data.repositories.UsersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

/**
 * ViewModel para la pantalla de Perfil
 *
 * Funcionalidades:
 * - Datos personales del usuario
 * - Permisos restantes (vacaciones, AP, SP, etc.)
 * - Calendario personal con guardias y solicitudes
 * - Resumen de solicitudes del mes (navegable)
 * - Tabla de cambios de guardia (navegable)
 * - Tabla de horas extra (navegable)
 * - Resumen económico de guardias (navegable)
 * - Cambio de contraseña
 */
class ProfileViewModel(
    private val usersRepository: UsersRepository,
    private val brigadesRepository: BrigadesRepository,
    private val assignmentsRepository: AssignmentsRepository,
    private val guardsRepository: GuardsRepository,
    private val requestsRepository: RequestsRepository,
    private val shiftChangeRepository: ShiftChangeRequestsRepository,
    private val extraHoursRepository: ExtraHoursRepository
) : ViewModel() {

    companion object {
        private const val TAG = "ProfileViewModel"

        // IDs de brigadas que son guardias normales (A, B, C, D, E, F)
        private val BRIGADAS_GUARDIA = listOf(6, 2, 7, 4, 9, 21, 22, 23, 24, 25)
    }

    // ==========================================
    // ESTADOS PRINCIPALES
    // ==========================================

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    // ==========================================
    // CALENDARIO - Mes independiente
    // ==========================================

    private val _calendarMonth = MutableStateFlow(YearMonth.now())
    val calendarMonth: StateFlow<YearMonth> = _calendarMonth.asStateFlow()

    private val _calendarEvents = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val calendarEvents: StateFlow<List<CalendarEvent>> = _calendarEvents.asStateFlow()

    // ==========================================
    // SOLICITUDES - Mes independiente
    // ==========================================

    private val _requestsMonth = MutableStateFlow(YearMonth.now())
    val requestsMonth: StateFlow<YearMonth> = _requestsMonth.asStateFlow()

    private val _monthRequests = MutableStateFlow<List<RequestItem>>(emptyList())
    val monthRequests: StateFlow<List<RequestItem>> = _monthRequests.asStateFlow()

    // ==========================================
    // CAMBIOS DE GUARDIA - Mes independiente
    // ==========================================

    private val _shiftChangesMonth = MutableStateFlow(YearMonth.now())
    val shiftChangesMonth: StateFlow<YearMonth> = _shiftChangesMonth.asStateFlow()

    private val _monthShiftChanges = MutableStateFlow<List<ShiftChangeRequest>>(emptyList())
    val monthShiftChanges: StateFlow<List<ShiftChangeRequest>> = _monthShiftChanges.asStateFlow()

    // ==========================================
    // HORAS EXTRA - Mes independiente
    // ==========================================

    private val _extraHoursMonth = MutableStateFlow(YearMonth.now())
    val extraHoursMonth: StateFlow<YearMonth> = _extraHoursMonth.asStateFlow()

    private val _monthExtraHours = MutableStateFlow<List<ExtraHour>>(emptyList())
    val monthExtraHours: StateFlow<List<ExtraHour>> = _monthExtraHours.asStateFlow()

    // ==========================================
    // RESUMEN ECONÓMICO - Mes independiente
    // ==========================================

    private val _salaryMonth = MutableStateFlow(YearMonth.now())
    val salaryMonth: StateFlow<YearMonth> = _salaryMonth.asStateFlow()

    private val _monthGuards = MutableStateFlow<List<Guard>>(emptyList())
    val monthGuards: StateFlow<List<Guard>> = _monthGuards.asStateFlow()

    private val _totalSalary = MutableStateFlow(0.0)
    val totalSalary: StateFlow<Double> = _totalSalary.asStateFlow()

    // ==========================================
    // BRIGADAS Y ASIGNACIONES
    // ==========================================

    private val _brigades = MutableStateFlow<Map<Int, Brigade>>(emptyMap())
    private val _userAssignments = MutableStateFlow<List<FirefighterAssignment>>(emptyList())

    // ==========================================
    // CAMBIO DE CONTRASEÑA
    // ==========================================

    private val _passwordState = MutableStateFlow(PasswordState())
    val passwordState: StateFlow<PasswordState> = _passwordState.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // ==========================================
    // SEALED CLASSES Y DATA CLASSES
    // ==========================================

    sealed class ProfileUiState {
        object Loading : ProfileUiState()
        object Success : ProfileUiState()
        data class Error(val message: String) : ProfileUiState()
    }

    data class CalendarEvent(
        val date: LocalDate,
        val type: EventType,
        val label: String,
        val color: EventColor,
        val brigadeId: Int? = null
    )

    enum class EventType {
        GUARD,          // Guardia normal
        GUARD_REQ,      // Guardia de requerimiento
        REQUEST,        // Solicitud confirmada
        SHIFT_CHANGE    // Cambio de guardia
    }

    enum class EventColor(val colorHex: String, val textColorHex: String) {
        BRIGADE_A("#22C55E", "#FFFFFF"),      // Verde
        BRIGADE_B("#F4F4F5", "#1F2937"),      // Blanco/Gris claro
        BRIGADE_C("#3B82F6", "#FFFFFF"),      // Azul
        BRIGADE_D("#DC2626", "#FFFFFF"),      // Rojo
        BRIGADE_E("#FDE047", "#1F2937"),      // Amarillo
        BRIGADE_F("#1F2937", "#FFFFFF"),      // Negro (Brigada F)
        VACATION("#EF4444", "#FFFFFF"),       // Rojo - Vacaciones
        PERMISSION("#F97316", "#FFFFFF"),     // Naranja - Permisos
        SICK_LEAVE("#6B7280", "#FFFFFF"),     // Gris - Baja médica
        SHIFT_CHANGE("#8B5CF6", "#FFFFFF"),   // Púrpura - Cambio guardia
        REQUIREMENT("#A855F7", "#FFFFFF"),    // Púrpura claro - Requerimiento
        DEFAULT("#94A3B8", "#FFFFFF")         // Gris
    }

    data class PasswordState(
        val currentPassword: String = "",
        val newPassword: String = "",
        val confirmPassword: String = "",
        val isLoading: Boolean = false,
        val error: String? = null,
        val success: String? = null
    )

    data class PermissionStat(
        val label: String,
        val value: String,
        val helper: String? = null
    )

    data class LegendItem(
        val label: String,
        val color: EventColor
    )

    // ==========================================
    // CARGA INICIAL
    // ==========================================

    fun loadProfile(currentUser: User?) {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            Log.d(TAG, "=== CARGANDO PERFIL ===")

            try {
                if (currentUser == null) {
                    _uiState.value = ProfileUiState.Error("Usuario no disponible")
                    return@launch
                }

                _user.value = currentUser
                Log.d(TAG, "✅ Usuario: ${currentUser.nombreCompleto}")

                // Cargar brigadas
                loadBrigades()

                // Cargar asignaciones del usuario
                loadUserAssignments(currentUser.id_empleado)

                // Cargar todos los datos de cada sección
                loadCalendarData(currentUser.id_empleado)
                loadRequestsData(currentUser.id_empleado)
                loadShiftChangesData(currentUser.id_empleado)
                loadExtraHoursData(currentUser.id_empleado)
                loadSalaryData(currentUser.id_empleado)

                _uiState.value = ProfileUiState.Success
            } catch (e: Exception) {
                Log.e(TAG, "❌ Excepción: ${e.message}")
                _uiState.value = ProfileUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    private suspend fun loadBrigades() {
        val result = brigadesRepository.getAllBrigades()
        result.onSuccess { brigadeList ->
            _brigades.value = brigadeList.associateBy { it.id_brigada }
            Log.d(TAG, "✅ ${brigadeList.size} brigadas cargadas")
        }
    }

    private suspend fun loadUserAssignments(userId: Int) {
        val result = assignmentsRepository.getAssignments()
        result.onSuccess { allAssignments ->
            _userAssignments.value = allAssignments.filter { it.id_empleado == userId }
            Log.d(TAG, "✅ ${_userAssignments.value.size} asignaciones del usuario")
        }
    }

    // ==========================================
    // CALENDARIO
    // ==========================================

    private suspend fun loadCalendarData(userId: Int) {
        val month = _calendarMonth.value
        val events = mutableListOf<CalendarEvent>()

        // Filtrar asignaciones de guardia
        val guardAssignments = _userAssignments.value.filter {
            BRIGADAS_GUARDIA.contains(it.id_brigada_destino)
        }

        // Cargar guardias para las brigadas asignadas
        val brigadeIds = guardAssignments.map { it.id_brigada_destino }.distinct()
        if (brigadeIds.isNotEmpty()) {
            val guardsResult = guardsRepository.getGuardsByDateRange(
                brigadeIds = brigadeIds,
                startDate = month.atDay(1).toString(),
                endDate = month.atEndOfMonth().toString()
            )

            guardsResult.onSuccess { guards ->
                guards.forEach { guard ->
                    val guardDate = LocalDate.parse(guard.date)
                    val assignment = findAssignmentForDate(guardAssignments, guardDate, guard.id_brigada)

                    if (assignment != null) {
                        val isRequerimiento = assignment.requerimiento == true
                        val color = if (isRequerimiento) {
                            EventColor.REQUIREMENT
                        } else {
                            getBrigadeColor(guard.id_brigada)
                        }

                        val brigadeName = _brigades.value[guard.id_brigada]?.nombre ?: "Guardia"
                        val label = getBrigadeShortName(brigadeName)

                        events.add(CalendarEvent(
                            date = guardDate,
                            type = if (isRequerimiento) EventType.GUARD_REQ else EventType.GUARD,
                            label = label,
                            color = color,
                            brigadeId = guard.id_brigada
                        ))
                    }
                }
            }
        }

        // Cargar solicitudes confirmadas
        val requestsResult = requestsRepository.getRequests()
        requestsResult.onSuccess { allRequests ->
            val confirmedRequests = allRequests.filter {
                it.id_empleado == userId && it.estado.lowercase() == "confirmada"
            }

            confirmedRequests.forEach { request ->
                val startDate = parseDate(request.fecha_ini)
                val endDate = parseDate(request.fecha_fin)

                if (startDate != null) {
                    val end = endDate ?: startDate
                    var currentDate: LocalDate = startDate

                    while (!currentDate.isAfter(end)) {
                        if (YearMonth.from(currentDate) == month) {
                            events.add(CalendarEvent(
                                date = currentDate,
                                type = EventType.REQUEST,
                                label = getRequestShortLabel(request.tipo),
                                color = getRequestColor(request.tipo)
                            ))
                        }
                        currentDate = currentDate.plusDays(1)
                    }
                }
            }
        }

        // Cargar cambios de guardia aceptados
        val shiftChangesResult = shiftChangeRepository.getShiftChangeRequests()
        shiftChangesResult.onSuccess { allChanges ->
            val confirmed = allChanges.filter {
                (it.id_empleado1 == userId || it.id_empleado2 == userId) &&
                        it.estado.lowercase() == "aceptado"
            }

            confirmed.forEach { change ->
                val date = parseDate(change.fecha)
                if (date != null && YearMonth.from(date) == month) {
                    events.add(CalendarEvent(
                        date = date,
                        type = EventType.SHIFT_CHANGE,
                        label = "CG",
                        color = EventColor.SHIFT_CHANGE
                    ))
                }
            }
        }

        _calendarEvents.value = events.sortedBy { it.date }
        Log.d(TAG, "📅 Calendario: ${events.size} eventos")
    }

    fun previousCalendarMonth() {
        _calendarMonth.value = _calendarMonth.value.minusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadCalendarData(user.id_empleado) }
        }
    }

    fun nextCalendarMonth() {
        _calendarMonth.value = _calendarMonth.value.plusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadCalendarData(user.id_empleado) }
        }
    }

    // ==========================================
    // SOLICITUDES
    // ==========================================

    private suspend fun loadRequestsData(userId: Int) {
        val month = _requestsMonth.value
        val requestsResult = requestsRepository.getRequests()

        requestsResult.onSuccess { allRequests ->
            _monthRequests.value = allRequests.filter { request ->
                request.id_empleado == userId &&
                        parseDate(request.fecha_ini)?.let { YearMonth.from(it) == month } == true
            }
            Log.d(TAG, "📋 Solicitudes: ${_monthRequests.value.size}")
        }
    }

    fun previousRequestsMonth() {
        _requestsMonth.value = _requestsMonth.value.minusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadRequestsData(user.id_empleado) }
        }
    }

    fun nextRequestsMonth() {
        _requestsMonth.value = _requestsMonth.value.plusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadRequestsData(user.id_empleado) }
        }
    }

    // ==========================================
    // CAMBIOS DE GUARDIA
    // ==========================================

    private suspend fun loadShiftChangesData(userId: Int) {
        val month = _shiftChangesMonth.value
        val result = shiftChangeRepository.getShiftChangeRequests()

        result.onSuccess { allChanges ->
            _monthShiftChanges.value = allChanges.filter { change ->
                (change.id_empleado1 == userId || change.id_empleado2 == userId) &&
                        parseDate(change.fecha)?.let { YearMonth.from(it) == month } == true
            }
            Log.d(TAG, "🔄 Cambios guardia: ${_monthShiftChanges.value.size}")
        }
    }

    fun previousShiftChangesMonth() {
        _shiftChangesMonth.value = _shiftChangesMonth.value.minusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadShiftChangesData(user.id_empleado) }
        }
    }

    fun nextShiftChangesMonth() {
        _shiftChangesMonth.value = _shiftChangesMonth.value.plusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadShiftChangesData(user.id_empleado) }
        }
    }

    // ==========================================
    // HORAS EXTRA
    // ==========================================

    private suspend fun loadExtraHoursData(userId: Int) {
        val month = _extraHoursMonth.value
        val monthStr = "${month.year}-${month.monthValue.toString().padStart(2, '0')}"

        val result = extraHoursRepository.getAllExtraHours()

        result.onSuccess { allHours ->
            _monthExtraHours.value = allHours.filter { hour ->
                hour.id_empleado == userId &&
                        parseDate(hour.date)?.let { YearMonth.from(it) == month } == true
            }
            Log.d(TAG, "⏰ Horas extra: ${_monthExtraHours.value.size}")
        }
    }

    fun previousExtraHoursMonth() {
        _extraHoursMonth.value = _extraHoursMonth.value.minusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadExtraHoursData(user.id_empleado) }
        }
    }

    fun nextExtraHoursMonth() {
        _extraHoursMonth.value = _extraHoursMonth.value.plusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadExtraHoursData(user.id_empleado) }
        }
    }

    // Cálculos de horas extra
    fun getTotalDiurnas(): Double = _monthExtraHours.value.sumOf { it.horas_diurnas ?: 0.0 }
    fun getTotalNocturnas(): Double = _monthExtraHours.value.sumOf { it.horas_nocturnas ?: 0.0 }
    fun getTotalExtraHoursSalary(): Double = _monthExtraHours.value.sumOf { hour ->
        val diurnas = hour.horas_diurnas ?: 0.0
        val nocturnas = hour.horas_nocturnas ?: 0.0
        val precioDiurno = hour.salarie?.precio_diurno ?: 0.0
        val precioNocturno = hour.salarie?.precio_nocturno ?: 0.0
        (diurnas * precioDiurno) + (nocturnas * precioNocturno)
    }

    // ==========================================
    // RESUMEN ECONÓMICO (GUARDIAS)
    // ==========================================

    private suspend fun loadSalaryData(userId: Int) {
        val month = _salaryMonth.value

        // Filtrar asignaciones de guardia
        val guardAssignments = _userAssignments.value.filter {
            BRIGADAS_GUARDIA.contains(it.id_brigada_destino)
        }

        val brigadeIds = guardAssignments.map { it.id_brigada_destino }.distinct()
        if (brigadeIds.isEmpty()) {
            _monthGuards.value = emptyList()
            _totalSalary.value = 0.0
            return
        }

        val guardsResult = guardsRepository.getGuardsByDateRange(
            brigadeIds = brigadeIds,
            startDate = month.atDay(1).toString(),
            endDate = month.atEndOfMonth().toString()
        )

        guardsResult.onSuccess { guards ->
            // Filtrar guardias donde el usuario estaba asignado
            val validGuards = guards.filter { guard ->
                val guardDate = LocalDate.parse(guard.date)
                findAssignmentForDate(guardAssignments, guardDate, guard.id_brigada) != null
            }

            _monthGuards.value = validGuards
            _totalSalary.value = validGuards.sumOf { guard ->
                val salary = guard.salary
                if (salary != null) {
                    (salary.precio_diurno * salary.horas_diurnas) +
                            (salary.precio_nocturno * salary.horas_nocturnas)
                } else 0.0
            }
            Log.d(TAG, "💰 Guardias: ${validGuards.size}, Salario: ${_totalSalary.value}€")
        }
    }

    fun previousSalaryMonth() {
        _salaryMonth.value = _salaryMonth.value.minusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadSalaryData(user.id_empleado) }
        }
    }

    fun nextSalaryMonth() {
        _salaryMonth.value = _salaryMonth.value.plusMonths(1)
        _user.value?.let { user ->
            viewModelScope.launch { loadSalaryData(user.id_empleado) }
        }
    }

    // ==========================================
    // CAMBIO DE CONTRASEÑA
    // ==========================================

    fun updateCurrentPassword(value: String) {
        _passwordState.value = _passwordState.value.copy(currentPassword = value, error = null)
    }

    fun updateNewPassword(value: String) {
        _passwordState.value = _passwordState.value.copy(newPassword = value, error = null)
    }

    fun updateConfirmPassword(value: String) {
        _passwordState.value = _passwordState.value.copy(confirmPassword = value, error = null)
    }

    fun changePassword() {
        val state = _passwordState.value

        if (state.currentPassword.isBlank()) {
            _passwordState.value = state.copy(error = "Introduce tu contraseña actual")
            return
        }
        if (state.newPassword.length < 6) {
            _passwordState.value = state.copy(error = "La nueva contraseña debe tener al menos 6 caracteres")
            return
        }
        if (state.newPassword != state.confirmPassword) {
            _passwordState.value = state.copy(error = "Las contraseñas no coinciden")
            return
        }

        viewModelScope.launch {
            _passwordState.value = state.copy(isLoading = true, error = null)

            val user = _user.value ?: return@launch

            val result = usersRepository.updateUser(
                id = user.id_empleado,
                user = UpdateUserRequest(
                    current_password = state.currentPassword,
                    password = state.newPassword,
                    password_confirmation = state.confirmPassword
                )
            )

            result.fold(
                onSuccess = {
                    _passwordState.value = PasswordState(success = "Contraseña actualizada correctamente")
                    _successMessage.value = "Contraseña actualizada"
                },
                onFailure = { error ->
                    _passwordState.value = _passwordState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Error al cambiar contraseña"
                    )
                }
            )
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

    fun getPermissionStats(): List<PermissionStat> {
        val user = _user.value ?: return emptyList()

        return listOf(
            PermissionStat("Vacaciones", "${user.vacaciones ?: 0} días"),
            PermissionStat("Asuntos Propios", "${user.AP ?: 0} jornadas"),
            PermissionStat("Salidas Personales", "${user.SP ?: 0} horas"),
            PermissionStat("Horas Sindicales", "${user.horas_sindicales ?: 0} horas"),
            PermissionStat("Módulos", "${user.modulo ?: 0} días"),
            PermissionStat("Comp. Grupos", "${user.compensacion_grupos ?: 0} jornadas")
        )
    }

    private fun findAssignmentForDate(
        assignments: List<FirefighterAssignment>,
        date: LocalDate,
        brigadeId: Int
    ): FirefighterAssignment? {
        return assignments.find { assignment ->
            val startDate = parseDate(assignment.fecha_ini)
            assignment.id_brigada_destino == brigadeId &&
                    startDate != null &&
                    !startDate.isAfter(date)
        }
    }

    private fun parseDate(dateString: String?): LocalDate? {
        if (dateString == null) return null
        return try {
            LocalDate.parse(dateString.substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE)
        } catch (e: Exception) {
            null
        }
    }

    private fun getBrigadeColor(brigadeId: Int): EventColor {
        val brigade = _brigades.value[brigadeId]
        val name = brigade?.nombre?.lowercase() ?: ""

        return when {
            name.contains("brigada a") -> EventColor.BRIGADE_A
            name.contains("brigada b") -> EventColor.BRIGADE_B
            name.contains("brigada c") -> EventColor.BRIGADE_C
            name.contains("brigada d") -> EventColor.BRIGADE_D
            name.contains("brigada e") -> EventColor.BRIGADE_E
            name.contains("brigada f") -> EventColor.BRIGADE_F
            else -> EventColor.DEFAULT
        }
    }

    private fun getBrigadeShortName(brigadeName: String): String {
        return when {
            brigadeName.contains("Brigada A", ignoreCase = true) -> "A"
            brigadeName.contains("Brigada B", ignoreCase = true) -> "B"
            brigadeName.contains("Brigada C", ignoreCase = true) -> "C"
            brigadeName.contains("Brigada D", ignoreCase = true) -> "D"
            brigadeName.contains("Brigada E", ignoreCase = true) -> "E"
            brigadeName.contains("Brigada F", ignoreCase = true) -> "F"
            brigadeName.contains("GREPS", ignoreCase = true) -> "GREPS"
            brigadeName.contains("GRAFOR", ignoreCase = true) -> "GRAFOR"
            else -> brigadeName.take(3)
        }
    }

    private fun getRequestColor(tipo: String?): EventColor {
        return when (tipo?.lowercase()) {
            "vacaciones" -> EventColor.VACATION
            "baja medica", "baja" -> EventColor.SICK_LEAVE
            else -> EventColor.PERMISSION
        }
    }

    private fun getRequestShortLabel(tipo: String?): String {
        return when (tipo?.lowercase()) {
            "vacaciones" -> "VAC"
            "asuntos propios" -> "AP"
            "salidas personales" -> "SP"
            "baja medica", "baja" -> "BAJA"
            "modulo" -> "MOD"
            "horas sindicales" -> "HS"
            "compensacion grupos especiales" -> "CGE"
            else -> tipo?.take(3)?.uppercase() ?: "?"
        }
    }

    fun getEventForDate(date: LocalDate): CalendarEvent? {
        val events = _calendarEvents.value.filter { it.date == date }
        return events.find { it.type == EventType.REQUEST }
            ?: events.find { it.type == EventType.SHIFT_CHANGE }
            ?: events.firstOrNull()
    }

    fun getCalendarLegend(): List<LegendItem> {
        return listOf(
            LegendItem("Brigada A", EventColor.BRIGADE_A),
            LegendItem("Brigada B", EventColor.BRIGADE_B),
            LegendItem("Brigada C", EventColor.BRIGADE_C),
            LegendItem("Brigada D", EventColor.BRIGADE_D),
            LegendItem("Brigada E", EventColor.BRIGADE_E),
            LegendItem("Brigada F", EventColor.BRIGADE_F),
            LegendItem("Vacaciones", EventColor.VACATION),
            LegendItem("Permisos", EventColor.PERMISSION),
            LegendItem("Baja médica", EventColor.SICK_LEAVE),
            LegendItem("Cambio guardia", EventColor.SHIFT_CHANGE),
            LegendItem("Requerimiento", EventColor.REQUIREMENT)
        )
    }

    fun formatEstado(estado: String): String {
        return when (estado.lowercase()) {
            "en_tramite" -> "En Trámite"
            "aceptado_por_empleados" -> "Aceptado por Empleados"
            "aceptado" -> "Aceptado"
            "rechazado" -> "Rechazado"
            "pendiente" -> "Pendiente"
            "confirmada" -> "Confirmada"
            "cancelada" -> "Cancelada"
            "denegada" -> "Denegada"
            else -> estado
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun clearSuccess() {
        _successMessage.value = null
    }

    fun clearPasswordMessages() {
        _passwordState.value = _passwordState.value.copy(error = null, success = null)
    }
}