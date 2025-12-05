package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.repositories.AssignmentsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * ViewModel para las pantallas de Listas de Requerimientos
 *
 * Soporta 4 tipos de listas:
 * - 24h: Bomberos disponibles excluyendo guardias ayer/hoy/mañana
 * - 10h: Bomberos disponibles excluyendo SOLO guardia del día consultado
 * - Operadores Noche: Solo Operadores, excluyendo hoy y mañana
 * - Operadores Mañana: Solo Operadores, excluyendo hoy y ayer
 */
class RequirementListViewModel(
    private val assignmentsRepository: AssignmentsRepository
) : ViewModel() {

    companion object {
        private const val TAG = "RequirementListVM"
    }

    // ==========================================
    // TIPOS DE LISTA
    // ==========================================

    enum class ListType(
        val id: String,
        val title: String,
        val subtitle: String,
        val route: String
    ) {
        HOURS_24(
            id = "24h",
            title = "Lista de Requerimientos 24h",
            subtitle = "Bomberos disponibles para turnos de 24 horas",
            route = "requirement-list-24h"
        ),
        HOURS_10(
            id = "10h",
            title = "Lista de Requerimientos 10h",
            subtitle = "Bomberos disponibles para turnos de 10 horas",
            route = "requirement-list-10h"
        ),
        OPERATORS_NIGHT(
            id = "operators_night",
            title = "Operadores Noche",
            subtitle = "Operadores disponibles para turno de noche",
            route = "requirement-list-operators-night"
        ),
        OPERATORS_MORNING(
            id = "operators_morning",
            title = "Operadores Mañana",
            subtitle = "Operadores disponibles para turno de mañana",
            route = "requirement-list-operators-morning"
        )
    }

    // ==========================================
    // TIPOS DE FILTRO
    // ==========================================

    enum class FilterType(val id: String, val label: String, val placeholder: String) {
        PUESTO("puesto", "Puesto", "Buscar por puesto..."),
        NOMBRE("nombre", "Nombre/Apellido", "Buscar por nombre o apellido..."),
        DNI("dni", "Nº Funcionario", "Buscar por número de funcionario...")
    }

    data class Filter(
        val id: Int,
        val type: FilterType,
        val value: String = ""
    )

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<RequirementListUiState>(RequirementListUiState.Loading)
    val uiState: StateFlow<RequirementListUiState> = _uiState.asStateFlow()

    private val _firefighters = MutableStateFlow<List<User>>(emptyList())
    val firefighters: StateFlow<List<User>> = _firefighters.asStateFlow()

    private val _filteredFirefighters = MutableStateFlow<List<User>>(emptyList())
    val filteredFirefighters: StateFlow<List<User>> = _filteredFirefighters.asStateFlow()

    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()

    private val _filters = MutableStateFlow<List<Filter>>(listOf(Filter(1, FilterType.PUESTO, "")))
    val filters: StateFlow<List<Filter>> = _filters.asStateFlow()

    private var nextFilterId = 2

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // ==========================================
    // SEALED CLASS PARA ESTADO UI
    // ==========================================

    sealed class RequirementListUiState {
        object Loading : RequirementListUiState()
        object Success : RequirementListUiState()
        data class Error(val message: String) : RequirementListUiState()
    }

    // ==========================================
    // CARGA DE DATOS
    // ==========================================

    fun loadData(listType: ListType) {
        viewModelScope.launch {
            _uiState.value = RequirementListUiState.Loading

            val dateStr = _selectedDate.value.format(DateTimeFormatter.ISO_LOCAL_DATE)
            Log.d(TAG, "=== CARGANDO ${listType.title} - Fecha: $dateStr ===")

            val result = when (listType) {
                ListType.HOURS_24 -> assignmentsRepository.getAvailableFirefighters(dateStr)
                ListType.HOURS_10 -> assignmentsRepository.getAvailableFirefightersNoAdjacentDays(dateStr)
                ListType.OPERATORS_NIGHT -> assignmentsRepository.getAvailableFirefightersNoTodayAndTomorrow(dateStr)
                ListType.OPERATORS_MORNING -> assignmentsRepository.getAvailableFirefightersNoTodayAndYesterday(dateStr)
            }

            result.fold(
                onSuccess = { firefightersList ->
                    // Ordenar por horas_ofrecidas (asc), luego fecha_req (más antiguo primero), luego DNI (desc)
                    val sortedList = sortFirefighters(firefightersList)
                    _firefighters.value = sortedList
                    applyFilters()
                    _uiState.value = RequirementListUiState.Success
                    Log.d(TAG, "✅ ${sortedList.size} bomberos cargados")
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error: ${error.message}")
                    _uiState.value = RequirementListUiState.Error(error.message ?: "Error desconocido")
                    _errorMessage.value = error.message
                }
            )
        }
    }

    /**
     * Ordena los bomberos según la lógica de negocio:
     * 1. Por horas_ofrecidas (ascendente - menos horas primero)
     * 2. Por fecha_req (más antiguo primero)
     * 3. Por DNI (descendente)
     */
    private fun sortFirefighters(list: List<User>): List<User> {
        return list.sortedWith(
            compareBy<User> { it.horas_ofrecidas ?: 0.0 }
                .thenBy { it.fecha_req ?: "" }
                .thenByDescending { it.dni.toIntOrNull() ?: 0 }
        )
    }

    // ==========================================
    // NAVEGACIÓN DE FECHAS
    // ==========================================

    fun previousDay(listType: ListType) {
        _selectedDate.value = _selectedDate.value.minusDays(1)
        loadData(listType)
    }

    fun nextDay(listType: ListType) {
        _selectedDate.value = _selectedDate.value.plusDays(1)
        loadData(listType)
    }

    fun setDate(date: LocalDate, listType: ListType) {
        _selectedDate.value = date
        loadData(listType)
    }

    // ==========================================
    // GESTIÓN DE FILTROS
    // ==========================================

    fun addFilter(type: FilterType) {
        // No añadir si ya existe un filtro de ese tipo
        if (_filters.value.any { it.type == type }) return

        val newFilter = Filter(nextFilterId++, type, "")
        _filters.value = _filters.value + newFilter
    }

    fun updateFilter(filterId: Int, value: String) {
        _filters.value = _filters.value.map { filter ->
            if (filter.id == filterId) filter.copy(value = value) else filter
        }
        applyFilters()
    }

    fun removeFilter(filterId: Int) {
        // No eliminar si es el último filtro
        if (_filters.value.size <= 1) return

        _filters.value = _filters.value.filter { it.id != filterId }
        applyFilters()
    }

    fun clearFilters() {
        _filters.value = listOf(Filter(nextFilterId++, FilterType.PUESTO, ""))
        applyFilters()
    }

    /**
     * Obtiene los tipos de filtro disponibles (no usados actualmente)
     */
    fun getAvailableFilterTypes(): List<FilterType> {
        val usedTypes = _filters.value.map { it.type }
        return FilterType.entries.filter { it !in usedTypes }
    }

    /**
     * Aplica todos los filtros activos a la lista de bomberos
     */
    private fun applyFilters() {
        val allFirefighters = _firefighters.value
        val activeFilters = _filters.value

        val filtered = allFirefighters.filter { firefighter ->
            activeFilters.all { filter ->
                if (filter.value.isBlank()) return@all true

                val searchValue = filter.value.lowercase().trim()

                when (filter.type) {
                    FilterType.PUESTO -> {
                        firefighter.puesto?.lowercase()?.contains(searchValue) == true
                    }
                    FilterType.NOMBRE -> {
                        val nombreCompleto = "${firefighter.nombre} ${firefighter.apellido}".lowercase()
                        nombreCompleto.contains(searchValue)
                    }
                    FilterType.DNI -> {
                        firefighter.dni.contains(searchValue)
                    }
                }
            }
        }

        _filteredFirefighters.value = filtered
    }

    // ==========================================
    // HELPERS
    // ==========================================

    fun clearError() {
        _errorMessage.value = null
    }

    /**
     * Obtiene estadísticas de la lista actual
     */
    fun getStats(): Stats {
        return Stats(
            total = _firefighters.value.size,
            filtered = _filteredFirefighters.value.size,
            date = _selectedDate.value
        )
    }

    data class Stats(
        val total: Int,
        val filtered: Int,
        val date: LocalDate
    )

    /**
     * Formatea la fecha de requerimiento para mostrar
     */
    fun formatFechaReq(fechaReq: String?): String {
        if (fechaReq.isNullOrBlank()) return "-"

        return try {
            // El formato viene como "2024-01-15 10:30:45" o similar
            val parts = fechaReq.split(" ")
            if (parts.size >= 2) {
                val datePart = parts[0].split("-")
                val timePart = parts[1].split(":")
                if (datePart.size >= 3 && timePart.size >= 2) {
                    "${datePart[2]}/${datePart[1]}/${datePart[0]} ${timePart[0]}:${timePart[1]}"
                } else {
                    fechaReq
                }
            } else {
                fechaReq
            }
        } catch (e: Exception) {
            fechaReq
        }
    }

    /**
     * Formatea las horas ofrecidas para mostrar
     */
    fun formatHoras(horas: Double?): String {
        if (horas == null) return "0"
        return if (horas == horas.toLong().toDouble()) {
            horas.toLong().toString()
        } else {
            String.format("%.1f", horas)
        }
    }
}