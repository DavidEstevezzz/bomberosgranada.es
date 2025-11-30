package es.bomberosgranada.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp


// ============================================
// PALETA DE COLORES - Elegante y Minimalista
// ============================================

// Colores Primary (Rojo bomberos - sofisticado)
private val PrimaryLight = Color(0xFFDC2626) // red-600
private val PrimaryDark = Color(0xFFEF4444)  // red-500
private val PrimaryContainer = Color(0xFFB91C1C) // red-700

// Colores de fondo
private val BackgroundLight = Color(0xFFFAFAFA) // slate-50
private val BackgroundDark = Color(0xFF0F172A)  // slate-950

private val SurfaceLight = Color(0xFFFFFFFF)
private val SurfaceDark = Color(0xFF1E293B)     // slate-800

// Colores de texto
private val OnBackgroundLight = Color(0xFF0F172A) // slate-950
private val OnBackgroundDark = Color(0xFFF1F5F9)  // slate-100

private val OnSurfaceLight = Color(0xFF334155)    // slate-700
private val OnSurfaceDark = Color(0xFFE2E8F0)     // slate-200

// Colores de estado (sutiles y elegantes)
private val SuccessLight = Color(0xFF10B981)  // emerald-500
private val SuccessDark = Color(0xFF34D399)   // emerald-400

private val WarningLight = Color(0xFFF59E0B)  // amber-500
private val WarningDark = Color(0xFFFBBF24)   // amber-400

private val ErrorLight = Color(0xFFEF4444)    // red-500
private val ErrorDark = Color(0xFFF87171)     // red-400

private val InfoLight = Color(0xFF3B82F6)     // blue-500
private val InfoDark = Color(0xFF60A5FA)      // blue-400

// Colores neutros para bordes y divisores
private val OutlineLight = Color(0xFFE2E8F0)  // slate-200
private val OutlineDark = Color(0xFF334155)   // slate-700

// ============================================
// ESQUEMAS DE COLOR
// ============================================

private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = Color.White,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = Color.White,

    secondary = Color(0xFF64748B), // slate-500
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF94A3B8), // slate-400
    onSecondaryContainer = Color.White,

    background = BackgroundLight,
    onBackground = OnBackgroundLight,

    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = Color(0xFFF8FAFC), // slate-50
    onSurfaceVariant = Color(0xFF64748B), // slate-500

    outline = OutlineLight,
    outlineVariant = Color(0xFFF1F5F9), // slate-100

    error = ErrorLight,
    onError = Color.White,
    errorContainer = Color(0xFFFEE2E2), // red-100
    onErrorContainer = Color(0xFF991B1B), // red-800
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = Color.White,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = Color.White,

    secondary = Color(0xFF94A3B8), // slate-400
    onSecondary = Color(0xFF0F172A), // slate-950
    secondaryContainer = Color(0xFF64748B), // slate-500
    onSecondaryContainer = Color.White,

    background = BackgroundDark,
    onBackground = OnBackgroundDark,

    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = Color(0xFF0F172A), // slate-950
    onSurfaceVariant = Color(0xFF94A3B8), // slate-400

    outline = OutlineDark,
    outlineVariant = Color(0xFF1E293B), // slate-800

    error = ErrorDark,
    onError = Color(0xFF0F172A),
    errorContainer = Color(0xFF7F1D1D), // red-900
    onErrorContainer = Color(0xFFFEE2E2), // red-100
)

// ============================================
// TIPOGRAFÍA - Elegante y Legible
// ============================================

private val AppTypography = Typography(
    // Títulos principales - Bold y espaciosos
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 45.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp
    ),
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 36.sp,
        lineHeight = 44.sp,
        letterSpacing = 0.sp
    ),

    // Headlines - Semibold
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),

    // Títulos - Medium weight
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),

    // Cuerpo - Regular
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),

    // Labels - Semibold (para botones, badges, etc)
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)

// ============================================
// SHAPES - Bordes redondeados elegantes
// ============================================

private val AppShapes = Shapes(
    extraSmall = MaterialTheme.shapes.extraSmall.copy(
        topStart = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        topEnd = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        bottomStart = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        bottomEnd = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ),
    small = MaterialTheme.shapes.small.copy(
        topStart = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        topEnd = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        bottomStart = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        bottomEnd = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ),
    medium = MaterialTheme.shapes.medium.copy(
        topStart = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
        topEnd = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
        bottomStart = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
        bottomEnd = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
    ),
    large = MaterialTheme.shapes.large.copy(
        topStart = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
        topEnd = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
        bottomStart = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
        bottomEnd = androidx.compose.foundation.shape.RoundedCornerShape(24.dp)
    ),
    extraLarge = MaterialTheme.shapes.extraLarge.copy(
        topStart = androidx.compose.foundation.shape.RoundedCornerShape(32.dp),
        topEnd = androidx.compose.foundation.shape.RoundedCornerShape(32.dp),
        bottomStart = androidx.compose.foundation.shape.RoundedCornerShape(32.dp),
        bottomEnd = androidx.compose.foundation.shape.RoundedCornerShape(32.dp)
    )
)

// ============================================
// TEMA PRINCIPAL
// ============================================

@Composable
fun BomberosGranadaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}

// ============================================
// COLORES EXTENDIDOS (para estados especiales)
// ============================================

object ExtendedColors {
    val successLight = SuccessLight
    val successDark = SuccessDark

    val warningLight = WarningLight
    val warningDark = WarningDark

    val infoLight = InfoLight
    val infoDark = InfoDark

    @Composable
    fun success() = if (isSystemInDarkTheme()) successDark else successLight

    @Composable
    fun warning() = if (isSystemInDarkTheme()) warningDark else warningLight

    @Composable
    fun info() = if (isSystemInDarkTheme()) infoDark else infoLight
}