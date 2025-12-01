package es.bomberosgranada.app.navigation

/**
 * Rutas de navegación de la aplicación
 */
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object BrigadeDetail : Screen("brigade/{brigadeId}?date={date}") {
        fun createRoute(brigadeId: Int, date: String) = "brigade/$brigadeId?date=$date"
    }
    object Guards : Screen("guards")
    object GuardDetail : Screen("guard/{guardId}") {
        fun createRoute(guardId: Int) = "guard/$guardId"
    }
    object Messages : Screen("messages")
    object MessageDetail : Screen("message/{messageId}") {
        fun createRoute(messageId: Int) = "message/$messageId"
    }
    object Requests : Screen("requests")
    object ShiftChanges : Screen("shift-changes")
    object Incidents : Screen("incidents")
    object Interventions : Screen("interventions")
    object Users : Screen("users")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}