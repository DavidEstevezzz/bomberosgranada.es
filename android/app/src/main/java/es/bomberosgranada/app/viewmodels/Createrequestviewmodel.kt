package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.repositories.RequestsRepository
import es.bomberosgranada.app.data.repositories.GuardsRepository
import es.bomberosgranada.app.data.repositories.AssignmentsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * ViewModel para la pantalla de creación de solicitudes
 *
 * Maneja la lógica de negocio y validaciones para todos los tipos de solicitudes:
 * - Vacaciones
 * - Asuntos Propios
 * - Horas Sindicales
 * - Salidas Personales
 * - Módulo
 * - Vestuario
 * - Licencias por Jornadas
 * - Licencias por Días
 * - Compensación Grupos Especiales
 */
class CreateRequestViewModel(
    private val requestsRepository: RequestsRepository,
    private val guardsRepository: GuardsRepository,
    private val assignmentsRepository: AssignmentsRepository
) : ViewModel() {

    companion object {
        private const val TAG = "CreateRequestViewModel"
    }

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<CreateRequestUiState>(CreateRequestUiState.Idle)
    val uiState: StateFlow<CreateRequestUiState> = _uiState.asStateFlow()

    private val _selectedType = MutableStateFlow(RequestType.VACACIONES)
    val selectedType: StateFlow<RequestType> = _selectedType.asStateFlow()

    private val _fechaInicio = MutableStateFlow<LocalDate?>(null)
    val fechaInicio: StateFlow<LocalDate?> = _fechaInicio.asStateFlow()

    private val _fechaFin = MutableStateFlow<LocalDate?>(null)
    val fechaFin: StateFlow<LocalDate?> = _fechaFin.asStateFlow()

    private val _horaInicio = MutableStateFlow<LocalTime?>(null)
    val horaInicio: StateFlow<LocalTime?> = _horaInicio.asStateFlow()

    private val _horaFin = MutableStateFlow<LocalTime?>(null)
    val horaFin: StateFlow<LocalTime?> = _horaFin.asStateFlow()

    private val _turnoSeleccionado = MutableStateFlow<Turno?>(null)
    val turnoSeleccionado: StateFlow<Turno?> = _turnoSeleccionado.asStateFlow()

    private val _motivo = MutableStateFlow("")
    val motivo: StateFlow<String> = _motivo.asStateFlow()

    private val _archivoAdjunto = MutableStateFlow<File?>(null)
    val archivoAdjunto: StateFlow<File?> = _archivoAdjunto.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // ==========================================
    // TIPOS Y ENUMS
    // ==========================================

    enum class RequestType(val displayName: String, val apiValue: String) {
        VACACIONES("Vacaciones", "vacaciones"),
        ASUNTOS_PROPIOS("Asuntos Propios", "asuntos propios"),
        HORAS_SINDICALES("Horas Sindicales", "horas sindicales"),
        SALIDAS_PERSONALES("Salidas Personales", "salidas personales"),
        MODULO("Módulo", "modulo"),
        VESTUARIO("Vestuario", "vestuario"),
        LICENCIAS_JORNADAS("Licencias por Jornadas", "licencias por jornadas"),
        LICENCIAS_DIAS("Licencias por Días", "licencias por dias"),
        COMPENSACION_GRUPOS("Compensación Grupos Especiales", "compensacion grupos especiales")
    }

    enum class Turno(val displayName: String, val apiValue: String) {
        MANANA("Mañana", "Mañana"),
        TARDE("Tarde", "Tarde"),
        NOCHE("Noche", "Noche"),
        DIA_COMPLETO("Día Completo", "Día Completo"),
        MANANA_TARDE("Mañana y Tarde", "Mañana y tarde"),
        TARDE_NOCHE("Tarde y Noche", "Tarde y noche")
    }

    sealed class CreateRequestUiState {
        object Idle : CreateRequestUiState()
        object Loading : CreateRequestUiState()
        object Validating : CreateRequestUiState()
        data class Success(val message: String) : CreateRequestUiState()
        data class Error(val message: String) : CreateRequestUiState()
    }

    // ==========================================
    // FUNCIONES DE ACTUALIZACIÓN
    // ==========================================

    fun setSelectedType(type: RequestType) {
        _selectedType.value = type
        // Limpiar campos al cambiar tipo
        _fechaFin.value = null
        _horaInicio.value = null
        _horaFin.value = null
        _turnoSeleccionado.value = null
        _errorMessage.value = null
    }

    fun setFechaInicio(date: LocalDate?) {
        _fechaInicio.value = date
        _errorMessage.value = null
    }

    fun setFechaFin(date: LocalDate?) {
        _fechaFin.value = date
        _errorMessage.value = null
    }

    fun setHoraInicio(time: LocalTime?) {
        _horaInicio.value = time
        _errorMessage.value = null
    }

    fun setHoraFin(time: LocalTime?) {
        _horaFin.value = time
        _errorMessage.value = null
    }

    fun setTurno(turno: Turno?) {
        _turnoSeleccionado.value = turno
        // Si es horas sindicales y se selecciona Día Completo, limpiar horas
        if (_selectedType.value == RequestType.HORAS_SINDICALES && turno == Turno.DIA_COMPLETO) {
            _horaInicio.value = null
            _horaFin.value = null
        }
        _errorMessage.value = null
    }

    fun setMotivo(text: String) {
        _motivo.value = text
    }

    fun setArchivoAdjunto(file: File?) {
        _archivoAdjunto.value = file
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun clearSuccess() {
        _successMessage.value = null
    }

    fun resetForm() {
        _selectedType.value = RequestType.VACACIONES
        _fechaInicio.value = null
        _fechaFin.value = null
        _horaInicio.value = null
        _horaFin.value = null
        _turnoSeleccionado.value = null
        _motivo.value = ""
        _archivoAdjunto.value = null
        _errorMessage.value = null
        _successMessage.value = null
        _uiState.value = CreateRequestUiState.Idle
    }

    // ==========================================
    // LÓGICA DE CAMPOS REQUERIDOS
    // ==========================================

    /**
     * Determina si el tipo de solicitud requiere fecha fin
     */
    fun requiresFechaFin(): Boolean {
        return when (_selectedType.value) {
            RequestType.VACACIONES,
            RequestType.LICENCIAS_DIAS -> true
            else -> false
        }
    }

    /**
     * Determina si el tipo de solicitud requiere selección de turno
     */
    fun requiresTurno(): Boolean {
        return when (_selectedType.value) {
            RequestType.ASUNTOS_PROPIOS,
            RequestType.LICENCIAS_JORNADAS,
            RequestType.COMPENSACION_GRUPOS,
            RequestType.HORAS_SINDICALES -> true
            else -> false
        }
    }

    /**
     * Determina si el tipo de solicitud requiere horas (inicio/fin)
     */
    fun requiresHoras(): Boolean {
        return when (_selectedType.value) {
            RequestType.SALIDAS_PERSONALES -> true
            RequestType.HORAS_SINDICALES -> _turnoSeleccionado.value != Turno.DIA_COMPLETO
            else -> false
        }
    }

    /**
     * Obtiene los turnos disponibles según el tipo de solicitud
     */
    fun getAvailableTurnos(): List<Turno> {
        return when (_selectedType.value) {
            RequestType.HORAS_SINDICALES -> listOf(
                Turno.MANANA,
                Turno.TARDE,
                Turno.NOCHE,
                Turno.DIA_COMPLETO
            )
            else -> listOf(
                Turno.MANANA,
                Turno.TARDE,
                Turno.NOCHE,
                Turno.DIA_COMPLETO,
                Turno.MANANA_TARDE,
                Turno.TARDE_NOCHE
            )
        }
    }

    // ==========================================
    // VALIDACIONES
    // ==========================================

    /**
     * Valida que el usuario tenga días de vacaciones suficientes
     */
    private fun validateVacationDays(user: User): Boolean {
        val startDate = _fechaInicio.value ?: return false
        val endDate = _fechaFin.value ?: return false

        if (endDate.isBefore(startDate)) {
            _errorMessage.value = "La fecha fin debe ser posterior a la fecha inicio"
            return false
        }

        val requestedDays = ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
        val availableDays = user.vacaciones ?: 0

        if (requestedDays > availableDays) {
            _errorMessage.value = "No tienes suficientes días de vacaciones. Disponibles: $availableDays, solicitados: $requestedDays"
            return false
        }
        return true
    }

    /**
     * Valida días de módulo disponibles
     */
    private fun validateModuloDays(user: User): Boolean {
        val availableDays = user.modulo ?: 0
        if (availableDays <= 0) {
            _errorMessage.value = "No tienes días de módulo disponibles. Disponibles: $availableDays"
            return false
        }
        return true
    }

    /**
     * Valida días de asuntos propios / compensación grupos
     */
    private fun validateAPDays(user: User, type: RequestType): Boolean {
        val availableDays = when (type) {
            RequestType.ASUNTOS_PROPIOS -> user.AP ?: 0
            RequestType.COMPENSACION_GRUPOS -> user.compensacion_grupos ?: 0
            else -> 0
        }

        if (availableDays <= 0) {
            val typeName = type.displayName
            _errorMessage.value = "No tienes días disponibles de $typeName. Disponibles: $availableDays"
            return false
        }
        return true
    }

    /**
     * Valida horas de salidas personales
     */
    private fun validateSPHours(user: User): Pair<Boolean, Double?> {
        val startTime = _horaInicio.value
        val endTime = _horaFin.value

        if (startTime == null || endTime == null) {
            _errorMessage.value = "Debe especificar hora de inicio y fin para salidas personales"
            return Pair(false, null)
        }

        val hoursDifference = ChronoUnit.MINUTES.between(startTime, endTime) / 60.0

        if (hoursDifference <= 0) {
            _errorMessage.value = "La hora de fin debe ser posterior a la hora de inicio"
            return Pair(false, null)
        }

        val availableHours = user.SP ?: 0
        if (hoursDifference > availableHours) {
            _errorMessage.value = "No tienes suficientes horas de salidas personales. Disponibles: $availableHours, solicitadas: ${"%.1f".format(hoursDifference)}"
            return Pair(false, null)
        }

        return Pair(true, hoursDifference)
    }

    /**
     * Valida horas sindicales
     */
    private fun validateSindicalHours(user: User): Pair<Boolean, Double?> {
        val turno = _turnoSeleccionado.value

        if (turno == Turno.DIA_COMPLETO) {
            val availableHours = user.horas_sindicales ?: 0
            if (availableHours < 24) {
                _errorMessage.value = "No tienes suficientes horas sindicales para un día completo. Disponibles: $availableHours"
                return Pair(false, null)
            }
            return Pair(true, 24.0)
        }

        val startTime = _horaInicio.value
        val endTime = _horaFin.value

        if (startTime == null || endTime == null) {
            _errorMessage.value = "Debe especificar hora de inicio y fin para horas sindicales"
            return Pair(false, null)
        }

        val hoursDifference = ChronoUnit.MINUTES.between(startTime, endTime) / 60.0

        if (hoursDifference <= 0) {
            _errorMessage.value = "La hora de fin debe ser posterior a la hora de inicio"
            return Pair(false, null)
        }

        val availableHours = user.horas_sindicales ?: 0
        if (hoursDifference > availableHours) {
            _errorMessage.value = "No tienes suficientes horas sindicales. Disponibles: $availableHours, solicitadas: ${"%.1f".format(hoursDifference)}"
            return Pair(false, null)
        }

        return Pair(true, hoursDifference)
    }

    /**
     * Valida que el usuario tenga guardia asignada en las fechas de vacaciones
     * (Simplificado - en producción se consultaría la API)
     */
    private suspend fun validateGuardDates(user: User): Boolean {
        // TODO: Implementar validación real consultando la API
        // Por ahora se asume válido
        return true
    }

    // ==========================================
    // ENVÍO DE SOLICITUD
    // ==========================================

    /**
     * Envía la solicitud al servidor
     */
    fun submitRequest(currentUser: User) {
        viewModelScope.launch {
            _uiState.value = CreateRequestUiState.Validating

            val type = _selectedType.value
            var horas: Double? = null

            // Validar fecha inicio obligatoria
            if (_fechaInicio.value == null) {
                _errorMessage.value = "Debe seleccionar una fecha de inicio"
                _uiState.value = CreateRequestUiState.Idle
                return@launch
            }

            // Validaciones específicas por tipo
            when (type) {
                RequestType.VACACIONES -> {
                    if (_fechaFin.value == null) {
                        _errorMessage.value = "Debe seleccionar una fecha de fin"
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    if (!validateVacationDays(currentUser)) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    if (!validateGuardDates(currentUser)) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                }

                RequestType.ASUNTOS_PROPIOS, RequestType.COMPENSACION_GRUPOS -> {
                    if (_turnoSeleccionado.value == null) {
                        _errorMessage.value = "Debe seleccionar un turno"
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    if (!validateAPDays(currentUser, type)) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                }

                RequestType.MODULO -> {
                    if (!validateModuloDays(currentUser)) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                }

                RequestType.SALIDAS_PERSONALES -> {
                    val (isValid, hours) = validateSPHours(currentUser)
                    if (!isValid) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    horas = hours
                }

                RequestType.HORAS_SINDICALES -> {
                    if (_turnoSeleccionado.value == null) {
                        _errorMessage.value = "Debe seleccionar un turno"
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    val (isValid, hours) = validateSindicalHours(currentUser)
                    if (!isValid) {
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                    horas = hours
                }

                RequestType.LICENCIAS_JORNADAS -> {
                    if (_turnoSeleccionado.value == null) {
                        _errorMessage.value = "Debe seleccionar un turno"
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                }

                RequestType.LICENCIAS_DIAS -> {
                    if (_fechaFin.value == null) {
                        _errorMessage.value = "Debe seleccionar una fecha de fin"
                        _uiState.value = CreateRequestUiState.Idle
                        return@launch
                    }
                }

                RequestType.VESTUARIO -> {
                    // Solo requiere fecha inicio
                }
            }

            // Preparar datos
            _uiState.value = CreateRequestUiState.Loading

            val fechaInicioStr = _fechaInicio.value!!.format(DateTimeFormatter.ISO_LOCAL_DATE)

            // Determinar fecha fin según el tipo
            val fechaFinStr = when (type) {
                RequestType.VACACIONES, RequestType.LICENCIAS_DIAS ->
                    _fechaFin.value!!.format(DateTimeFormatter.ISO_LOCAL_DATE)
                else -> fechaInicioStr // Misma fecha para tipos de un solo día
            }

            // Determinar turno
            val turnoStr = when (type) {
                RequestType.ASUNTOS_PROPIOS,
                RequestType.LICENCIAS_JORNADAS,
                RequestType.COMPENSACION_GRUPOS,
                RequestType.HORAS_SINDICALES -> _turnoSeleccionado.value?.apiValue
                else -> null
            }

            Log.d(TAG, "Enviando solicitud: tipo=${type.apiValue}, fechaIni=$fechaInicioStr, fechaFin=$fechaFinStr, turno=$turnoStr, horas=$horas")

            // Enviar al servidor
            val result = requestsRepository.createRequest(
                idEmpleado = currentUser.id_empleado,
                tipo = type.apiValue,
                fechaInicio = fechaInicioStr,
                fechaFin = fechaFinStr,
                estado = "Pendiente",
                motivo = _motivo.value.takeIf { it.isNotBlank() },
                turno = turnoStr,
                horas = horas,
                file = _archivoAdjunto.value
            )

            result.fold(
                onSuccess = { request ->
                    Log.d(TAG, "✅ Solicitud creada con ID: ${request.id}")
                    _successMessage.value = "Solicitud enviada con éxito"
                    _uiState.value = CreateRequestUiState.Success("Solicitud enviada con éxito")
                    // Limpiar formulario después de éxito
                    resetForm()
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error al crear solicitud: ${error.message}")
                    _errorMessage.value = error.message ?: "Error al enviar la solicitud"
                    _uiState.value = CreateRequestUiState.Error(error.message ?: "Error desconocido")
                }
            )
        }
    }

    // ==========================================
    // HELPERS PARA UI
    // ==========================================

    /**
     * Obtiene información del saldo disponible para mostrar en UI
     */
    fun getBalanceInfo(user: User): Map<String, String> {
        return mapOf(
            "Vacaciones" to "${user.vacaciones ?: 0} días",
            "Asuntos Propios" to "${user.AP ?: 0} jornadas",
            "Salidas Personales" to "${user.SP ?: 0} horas",
            "Horas Sindicales" to "${user.horas_sindicales ?: 0} horas",
            "Módulo" to "${user.modulo ?: 0} días",
            "Comp. Grupos" to "${user.compensacion_grupos ?: 0} jornadas"
        )
    }

    /**
     * Obtiene el saldo específico para el tipo seleccionado
     */
    fun getCurrentBalance(user: User): String {
        return when (_selectedType.value) {
            RequestType.VACACIONES -> "${user.vacaciones ?: 0} días disponibles"
            RequestType.ASUNTOS_PROPIOS -> "${user.AP ?: 0} jornadas disponibles"
            RequestType.SALIDAS_PERSONALES -> "${user.SP ?: 0} horas disponibles"
            RequestType.HORAS_SINDICALES -> "${user.horas_sindicales ?: 0} horas disponibles"
            RequestType.MODULO -> "${user.modulo ?: 0} días disponibles"
            RequestType.COMPENSACION_GRUPOS -> "${user.compensacion_grupos ?: 0} jornadas disponibles"
            else -> ""
        }
    }
}