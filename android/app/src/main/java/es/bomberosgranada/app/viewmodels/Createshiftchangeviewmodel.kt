package es.bomberosgranada.app.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.repositories.ShiftChangeRequestsRepository
import es.bomberosgranada.app.data.repositories.UsersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.Normalizer
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * ViewModel para la pantalla de creación de cambio de guardia
 *
 * Funcionalidades:
 * - Cambio Simple: Intercambio de una guardia entre dos bomberos
 * - Cambio Espejo: Intercambio doble con dos fechas (ida y vuelta)
 *
 * El backend calcula automáticamente las brigadas de cada empleado
 */
class CreateShiftChangeViewModel(
    private val shiftChangeRepository: ShiftChangeRequestsRepository,
    private val usersRepository: UsersRepository
) : ViewModel() {

    companion object {
        private const val TAG = "CreateShiftChangeVM"
    }

    // ==========================================
    // ESTADOS
    // ==========================================

    private val _uiState = MutableStateFlow<CreateShiftChangeUiState>(CreateShiftChangeUiState.Idle)
    val uiState: StateFlow<CreateShiftChangeUiState> = _uiState.asStateFlow()

    private val _changeType = MutableStateFlow(ChangeType.SIMPLE)
    val changeType: StateFlow<ChangeType> = _changeType.asStateFlow()

    // Lista de empleados disponibles para seleccionar
    private val _employees = MutableStateFlow<List<User>>(emptyList())
    val employees: StateFlow<List<User>> = _employees.asStateFlow()

    // Búsqueda y selección de empleado 1 (solo para jefes)
    private val _searchTerm1 = MutableStateFlow("")
    val searchTerm1: StateFlow<String> = _searchTerm1.asStateFlow()

    private val _selectedEmployee1 = MutableStateFlow<User?>(null)
    val selectedEmployee1: StateFlow<User?> = _selectedEmployee1.asStateFlow()

    // Búsqueda y selección de empleado 2
    private val _searchTerm2 = MutableStateFlow("")
    val searchTerm2: StateFlow<String> = _searchTerm2.asStateFlow()

    private val _selectedEmployee2 = MutableStateFlow<User?>(null)
    val selectedEmployee2: StateFlow<User?> = _selectedEmployee2.asStateFlow()

    // Fechas
    private val _fecha1 = MutableStateFlow<LocalDate?>(null)
    val fecha1: StateFlow<LocalDate?> = _fecha1.asStateFlow()

    private val _fecha2 = MutableStateFlow<LocalDate?>(null)
    val fecha2: StateFlow<LocalDate?> = _fecha2.asStateFlow()

    // Turno (solo para cambio simple)
    private val _turnoSeleccionado = MutableStateFlow(Turno.DIA_COMPLETO)
    val turnoSeleccionado: StateFlow<Turno> = _turnoSeleccionado.asStateFlow()

    // Motivo
    private val _motivo = MutableStateFlow("")
    val motivo: StateFlow<String> = _motivo.asStateFlow()

    // Mensajes
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // Estado de carga de empleados
    private val _loadingEmployees = MutableStateFlow(false)
    val loadingEmployees: StateFlow<Boolean> = _loadingEmployees.asStateFlow()

    // ==========================================
    // ENUMS
    // ==========================================

    enum class ChangeType(val displayName: String, val description: String) {
        SIMPLE(
            "Cambio Simple",
            "Intercambia una guardia concreta con otro compañero manteniendo el resto del cuadrante."
        ),
        ESPEJO(
            "Cambio Espejo",
            "Intercambio doble donde cada uno cubre la guardia del otro en distintas fechas. Las guardias deben ser seguidas."
        )
    }

    enum class Turno(val displayName: String, val apiValue: String) {
        DIA_COMPLETO("Día Completo", "Dia Completo"),
        MANANA("Mañana", "Mañana"),
        TARDE("Tarde", "Tarde"),
        NOCHE("Noche", "Noche"),
        MANANA_TARDE("Mañana y Tarde", "Mañana y tarde"),
        TARDE_NOCHE("Tarde y Noche", "Tarde y noche")
    }

    sealed class CreateShiftChangeUiState {
        object Idle : CreateShiftChangeUiState()
        object Loading : CreateShiftChangeUiState()
        object LoadingEmployees : CreateShiftChangeUiState()
        data class Success(val message: String) : CreateShiftChangeUiState()
        data class Error(val message: String) : CreateShiftChangeUiState()
    }

    // ==========================================
    // INICIALIZACIÓN Y CARGA DE EMPLEADOS
    // ==========================================

    /**
     * Carga los empleados según el tipo de usuario:
     * - Si es jefe: carga todos los empleados
     * - Si no es jefe: carga solo bomberos del mismo puesto
     */
    fun loadEmployees(currentUser: User) {
        viewModelScope.launch {
            _loadingEmployees.value = true
            _uiState.value = CreateShiftChangeUiState.LoadingEmployees

            try {
                val isJefe = currentUser.type.lowercase() == "jefe"

                val result = if (isJefe) {
                    Log.d(TAG, "Usuario es jefe, cargando todos los empleados")
                    usersRepository.getAllUsers()
                } else {
                    val puesto = currentUser.puesto
                    if (puesto.isNullOrEmpty()) {
                        Log.w(TAG, "Usuario sin puesto definido, cargando todos")
                        usersRepository.getAllUsers()
                    } else {
                        Log.d(TAG, "Cargando empleados del puesto: $puesto")
                        usersRepository.getUsersByPosition(puesto)
                    }
                }

                result.fold(
                    onSuccess = { users ->
                        Log.d(TAG, "✅ ${users.size} empleados cargados")
                        _employees.value = users

                        // Si no es jefe, establecer automáticamente como empleado 1
                        if (!isJefe) {
                            _selectedEmployee1.value = currentUser
                        }

                        _uiState.value = CreateShiftChangeUiState.Idle
                    },
                    onFailure = { error ->
                        Log.e(TAG, "❌ Error cargando empleados: ${error.message}")
                        _errorMessage.value = "Error al cargar empleados: ${error.message}"
                        _uiState.value = CreateShiftChangeUiState.Error(error.message ?: "Error desconocido")
                    }
                )
            } finally {
                _loadingEmployees.value = false
            }
        }
    }

    // ==========================================
    // FUNCIONES DE ACTUALIZACIÓN
    // ==========================================

    fun setChangeType(type: ChangeType) {
        _changeType.value = type
        // Si es cambio espejo, forzar turno a Día Completo
        if (type == ChangeType.ESPEJO) {
            _turnoSeleccionado.value = Turno.DIA_COMPLETO
        }
        // Limpiar fecha2 si cambiamos a simple
        if (type == ChangeType.SIMPLE) {
            _fecha2.value = null
        }
        _errorMessage.value = null
    }

    fun setSearchTerm1(term: String) {
        _searchTerm1.value = term
    }

    fun setSearchTerm2(term: String) {
        _searchTerm2.value = term
    }

    fun selectEmployee1(employee: User?) {
        _selectedEmployee1.value = employee
        _searchTerm1.value = ""
        // Si seleccionamos el mismo que employee2, limpiar employee2
        if (employee != null && employee.id_empleado == _selectedEmployee2.value?.id_empleado) {
            _selectedEmployee2.value = null
        }
        _errorMessage.value = null
    }

    fun selectEmployee2(employee: User?) {
        _selectedEmployee2.value = employee
        _searchTerm2.value = ""
        _errorMessage.value = null
    }

    fun setFecha1(date: LocalDate?) {
        _fecha1.value = date
        _errorMessage.value = null
    }

    fun setFecha2(date: LocalDate?) {
        _fecha2.value = date
        _errorMessage.value = null
    }

    fun setTurno(turno: Turno) {
        _turnoSeleccionado.value = turno
        _errorMessage.value = null
    }

    fun setMotivo(text: String) {
        _motivo.value = text
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun clearSuccess() {
        _successMessage.value = null
    }

    // ==========================================
    // FILTRADO DE EMPLEADOS
    // ==========================================

    /**
     * Elimina acentos/diacríticos de una cadena para búsqueda
     */
    private fun removeDiacritics(str: String): String {
        return Normalizer.normalize(str, Normalizer.Form.NFD)
            .replace(Regex("[\\p{InCombiningDiacriticalMarks}]"), "")
    }

    /**
     * Filtra empleados para el selector 1 (solo cuando es jefe)
     */
    fun getFilteredEmployees1(): List<User> {
        val term = removeDiacritics(_searchTerm1.value.lowercase())
        if (term.isEmpty()) return emptyList()

        return _employees.value.filter { emp ->
            val fullName = "${emp.nombre} ${emp.apellido}".lowercase()
            val normalizedName = removeDiacritics(fullName)
            val dni = emp.dni.lowercase()

            normalizedName.contains(term) || removeDiacritics(dni).contains(term)
        }.take(10) // Limitar resultados para rendimiento
    }

    /**
     * Filtra empleados para el selector 2
     * Excluye al empleado 1 si está seleccionado
     */
    fun getFilteredEmployees2(): List<User> {
        val term = removeDiacritics(_searchTerm2.value.lowercase())
        if (term.isEmpty()) return emptyList()

        val employee1Id = _selectedEmployee1.value?.id_empleado

        return _employees.value.filter { emp ->
            // Excluir empleado 1
            if (emp.id_empleado == employee1Id) return@filter false

            val fullName = "${emp.nombre} ${emp.apellido}".lowercase()
            val normalizedName = removeDiacritics(fullName)
            val dni = emp.dni.lowercase()

            normalizedName.contains(term) || removeDiacritics(dni).contains(term)
        }.take(10)
    }

    // ==========================================
    // VALIDACIONES
    // ==========================================

    private fun validate(currentUser: User): Boolean {
        val isJefe = currentUser.type.lowercase() == "jefe"

        // Validar empleado 1
        if (_selectedEmployee1.value == null) {
            _errorMessage.value = if (isJefe) {
                "Selecciona el primer bombero para completar la solicitud"
            } else {
                "Error: No se pudo identificar tu usuario"
            }
            return false
        }

        // Validar empleado 2
        if (_selectedEmployee2.value == null) {
            _errorMessage.value = "Selecciona un compañero para completar la solicitud"
            return false
        }

        // Validar que no sean el mismo
        if (_selectedEmployee1.value!!.id_empleado == _selectedEmployee2.value!!.id_empleado) {
            _errorMessage.value = "Los dos bomberos seleccionados deben ser diferentes"
            return false
        }

        // Validar fecha 1
        if (_fecha1.value == null) {
            _errorMessage.value = "Selecciona la fecha del cambio"
            return false
        }

        // Validar fecha 2 para cambio espejo
        if (_changeType.value == ChangeType.ESPEJO && _fecha2.value == null) {
            _errorMessage.value = "Selecciona la segunda fecha para el cambio espejo"
            return false
        }

        return true
    }

    // ==========================================
    // ENVÍO DE SOLICITUD
    // ==========================================

    fun submitRequest(currentUser: User) {
        if (!validate(currentUser)) {
            return
        }

        viewModelScope.launch {
            _uiState.value = CreateShiftChangeUiState.Loading

            val isJefe = currentUser.type.lowercase() == "jefe"
            val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

            // Preparar datos
            val idEmpleado1 = _selectedEmployee1.value!!.id_empleado
            val idEmpleado2 = _selectedEmployee2.value!!.id_empleado
            val fecha = _fecha1.value!!.format(dateFormatter)
            val fecha2Str = if (_changeType.value == ChangeType.ESPEJO) {
                _fecha2.value?.format(dateFormatter)
            } else null
            val turno = if (_changeType.value == ChangeType.ESPEJO) {
                "Dia Completo"
            } else {
                _turnoSeleccionado.value.apiValue
            }
            val motivoText = if (isJefe && _motivo.value.isNotBlank()) {
                "[Solicitado por jefe] ${_motivo.value}"
            } else {
                _motivo.value
            }

            Log.d(TAG, "Enviando solicitud de cambio de guardia:")
            Log.d(TAG, "  Empleado1: $idEmpleado1, Empleado2: $idEmpleado2")
            Log.d(TAG, "  Fecha: $fecha, Fecha2: $fecha2Str")
            Log.d(TAG, "  Turno: $turno, Tipo: ${_changeType.value}")

            val result = shiftChangeRepository.createShiftChangeRequest(
                idEmpleado1 = idEmpleado1,
                idEmpleado2 = idEmpleado2,
                fecha = fecha,
                fecha2 = fecha2Str,
                turno = turno,
                motivo = motivoText,
                estado = "en_tramite" // El compañero debe aceptar
            )

            result.fold(
                onSuccess = { shiftChange ->
                    Log.d(TAG, "✅ Solicitud creada con ID: ${shiftChange.id}")
                    _successMessage.value = "Solicitud de cambio de guardia enviada con éxito"
                    _uiState.value = CreateShiftChangeUiState.Success("Solicitud enviada")
                    resetForm(currentUser)
                },
                onFailure = { error ->
                    Log.e(TAG, "❌ Error al crear solicitud: ${error.message}")
                    _errorMessage.value = error.message ?: "Error al enviar la solicitud"
                    _uiState.value = CreateShiftChangeUiState.Error(error.message ?: "Error desconocido")
                }
            )
        }
    }

    // ==========================================
    // RESET
    // ==========================================

    fun resetForm(currentUser: User? = null) {
        _changeType.value = ChangeType.SIMPLE
        _searchTerm1.value = ""
        _searchTerm2.value = ""
        // Mantener empleado 1 si no es jefe
        if (currentUser != null && currentUser.type.lowercase() != "jefe") {
            _selectedEmployee1.value = currentUser
        } else {
            _selectedEmployee1.value = null
        }
        _selectedEmployee2.value = null
        _fecha1.value = null
        _fecha2.value = null
        _turnoSeleccionado.value = Turno.DIA_COMPLETO
        _motivo.value = ""
        _errorMessage.value = null
        _uiState.value = CreateShiftChangeUiState.Idle
    }

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Obtiene los turnos disponibles para el selector
     */
    fun getAvailableTurnos(): List<Turno> {
        return Turno.entries
    }

    /**
     * Determina si el usuario actual es jefe
     */
    fun isJefe(currentUser: User?): Boolean {
        return currentUser?.type?.lowercase() == "jefe"
    }
}