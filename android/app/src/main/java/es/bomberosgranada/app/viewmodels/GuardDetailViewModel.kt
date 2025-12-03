package es.bomberosgranada.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.*
import es.bomberosgranada.app.data.repositories.BrigadeCompositionRepository
import es.bomberosgranada.app.data.repositories.BrigadesRepository
import es.bomberosgranada.app.data.repositories.GuardAssignmentsRepository
import es.bomberosgranada.app.data.repositories.GuardsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate

class GuardDetailViewModel(
    private val guardsRepository: GuardsRepository,
    private val brigadeCompositionRepository: BrigadeCompositionRepository,
    private val brigadesRepository: BrigadesRepository,
    private val guardAssignmentsRepository: GuardAssignmentsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<GuardDetailUiState>(GuardDetailUiState.Loading)
    val uiState: StateFlow<GuardDetailUiState> = _uiState.asStateFlow()

    // Estado de las asignaciones por turno
    private val _assignments = MutableStateFlow<Map<String, Map<Int, String>>>(
        mapOf(
            "Mañana" to emptyMap(),
            "Tarde" to emptyMap(),
            "Noche" to emptyMap()
        )
    )
    val assignments: StateFlow<Map<String, Map<Int, String>>> = _assignments.asStateFlow()

    // Estado de guardado de asignaciones
    private val _savingAssignment = MutableStateFlow<SavingState>(SavingState.Idle)
    val savingAssignment: StateFlow<SavingState> = _savingAssignment.asStateFlow()

    // Información del parque para filtrar opciones
    private var currentParkName: String = ""
    private var currentGuardId: Int = 0

    fun loadGuardDetails(guardId: Int, brigadeId: Int, parkId: Int, date: String) {
        viewModelScope.launch {
            _uiState.value = GuardDetailUiState.Loading

            try {
                val guardResult = guardsRepository.getGuard(guardId)
                if (guardResult.isFailure) {
                    val error = guardResult.exceptionOrNull()?.message ?: "Error cargando la guardia"
                    _uiState.value = GuardDetailUiState.Error(error)
                    return@launch
                }
                val guard = guardResult.getOrThrow()
                currentGuardId = guard.id

                val localDate = LocalDate.parse(date)
                val compositionResult = brigadeCompositionRepository.getBrigadeComposition(
                    brigadeId,
                    parkId,
                    localDate.year,
                    localDate.monthValue
                )

                if (compositionResult.isFailure) {
                    val error = compositionResult.exceptionOrNull()?.message ?: "Error cargando asistentes"
                    _uiState.value = GuardDetailUiState.Error(error)
                    return@launch
                }

                val composition = compositionResult.getOrThrow()

                // Guardar nombre del parque para filtrar opciones
                currentParkName = composition.brigade.park?.nombre ?: ""

                val brigadeFirefightersResult = brigadesRepository.getFirefightersByBrigade(
                    brigadeId,
                    date
                )

                if (brigadeFirefightersResult.isFailure) {
                    val error = brigadeFirefightersResult.exceptionOrNull()?.message
                        ?: "Error cargando las asignaciones"
                    _uiState.value = GuardDetailUiState.Error(error)
                    return@launch
                }

                val brigadeFirefighters = brigadeFirefightersResult.getOrThrow().firefighters
                val compositionStatusMap = composition.firefighters.associateBy { it.id_empleado }

                val attendees = brigadeFirefighters.map { firefighter ->
                    val statusForDay = compositionStatusMap[firefighter.id_empleado]?.guard_status?.get(date)
                    Attendee(
                        id = firefighter.id_empleado,
                        name = "${firefighter.nombre} ${firefighter.apellido}",
                        position = firefighter.puesto ?: "",
                        shift = firefighter.turno ?: "",
                        assignment = "",  // Se cargará después desde guard_assignments
                        available = statusForDay?.available ?: true,
                        reason = statusForDay?.reason,
                        // Nuevos campos para R y CG
                        isRequerimiento = firefighter.requerimiento ?: false,
                        hasChangeRequest = firefighter.id_change_request != null,
                        tipoAsignacion = firefighter.tipo_asignacion,
                        cambioConNombre = firefighter.cambio_con  // Nombre del otro bombero en CG
                    )
                }

                // Cargar asignaciones existentes
                loadAssignments(guardId)

                _uiState.value = GuardDetailUiState.Success(
                    guard = guard,
                    brigadeName = composition.brigade.nombre,
                    parkName = currentParkName,
                    date = localDate,
                    attendees = attendees
                )
            } catch (e: Exception) {
                val message = e.message ?: "Error desconocido"
                _uiState.value = GuardDetailUiState.Error(message)
            }
        }
    }

    /**
     * Carga las asignaciones existentes para una guardia
     */
    private suspend fun loadAssignments(guardId: Int) {
        val result = guardAssignmentsRepository.getAssignmentsByShift(guardId)
        if (result.isSuccess) {
            _assignments.value = result.getOrThrow()
        }
    }

    /**
     * Actualiza una asignación de un bombero
     */
    fun updateAssignment(shift: String, employeeId: Int, assignment: String) {
        viewModelScope.launch {
            _savingAssignment.value = SavingState.Saving(employeeId, shift)

            try {
                val result = guardAssignmentsRepository.updateOrCreateAssignment(
                    guardId = currentGuardId,
                    employeeId = employeeId,
                    shift = shift,
                    assignment = assignment
                )

                if (result.isSuccess) {
                    // Actualizar el estado local
                    val currentAssignments = _assignments.value.toMutableMap()
                    val shiftAssignments = currentAssignments[shift]?.toMutableMap() ?: mutableMapOf()
                    shiftAssignments[employeeId] = assignment
                    currentAssignments[shift] = shiftAssignments
                    _assignments.value = currentAssignments

                    _savingAssignment.value = SavingState.Success(employeeId, shift)
                } else {
                    _savingAssignment.value = SavingState.Error(
                        employeeId,
                        shift,
                        result.exceptionOrNull()?.message ?: "Error guardando"
                    )
                }
            } catch (e: Exception) {
                _savingAssignment.value = SavingState.Error(
                    employeeId,
                    shift,
                    e.message ?: "Error desconocido"
                )
            }
        }
    }

    /**
     * Obtiene la asignación actual de un bombero para un turno
     */
    fun getAssignment(shift: String, employeeId: Int): String {
        return _assignments.value[shift]?.get(employeeId) ?: ""
    }

    /**
     * Obtiene las opciones de asignación filtradas según el puesto y parque
     */
    fun getFilteredOptions(position: String): List<String> {
        return AssignmentOptions.getFilteredOptions(position, currentParkName)
    }

    /**
     * Obtiene el mapeo de vehículos para una asignación
     */
    fun getVehicleForAssignment(assignment: String): String? {
        val mapping = AssignmentOptions.getVehicleMapping(currentParkName)
        return mapping[assignment]
    }

    /**
     * Limpia el estado de guardado
     */
    fun clearSavingState() {
        _savingAssignment.value = SavingState.Idle
    }

    // ==========================================
    // ESTADOS UI
    // ==========================================

    sealed class GuardDetailUiState {
        object Loading : GuardDetailUiState()
        data class Success(
            val guard: Guard,
            val brigadeName: String,
            val parkName: String,
            val date: LocalDate,
            val attendees: List<Attendee>
        ) : GuardDetailUiState()

        data class Error(val message: String) : GuardDetailUiState()
    }

    sealed class SavingState {
        object Idle : SavingState()
        data class Saving(val employeeId: Int, val shift: String) : SavingState()
        data class Success(val employeeId: Int, val shift: String) : SavingState()
        data class Error(val employeeId: Int, val shift: String, val message: String) : SavingState()
    }

    /**
     * Modelo de asistente con información de requerimiento y cambio de guardia
     */
    data class Attendee(
        val id: Int,
        val name: String,
        val position: String,
        val shift: String,
        val assignment: String,
        val available: Boolean,
        val reason: String?,
        // Campos para indicadores especiales
        val isRequerimiento: Boolean = false,      // True si viene por requerimiento
        val hasChangeRequest: Boolean = false,     // True si tiene un cambio de guardia
        val tipoAsignacion: String? = null,        // "ida" o "vuelta" para CG
        val cambioConNombre: String? = null        // Nombre del otro bombero en CG
    )
}