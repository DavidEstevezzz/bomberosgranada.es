package es.bomberosgranada.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.data.local.ThemeMode


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
    extraSmall = RoundedCornerShape(12.dp),
    small = RoundedCornerShape(16.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

// ============================================
// TEMA PRINCIPAL
// ============================================

/**
 * Tema principal de la aplicación Bomberos Granada
 *
 * @param themeMode Modo de tema seleccionado por el usuario (SYSTEM, LIGHT, DARK)
 * @param content Contenido a mostrar con el tema aplicado
 *
 * Uso básico (sigue al sistema):
 * ```
 * BomberosGranadaTheme {
 *     // contenido
 * }
 * ```
 *
 * Uso con preferencia del usuario:
 * ```
 * val themeMode by themeViewModel.themeMode.collectAsState()
 * BomberosGranadaTheme(themeMode = themeMode) {
 *     // contenido
 * }
 * ```
 */
@Composable
fun BomberosGranadaTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    val systemDarkTheme = isSystemInDarkTheme()

    val darkTheme = when (themeMode) {
        ThemeMode.SYSTEM -> systemDarkTheme
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

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

// ============================================
// APP COLORS - Sistema centralizado de colores
// para reemplazar colores hardcodeados
// ============================================

/**
 * Sistema centralizado de colores de la aplicación.
 *
 * Usar estos colores en lugar de definir colores locales en cada pantalla.
 * Todos los colores se adaptan automáticamente al modo claro/oscuro.
 *
 * Ejemplo de uso:
 *   val gradient = AppColors.gradientNorte
 *   val textColor = AppColors.textPrimary
 */
object AppColors {

    // ==========================================
    // GRADIENTES PARA HEADERS Y PARQUES
    // ==========================================

    /** Gradiente azul para Parque Norte */
    val gradientNorte: List<Color>
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) {
            listOf(Color(0xFF0F1F35), Color(0xFF1A3352))
        } else {
            listOf(Color(0xFF1E3A5F), Color(0xFF2D5A87))
        }

    /** Gradiente rojo para Parque Sur */
    val gradientSur: List<Color>
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) {
            listOf(Color(0xFF7F1D1D), Color(0xFF991B1B))
        } else {
            listOf(Color(0xFFB91C1C), Color(0xFFDC2626))
        }

    /** Gradiente principal (azul oscuro) para drawer y headers */
    val gradientPrimary: List<Color>
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) {
            listOf(Color(0xFF0F1F35), Color(0xFF1A3352))
        } else {
            listOf(Color(0xFF1E3A5F), Color(0xFF2D5A87))
        }

    /** Brush para gradiente horizontal Norte */
    val gradientNorteBrush: Brush
        @Composable
        get() = Brush.horizontalGradient(gradientNorte)

    /** Brush para gradiente horizontal Sur */
    val gradientSurBrush: Brush
        @Composable
        get() = Brush.horizontalGradient(gradientSur)

    /** Brush para gradiente horizontal primario */
    val gradientPrimaryBrush: Brush
        @Composable
        get() = Brush.horizontalGradient(gradientPrimary)

    // ==========================================
    // COLORES DE TEXTO
    // ==========================================

    /** Color de texto principal */
    val textPrimary: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFF1F5F9) else Color(0xFF1A1A2E)

    /** Color de texto secundario */
    val textSecondary: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF94A3B8) else Color(0xFF64748B)

    /** Color de texto terciario (más sutil) */
    val textTertiary: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF64748B) else Color(0xFF94A3B8)

    // ==========================================
    // COLORES DE SUPERFICIE Y FONDO
    // ==========================================

    /** Color de fondo general */
    val background: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF0F172A) else Color(0xFFF1F5F9)

    /** Color de superficie (cards, etc) */
    val surface: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF1E293B) else Color(0xFFFFFFFF)

    /** Color de superficie elevada */
    val surfaceElevated: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF273549) else Color(0xFFF8FAFC)

    /** Color de card (superficie con borde sutil) */
    val cardBackground: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF1E293B) else Color(0xFFFFFFFF)

    /** Color de fondo del drawer */
    val drawerBackground: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF0F172A) else Color(0xFFFFFFFF)

    // ==========================================
    // COLORES DE SELECCIÓN Y ESTADOS
    // ==========================================

    /** Fondo de item seleccionado */
    val selectedItemBackground: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF1E3A5F) else Color(0xFFF0F7FF)

    /** Borde de item seleccionado */
    val selectedItemBorder: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF60A5FA) else Color(0xFF3B82F6)

    // ==========================================
    // COLORES DE ACENTO
    // ==========================================

    /** Acento naranja (notificaciones, badges) */
    val accentOrange: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFFF8F5A) else Color(0xFFFF6B35)

    /** Acento verde (éxito, online) */
    val accentGreen: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF34D399) else Color(0xFF10B981)

    /** Acento azul */
    val accentBlue: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF60A5FA) else Color(0xFF3B82F6)

    /** Acento púrpura */
    val accentPurple: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFA78BFA) else Color(0xFF8B5CF6)

    /** Acento ámbar (warning) */
    val accentAmber: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFFBBF24) else Color(0xFFF59E0B)

    /** Acento rosa/rojo (error, rechazado) */
    val accentRose: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFF87171) else Color(0xFFEF4444)

    /** Acento sky (información) */
    val accentSky: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF38BDF8) else Color(0xFF0EA5E9)

    /** Acento emerald (confirmado) */
    val accentEmerald: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF34D399) else Color(0xFF059669)

    // ==========================================
    // COLORES POR ESTADO (REQUESTS, etc.)
    // ==========================================

    /** Mapa de colores por estado */
    val statusColors: Map<String, Color>
        @Composable
        get() = mapOf(
            "Pendiente" to accentBlue,
            "En trámite" to accentAmber,
            "Aceptado por empleados" to accentSky,
            "Aceptado" to accentEmerald,
            "Confirmada" to accentEmerald,
            "Rechazado" to accentRose,
            "Cancelada" to textSecondary,
            "Denegada" to accentRose
        )

    /** Obtener color por estado con fallback */
    @Composable
    fun getStatusColor(status: String): Color {
        return statusColors[status] ?: textSecondary
    }

    // ==========================================
    // COLORES DE ÉXITO/ERROR/WARNING
    // ==========================================

    /** Color de éxito */
    val success: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF34D399) else Color(0xFF22C55E)

    /** Color de error */
    val error: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFF87171) else Color(0xFFEF4444)

    /** Color de warning */
    val warning: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFFFBBF24) else Color(0xFFF59E0B)

    // ==========================================
    // COLORES DE DIVIDER Y OUTLINE
    // ==========================================

    /** Color de divisor */
    val divider: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF334155) else Color(0xFFE2E8F0)

    /** Color de borde */
    val outline: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF475569) else Color(0xFFCBD5E1)

    // ==========================================
    // COLORES ESPECIALES PARA COMPONENTES
    // ==========================================

    /** Fondo de botón circular (iconos de navegación) */
    val circleButtonBackground: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF1E293B) else Color(0xFFF1F5F9)

    /** Shimmer base color para loading states */
    val shimmerBase: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF1E293B) else Color(0xFFE2E8F0)

    /** Shimmer highlight color para loading states */
    val shimmerHighlight: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) Color(0xFF334155) else Color(0xFFF8FAFC)

    /** Overlay oscuro para modals/dialogs */
    val overlay: Color
        @Composable
        @ReadOnlyComposable
        get() = if (isSystemInDarkTheme()) {
            Color.Black.copy(alpha = 0.7f)
        } else {
            Color.Black.copy(alpha = 0.5f)
        }
}