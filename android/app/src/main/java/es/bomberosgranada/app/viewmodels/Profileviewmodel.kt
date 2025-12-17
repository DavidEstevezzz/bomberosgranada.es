package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.*
import es.bomberosgranada.app.data.repositories.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

/**
 * ViewModel para la pantalla de Perfil - VERSIÓN OPTIMIZADA
 *
 * Optimizaciones:
 * 1. Carga datos UNA sola vez y los cachea
 * 2. Filtrado local por mes (sin llamadas API al navegar)
 * 3. Carga paralela con async/await
 * 4. Evita duplicación de llamadas
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

        // Prioridad de turnos: Noche > Tarde > Mañana (igual que en React)
        // Un índice menor significa mayor prioridad
        private val TURN_PRIORITY = listOf("Noche", "Tarde", "Mañana")
    }

    // ==========================================
    // ESTADOS UI
    // ==========================================

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    // ==========================================
    // CACHE DE DATOS (cargados una sola vez)
    // ==========================================

    private val _brigadesMap = MutableStateFlow<Map<Int, Brigade>>(emptyMap())
    val brigadesMap: StateFlow<Map<Int, Brigade>> = _brigadesMap.asStateFlow()

    private val _userAssignments = MutableStateFlow<List<FirefighterAssignment>>(emptyList())
    val userAssignments: StateFlow<List<FirefighterAssignment>> = _userAssignments.asStateFlow()

    // Cache de TODOS los datos del usuario (se cargan una vez)
    private var allUserRequests: List<RequestItem> = emptyList()
    private var allUserShiftChanges: List<ShiftChangeRequest> = emptyList()
    private var allUserExtraHours: List<ExtraHour> = emptyList()
    private var allGuards: List<Guard> = emptyList()

    // Flag para evitar recargas
    private var dataLoaded = false

    // ==========================================
    // CALENDARIO - Mes independiente
    // ==========================================

    private val _calendarMonth = MutableStateFlow(YearMonth.now())
    val calendarMonth: StateFlow<YearMonth> = _calendarMonth.asStateFlow()

    private val _calendarGuards = MutableStateFlow<List<Guard>>(emptyList())
    val calendarGuards: StateFlow<List<Guard>> = _calendarGuards.asStateFlow()

    private val _calendarRequests = MutableStateFlow<List<RequestItem>>(emptyList())
    val calendarRequests: StateFlow<List<RequestItem>> = _calendarRequests.asStateFlow()

    private val _calendarShiftChanges = MutableStateFlow<List<ShiftChangeRequest>>(emptyList())
    val calendarShiftChanges: StateFlow<List<ShiftChangeRequest>> = _calendarShiftChanges.asStateFlow()

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
    // CAMBIO DE CONTRASEÑA
    // ==========================================

    private val _isChangingPassword = MutableStateFlow(false)
    val isChangingPassword: StateFlow<Boolean> = _isChangingPassword.asStateFlow()

    private val _passwordChangeSuccess = MutableStateFlow<String?>(null)
    val passwordChangeSuccess: StateFlow<String?> = _passwordChangeSuccess.asStateFlow()

    private val _passwordChangeError = MutableStateFlow<String?>(null)
    val passwordChangeError: StateFlow<String?> = _passwordChangeError.asStateFlow()

    // ==========================================
    // MENSAJES
    // ==========================================

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    init {
        Log.d(TAG, "ProfileViewModel inicializado")
    }

    // ==========================================
    // CARGA DE DATOS - OPTIMIZADA
    // ==========================================

    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    /**
     * Carga todos los datos del perfil UNA SOLA VEZ
     * Usa carga paralela para mejorar rendimiento
     */
    fun loadProfile(currentUser: User) {
        // Evitar recargas innecesarias
        if (dataLoaded && _user.value?.id_empleado == currentUser.id_empleado) {
            Log.d(TAG, "Datos ya cargados, usando cache")
            return
        }

        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            Log.d(TAG, "Cargando perfil para usuario: ${currentUser.id_empleado}")

            try {
                _user.value = currentUser

                // CARGA PARALELA de todos los datos
                val brigadesDeferred = async { brigadesRepository.getAllBrigades() }
                val assignmentsDeferred = async { assignmentsRepository.getAssignments() }
                val requestsDeferred = async { requestsRepository.getRequests() }
                val changesDeferred = async { shiftChangeRepository.getShiftChangeRequests() }
                val extraHoursDeferred = async { extraHoursRepository.getAllExtraHours() }

                // Esperar brigadas primero (necesarias para guardias)
                val brigadesResult = brigadesDeferred.await()
                brigadesResult.fold(
                    onSuccess = { brigades ->
                        _brigadesMap.value = brigades.associateBy { it.id_brigada }
                        Log.d(TAG, "✅ Brigadas: ${brigades.size}")
                    },
                    onFailure = { Log.e(TAG, "❌ Error brigadas: ${it.message}") }
                )

                // Cargar guardias del mes actual (esto sí necesita rango de fechas)
                loadGuardsForMonth(_calendarMonth.value)

                // Procesar asignaciones
                val assignmentsResult = assignmentsDeferred.await()
                assignmentsResult.fold(
                    onSuccess = { assignments ->
                        _userAssignments.value = assignments.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        Log.d(TAG, "✅ Asignaciones usuario: ${_userAssignments.value.size}")
                    },
                    onFailure = { Log.e(TAG, "❌ Error asignaciones: ${it.message}") }
                )

                // Procesar solicitudes - CACHEAR TODAS
                val requestsResult = requestsDeferred.await()
                requestsResult.fold(
                    onSuccess = { requests ->
                        allUserRequests = requests.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        Log.d(TAG, "✅ Total solicitudes usuario: ${allUserRequests.size}")

                        // Filtrar para calendario (confirmadas)
                        _calendarRequests.value = allUserRequests.filter {
                            it.estado.lowercase() == "confirmada"
                        }

                        // Filtrar para sección del mes actual
                        filterRequestsByMonth(_requestsMonth.value)
                    },
                    onFailure = { Log.e(TAG, "❌ Error solicitudes: ${it.message}") }
                )

                // Procesar cambios de guardia - CACHEAR TODOS
                val changesResult = changesDeferred.await()
                changesResult.fold(
                    onSuccess = { changes ->
                        allUserShiftChanges = changes.filter { change ->
                            change.id_empleado1 == currentUser.id_empleado ||
                                    change.id_empleado2 == currentUser.id_empleado
                        }
                        Log.d(TAG, "✅ Total cambios usuario: ${allUserShiftChanges.size}")

                        // Filtrar para calendario (aceptados)
                        _calendarShiftChanges.value = allUserShiftChanges.filter {
                            it.estado.lowercase() == "aceptado"
                        }

                        // Filtrar para sección del mes actual
                        filterShiftChangesByMonth(_shiftChangesMonth.value)
                    },
                    onFailure = { Log.e(TAG, "❌ Error cambios: ${it.message}") }
                )

                // Procesar horas extra - CACHEAR TODAS
                val extraHoursResult = extraHoursDeferred.await()
                extraHoursResult.fold(
                    onSuccess = { hours ->
                        allUserExtraHours = hours.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        Log.d(TAG, "✅ Total horas extra usuario: ${allUserExtraHours.size}")

                        // Filtrar para sección del mes actual
                        filterExtraHoursByMonth(_extraHoursMonth.value)
                    },
                    onFailure = { Log.e(TAG, "❌ Error horas extra: ${it.message}") }
                )

                dataLoaded = true
                _uiState.value = ProfileUiState.Success

            } catch (e: Exception) {
                Log.e(TAG, "Error cargando perfil: ${e.message}", e)
                _uiState.value = ProfileUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    /**
     * Carga guardias para un mes específico (requiere llamada API por rango)
     */
    private suspend fun loadGuardsForMonth(month: YearMonth) {
        val brigadeIds = _brigadesMap.value.keys.toList()
        if (brigadeIds.isEmpty()) {
            Log.w(TAG, "No hay brigadas para cargar guardias")
            return
        }

        val startDate = month.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        val endDate = month.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE)

        val result = guardsRepository.getGuardsByDateRange(
            brigadeIds = brigadeIds,
            startDate = startDate,
            endDate = endDate
        )

        result.fold(
            onSuccess = { guards ->
                allGuards = guards
                _calendarGuards.value = guards
                Log.d(TAG, "✅ Guardias mes $month: ${guards.size}")
            },
            onFailure = { Log.e(TAG, "❌ Error guardias: ${it.message}") }
        )
    }

    // ==========================================
    // FILTRADO LOCAL (sin llamadas API)
    // ==========================================

    private fun filterRequestsByMonth(month: YearMonth) {
        _monthRequests.value = allUserRequests.filter { req ->
            try {
                val date = LocalDate.parse(req.fecha_ini, dateFormatter)
                YearMonth.from(date) == month
            } catch (e: Exception) {
                false
            }
        }.sortedByDescending { it.fecha_ini }
    }

    private fun filterShiftChangesByMonth(month: YearMonth) {
        _monthShiftChanges.value = allUserShiftChanges.filter { change ->
            try {
                val date = LocalDate.parse(change.fecha, dateFormatter)
                YearMonth.from(date) == month
            } catch (e: Exception) {
                false
            }
        }.sortedByDescending { it.fecha }
    }

    private fun filterExtraHoursByMonth(month: YearMonth) {
        _monthExtraHours.value = allUserExtraHours.filter { hour ->
            try {
                val date = LocalDate.parse(hour.date, dateFormatter)
                YearMonth.from(date) == month
            } catch (e: Exception) {
                false
            }
        }.sortedByDescending { it.date }
    }

    // ==========================================
    // NAVEGACIÓN DE MESES - SIN LLAMADAS API
    // ==========================================

    fun previousCalendarMonth(currentUser: User) {
        _calendarMonth.value = _calendarMonth.value.minusMonths(1)
        // Solo guardias necesitan recarga (por rango de fechas en API)
        viewModelScope.launch { loadGuardsForMonth(_calendarMonth.value) }
    }

    fun nextCalendarMonth(currentUser: User) {
        _calendarMonth.value = _calendarMonth.value.plusMonths(1)
        viewModelScope.launch { loadGuardsForMonth(_calendarMonth.value) }
    }

    // Estas NO hacen llamadas API - solo filtran datos cacheados
    fun previousRequestsMonth(currentUser: User) {
        _requestsMonth.value = _requestsMonth.value.minusMonths(1)
        filterRequestsByMonth(_requestsMonth.value)
    }

    fun nextRequestsMonth(currentUser: User) {
        _requestsMonth.value = _requestsMonth.value.plusMonths(1)
        filterRequestsByMonth(_requestsMonth.value)
    }

    fun previousShiftChangesMonth(currentUser: User) {
        _shiftChangesMonth.value = _shiftChangesMonth.value.minusMonths(1)
        filterShiftChangesByMonth(_shiftChangesMonth.value)
    }

    fun nextShiftChangesMonth(currentUser: User) {
        _shiftChangesMonth.value = _shiftChangesMonth.value.plusMonths(1)
        filterShiftChangesByMonth(_shiftChangesMonth.value)
    }

    fun previousExtraHoursMonth(currentUser: User) {
        _extraHoursMonth.value = _extraHoursMonth.value.minusMonths(1)
        filterExtraHoursByMonth(_extraHoursMonth.value)
    }

    fun nextExtraHoursMonth(currentUser: User) {
        _extraHoursMonth.value = _extraHoursMonth.value.plusMonths(1)
        filterExtraHoursByMonth(_extraHoursMonth.value)
    }

    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    fun getTotalDiurnas(): Double {
        return _monthExtraHours.value.sumOf { it.horas_diurnas.toDouble() }
    }

    fun getTotalNocturnas(): Double {
        return _monthExtraHours.value.sumOf { it.horas_nocturnas.toDouble() }
    }

    fun getTotalExtraHoursSalary(): Double {
        var total = 0.0
        for (hour in _monthExtraHours.value) {
            val diurnas = hour.horas_diurnas.toDouble()
            val nocturnas = hour.horas_nocturnas.toDouble()
            val precioDiurno = hour.salarie?.precio_diurno ?: 0.0
            val precioNocturno = hour.salarie?.precio_nocturno ?: 0.0
            total += (diurnas * precioDiurno) + (nocturnas * precioNocturno)
        }
        return total
    }

    fun getPermissionStats(user: User): List<PermissionStat> {
        return listOf(
            PermissionStat(label = "Vacaciones", value = "${user.vacaciones ?: 0}", unit = "días"),
            PermissionStat(label = "Asuntos Propios", value = "${user.AP ?: 0}", unit = "jornadas"),
            PermissionStat(label = "Salidas Personales", value = "${user.SP ?: 0}", unit = "horas"),
            PermissionStat(label = "Horas Sindicales", value = "${user.horas_sindicales ?: 0}", unit = "horas"),
            PermissionStat(label = "Módulos", value = "${user.modulo ?: 0}", unit = "días"),
            PermissionStat(label = "Comp. Grupos", value = "${user.compensacion_grupos ?: 0}", unit = "jornadas")
        )
    }

    fun getRequestsStats(): RequestsStats {
        val requests = _monthRequests.value
        return RequestsStats(
            total = requests.size,
            confirmed = requests.count { it.estado.lowercase() == "confirmada" },
            pending = requests.count { it.estado.lowercase() == "pendiente" },
            cancelled = requests.count { it.estado.lowercase() == "cancelada" },
            rejected = requests.count { it.estado.lowercase() == "rechazada" }
        )
    }

    fun getShiftChangesStats(): ShiftChangesStats {
        val changes = _monthShiftChanges.value
        return ShiftChangesStats(
            total = changes.size,
            accepted = changes.count { it.estado.lowercase() == "aceptado" },
            pending = changes.count { it.estado.lowercase() == "pendiente" },
            rejected = changes.count { it.estado.lowercase() == "rechazado" },
            simple = changes.count { it.fecha2.isNullOrEmpty() },
            mirror = changes.count { !it.fecha2.isNullOrEmpty() }
        )
    }

    // ==========================================
    // EVENTOS DEL CALENDARIO
    // ==========================================

    fun getEventForDate(date: LocalDate, currentUser: User): CalendarEvent? {
        val dateStr = date.format(dateFormatter)

        // 1. Solicitudes confirmadas (prioridad máxima - días libres)
        val request = _calendarRequests.value.find { req ->
            try {
                val fechaIni = LocalDate.parse(req.fecha_ini, dateFormatter)
                val fechaFin = req.fecha_fin?.let { LocalDate.parse(it, dateFormatter) } ?: fechaIni
                !date.isBefore(fechaIni) && !date.isAfter(fechaFin)
            } catch (e: Exception) {
                false
            }
        }
        if (request != null) {
            return CalendarEvent(
                type = CalendarEventType.REQUEST,
                label = getRequestShortLabel(request.tipo),
                color = getRequestEventColor(request.tipo)
            )
        }

        // 2. Cambios de guardia aceptados
        val change = _calendarShiftChanges.value.find { it.fecha == dateStr || it.fecha2 == dateStr }
        if (change != null) {
            val isMyGuard = (change.id_empleado1 == currentUser.id_empleado && change.fecha == dateStr) ||
                    (change.id_empleado2 == currentUser.id_empleado && change.fecha2 == dateStr)
            return CalendarEvent(
                type = if (isMyGuard) CalendarEventType.SHIFT_CHANGE_WORK else CalendarEventType.SHIFT_CHANGE_FREE,
                label = if (isMyGuard) "CG" else "Libre",
                color = if (isMyGuard) EventColor.SHIFT_CHANGE_WORK else EventColor.BRIGADE_B
            )
        }

        // 3. Guardia normal
        val guard = _calendarGuards.value.find { it.date == dateStr }
        if (guard != null) {
            val brigade = _brigadesMap.value[guard.id_brigada]
            val userBrigadeId = findUserBrigadeForDate(date)

            Log.d(TAG, "📅 Fecha: $dateStr | Guardia brigada: ${guard.id_brigada} | Usuario brigada: $userBrigadeId")

            if (userBrigadeId == guard.id_brigada) {
                return CalendarEvent(
                    type = CalendarEventType.GUARD,
                    label = brigade?.nombre ?: "G",
                    color = getBrigadeEventColor(brigade?.nombre ?: "")
                )
            }
        }

        return null
    }

    /**
     * Encuentra la brigada del usuario para una fecha específica.
     *
     * LÓGICA CORREGIDA (igual que React):
     * 1. Filtra asignaciones donde fecha_ini <= date (asignaciones que empiezan antes o en la fecha)
     * 2. Ordena por fecha descendente (más reciente primero)
     * 3. Para la misma fecha, ordena por prioridad de turno: Noche > Tarde > Mañana
     * 4. Devuelve la brigada destino de la primera asignación
     */
    private fun findUserBrigadeForDate(date: LocalDate): Int? {
        val dateStr = date.format(dateFormatter)

        // Filtrar asignaciones válidas para esta fecha
        val validAssignments = _userAssignments.value.filter { assignment ->
            try {
                val fechaIni = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                // La asignación es válida si empieza antes o en la fecha consultada
                !fechaIni.isAfter(date)
            } catch (e: Exception) {
                Log.e(TAG, "Error parseando fecha de asignación: ${assignment.fecha_ini}", e)
                false
            }
        }

        if (validAssignments.isEmpty()) {
            Log.d(TAG, "⚠️ No hay asignaciones válidas para fecha $dateStr")
            return null
        }

        // Ordenar: primero por fecha descendente, luego por prioridad de turno
        val sortedAssignments = validAssignments.sortedWith(
            compareByDescending<FirefighterAssignment> { assignment ->
                try {
                    LocalDate.parse(assignment.fecha_ini, dateFormatter)
                } catch (e: Exception) {
                    LocalDate.MIN
                }
            }.thenBy { assignment ->
                // Prioridad de turno: Noche (0) > Tarde (1) > Mañana (2)
                // Un índice menor = mayor prioridad
                val turno = assignment.turno ?: ""
                TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
            }
        )

        val bestAssignment = sortedAssignments.firstOrNull()

        if (bestAssignment != null) {
            Log.d(TAG, "✅ Mejor asignación para $dateStr: brigada=${bestAssignment.id_brigada_destino}, " +
                    "fecha_ini=${bestAssignment.fecha_ini}, turno=${bestAssignment.turno}")
        }

        return bestAssignment?.id_brigada_destino
    }

    private fun getRequestShortLabel(tipo: String): String {
        return when (tipo.lowercase()) {
            "vacaciones" -> "VAC"
            "asuntos propios" -> "AP"
            "baja" -> "BAJA"
            "salidas personales" -> "SP"
            "horas sindicales" -> "HS"
            "licencias por jornadas" -> "LIC"
            "modulo" -> "MOD"
            "compensacion grupos especiales" -> "CG"
            "vestuario" -> "VEST"
            else -> tipo.take(3).uppercase()
        }
    }

    private fun getRequestEventColor(tipo: String): EventColor {
        return when (tipo.lowercase()) {
            "vacaciones" -> EventColor.VACACIONES
            "asuntos propios" -> EventColor.ASUNTOS_PROPIOS
            "baja" -> EventColor.BAJA
            "salidas personales" -> EventColor.SALIDAS_PERSONALES
            "horas sindicales" -> EventColor.HORAS_SINDICALES
            "licencias por jornadas" -> EventColor.LICENCIAS
            "modulo" -> EventColor.MODULO
            "compensacion grupos especiales" -> EventColor.COMPENSACION
            "vestuario" -> EventColor.VESTUARIO
            else -> EventColor.DEFAULT
        }
    }

    private fun getBrigadeEventColor(nombre: String): EventColor {
        return when (nombre.uppercase()) {
            "A" -> EventColor.BRIGADE_A
            "B" -> EventColor.BRIGADE_B
            "C" -> EventColor.BRIGADE_C
            "D" -> EventColor.BRIGADE_D
            "E" -> EventColor.BRIGADE_E
            "F" -> EventColor.BRIGADE_F
            else -> EventColor.DEFAULT
        }
    }

    fun getEstadoColor(estado: String): StatusColor {
        return when (estado.lowercase()) {
            "confirmada" -> StatusColor.CONFIRMADA
            "aceptado" -> StatusColor.ACEPTADO
            "pendiente" -> StatusColor.PENDIENTE
            "cancelada" -> StatusColor.CANCELADA
            "rechazada" -> StatusColor.RECHAZADA
            "rechazado" -> StatusColor.RECHAZADO
            else -> StatusColor.DEFAULT
        }
    }

    fun getCalendarLegend(): List<LegendItem> {
        return listOf(
            LegendItem("Brigada A", EventColor.BRIGADE_A),
            LegendItem("Brigada B", EventColor.BRIGADE_B),
            LegendItem("Brigada C", EventColor.BRIGADE_C),
            LegendItem("Brigada D", EventColor.BRIGADE_D),
            LegendItem("Brigada E", EventColor.BRIGADE_E),
            LegendItem("Brigada F", EventColor.BRIGADE_F),
            LegendItem("Vacaciones", EventColor.VACACIONES),
            LegendItem("Asuntos Propios", EventColor.ASUNTOS_PROPIOS),
            LegendItem("Baja", EventColor.BAJA),
            LegendItem("Cambio Guardia", EventColor.SHIFT_CHANGE_WORK),
        )
    }

    fun findAssignmentForDate(date: LocalDate, brigadeId: Int): FirefighterAssignment? {
        return _userAssignments.value.find { assignment ->
            assignment.id_brigada_destino == brigadeId &&
                    try {
                        val fechaIni = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                        val fechaFin = assignment.fecha_fin?.let { LocalDate.parse(it, dateFormatter) }

                        if (fechaFin != null) {
                            !date.isBefore(fechaIni) && !date.isAfter(fechaFin)
                        } else {
                            !date.isBefore(fechaIni)
                        }
                    } catch (e: Exception) {
                        false
                    }
        }
    }

    // ==========================================
    // CAMBIO DE CONTRASEÑA
    // ==========================================

    fun changePassword(
        currentUser: User,
        currentPassword: String,
        newPassword: String,
        confirmPassword: String
    ) {
        if (currentPassword.isBlank()) {
            _passwordChangeError.value = "Introduce tu contraseña actual"
            return
        }

        if (newPassword.length < 6) {
            _passwordChangeError.value = "La nueva contraseña debe tener al menos 6 caracteres"
            return
        }

        if (newPassword != confirmPassword) {
            _passwordChangeError.value = "Las contraseñas no coinciden"
            return
        }

        viewModelScope.launch {
            _isChangingPassword.value = true
            _passwordChangeError.value = null
            _passwordChangeSuccess.value = null

            val request = UpdateUserRequest(
                current_password = currentPassword,
                password = newPassword,
                password_confirmation = confirmPassword
            )

            val result = usersRepository.updateUser(currentUser.id_empleado, request)

            result.fold(
                onSuccess = {
                    _passwordChangeSuccess.value = "Contraseña actualizada correctamente"
                    Log.d(TAG, "✅ Contraseña actualizada")
                },
                onFailure = { error ->
                    _passwordChangeError.value = error.message ?: "Error al cambiar contraseña"
                    Log.e(TAG, "❌ Error cambiando contraseña: ${error.message}")
                }
            )

            _isChangingPassword.value = false
        }
    }

    // ==========================================
    // LIMPIEZA DE MENSAJES
    // ==========================================

    fun clearSuccessMessage() {
        _successMessage.value = null
    }

    fun clearErrorMessage() {
        _errorMessage.value = null
    }

    fun clearPasswordMessages() {
        _passwordChangeSuccess.value = null
        _passwordChangeError.value = null
    }
}

// ==========================================
// UI STATES & DATA CLASSES
// ==========================================

sealed class ProfileUiState {
    object Loading : ProfileUiState()
    object Success : ProfileUiState()
    data class Error(val message: String) : ProfileUiState()
}

data class PermissionStat(
    val label: String,
    val value: String,
    val unit: String
)

data class RequestsStats(
    val total: Int,
    val confirmed: Int,
    val pending: Int,
    val cancelled: Int,
    val rejected: Int
)

data class ShiftChangesStats(
    val total: Int,
    val accepted: Int,
    val pending: Int,
    val rejected: Int,
    val simple: Int,
    val mirror: Int
)

data class CalendarEvent(
    val type: CalendarEventType,
    val label: String,
    val color: EventColor
)

enum class CalendarEventType {
    GUARD,
    REQUEST,
    SHIFT_CHANGE_WORK,
    SHIFT_CHANGE_FREE
}

enum class EventColor(val hex: String) {
    BRIGADE_A("#22C55E"),  // Verde
    BRIGADE_B("#F8FAFC"),  // Blanco
    BRIGADE_C("#3B82F6"),  // Azul
    BRIGADE_D("#DC2626"),  // Rojo
    BRIGADE_E("#FDE047"),  // Amarillo
    BRIGADE_F("#000000"),  // Negro
    VACACIONES("#DC2626"),
    ASUNTOS_PROPIOS("#F97316"),
    BAJA("#6B7280"),
    SALIDAS_PERSONALES("#8B5CF6"),
    HORAS_SINDICALES("#F59E0B"),
    LICENCIAS("#EC4899"),
    MODULO("#14B8A6"),
    COMPENSACION("#F97316"),
    VESTUARIO("#6366F1"),
    SHIFT_CHANGE_WORK("#F97316"),
    DEFAULT("#64748B")
}

enum class StatusColor(val hex: String) {
    CONFIRMADA("#10B981"),
    ACEPTADO("#10B981"),
    PENDIENTE("#F59E0B"),
    CANCELADA("#6B7280"),
    RECHAZADA("#EF4444"),
    RECHAZADO("#EF4444"),
    DEFAULT("#64748B")
}

data class LegendItem(
    val label: String,
    val color: EventColor
)