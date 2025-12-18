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
 * ViewModel para la pantalla de Perfil - VERSIÓN CORREGIDA
 *
 * CORRECCIÓN PRINCIPAL: Replica EXACTAMENTE la lógica de React (UserGuardsCalendarPage.jsx):
 *
 * 1. Obtiene asignaciones efectivas = última asignación previa + asignaciones del mes
 * 2. Extrae brigadas únicas DE LAS ASIGNACIONES DEL USUARIO (no todas las brigadas)
 * 3. Obtiene guardias SOLO de esas brigadas
 * 4. Para cada guardia, usa findLastAssignment(date, requiredBrigada) para verificar
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
        private const val TAG_DEBUG = "ProfileVM_DEBUG"

        // Prioridad de turnos: Noche > Tarde > Mañana (igual que en React)
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

    // *** CLAVE: Cache de TODAS las asignaciones del usuario ***
    private var allUserAssignmentsCache: List<FirefighterAssignment> = emptyList()

    // *** CLAVE: Asignaciones efectivas para el mes actual (incluye última previa) ***
    // Convertido a StateFlow para que el UI pueda observar cambios
    private val _effectiveAssignments = MutableStateFlow<List<FirefighterAssignment>>(emptyList())
    private val effectiveAssignments: List<FirefighterAssignment>
        get() = _effectiveAssignments.value

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

    // Estado de carga del calendario
    private val _isCalendarLoading = MutableStateFlow(false)
    val isCalendarLoading: StateFlow<Boolean> = _isCalendarLoading.asStateFlow()

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

    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    init {
        Log.d(TAG, "ProfileViewModel inicializado")
    }

    // ==========================================
    // CARGA DE DATOS - OPTIMIZADA
    // ==========================================

    /**
     * Carga todos los datos del perfil UNA SOLA VEZ
     */
    fun loadProfile(currentUser: User) {
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

                // Esperar brigadas primero (para mapeo de nombres)
                val brigadesResult = brigadesDeferred.await()
                brigadesResult.fold(
                    onSuccess = { brigades ->
                        _brigadesMap.value = brigades.associateBy { it.id_brigada }
                        Log.d(TAG, "✅ Brigadas: ${brigades.size}")
                    },
                    onFailure = { Log.e(TAG, "❌ Error brigadas: ${it.message}") }
                )

                // Procesar asignaciones - GUARDAR TODAS EN CACHE (ANTES de cargar guardias)
                val assignmentsResult = assignmentsDeferred.await()
                assignmentsResult.fold(
                    onSuccess = { assignments ->
                        Log.d(TAG_DEBUG, "📋 Total asignaciones del API: ${assignments.size}")
                        Log.d(TAG_DEBUG, "📋 Usuario actual id_empleado: ${currentUser.id_empleado}")

                        // DEBUG: Mostrar algunos id_empleado de las asignaciones
                        val sampleIds = assignments.take(10).map { it.id_empleado }.distinct()
                        Log.d(TAG_DEBUG, "📋 Muestra de id_empleado en asignaciones: $sampleIds")

                        // Filtrar SOLO las asignaciones de este usuario
                        allUserAssignmentsCache = assignments.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        _userAssignments.value = allUserAssignmentsCache

                        Log.d(TAG_DEBUG, "✅ Asignaciones usuario (total): ${allUserAssignmentsCache.size}")

                        // DEBUG: Mostrar las últimas 20 asignaciones del usuario
                        if (allUserAssignmentsCache.isNotEmpty()) {
                            allUserAssignmentsCache.sortedByDescending { it.fecha_ini }.take(20).forEach { assignment ->
                                Log.d(TAG_DEBUG, "   📋 ${assignment.fecha_ini} | Brigada: ${assignment.id_brigada_destino} | Turno: ${assignment.turno}")
                            }
                        } else {
                            Log.w(TAG_DEBUG, "⚠️ NO HAY ASIGNACIONES PARA ESTE USUARIO (id=${currentUser.id_empleado})")
                        }
                    },
                    onFailure = { Log.e(TAG, "❌ Error asignaciones: ${it.message}") }
                )

                // Cargar guardias del mes actual (DESPUÉS de tener las asignaciones)
                loadGuardsForMonth(_calendarMonth.value)

                // Procesar solicitudes - CACHEAR TODAS
                val requestsResult = requestsDeferred.await()
                requestsResult.fold(
                    onSuccess = { requests ->
                        allUserRequests = requests.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        Log.d(TAG, "✅ Total solicitudes usuario: ${allUserRequests.size}")

                        _calendarRequests.value = allUserRequests.filter {
                            it.estado.lowercase() == "confirmada"
                        }

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

                        _calendarShiftChanges.value = allUserShiftChanges.filter {
                            it.estado.lowercase() == "aceptado"
                        }

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

    // ==========================================
    // CARGA DE GUARDIAS - LÓGICA DE REACT
    // ==========================================

    /**
     * Carga guardias para un mes específico.
     *
     * REPLICA LA LÓGICA DE REACT (UserGuardsCalendarPage.jsx):
     * 1. Calcula asignaciones efectivas (mes actual + última previa)
     * 2. Extrae brigadas ÚNICAS de esas asignaciones
     * 3. Obtiene guardias SOLO de esas brigadas
     */
    private suspend fun loadGuardsForMonth(month: YearMonth) {
        // 1. Calcular asignaciones efectivas para este mes
        calculateEffectiveAssignments(month)

        // 2. Extraer brigadas únicas DE LAS ASIGNACIONES (no todas las brigadas del sistema)
        val userBrigadeIds = effectiveAssignments
            .map { it.id_brigada_destino }
            .distinct()

        if (userBrigadeIds.isEmpty()) {
            Log.w(TAG_DEBUG, "⚠️ No hay brigadas en las asignaciones del usuario")
            _calendarGuards.value = emptyList()
            return
        }

        val startDate = month.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        val endDate = month.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE)

        Log.d(TAG_DEBUG, "📅 Cargando guardias para mes: $month ($startDate a $endDate)")
        Log.d(TAG_DEBUG, "   Brigadas del usuario: $userBrigadeIds")

        // 3. Obtener guardias SOLO de las brigadas del usuario
        val result = guardsRepository.getGuardsByDateRange(
            brigadeIds = userBrigadeIds,
            startDate = startDate,
            endDate = endDate
        )

        result.fold(
            onSuccess = { guards ->
                _calendarGuards.value = guards
                Log.d(TAG_DEBUG, "✅ Guardias obtenidas: ${guards.size}")

                // DEBUG: Mostrar las guardias
                guards.take(10).forEach { guard ->
                    val brigadeName = _brigadesMap.value[guard.id_brigada]?.nombre ?: "?"
                    Log.d(TAG_DEBUG, "   🛡️ ${guard.date} | Brigada: ${guard.id_brigada} ($brigadeName)")
                }
            },
            onFailure = { Log.e(TAG, "❌ Error guardias: ${it.message}") }
        )
    }

    /**
     * Calcula las asignaciones efectivas para un mes.
     *
     * REPLICA LA LÓGICA DE REACT:
     * - Asignaciones del mes actual
     * - + Última asignación PREVIA al mes (buscando hacia atrás)
     */
    private fun calculateEffectiveAssignments(month: YearMonth) {
        val monthStart = month.atDay(1)
        val monthEnd = month.atEndOfMonth()

        // 1. Asignaciones del mes actual
        val currentMonthAssignments = allUserAssignmentsCache.filter { assignment ->
            try {
                val assignmentDate = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                !assignmentDate.isBefore(monthStart) && !assignmentDate.isAfter(monthEnd)
            } catch (e: Exception) {
                false
            }
        }

        Log.d(TAG_DEBUG, "📅 Asignaciones del mes $month: ${currentMonthAssignments.size}")
        currentMonthAssignments.forEach { assignment ->
            Log.d(TAG_DEBUG, "   📋 ${assignment.fecha_ini} | Brigada: ${assignment.id_brigada_destino} | Turno: ${assignment.turno}")
        }

        // 2. Buscar la última asignación PREVIA al mes (igual que React)
        val lastAssignmentPrevMonth = findLastAssignmentBeforeDate(monthStart)

        if (lastAssignmentPrevMonth != null) {
            Log.d(TAG_DEBUG, "📅 Última asignación previa: ${lastAssignmentPrevMonth.fecha_ini} | Brigada: ${lastAssignmentPrevMonth.id_brigada_destino}")
            // Combinar: última previa + mes actual
            _effectiveAssignments.value = listOf(lastAssignmentPrevMonth) + currentMonthAssignments
        } else {
            Log.d(TAG_DEBUG, "⚠️ No se encontró asignación previa al mes $month")
            _effectiveAssignments.value = currentMonthAssignments
        }

        Log.d(TAG_DEBUG, "📅 Asignaciones efectivas totales: ${_effectiveAssignments.value.size}")
    }

    /**
     * Busca la última asignación antes de una fecha específica.
     * Ordena por fecha desc y luego por prioridad de turno.
     */
    private fun findLastAssignmentBeforeDate(date: LocalDate): FirefighterAssignment? {
        val previousAssignments = allUserAssignmentsCache.filter { assignment ->
            try {
                val assignmentDate = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                assignmentDate.isBefore(date)
            } catch (e: Exception) {
                false
            }
        }

        if (previousAssignments.isEmpty()) return null

        // Ordenar: fecha desc, luego prioridad de turno
        return previousAssignments.sortedWith(
            compareByDescending<FirefighterAssignment> { assignment ->
                try {
                    LocalDate.parse(assignment.fecha_ini, dateFormatter)
                } catch (e: Exception) {
                    LocalDate.MIN
                }
            }.thenBy { assignment ->
                val turno = assignment.turno ?: "Mañana"
                TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
            }
        ).firstOrNull()
    }

    // ==========================================
    // FILTRADO LOCAL
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
    // NAVEGACIÓN DE MESES
    // ==========================================

    fun previousCalendarMonth(currentUser: User) {
        viewModelScope.launch {
            _isCalendarLoading.value = true
            _calendarGuards.value = emptyList() // Limpiar guardias mientras carga
            _calendarMonth.value = _calendarMonth.value.minusMonths(1)

            // Recalcular asignaciones efectivas y luego cargar guardias
            calculateEffectiveAssignments(_calendarMonth.value)
            loadGuardsForMonthInternal(_calendarMonth.value)

            _isCalendarLoading.value = false
        }
    }

    fun nextCalendarMonth(currentUser: User) {
        viewModelScope.launch {
            _isCalendarLoading.value = true
            _calendarGuards.value = emptyList() // Limpiar guardias mientras carga
            _calendarMonth.value = _calendarMonth.value.plusMonths(1)

            // Recalcular asignaciones efectivas y luego cargar guardias
            calculateEffectiveAssignments(_calendarMonth.value)
            loadGuardsForMonthInternal(_calendarMonth.value)

            _isCalendarLoading.value = false
        }
    }

    /**
     * Carga guardias sin recalcular effectiveAssignments (para navegación)
     */
    private suspend fun loadGuardsForMonthInternal(month: YearMonth) {
        // Extraer brigadas únicas DE LAS ASIGNACIONES
        val userBrigadeIds = effectiveAssignments
            .map { it.id_brigada_destino }
            .distinct()

        if (userBrigadeIds.isEmpty()) {
            Log.w(TAG_DEBUG, "⚠️ No hay brigadas en las asignaciones del usuario para $month")
            _calendarGuards.value = emptyList()
            return
        }

        val startDate = month.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        val endDate = month.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE)

        Log.d(TAG_DEBUG, "📅 Cargando guardias para mes: $month ($startDate a $endDate)")
        Log.d(TAG_DEBUG, "   Brigadas del usuario: $userBrigadeIds")

        val result = guardsRepository.getGuardsByDateRange(
            brigadeIds = userBrigadeIds,
            startDate = startDate,
            endDate = endDate
        )

        result.fold(
            onSuccess = { guards ->
                _calendarGuards.value = guards
                Log.d(TAG_DEBUG, "✅ Guardias obtenidas: ${guards.size}")
            },
            onFailure = { Log.e(TAG, "❌ Error guardias: ${it.message}") }
        )
    }

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

    fun getTotalDiurnas(): Double {
        return _monthExtraHours.value.sumOf { (it.horas_diurnas ?: 0.0).toDouble() }
    }

    fun getTotalNocturnas(): Double {
        return _monthExtraHours.value.sumOf { (it.horas_nocturnas ?: 0.0).toDouble() }
    }

    // ==========================================
    // EVENTOS DEL CALENDARIO - LÓGICA DE REACT
    // ==========================================

    /**
     * Obtiene el evento para una fecha específica.
     *
     * REPLICA LA LÓGICA DE REACT (UserGuardsCalendarPage.jsx):
     * 1. Solicitudes confirmadas (prioridad máxima)
     * 2. Cambios de guardia aceptados
     * 3. Guardias: usa findLastAssignment(date, guard.id_brigada)
     *    - Si es requerimiento -> color verde
     */
    fun getEventForDate(date: LocalDate, currentUser: User): CalendarEvent? {
        // Si está cargando, no mostrar nada
        if (_isCalendarLoading.value) {
            return null
        }

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
            Log.d(TAG_DEBUG, "📅 $dateStr → Solicitud: ${request.tipo}")
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
            Log.d(TAG_DEBUG, "📅 $dateStr → Cambio guardia: ${if (isMyGuard) "trabajo" else "libre"}")
            return CalendarEvent(
                type = if (isMyGuard) CalendarEventType.SHIFT_CHANGE_WORK else CalendarEventType.SHIFT_CHANGE_FREE,
                label = if (isMyGuard) "CG" else "Libre",
                color = if (isMyGuard) EventColor.SHIFT_CHANGE_WORK else EventColor.BRIGADE_B
            )
        }

        // 3. Guardia normal - USANDO LÓGICA DE REACT
        val guard = _calendarGuards.value.find { it.date == dateStr }
        if (guard != null) {
            val brigade = _brigadesMap.value[guard.id_brigada]

            // *** CLAVE: Usar findLastAssignment con la brigada requerida (igual que React) ***
            val (lastAssignment, suffix) = findLastAssignment(date, guard.id_brigada)

            // Verificar si la última asignación coincide con la brigada de la guardia
            val isValid = lastAssignment != null && lastAssignment.id_brigada_destino == guard.id_brigada

            // Detectar si es requerimiento
            val isRequerimiento = lastAssignment?.requerimiento == true

            Log.d(TAG_DEBUG, "📅 $dateStr | Guardia: ${guard.id_brigada} (${brigade?.nombre}) | " +
                    "Última asig: ${lastAssignment?.id_brigada_destino} | Valid: $isValid | " +
                    "Req: $isRequerimiento | Suffix: $suffix")

            if (isValid) {
                // Crear etiqueta corta: "A", "B", "C", etc. + sufijo abreviado
                val shortBrigadeName = getShortBrigadeName(brigade?.nombre ?: "G")
                val shortSuffix = getShortSuffix(suffix)
                val label = if (shortSuffix.isNotEmpty()) {
                    "$shortBrigadeName ($shortSuffix)"
                } else {
                    shortBrigadeName
                }

                // Si es requerimiento -> color verde (REQUERIMIENTO)
                val color = if (isRequerimiento) {
                    EventColor.REQUERIMIENTO
                } else {
                    getBrigadeEventColor(brigade?.nombre ?: "")
                }

                return CalendarEvent(
                    type = CalendarEventType.GUARD,
                    label = label,
                    color = color,
                    isRequerimiento = isRequerimiento
                )
            }
        }

        return null
    }

    /**
     * Obtiene el nombre corto de la brigada (solo la letra)
     */
    private fun getShortBrigadeName(brigadeName: String): String {
        return when {
            brigadeName.contains("Brigada A", ignoreCase = true) -> "A"
            brigadeName.contains("Brigada B", ignoreCase = true) -> "B"
            brigadeName.contains("Brigada C", ignoreCase = true) -> "C"
            brigadeName.contains("Brigada D", ignoreCase = true) -> "D"
            brigadeName.contains("Brigada E", ignoreCase = true) -> "E"
            brigadeName.contains("Brigada F", ignoreCase = true) -> "F"
            brigadeName.contains(" A", ignoreCase = true) -> "A"
            brigadeName.contains(" B", ignoreCase = true) -> "B"
            brigadeName.contains(" C", ignoreCase = true) -> "C"
            brigadeName.contains(" D", ignoreCase = true) -> "D"
            brigadeName.contains(" E", ignoreCase = true) -> "E"
            brigadeName.contains(" F", ignoreCase = true) -> "F"
            else -> brigadeName.take(3)
        }
    }

    /**
     * Obtiene el sufijo abreviado
     */
    private fun getShortSuffix(suffix: String): String {
        return when (suffix.lowercase()) {
            "día completo" -> "DC"
            "tarde y noche" -> "TN"
            "mañana y tarde" -> "MT"
            "mañana" -> "M"
            "tarde" -> "T"
            "noche" -> "N"
            else -> if (suffix.length > 3) suffix.take(2) else suffix
        }
    }

    /**
     * Encuentra la última asignación válida para una fecha y brigada requerida.
     *
     * REPLICA EXACTAMENTE LA LÓGICA DE REACT (findLastAssignment en UserGuardsCalendarPage.jsx):
     *
     * 1. Si hay asignaciones del MISMO DÍA:
     *    - Si hay 1 sola: verificar si coincide con requiredBrigada
     *    - Si hay 2: lógica de turnos para determinar sufijo
     *    - Si hay más de 2: ordenar por prioridad de turno
     *
     * 2. Si NO hay asignaciones del mismo día:
     *    - Buscar la última asignación ANTERIOR a la fecha
     */
    private fun findLastAssignment(date: LocalDate, requiredBrigada: Int): Pair<FirefighterAssignment?, String> {
        // 1. Obtener asignaciones del MISMO DÍA
        val sameDayAssignments = effectiveAssignments.filter { assignment ->
            try {
                val assignmentDate = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                assignmentDate.isEqual(date)
            } catch (e: Exception) {
                false
            }
        }

        if (sameDayAssignments.size == 1) {
            // Solo una asignación en ese día
            val single = sameDayAssignments[0]
            if (single.id_brigada_destino == requiredBrigada) {
                val suffix = when (single.turno) {
                    "Mañana" -> "Día completo"
                    "Tarde" -> "Tarde y noche"
                    "Noche" -> "Noche"
                    else -> ""
                }
                return Pair(single, suffix)
            }
            return Pair(single, "")

        } else if (sameDayAssignments.size == 2) {
            // Dos asignaciones en el mismo día
            val matching = sameDayAssignments.filter { it.id_brigada_destino == requiredBrigada }

            if (matching.size == 1) {
                val other = sameDayAssignments.find { it.id_brigada_destino != requiredBrigada }
                val matchingTurn = matching[0].turno ?: "Mañana"
                val otherTurn = other?.turno ?: "Mañana"

                var suffix = ""

                // Determinar sufijo basado en turnos (igual que React)
                if (matchingTurn == "Mañana" && otherTurn == "Tarde" &&
                    other?.id_brigada_origen == requiredBrigada) {
                    suffix = "Mañana"
                } else if (matchingTurn == "Tarde" && otherTurn == "Noche" &&
                    other?.id_brigada_origen == requiredBrigada) {
                    suffix = "Tarde"
                } else if (matchingTurn == "Mañana" && otherTurn == "Noche") {
                    suffix = "Mañana"
                } else {
                    // Lógica genérica
                    val isTemporaryAssignment = other?.id_brigada_origen == requiredBrigada ||
                            other?.id_brigada_destino == requiredBrigada

                    suffix = if (isTemporaryAssignment) {
                        when (matchingTurn) {
                            "Mañana" -> "Mañana"
                            "Tarde" -> "Tarde"
                            "Noche" -> "Noche"
                            else -> ""
                        }
                    } else {
                        when (matchingTurn) {
                            "Mañana" -> "Día completo"
                            "Tarde" -> "Tarde y noche"
                            "Noche" -> "Noche"
                            else -> ""
                        }
                    }
                }

                return Pair(matching[0], suffix)

            } else if (matching.size == 2) {
                // Ambas asignaciones coinciden con la brigada requerida
                val sorted = matching.sortedBy { assignment ->
                    val turno = assignment.turno ?: "Mañana"
                    TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
                }

                val isSequential = sorted[0].id_brigada_origen == sorted[1].id_brigada_destino ||
                        sorted[1].id_brigada_origen == sorted[0].id_brigada_destino

                val suffix = if (isSequential) {
                    val t0 = sorted[0].turno ?: ""
                    val t1 = sorted[1].turno ?: ""
                    when {
                        t0 == "Mañana" && t1 == "Tarde" -> "Mañana y tarde"
                        t0 == "Mañana" && t1 == "Noche" -> "Mañana"
                        t0 == "Tarde" && t1 == "Noche" -> "Tarde y noche"
                        else -> sorted[0].turno ?: ""
                    }
                } else {
                    when (sorted[0].turno) {
                        "Mañana" -> "Día completo"
                        "Tarde" -> "Tarde y noche"
                        "Noche" -> "Noche"
                        else -> ""
                    }
                }

                return Pair(sorted[0], suffix)
            } else {
                // Ninguna coincide
                val sorted = sameDayAssignments.sortedBy { assignment ->
                    val turno = assignment.turno ?: "Mañana"
                    TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
                }
                return Pair(sorted[0], "")
            }

        } else if (sameDayAssignments.size > 2) {
            // Más de dos asignaciones
            val matching = sameDayAssignments.filter { it.id_brigada_destino == requiredBrigada }
            if (matching.isNotEmpty()) {
                val sorted = matching.sortedBy { assignment ->
                    val turno = assignment.turno ?: "Mañana"
                    TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
                }
                val suffix = when (sorted[0].turno) {
                    "Mañana" -> "Día completo"
                    "Tarde" -> "Tarde y noche"
                    "Noche" -> "Noche"
                    else -> ""
                }
                return Pair(sorted[0], suffix)
            } else {
                val sorted = sameDayAssignments.sortedBy { assignment ->
                    val turno = assignment.turno ?: "Mañana"
                    TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
                }
                return Pair(sorted[0], "")
            }
        }

        // 2. Si no hay asignaciones del mismo día, buscar la última asignación ANTERIOR
        val previousAssignments = effectiveAssignments.filter { assignment ->
            try {
                val assignmentDate = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                assignmentDate.isBefore(date)
            } catch (e: Exception) {
                false
            }
        }

        if (previousAssignments.isNotEmpty()) {
            val sorted = previousAssignments.sortedWith(
                compareByDescending<FirefighterAssignment> { assignment ->
                    try {
                        LocalDate.parse(assignment.fecha_ini, dateFormatter)
                    } catch (e: Exception) {
                        LocalDate.MIN
                    }
                }.thenBy { assignment ->
                    val turno = assignment.turno ?: "Mañana"
                    TURN_PRIORITY.indexOf(turno).let { if (it == -1) Int.MAX_VALUE else it }
                }
            )
            return Pair(sorted[0], "")
        }

        return Pair(null, "")
    }

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

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

    private fun getRequestShortLabel(tipo: String): String {
        return when (tipo.lowercase()) {
            "vacaciones" -> "VAC"
            "asuntos propios" -> "AP"
            "baja" -> "BAJA"
            "licencias por jornadas" -> "LJ"
            "licencias por días" -> "LD"
            "horas sindicales" -> "HS"
            "modulo" -> "MOD"
            "vestuario" -> "VEST"
            "compensacion grupos especiales" -> "CGE"
            else -> tipo.take(3).uppercase()
        }
    }

    private fun getRequestEventColor(tipo: String): EventColor {
        return when (tipo.lowercase()) {
            "vacaciones" -> EventColor.VACACIONES
            "asuntos propios" -> EventColor.ASUNTOS_PROPIOS
            "baja" -> EventColor.BAJA
            "licencias por jornadas", "licencias por días" -> EventColor.LICENCIAS
            "horas sindicales" -> EventColor.HORAS_SINDICALES
            "modulo" -> EventColor.MODULO
            "vestuario" -> EventColor.VESTUARIO
            "compensacion grupos especiales" -> EventColor.COMPENSACION
            else -> EventColor.DEFAULT
        }
    }

    private fun getBrigadeEventColor(brigadeName: String): EventColor {
        return when {
            brigadeName.contains("A", ignoreCase = true) -> EventColor.BRIGADE_A
            brigadeName.contains("B", ignoreCase = true) -> EventColor.BRIGADE_B
            brigadeName.contains("C", ignoreCase = true) -> EventColor.BRIGADE_C
            brigadeName.contains("D", ignoreCase = true) -> EventColor.BRIGADE_D
            brigadeName.contains("E", ignoreCase = true) -> EventColor.BRIGADE_E
            brigadeName.contains("F", ignoreCase = true) -> EventColor.BRIGADE_F
            else -> EventColor.DEFAULT
        }
    }

    fun getStatusColor(status: String): StatusColor {
        return when (status.lowercase()) {
            "confirmada" -> StatusColor.CONFIRMADA
            "aceptado" -> StatusColor.ACEPTADO
            "pendiente" -> StatusColor.PENDIENTE
            "cancelada" -> StatusColor.CANCELADA
            "rechazada" -> StatusColor.RECHAZADA
            "rechazado" -> StatusColor.RECHAZADO
            else -> StatusColor.DEFAULT
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

            val result = usersRepository.changePassword(
                userId = currentUser.id_empleado,
                currentPassword = currentPassword,
                newPassword = newPassword,
                confirmPassword = confirmPassword
            )

            result.fold(
                onSuccess = {
                    _passwordChangeSuccess.value = "Contraseña actualizada correctamente"
                    Log.d(TAG, "✅ Contraseña actualizada")
                },
                onFailure = { error ->
                    _passwordChangeError.value = error.message ?: "Error al cambiar la contraseña"
                    Log.e(TAG, "❌ Error: ${error.message}")
                }
            )

            _isChangingPassword.value = false
        }
    }

    fun clearMessages() {
        _passwordChangeSuccess.value = null
        _passwordChangeError.value = null
        _successMessage.value = null
        _errorMessage.value = null
    }

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

    fun getEstadoColor(status: String): StatusColor {
        return getStatusColor(status)
    }

    fun getTotalExtraHoursSalary(): Double {
        val diurnas = getTotalDiurnas()
        val nocturnas = getTotalNocturnas()
        // Tarifas aproximadas (ajustar según convenga)
        val tarifaDiurna = 15.0
        val tarifaNocturna = 20.0
        return (diurnas * tarifaDiurna) + (nocturnas * tarifaNocturna)
    }
}

// ==========================================
// ESTADOS UI
// ==========================================

sealed class ProfileUiState {
    object Loading : ProfileUiState()
    object Success : ProfileUiState()
    data class Error(val message: String) : ProfileUiState()
}

// ==========================================
// MODELOS DE DATOS PARA UI
// ==========================================

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

// ==========================================
// EVENTOS DE CALENDARIO
// ==========================================

data class CalendarEvent(
    val type: CalendarEventType,
    val label: String,
    val color: EventColor,
    val isRequerimiento: Boolean = false  // Para pintar verde si viene por requerimiento
)

enum class CalendarEventType {
    GUARD,
    REQUEST,
    SHIFT_CHANGE_WORK,
    SHIFT_CHANGE_FREE
}

data class LegendItem(
    val label: String,
    val color: EventColor
)

enum class EventColor(val hex: String) {
    BRIGADE_A("#3B82F6"),      // Azul
    BRIGADE_B("#10B981"),      // Verde
    BRIGADE_C("#F59E0B"),      // Naranja
    BRIGADE_D("#8B5CF6"),      // Violeta
    BRIGADE_E("#EC4899"),      // Rosa
    BRIGADE_F("#06B6D4"),      // Cyan
    VACACIONES("#EF4444"),     // Rojo
    ASUNTOS_PROPIOS("#F59E0B"), // Amarillo
    BAJA("#6B7280"),           // Gris
    LICENCIAS("#14B8A6"),      // Teal
    HORAS_SINDICALES("#8B5CF6"), // Violeta
    MODULO("#FBBF24"),         // Amarillo (diferente tono)
    VESTUARIO("#A855F7"),      // Purple
    COMPENSACION("#06B6D4"),   // Cyan
    SHIFT_CHANGE_WORK("#22C55E"), // Verde brillante
    REQUERIMIENTO("#22C55E"),  // Verde brillante (igual que React bg-green-500)
    DEFAULT("#9CA3AF")         // Gris claro
}

enum class StatusColor(val hex: String) {
    CONFIRMADA("#22C55E"),
    ACEPTADO("#22C55E"),
    PENDIENTE("#F59E0B"),
    CANCELADA("#EF4444"),
    RECHAZADA("#EF4444"),
    RECHAZADO("#EF4444"),
    DEFAULT("#9CA3AF")
}