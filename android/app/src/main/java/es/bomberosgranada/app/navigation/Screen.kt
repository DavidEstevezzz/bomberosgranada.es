package es.bomberosgranada.app.navigation

import android.net.Uri

/**
 * Rutas de navegación de la aplicación
 *
 * Define todas las pantallas disponibles y sus rutas correspondientes.
 * Algunas rutas incluyen parámetros dinámicos.
 */
sealed class Screen(val route: String) {

    // ==========================================
    // AUTENTICACIÓN
    // ==========================================

    object Login : Screen("login")

    // ==========================================
    // PANTALLAS PRINCIPALES
    // ==========================================

    object Dashboard : Screen("dashboard")

    object Messages : Screen("messages")

    object MessageDetail : Screen("message/{messageId}") {
        fun createRoute(messageId: Int) = "message/$messageId"
    }

    // ==========================================
    // SOLICITUDES
    // ==========================================

    object Requests : Screen("requests")

    object CreateRequest : Screen("create-request")
    object MyRequests : Screen("my-requests")

    object RequestDetail : Screen("request/{requestId}") {
        fun createRoute(requestId: Int) = "request/$requestId"
    }

    // ==========================================
    // CAMBIOS DE GUARDIA
    // ==========================================

    object ShiftChanges : Screen("shift-changes")

    object CreateShiftChange : Screen("create-shift-change")

    // ==========================================
    // GUARDIAS Y BRIGADAS
    // ==========================================

    object Guards : Screen("guards")

    object GuardDetail : Screen("guard/{guardId}") {
        fun createRoute(guardId: Int) = "guard/$guardId"
    }

    object GuardAttendance : Screen("guard-attendance/{guardId}/{brigadeId}/{parkId}/{date}") {
        fun createRoute(guardId: Int, brigadeId: Int, parkId: Int, date: String) =
            "guard-attendance/$guardId/$brigadeId/$parkId/${Uri.encode(date)}"
    }

    object BrigadeDetail : Screen("brigade/{brigadeId}?date={date}") {
        fun createRoute(brigadeId: Int, date: String? = null): String {
            return if (date != null) {
                "brigade/$brigadeId?date=$date"
            } else {
                "brigade/$brigadeId"
            }
        }
    }

    // ==========================================
    // LISTAS DE REQUERIMIENTOS
    // ==========================================

    object RequirementList24h : Screen("requirement-list-24h")
    object RequirementList10h : Screen("requirement-list-10h")
    object RequirementListOperatorsNight : Screen("requirement-list-operators-night")
    object RequirementListOperatorsMorning : Screen("requirement-list-operators-morning")


    // ==========================================
    // CALENDARIO
    // ==========================================

    object Calendar : Screen("calendar")

    object CalendarNorte : Screen("calendar-norte")

    object CalendarSur : Screen("calendar-sur")

    // ==========================================
    // USUARIO
    // ==========================================

    object Profile : Screen("profile")

    object Settings : Screen("settings")

    // ==========================================
    // OTROS
    // ==========================================

    object Suggestions : Screen("suggestions")

    object Incidents : Screen("incidents")

    object Interventions : Screen("interventions")

    object Users : Screen("users")

    object Vehicles : Screen("vehicles")

    object Transfers : Screen("transfers")

    object ExtraHours : Screen("extra-hours")
}