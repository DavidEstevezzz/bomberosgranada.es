package es.bomberosgranada.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.Guard
import es.bomberosgranada.app.data.repositories.BrigadeCompositionRepository
import es.bomberosgranada.app.data.repositories.GuardsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate

class GuardDetailViewModel(
    private val guardsRepository: GuardsRepository,
    private val brigadeCompositionRepository: BrigadeCompositionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<GuardDetailUiState>(GuardDetailUiState.Loading)
    val uiState: StateFlow<GuardDetailUiState> = _uiState.asStateFlow()

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
                val attendees = composition.firefighters.map { firefighter ->
                    val statusForDay = firefighter.guard_status?.get(date)
                    Attendee(
                        id = firefighter.id_empleado,
                        name = "${firefighter.nombre} ${firefighter.apellido}",
                        position = firefighter.puesto ?: "",
                        available = statusForDay?.available ?: true,
                        reason = statusForDay?.reason
                    )
                }

                _uiState.value = GuardDetailUiState.Success(
                    guard = guard,
                    brigadeName = composition.brigade.nombre,
                    date = localDate,
                    attendees = attendees
                )
            } catch (e: Exception) {
                val message = e.message ?: "Error desconocido"
                _uiState.value = GuardDetailUiState.Error(message)
            }
        }
    }
}

sealed class GuardDetailUiState {
    object Loading : GuardDetailUiState()
    data class Success(
        val guard: Guard,
        val brigadeName: String,
        val date: LocalDate,
        val attendees: List<Attendee>
    ) : GuardDetailUiState()

    data class Error(val message: String) : GuardDetailUiState()
}

data class Attendee(
    val id: Int,
    val name: String,
    val position: String,
    val available: Boolean,
    val reason: String?
)