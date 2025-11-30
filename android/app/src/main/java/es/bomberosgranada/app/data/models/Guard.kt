package es.bomberosgranada.app.data.models

data class Guard(
    val id: Int,
    val date: String,
    val id_brigada: Int,
    val id_parque: Int? = null,
    val tipo: String,
    val revision: String? = null,
    val practica: String? = null,
    val basura: String? = null,
    val anotaciones: String? = null,
    val incidencias_de_trafico: String? = null,
    val mando: String? = null,
    val comentarios: String? = null,
    val incidencias_personal: String? = null,
    val incidencias_generales: String? = null,
    val especiales: String? = null,
    val limpieza_vehiculos: String? = null,
    val limpieza_dependencias: String? = null,
    val callejero: String? = null,
    val ejercicios: String? = null,
    val repostaje: String? = null,
    val botellas: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val brigade: BrigadeBasic? = null,
    val salary: Salary? = null
)

data class BrigadeBasic(
    val id_brigada: Int,
    val nombre: String
)

data class GuardByBrigadeAndDateResponse(
    val comentarios: String?,
    val guard: Guard
)

data class CreateGuardRequest(
    val date: String,
    val id_brigada: Int,
    val tipo: String,
    val revision: String? = null,
    val practica: String? = null,
    val basura: String? = null,
    val anotaciones: String? = null,
    val incidencias_de_trafico: String? = null,
    val mando: String? = null
)

data class UpdateGuardRequest(
    val date: String? = null,
    val id_brigada: Int? = null,
    val tipo: String? = null,
    val revision: String? = null,
    val practica: String? = null,
    val basura: String? = null,
    val anotaciones: String? = null,
    val incidencias_de_trafico: String? = null,
    val mando: String? = null
)

data class UpdateGuardResponse(
    val message: String,
    val guard: Guard
)

data class UpdateScheduleRequest(
    val revision: String? = null,
    val practica: String? = null,
    val basura: String? = null,
    val anotaciones: String? = null,
    val incidencias_de_trafico: String? = null,
    val mando: String? = null
)

data class UpdateDailyActivitiesRequest(
    val limpieza_vehiculos: String? = null,
    val limpieza_dependencias: String? = null,
    val callejero: String? = null,
    val ejercicios: String? = null,
    val repostaje: String? = null,
    val botellas: String? = null
)

data class UpdateCommentsRequest(
    val id_brigada: Int,
    val date: String,
    val comentarios: String
)

data class UpdateCommentsResponse(
    val message: String,
    val comentarios: String
)

data class UpdatePersonalIncidentsRequest(
    val id_brigada: Int,
    val date: String,
    val incidencias_personal: String
)

data class UpdatePersonalIncidentsResponse(
    val message: String,
    val incidencias_personal: String
)

data class UpdateGeneralIncidentsRequest(
    val id_brigada: Int,
    val date: String,
    val incidencias_generales: String
)

data class UpdateGeneralIncidentsResponse(
    val message: String,
    val incidencias_generales: String
)

data class Salary(
    val id_salario: Int,
    val tipo: String,
    val fecha_ini: String,
    val precio_diurno: Double,
    val precio_nocturno: Double,
    val horas_diurnas: Int,
    val horas_nocturnas: Int,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class CreateSalaryRequest(
    val tipo: String,
    val fecha_ini: String,
    val precio_diurno: Double,
    val precio_nocturno: Double,
    val horas_diurnas: Int,
    val horas_nocturnas: Int
)

data class UpdateSalaryRequest(
    val tipo: String? = null,
    val fecha_ini: String? = null,
    val precio_diurno: Double? = null,
    val precio_nocturno: Double? = null,
    val horas_diurnas: Int? = null,
    val horas_nocturnas: Int? = null
)