package es.bomberosgranada.app.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import es.bomberosgranada.app.data.models.User
import es.bomberosgranada.app.data.local.ThemeMode
import es.bomberosgranada.app.ui.theme.AppColors
import es.bomberosgranada.app.viewmodels.ThemeViewModel

// ============================================
// MODELO DE ITEMS DEL MENÚ
// ============================================

/**
 * Representa un item del menú de navegación
 */
data class NavigationItem(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon,
    val route: String,
    val badge: Int? = null,
    val badgeColor: Color? = null, // null = usar AppColors.accentOrange
    val children: List<NavigationItem>? = null,
    val requiredUserTypes: List<String>? = null, // null = todos pueden ver
    val requiresMandoEspecial: Boolean = false
)

/**
 * Items de navegación disponibles
 */
object NavigationItems {

    val allItems = listOf(
        NavigationItem(
            id = "inicio",
            title = "Inicio",
            icon = Icons.Outlined.Home,
            selectedIcon = Icons.Filled.Home,
            route = "dashboard"
        ),
        NavigationItem(
            id = "messages",
            title = "Mensajes",
            icon = Icons.Outlined.Email,
            selectedIcon = Icons.Filled.Email,
            route = "messages"
        ),
        NavigationItem(
            id = "solicitudes",
            title = "Solicitudes",
            icon = Icons.Outlined.Description,
            selectedIcon = Icons.Filled.Description,
            route = "requests",
            children = listOf(
                NavigationItem(
                    id = "crear_solicitud",
                    title = "Crear Solicitud",
                    icon = Icons.Outlined.Add,
                    route = "create-request"
                ),
                NavigationItem(
                    id = "cambio_guardia",
                    title = "Cambio de Guardia",
                    icon = Icons.Outlined.SwapHoriz,
                    route = "create-shift-change"
                ),
                NavigationItem(
                    id = "mis_solicitudes",
                    title = "Mis Solicitudes",
                    icon = Icons.Outlined.List,
                    route = "my-requests"
                )
            )
        ),
        NavigationItem(
            id = "listas_requerimientos",
            title = "Listas de Requerimientos",
            icon = Icons.Outlined.FormatListNumbered,
            selectedIcon = Icons.Filled.FormatListNumbered,
            route = "requirement-lists",
            children = listOf(
                NavigationItem(
                    id = "req_24h",
                    title = "24 Horas",
                    icon = Icons.Outlined.Schedule,
                    route = "requirement-list-24h"
                ),
                NavigationItem(
                    id = "req_10h",
                    title = "10 Horas",
                    icon = Icons.Outlined.Timer,
                    route = "requirement-list-10h"
                ),
                NavigationItem(
                    id = "req_op_noche",
                    title = "Operadores Noche",
                    icon = Icons.Outlined.NightsStay,
                    route = "requirement-list-operators-night"
                ),
                NavigationItem(
                    id = "req_op_manana",
                    title = "Operadores Mañana",
                    icon = Icons.Outlined.WbSunny,
                    route = "requirement-list-operators-morning"
                )
            )
        ),
        NavigationItem(
            id = "perfil",
            title = "Mi Perfil",
            icon = Icons.Outlined.Person,
            selectedIcon = Icons.Filled.Person,
            route = "profile"
        ),
    )

    /**
     * Filtra los items según el tipo de usuario
     */
    fun getItemsForUser(user: User?): List<NavigationItem> {
        if (user == null) return emptyList()

        return allItems.filter { item ->
            val hasRequiredType = item.requiredUserTypes?.let { types ->
                user.type.lowercase() in types.map { it.lowercase() }
            } ?: true

            val hasMandoEspecial = if (item.requiresMandoEspecial) {
                user.mando_especial == true
            } else true

            hasRequiredType && hasMandoEspecial
        }
    }
}

// ============================================
// COMPONENTE PRINCIPAL: AppScaffold
// ============================================

/**
 * Scaffold principal de la aplicación con soporte para navegación drawer
 *
 * Este componente envuelve todas las pantallas y proporciona:
 * - TopBar con botón de menú, título centrado y toggle de tema
 * - Modal Navigation Drawer
 * - Contenido de la pantalla
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppScaffold(
    currentRoute: String,
    title: String,
    currentUser: User?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    showBackButton: Boolean = false,
    onBack: (() -> Unit)? = null,
    unreadMessagesCount: Int = 0,
    themeViewModel: ThemeViewModel? = null,
    floatingActionButton: @Composable () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit
) {
    // Colores del tema
    val backgroundColor = AppColors.background

    // Estado del tema
    val themeMode = themeViewModel?.themeMode?.collectAsState()?.value ?: ThemeMode.SYSTEM

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    // Items filtrados para el usuario actual
    val navigationItems = remember(currentUser) {
        NavigationItems.getItemsForUser(currentUser)
    }

    // Actualizar badges
    val itemsWithBadges = remember(navigationItems, unreadMessagesCount) {
        navigationItems.map { item ->
            if (item.id == "messages" && unreadMessagesCount > 0) {
                item.copy(badge = unreadMessagesCount)
            } else item
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = drawerState.isOpen,
        drawerContent = {
            NavigationDrawerContent(
                currentUser = currentUser,
                navigationItems = itemsWithBadges,
                currentRoute = currentRoute,
                onItemClick = { route ->
                    scope.launch {
                        drawerState.close()
                    }
                    onNavigate(route)
                },
                onLogout = {
                    scope.launch {
                        drawerState.close()
                    }
                    onLogout()
                },
                onClose = {
                    scope.launch {
                        drawerState.close()
                    }
                }
            )
        }
    ) {
        Scaffold(
            topBar = {
                ModernTopBar(
                    title = title,
                    showBackButton = showBackButton,
                    onMenuClick = {
                        scope.launch {
                            drawerState.open()
                        }
                    },
                    onBack = onBack,
                    themeMode = themeMode,
                    onThemeToggle = { themeViewModel?.cycleThemeMode() }
                )
            },
            floatingActionButton = floatingActionButton,
            containerColor = backgroundColor
        ) { paddingValues ->
            content(paddingValues)
        }
    }
}

// ============================================
// TOP BAR MODERNA
// ============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ModernTopBar(
    title: String,
    showBackButton: Boolean,
    onMenuClick: () -> Unit,
    onBack: (() -> Unit)?,
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    onThemeToggle: (() -> Unit)? = null
) {
    // Colores del tema
    val textPrimary = AppColors.textPrimary
    val surface = AppColors.surface

    // Icono según el modo de tema
    val themeIcon = when (themeMode) {
        ThemeMode.SYSTEM -> Icons.Outlined.SettingsBrightness
        ThemeMode.LIGHT -> Icons.Outlined.LightMode
        ThemeMode.DARK -> Icons.Outlined.DarkMode
    }

    // Tooltip según el modo
    val themeTooltip = when (themeMode) {
        ThemeMode.SYSTEM -> "Tema: Sistema"
        ThemeMode.LIGHT -> "Tema: Claro"
        ThemeMode.DARK -> "Tema: Oscuro"
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp),
        color = surface
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 8.dp, vertical = 12.dp)
        ) {
            // Botón izquierdo (menú o back)
            if (showBackButton && onBack != null) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.align(Alignment.CenterStart)
                ) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Volver",
                        tint = textPrimary
                    )
                }
            } else {
                IconButton(
                    onClick = onMenuClick,
                    modifier = Modifier.align(Alignment.CenterStart)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Menu,
                        contentDescription = "Abrir menú",
                        tint = textPrimary
                    )
                }
            }

            // Título centrado
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = textPrimary,
                modifier = Modifier.align(Alignment.Center),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Botón de tema (derecha)
            if (onThemeToggle != null) {
                IconButton(
                    onClick = onThemeToggle,
                    modifier = Modifier.align(Alignment.CenterEnd)
                ) {
                    Icon(
                        imageVector = themeIcon,
                        contentDescription = themeTooltip,
                        tint = textPrimary
                    )
                }
            } else {
                // Espacio para balancear si no hay toggle de tema
                Spacer(
                    modifier = Modifier
                        .size(48.dp)
                        .align(Alignment.CenterEnd)
                )
            }
        }
    }
}

// ============================================
// CONTENIDO DEL DRAWER
// ============================================

@Composable
private fun NavigationDrawerContent(
    currentUser: User?,
    navigationItems: List<NavigationItem>,
    currentRoute: String,
    onItemClick: (String) -> Unit,
    onLogout: () -> Unit,
    onClose: () -> Unit
) {
    // Colores del tema
    val drawerBackground = AppColors.drawerBackground
    val dividerColor = AppColors.divider

    var expandedItems by remember { mutableStateOf(setOf<String>()) }

    ModalDrawerSheet(
        modifier = Modifier.width(300.dp),
        drawerContainerColor = drawerBackground,
        drawerShape = RoundedCornerShape(topEnd = 28.dp, bottomEnd = 28.dp)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // Header del drawer con info del usuario
            item {
                DrawerHeader(
                    user = currentUser,
                    onClose = onClose
                )
            }

            // Separador
            item {
                HorizontalDivider(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
                    color = dividerColor
                )
            }

            // Items de navegación
            items(navigationItems) { item ->
                if (item.children != null) {
                    // Item con submenú
                    ExpandableNavigationItem(
                        item = item,
                        isExpanded = item.id in expandedItems,
                        currentRoute = currentRoute,
                        onExpandToggle = {
                            expandedItems = if (item.id in expandedItems) {
                                expandedItems - item.id
                            } else {
                                expandedItems + item.id
                            }
                        },
                        onChildClick = onItemClick
                    )
                } else {
                    // Item simple
                    NavigationDrawerItem(
                        item = item,
                        isSelected = currentRoute == item.route,
                        onClick = { onItemClick(item.route) }
                    )
                }
            }

            // Separador antes de logout
            item {
                HorizontalDivider(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp),
                    color = dividerColor
                )
            }

            // Botón de cerrar sesión
            item {
                LogoutButton(onClick = onLogout)
            }
        }
    }
}

// ============================================
// HEADER DEL DRAWER
// ============================================

@Composable
private fun DrawerHeader(
    user: User?,
    onClose: () -> Unit
) {
    // Colores del tema
    val gradientColors = AppColors.gradientPrimary

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                brush = Brush.horizontalGradient(colors = gradientColors)
            )
            .statusBarsPadding()
            .padding(24.dp)
    ) {
        // Botón de cerrar
        IconButton(
            onClick = onClose,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(32.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.2f))
        ) {
            Icon(
                imageVector = Icons.Rounded.Close,
                contentDescription = "Cerrar menú",
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
        }

        Column {
            // Avatar
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(40.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Nombre del usuario
            Text(
                text = user?.let { "${it.nombre} ${it.apellido}" } ?: "Usuario",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Puesto/Tipo
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = user?.puesto ?: "Bombero",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.85f)
                )

                // Badge de tipo de usuario
                user?.type?.let { type ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White.copy(alpha = 0.25f)
                    ) {
                        Text(
                            text = type.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

// ============================================
// ITEM DE NAVEGACIÓN
// ============================================

@Composable
private fun NavigationDrawerItem(
    item: NavigationItem,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    indented: Boolean = false
) {
    // Colores del tema
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val selectedBackground = AppColors.selectedItemBackground
    val selectedBorder = AppColors.selectedItemBorder
    val accentOrange = AppColors.accentOrange

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) selectedBackground else Color.Transparent,
        animationSpec = tween(200),
        label = "itemBackground"
    )

    val contentColor by animateColorAsState(
        targetValue = if (isSelected) selectedBorder else textSecondary,
        animationSpec = tween(200),
        label = "itemContent"
    )

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 2.dp)
            .padding(start = if (indented) 24.dp else 0.dp),
        color = backgroundColor,
        shape = RoundedCornerShape(16.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isSelected) item.selectedIcon else item.icon,
                contentDescription = null,
                tint = contentColor,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                text = item.title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                color = if (isSelected) textPrimary else textSecondary,
                modifier = Modifier.weight(1f)
            )

            // Badge
            item.badge?.let { count ->
                if (count > 0) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = item.badgeColor ?: accentOrange
                    ) {
                        Text(
                            text = if (count > 99) "99+" else count.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

// ============================================
// ITEM EXPANDIBLE (CON HIJOS)
// ============================================

@Composable
private fun ExpandableNavigationItem(
    item: NavigationItem,
    isExpanded: Boolean,
    currentRoute: String,
    onExpandToggle: () -> Unit,
    onChildClick: (String) -> Unit
) {
    // Colores del tema
    val textPrimary = AppColors.textPrimary
    val textSecondary = AppColors.textSecondary
    val selectedBackground = AppColors.selectedItemBackground
    val selectedBorder = AppColors.selectedItemBorder

    val rotationAngle by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        animationSpec = tween(200),
        label = "chevronRotation"
    )

    val isAnyChildSelected = item.children?.any { it.route == currentRoute } ?: false

    Column {
        // Item padre
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 2.dp),
            color = if (isAnyChildSelected) selectedBackground.copy(alpha = 0.5f) else Color.Transparent,
            shape = RoundedCornerShape(16.dp),
            onClick = onExpandToggle
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (isAnyChildSelected) item.selectedIcon else item.icon,
                    contentDescription = null,
                    tint = if (isAnyChildSelected) selectedBorder else textSecondary,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(16.dp))

                Text(
                    text = item.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = if (isAnyChildSelected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isAnyChildSelected) textPrimary else textSecondary,
                    modifier = Modifier.weight(1f)
                )

                Icon(
                    imageVector = Icons.Filled.KeyboardArrowDown,
                    contentDescription = if (isExpanded) "Contraer" else "Expandir",
                    tint = textSecondary,
                    modifier = Modifier
                        .size(24.dp)
                        .graphicsLayer(rotationZ = rotationAngle)
                )
            }
        }

        // Items hijos con animación
        AnimatedVisibility(
            visible = isExpanded,
            enter = expandVertically(animationSpec = tween(200)) + fadeIn(animationSpec = tween(200)),
            exit = shrinkVertically(animationSpec = tween(200)) + fadeOut(animationSpec = tween(200))
        ) {
            Column(
                modifier = Modifier.padding(start = 8.dp)
            ) {
                item.children?.forEach { childItem ->
                    NavigationDrawerItem(
                        item = childItem,
                        isSelected = currentRoute == childItem.route,
                        onClick = { onChildClick(childItem.route) },
                        indented = true
                    )
                }
            }
        }
    }
}

// ============================================
// BOTÓN DE LOGOUT
// ============================================

@Composable
private fun LogoutButton(onClick: () -> Unit) {
    // Colores del tema - el botón de logout mantiene colores fijos rojos
    // para mantener la consistencia visual de "acción destructiva"
    val logoutBackground = Color(0xFFFEE2E2) // Rojo claro
    val logoutText = Color(0xFFDC2626) // Rojo

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp),
        color = logoutBackground,
        shape = RoundedCornerShape(16.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Logout,
                contentDescription = null,
                tint = logoutText,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                text = "Cerrar Sesión",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = logoutText
            )
        }
    }
}