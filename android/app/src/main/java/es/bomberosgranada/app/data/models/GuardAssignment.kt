package es.bomberosgranada.app.data.models

/**
 * Modelo de asignación de guardia
 * Representa la asignación de un bombero a un puesto específico (B1, B2, C1, etc.)
 * durante un turno de una guardia específica
 */
data class GuardAssignment(
    val id: Int,
    val id_guard: Int,
    val id_empleado: Int,
    val turno: String,
    val asignacion: String,
    val created_at: String?,
    val updated_at: String?
)

/**
 * Request para crear una nueva asignación de guardia
 */
data class CreateGuardAssignmentRequest(
    val id_guard: Int,
    val id_empleado: Int,
    val turno: String,
    val asignacion: String
)

/**
 * Request para actualizar una asignación existente
 */
data class UpdateGuardAssignmentRequest(
    val id_guard: Int,
    val id_empleado: Int,
    val turno: String,
    val asignacion: String
)

/**
 * Request para actualizar o crear una asignación (upsert)
 * Este es el endpoint principal usado para cambiar asignaciones
 */
data class UpdateOrCreateGuardAssignmentRequest(
    val id_guard: Int,
    val id_empleado: Int,
    val turno: String,
    val asignacion: String
)

/**
 * Opciones de asignación disponibles según el puesto y parque
 */
object AssignmentOptions {

    // Todas las opciones disponibles
    val allOptions = listOf(
        "N1", "N2", "N3", "N4",           // Subinspector/Oficial Norte
        "S1", "S2", "S3",                  // Subinspector/Oficial Sur
        "B1", "B2", "B3", "B4", "B5",      // Bomberos
        "B6", "B7", "B8", "B9",
        "C1", "C2", "C3", "C4", "C5",      // Conductores
        "Operador 1", "Operador 2", "Operador 3",
        "Telefonista",
        "Jefe de Guardia"
    )

    /**
     * Filtra las opciones de asignación según el puesto del bombero y el parque
     */
    fun getFilteredOptions(puesto: String, parkName: String): List<String> {
        val isSur = parkName.lowercase().contains("sur")

        return when (puesto) {
            "Bombero" -> {
                if (isSur) {
                    // Parque Sur: opciones B y Telefonista
                    allOptions.filter { it.startsWith("B") || it.startsWith("T") }
                } else {
                    // Parque Norte: solo opciones B
                    allOptions.filter { it.startsWith("B") }
                }
            }
            "Conductor" -> {
                if (isSur) {
                    allOptions.filter { it.startsWith("C") || it.startsWith("T") }
                } else {
                    allOptions.filter { it.startsWith("C") }
                }
            }
            "Operador" -> {
                allOptions.filter { it.lowercase().contains("operador") }
            }
            "Subinspector", "Oficial" -> {
                if (isSur) {
                    allOptions.filter { it.startsWith("S") || it.startsWith("J") }
                } else {
                    allOptions.filter { it.startsWith("N") || it.startsWith("J") }
                }
            }
            else -> allOptions
        }
    }

    /**
     * Mapeo de vehículos por asignación - Parque Norte
     */
    val vehicleMappingNorte = mapOf(
        "B1" to "BUL-3-7 / BRP-1",
        "B2" to "BUL-3-7 / BRP-1",
        "B3" to "FSV-3 / BIP-1 / BUL-1 / UMC-1 / UPI-1",
        "B4" to "FSV-3 / BIP-1 / BUL-1 / UMC-1 / UPI-1",
        "B5" to "AEA-3 / VAT-1 / UBH-1 / UPC-1-3 / BNP-1",
        "B6" to "AEA-3 / VAT-1 / UBH-1 / UPC-1-3 / BNP-1",
        "B7" to "Apoyo equipo 2 (B3 y B4)",
        "B8" to "Apoyo equipo 3 (B5 y B6)",
        "B9" to "Apoyo",
        "C1" to "BUL-1-3 / BRP-1 / UPC-1-3",
        "C2" to "AEA-3 / UBH-1 / BIP-1 / UPI-1",
        "C3" to "FSV-3 / UMC-1 / BNP-1 / BUL-7 / VAT-1",
        "C4" to "Apoyo",
        "C5" to "Apoyo"
    )

    /**
     * Mapeo de vehículos por asignación - Parque Sur
     */
    val vehicleMappingSur = mapOf(
        "B1" to "BUL-4-6 / BRP-2",
        "B2" to "BUL-4-6 / BRP-2",
        "B3" to "FSV-4 / BIP-2 / BUL-2 / UMC-2 / UP-2",
        "B4" to "FSV-4 / BIP-2 / BUL-2 / UMC-2 / UP-2",
        "B5" to "AEA-4-6 / VAT-2 / UBH-2 / UPC-2",
        "B6" to "AEA-4-6 / VAT-2 / UBH-2 / UPC-2",
        "B7" to "Apoyo equipo 2 (B3 y B4)",
        "B8" to "Apoyo equipo 3 (B5 y B6)",
        "B9" to "Apoyo",
        "C1" to "BUL-2-4 / BRP-2 / UPC-2",
        "C2" to "AEA-4-6 / UBH-2 / UPI-2",
        "C3" to "FSV-4 / BIP-2 / UMC-2 / BUL-6 / VAT-2",
        "C4" to "Apoyo",
        "C5" to "Apoyo"
    )

    /**
     * Obtiene el mapeo de vehículos según el parque
     */
    fun getVehicleMapping(parkName: String): Map<String, String> {
        return if (parkName.lowercase().contains("sur")) {
            vehicleMappingSur
        } else {
            vehicleMappingNorte
        }
    }
}