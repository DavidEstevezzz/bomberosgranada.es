package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.Brigade
import es.bomberosgranada.app.data.models.Guard
import es.bomberosgranada.app.data.repositories.BrigadesRepository
import es.bomberosgranada.app.data.repositories.GuardsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth

/**
 * ViewModel para el Dashboard principal
 *
 * Maneja:
 * - Lista de guardias del mes actual
 * - Lista de brigadas (Norte y Sur)
 * - Navegación a detalles de brigada
 * - Estados de carga y error
 */
class DashboardViewModel(
    private val guardsRepository: GuardsRepository,
    private val brigadesRepository: BrigadesRepository
) : ViewModel() {

    companion object {
        private const val TAG = "DashboardViewModel"
    }

    // ============================================
    // ESTADOS UI
    // ============================================

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _guards = MutableStateFlow<List<Guard>>(emptyList())
    val guards: StateFlow<List<Guard>> = _guards.asStateFlow()

    private val _brigades = MutableStateFlow<List<Brigade>>(emptyList())
    val brigades: StateFlow<List<Brigade>> = _brigades.asStateFlow()

    private val _currentMonth = MutableStateFlow(YearMonth.now())
    val currentMonth: StateFlow<YearMonth> = _currentMonth.asStateFlow()

    // Mapa de brigadas por ID para acceso rápido
    private val _brigadeMap = MutableStateFlow<Map<Int, String>>(emptyMap())
    val brigadeMap: StateFlow<Map<Int, String>> = _brigadeMap.asStateFlow()

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    init {
        Log.d(TAG, "DashboardViewModel inicializado")
        loadDashboardData()
    }

    // ============================================
    // FUNCIONES PÚBLICAS
    // ============================================

    /**
     * Carga todos los datos necesarios para el dashboard
     */
    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Loading

            try {
                Log.d(TAG, "Cargando datos del dashboard...")

                // Cargar brigadas primero
                val brigadesResult = brigadesRepository.getAllBrigades()
                if (brigadesResult.isSuccess) {
                    val brigadesData = brigadesResult.getOrNull() ?: emptyList<Brigade>()
                    _brigades.value = brigadesData

                    // Crear mapa de brigadas
                    val map = brigadesData.associate {
                        it.id_brigada to it.nombre
                    }
                    _brigadeMap.value = map

                    Log.d(TAG, "✓ Brigadas cargadas: ${brigadesData.size}")
                } else {
                    Log.e(TAG, "Error al cargar brigadas: ${brigadesResult.exceptionOrNull()?.message}")
                }

                // Cargar guardias
                val guardsResult = guardsRepository.getGuards()
                if (guardsResult.isSuccess) {
                    val guardsData = guardsResult.getOrNull() ?: emptyList<Guard>()
                    _guards.value = guardsData
                    Log.d(TAG, "✓ Guardias cargadas: ${guardsData.size}")

                    _uiState.value = DashboardUiState.Success
                } else {
                    val error = guardsResult.exceptionOrNull()?.message ?: "Error desconocido"
                    Log.e(TAG, "Error al cargar guardias: $error")
                    _uiState.value = DashboardUiState.Error(error)
                }

            } catch (e: Exception) {
                val errorMessage = "Error al cargar el dashboard: ${e.message}"
                Log.e(TAG, errorMessage, e)
                _uiState.value = DashboardUiState.Error(errorMessage)
            }
        }
    }

    /**
     * Refresca los datos del dashboard
     */
    fun refresh() {
        Log.d(TAG, "Refrescando dashboard...")
        loadDashboardData()
    }

    /**
     * Cambia el mes actual del calendario
     */
    fun changeMonth(yearMonth: YearMonth) {
        _currentMonth.value = yearMonth
        Log.d(TAG, "Mes cambiado a: $yearMonth")
    }

    /**
     * Obtiene la guardia para una fecha específica
     */
    fun getGuardForDate(date: LocalDate): Guard? {
        return _guards.value.find { guard ->
            guard.date == date.toString()
        }
    }

    /**
     * Obtiene la brigada para una guardia y parque específicos
     */
    fun getBrigadeForGuard(guard: Guard, parkId: Int): Brigade? {
        return _brigades.value.find { brigade ->
            brigade.nombre == _brigadeMap.value[guard.id_brigada] &&
                    brigade.id_parque == parkId
        }
    }

    /**
     * Obtiene el nombre de la brigada por ID
     */
    fun getBrigadeName(brigadeId: Int): String {
        return _brigadeMap.value[brigadeId] ?: "Desconocida"
    }

    /**
     * Verifica si hay una guardia asignada para una fecha
     */
    fun hasGuardOnDate(date: LocalDate): Boolean {
        return getGuardForDate(date) != null
    }

    /**
     * Obtiene el color de la brigada para el calendario
     */
    fun getBrigadeColor(brigadeId: Int): String {
        // Colores según el nombre de la brigada
        return when (_brigadeMap.value[brigadeId]) {
            "A" -> "#DC2626" // Rojo
            "B" -> "#2563EB" // Azul
            "C" -> "#16A34A" // Verde
            "D" -> "#F59E0B" // Ámbar
            "E" -> "#9333EA" // Púrpura
            else -> "#64748B" // Gris por defecto
        }
    }

    /**
     * Obtiene estadísticas del mes actual
     */
    fun getMonthStats(): MonthStats {
        val currentMonthGuards = _guards.value.filter { guard ->
            val guardDate = LocalDate.parse(guard.date)
            val guardMonth = YearMonth.from(guardDate)
            guardMonth == _currentMonth.value
        }

        val brigadeStats = currentMonthGuards.groupBy { it.id_brigada }
            .mapValues { it.value.size }

        return MonthStats(
            totalGuards = currentMonthGuards.size,
            brigadeStats = brigadeStats,
            month = _currentMonth.value
        )
    }
}

// ============================================
// ESTADOS UI
// ============================================

sealed class DashboardUiState {
    object Loading : DashboardUiState()
    object Success : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

// ============================================
// DATA CLASSES
// ============================================

data class MonthStats(
    val totalGuards: Int,
    val brigadeStats: Map<Int, Int>,
    val month: YearMonth
)