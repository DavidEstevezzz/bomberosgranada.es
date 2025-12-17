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
import java.util.Locale

/**
 * ProfileViewModel - VERSIÓN CORREGIDA Y CON LOGS DE DIAGNÓSTICO
 *
 * CORRECCIONES APLICADAS (igual que React):
 * 1. ✅ Se cargan TODAS las asignaciones del usuario (no solo del mes actual)
 * 2. ✅ La lógica findUserBrigadeForDate ahora considera asignaciones de meses anteriores
 * 3. ✅ Logs detallados para depuración
 *
 * DIFERENCIA CLAVE CON REACT:
 * React pre-filtra las guardias y solo muestra aquellas donde la brigada coincide.
 * Android evalúa cada día del calendario y muestra el evento correspondiente.
 * Ambos enfoques deberían dar el mismo resultado si la lógica de findUserBrigadeForDate es correcta.
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
        private const val TAG = "ProfileVM_DEBUG"
    }

    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    // Mapa de brigadas
    private val _brigadesMap = MutableStateFlow<Map<Int, Brigade>>(emptyMap())
    val brigadesMap: StateFlow<Map<Int, Brigade>> = _brigadesMap.asStateFlow()

    // TODAS las asignaciones del usuario (no solo del mes actual)
    private val _userAssignments = MutableStateFlow<List<FirefighterAssignment>>(emptyList())
    val userAssignments: StateFlow<List<FirefighterAssignment>> = _userAssignments.asStateFlow()

    // ==========================================
    // CALENDARIO
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

    private val _passwordChangeSuccess = MutableStateFlow<String?>(null)
    val passwordChangeSuccess: StateFlow<String?> = _passwordChangeSuccess.asStateFlow()

    private val _passwordChangeError = MutableStateFlow<String?>(null)
    val passwordChangeError: StateFlow<String?> = _passwordChangeError.asStateFlow()

    // Mensajes de estado
    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // Cache para evitar recargas
    private var dataLoaded = false
    private var allUserRequests: List<RequestItem> = emptyList()
    private var allUserShiftChanges: List<ShiftChangeRequest> = emptyList()
    private var allUserExtraHours: List<ExtraHour> = emptyList()
    private var allGuards: List<Guard> = emptyList()

    // ==========================================
    // CARGA DE DATOS - MEJORADA CON LOGS
    // ==========================================

    fun loadProfile(currentUser: User) {
        if (dataLoaded) {
            Log.d(TAG, "📋 Datos ya cargados, omitiendo recarga")
            return
        }

        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            Log.d(TAG, "═══════════════════════════════════════")
            Log.d(TAG, "🚀 INICIANDO CARGA DE PERFIL")
            Log.d(TAG, "👤 Usuario: ${currentUser.nombre} ${currentUser.apellido} (ID: ${currentUser.id_empleado})")
            Log.d(TAG, "═══════════════════════════════════════")

            try {
                // Cargar todo en paralelo
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
                        Log.d(TAG, "✅ Brigadas cargadas: ${brigades.size}")
                        brigades.forEach {
                            Log.d(TAG, "   📍 Brigada ${it.id_brigada}: ${it.nombre} (Parque: ${it.id_parque})")
                        }
                    },
                    onFailure = { Log.e(TAG, "❌ Error brigadas: ${it.message}") }
                )

                // Cargar guardias del mes actual
                loadGuardsForMonth(_calendarMonth.value)

                // Procesar asignaciones - TODAS, no solo las del mes
                val assignmentsResult = assignmentsDeferred.await()
                assignmentsResult.fold(
                    onSuccess = { assignments ->
                        val userAssignments = assignments.filter {
                            it.id_empleado == currentUser.id_empleado
                        }
                        _userAssignments.value = userAssignments

                        Log.d(TAG, "═══════════════════════════════════════")
                        Log.d(TAG, "📊 ASIGNACIONES DEL USUARIO")
                        Log.d(TAG, "═══════════════════════════════════════")
                        Log.d(TAG, "Total asignaciones en sistema: ${assignments.size}")
                        Log.d(TAG, "Asignaciones del usuario: ${userAssignments.size}")

                        // Mostrar las últimas 10 asignaciones ordenadas
                        userAssignments
                            .sortedByDescending { it.fecha_ini }
                            .take(10)
                            .forEach { assignment ->
                                Log.d(TAG, "   📅 ${assignment.fecha_ini} | " +
                                        "Turno: ${assignment.turno} | " +
                                        "Brigada Destino: ${assignment.id_brigada_destino} | " +
                                        "Brigada Origen: ${assignment.id_brigada_origen}")
                            }
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
                        Log.d(TAG, "   📋 Solicitudes confirmadas para calendario: ${_calendarRequests.value.size}")

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
                        Log.d(TAG, "   🔄 Cambios aceptados para calendario: ${_calendarShiftChanges.value.size}")

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

                Log.d(TAG, "═══════════════════════════════════════")
                Log.d(TAG, "✅ CARGA DE PERFIL COMPLETADA")
                Log.d(TAG, "═══════════════════════════════════════")

            } catch (e: Exception) {
                Log.e(TAG, "💥 Error cargando perfil: ${e.message}", e)
                _uiState.value = ProfileUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    /**
     * Carga guardias para un mes específico
     */
    private suspend fun loadGuardsForMonth(month: YearMonth) {
        val brigadeIds = _brigadesMap.value.keys.toList()
        if (brigadeIds.isEmpty()) {
            Log.w(TAG, "⚠️ No hay brigadas para cargar guardias")
            return
        }

        val startDate = month.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        val endDate = month.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE)

        Log.d(TAG, "📅 Cargando guardias para mes: $month ($startDate a $endDate)")
        Log.d(TAG, "   Brigadas a consultar: $brigadeIds")

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

                // Mostrar algunas guardias como ejemplo
                guards.take(5).forEach { guard ->
                    Log.d(TAG, "   🛡️ ${guard.date} | Brigada: ${guard.id_brigada}")
                }
            },
            onFailure = { Log.e(TAG, "❌ Error guardias: ${it.message}") }
        )
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
        _calendarMonth.value = _calendarMonth.value.minusMonths(1)
        viewModelScope.launch { loadGuardsForMonth(_calendarMonth.value) }
    }

    fun nextCalendarMonth(currentUser: User) {
        _calendarMonth.value = _calendarMonth.value.plusMonths(1)
        viewModelScope.launch { loadGuardsForMonth(_calendarMonth.value) }
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
    // EVENTOS DEL CALENDARIO - CON LOGS DETALLADOS
    // ==========================================

    /**
     * Obtiene el evento a mostrar para una fecha específica.
     *
     * PRIORIDAD:
     * 1. Solicitudes confirmadas (vacaciones, permisos, etc.)
     * 2. Cambios de guardia aceptados
     * 3. Guardias normales (donde la brigada del usuario coincide)
     */
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
            Log.d(TAG, "📅 $dateStr → Solicitud: ${request.tipo}")
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
            Log.d(TAG, "📅 $dateStr → Cambio guardia: ${if (isMyGuard) "TRABAJO" else "LIBRE"}")
            return CalendarEvent(
                type = if (isMyGuard) CalendarEventType.SHIFT_CHANGE_WORK else CalendarEventType.SHIFT_CHANGE_FREE,
                label = if (isMyGuard) "CG" else "Libre",
                color = if (isMyGuard) EventColor.SHIFT_CHANGE_WORK else EventColor.BRIGADE_B
            )
        }

        // 3. Guardia normal - AQUÍ ESTÁ LA LÓGICA CRÍTICA
        val guard = _calendarGuards.value.find { it.date == dateStr }
        if (guard != null) {
            val brigade = _brigadesMap.value[guard.id_brigada]
            val userBrigadeId = findUserBrigadeForDate(date)

            Log.d(TAG, "═══════════════════════════════════════")
            Log.d(TAG, "🔍 EVALUANDO GUARDIA PARA FECHA: $dateStr")
            Log.d(TAG, "   🛡️ Guardia encontrada: Brigada ${guard.id_brigada} (${brigade?.nombre})")
            Log.d(TAG, "   👤 Brigada del usuario: $userBrigadeId")
            Log.d(TAG, "   ✓ ¿Coinciden? ${userBrigadeId == guard.id_brigada}")
            Log.d(TAG, "═══════════════════════════════════════")

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
     * LÓGICA (igual que React):
     * 1. Filtra asignaciones donde fecha_ini <= date
     * 2. Ordena por fecha descendente (más reciente primero)
     * 3. Para la misma fecha, ordena por prioridad de turno: Noche > Tarde > Mañana
     * 4. Devuelve la brigada destino de la primera asignación
     */
    private fun findUserBrigadeForDate(date: LocalDate): Int? {
        val dateStr = date.format(dateFormatter)
        val turnPriority = listOf("Noche", "Tarde", "Mañana")

        Log.d(TAG, "   🔎 Buscando brigada para fecha: $dateStr")
        Log.d(TAG, "   📊 Total asignaciones del usuario: ${_userAssignments.value.size}")

        // Filtrar asignaciones válidas para esta fecha
        val validAssignments = _userAssignments.value.filter { assignment ->
            try {
                val fechaIni = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                val isValid = !fechaIni.isAfter(date)
                if (isValid) {
                    Log.v(TAG, "      ✓ Asignación válida: ${assignment.fecha_ini} (turno: ${assignment.turno}) → Brigada ${assignment.id_brigada_destino}")
                }
                isValid
            } catch (e: Exception) {
                Log.e(TAG, "      ❌ Error parseando fecha: ${assignment.fecha_ini}", e)
                false
            }
        }

        Log.d(TAG, "   📋 Asignaciones válidas encontradas: ${validAssignments.size}")

        if (validAssignments.isEmpty()) {
            Log.w(TAG, "   ⚠️ NO HAY ASIGNACIONES VÁLIDAS para fecha $dateStr")
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
                val turno = assignment.turno ?: "Mañana"
                turnPriority.indexOf(turno).let { if (it == -1) 3 else it }
            }
        )

        val lastAssignment = sortedAssignments.firstOrNull()

        if (lastAssignment != null) {
            Log.d(TAG, "   ✅ Última asignación seleccionada:")
            Log.d(TAG, "      📅 Fecha: ${lastAssignment.fecha_ini}")
            Log.d(TAG, "      🕐 Turno: ${lastAssignment.turno}")
            Log.d(TAG, "      🏠 Brigada Origen: ${lastAssignment.id_brigada_origen}")
            Log.d(TAG, "      🎯 Brigada Destino: ${lastAssignment.id_brigada_destino}")
            return lastAssignment.id_brigada_destino
        }

        Log.w(TAG, "   ⚠️ No se encontró asignación para fecha $dateStr")
        return null
    }

    // ==========================================
    // HELPERS PARA COLORES Y ETIQUETAS
    // ==========================================

    private fun getRequestShortLabel(tipo: String): String {
        return when (tipo.lowercase()) {
            "vacaciones" -> "VAC"
            "asuntos propios" -> "AP"
            "licencias por jornadas" -> "LJ"
            "licencias por días" -> "LD"
            "modulo" -> "MOD"
            "bajas" -> "BAJA"
            "compensacion grupos especiales" -> "CGE"
            "horas sindicales" -> "HS"
            "vestuario" -> "VEST"
            else -> tipo.take(3).uppercase()
        }
    }

    private fun getRequestEventColor(tipo: String): EventColor {
        return when (tipo.lowercase()) {
            "vacaciones" -> EventColor.VACACIONES
            "asuntos propios" -> EventColor.ASUNTOS_PROPIOS
            "bajas" -> EventColor.BAJA
            "licencias por jornadas", "licencias por días" -> EventColor.LICENCIA
            "modulo" -> EventColor.MODULO
            "compensacion grupos especiales" -> EventColor.COMPENSACION
            "horas sindicales" -> EventColor.HORAS_SINDICALES
            else -> EventColor.OTHER_REQUEST
        }
    }

    fun getBrigadeEventColor(brigadeName: String): EventColor {
        val normalized = brigadeName.lowercase(Locale.getDefault())
        return when {
            normalized.contains("brigada a") -> EventColor.BRIGADE_A
            normalized.contains("brigada b") -> EventColor.BRIGADE_B
            normalized.contains("brigada c") -> EventColor.BRIGADE_C
            normalized.contains("brigada d") -> EventColor.BRIGADE_D
            normalized.contains("brigada e") -> EventColor.BRIGADE_E
            normalized.contains("brigada f") -> EventColor.BRIGADE_F
            else -> EventColor.BRIGADE_DEFAULT
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
            try {
                val assignmentDate = LocalDate.parse(assignment.fecha_ini, dateFormatter)
                assignmentDate == date && assignment.id_brigada_destino == brigadeId
            } catch (e: Exception) {
                false
            }
        }
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

    // ==========================================
    // CAMBIO DE CONTRASEÑA
    // ==========================================

    // Estado adicional para loading del cambio de contraseña
    private val _isChangingPassword = MutableStateFlow(false)
    val isChangingPassword: StateFlow<Boolean> = _isChangingPassword.asStateFlow()

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
                    _passwordChangeError.value = error.message ?: "Error al cambiar la contraseña"
                    Log.e(TAG, "❌ Error al cambiar contraseña: ${error.message}")
                }
            )

            _isChangingPassword.value = false
        }
    }

    fun clearPasswordMessages() {
        _passwordChangeSuccess.value = null
        _passwordChangeError.value = null
    }

    fun clearSuccessMessage() {
        _successMessage.value = null
    }

    fun clearErrorMessage() {
        _errorMessage.value = null
    }

    // ==========================================
// HORAS EXTRA - CÁLCULOS
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

// ==========================================
// COLORES DE ESTADO (alias para compatibilidad)
// ==========================================

    fun getEstadoColor(status: String): StatusColor {
        return getStatusColor(status)
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
// DATA CLASSES
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

data class CalendarDayInfo(
    val date: LocalDate,
    val monthOffset: Int  // -1, 0, 1
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
    // Brigadas
    BRIGADE_A("#22C55E"),      // Verde
    BRIGADE_B("#F4F4F5"),      // Casi blanco
    BRIGADE_C("#3B82F6"),      // Azul
    BRIGADE_D("#EF4444"),      // Rojo
    BRIGADE_E("#FACC15"),      // Amarillo
    BRIGADE_F("#9CA3AF"),      // Gris
    BRIGADE_DEFAULT("#78909C"),

    // Solicitudes
    VACACIONES("#EF4444"),     // Rojo
    ASUNTOS_PROPIOS("#F59E0B"), // Amarillo/Naranja
    BAJA("#6B7280"),           // Gris
    LICENCIA("#8B5CF6"),       // Púrpura
    MODULO("#EC4899"),         // Rosa
    COMPENSACION("#14B8A6"),   // Teal
    HORAS_SINDICALES("#06B6D4"), // Cyan
    OTHER_REQUEST("#9CA3AF"),

    // Cambios de guardia
    SHIFT_CHANGE_WORK("#10B981"), // Verde esmeralda
    SHIFT_CHANGE_FREE("#6366F1")  // Índigo
}

enum class StatusColor(val hex: String) {
    CONFIRMADA("#22C55E"),
    ACEPTADO("#22C55E"),
    PENDIENTE("#F59E0B"),
    CANCELADA("#6B7280"),
    RECHAZADA("#EF4444"),
    RECHAZADO("#EF4444"),
    DEFAULT("#9CA3AF")
}

data class LegendItem(
    val label: String,
    val color: EventColor
)