package es.bomberosgranada.app.data.models

data class ExtraHour(
    val date: String,
    val id_empleado: Int,
    val id_salario: Int,
    val horas_diurnas: Int,
    val horas_nocturnas: Int,
    val created_at: String?,
    val updated_at: String?,
    val user: User? = null,
    val salarie: Salary? = null
)

data class CreateExtraHourRequest(
    val id_empleado: Int,
    val date: String,
    val id_salario: Int,
    val horas_diurnas: Int,
    val horas_nocturnas: Int
)

data class UpdateExtraHourRequest(
    val id_empleado: Int,
    val date: String,
    val horas_diurnas: Int,
    val horas_nocturnas: Int,
    val id_salario: Int
)

data class ExtraHoursByMonthItem(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val horas_diurnas: Int,
    val horas_nocturnas: Int,
    val total_salary: Double
)