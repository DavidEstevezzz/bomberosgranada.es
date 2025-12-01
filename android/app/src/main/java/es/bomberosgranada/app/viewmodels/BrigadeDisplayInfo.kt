package es.bomberosgranada.app.viewmodels

data class BrigadeDisplayInfo(
    val name: String,
    val label: String,
    val colorHex: String,
    val onColorHex: String,
    val borderHex: String? = null
)