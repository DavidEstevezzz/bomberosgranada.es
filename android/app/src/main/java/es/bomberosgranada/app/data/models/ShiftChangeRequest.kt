package es.bomberosgranada.app.data.models

/**
 * Modelo de solicitud de cambio de guardia
 *
 * IMPORTANTE: Laravel devuelve brigada1 y brigada2 como objetos completos
 * debido al eager loading con with(['brigada1', 'brigada2']).
 *
 * El controller hace: ShiftChangeRequest::with(['empleado1', 'empleado2', 'brigada1', 'brigada2'])->get()
 * Por lo tanto, brigada1 y brigada2 vienen como objetos Brigade, no como IDs.
 */
data class ShiftChangeRequest(
    val id: Int,
    val id_empleado1: Int,
    val id_empleado2: Int,
    val id_empleado3: Int? = null,
    // brigada1 y brigada2 vienen como objetos debido al with() en Laravel
    // Si necesitas el ID, usa brigada1?.id_brigada
    val brigada1: Brigade? = null,
    val brigada2: Brigade? = null,
    val fecha: String,
    val fecha2: String? = null,
    val turno: String,
    val motivo: String,
    val estado: String,
    val created_at: String? = null,
    val updated_at: String? = null,
    // Relaciones de empleados
    val empleado1: User? = null,
    val empleado2: User? = null,
    val empleado3: User? = null
) {
    /**
     * Obtiene el ID de la brigada 1
     */
    val brigada1Id: Int?
        get() = brigada1?.id_brigada

    /**
     * Obtiene el ID de la brigada 2
     */
    val brigada2Id: Int?
        get() = brigada2?.id_brigada

    /**
     * Obtiene el nombre de la brigada 1
     */
    val brigada1Nombre: String?
        get() = brigada1?.nombre

    /**
     * Obtiene el nombre de la brigada 2
     */
    val brigada2Nombre: String?
        get() = brigada2?.nombre
}

/**
 * Request para crear un cambio de guardia
 * El backend calcula brigada1 y brigada2 automáticamente
 */
data class CreateShiftChangeRequest(
    val id_empleado1: Int,
    val id_empleado2: Int,
    val fecha: String,
    val fecha2: String? = null,
    val turno: String,
    val motivo: String,
    val estado: String
)

/**
 * Request para actualizar el estado de un cambio de guardia
 */
data class UpdateShiftChangeRequest(
    val estado: String
)