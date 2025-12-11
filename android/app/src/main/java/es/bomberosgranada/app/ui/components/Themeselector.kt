package es.bomberosgranada.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.SettingsBrightness
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.data.local.ThemeMode
import es.bomberosgranada.app.ui.theme.AppColors

/**
 * Selector de tema con 3 opciones: Sistema, Claro, Oscuro
 *
 * Uso:
 * ```
 * val themeMode by themeViewModel.themeMode.collectAsState()
 *
 * ThemeSelector(
 *     currentMode = themeMode,
 *     onModeSelected = { mode -> themeViewModel.setThemeMode(mode) }
 * )
 * ```
 */
@Composable
fun ThemeSelector(
    currentMode: ThemeMode,
    onModeSelected: (ThemeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val cardBackground = AppColors.cardBackground
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Apariencia",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = textPrimary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBackground)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ThemeOption(
                    icon = Icons.Outlined.SettingsBrightness,
                    label = "Sistema",
                    isSelected = currentMode == ThemeMode.SYSTEM,
                    onClick = { onModeSelected(ThemeMode.SYSTEM) },
                    modifier = Modifier.weight(1f)
                )

                ThemeOption(
                    icon = Icons.Outlined.LightMode,
                    label = "Claro",
                    isSelected = currentMode == ThemeMode.LIGHT,
                    onClick = { onModeSelected(ThemeMode.LIGHT) },
                    modifier = Modifier.weight(1f)
                )

                ThemeOption(
                    icon = Icons.Outlined.DarkMode,
                    label = "Oscuro",
                    isSelected = currentMode == ThemeMode.DARK,
                    onClick = { onModeSelected(ThemeMode.DARK) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Text(
            text = when (currentMode) {
                ThemeMode.SYSTEM -> "El tema cambiará automáticamente según la configuración de tu dispositivo"
                ThemeMode.LIGHT -> "Siempre se mostrará el tema claro"
                ThemeMode.DARK -> "Siempre se mostrará el tema oscuro"
            },
            style = MaterialTheme.typography.bodySmall,
            color = textSecondary,
            modifier = Modifier.padding(top = 8.dp, start = 4.dp)
        )
    }
}

@Composable
private fun ThemeOption(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedBackground = AppColors.selectedItemBackground
    val selectedBorder = AppColors.selectedItemBorder
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val surfaceElevated = AppColors.surfaceElevated

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) selectedBackground else surfaceElevated,
        animationSpec = tween(200),
        label = "optionBackground"
    )

    val borderColor by animateColorAsState(
        targetValue = if (isSelected) selectedBorder else Color.Transparent,
        animationSpec = tween(200),
        label = "optionBorder"
    )

    val contentColor by animateColorAsState(
        targetValue = if (isSelected) selectedBorder else textSecondary,
        animationSpec = tween(200),
        label = "optionContent"
    )

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor)
            .border(
                width = if (isSelected) 2.dp else 0.dp,
                color = borderColor,
                shape = RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = contentColor,
            modifier = Modifier.size(28.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (isSelected) textPrimary else textSecondary
        )
    }
}

/**
 * Versión compacta del selector de tema (solo iconos)
 * Útil para incluir en la TopBar o en espacios reducidos
 */
@Composable
fun ThemeSelectorCompact(
    currentMode: ThemeMode,
    onModeSelected: (ThemeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedBackground = AppColors.selectedItemBackground
    val selectedBorder = AppColors.selectedItemBorder
    val textSecondary = AppColors.textSecondary
    val cardBackground = AppColors.cardBackground

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(cardBackground)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        listOf(
            ThemeMode.SYSTEM to Icons.Outlined.SettingsBrightness,
            ThemeMode.LIGHT to Icons.Outlined.LightMode,
            ThemeMode.DARK to Icons.Outlined.DarkMode
        ).forEach { (mode, icon) ->
            val isSelected = currentMode == mode

            IconButton(
                onClick = { onModeSelected(mode) },
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isSelected) selectedBackground else Color.Transparent)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = mode.name,
                    tint = if (isSelected) selectedBorder else textSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

/**
 * Botón simple para ciclar entre temas
 * Útil para añadir en la TopBar
 */
@Composable
fun ThemeToggleButton(
    currentMode: ThemeMode,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val textPrimary = AppColors.textPrimary

    val icon = when (currentMode) {
        ThemeMode.SYSTEM -> Icons.Outlined.SettingsBrightness
        ThemeMode.LIGHT -> Icons.Outlined.LightMode
        ThemeMode.DARK -> Icons.Outlined.DarkMode
    }

    IconButton(
        onClick = onToggle,
        modifier = modifier
    ) {
        Icon(
            imageVector = icon,
            contentDescription = "Cambiar tema",
            tint = textPrimary
        )
    }
}