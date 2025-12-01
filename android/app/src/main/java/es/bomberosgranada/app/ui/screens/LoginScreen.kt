package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.bomberosgranada.app.ui.components.ElegantButton
import es.bomberosgranada.app.ui.components.ElegantTextField
import es.bomberosgranada.app.viewmodels.AuthState
import es.bomberosgranada.app.viewmodels.AuthViewModel

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }

    val authState by viewModel.authState.collectAsState()

    // Manejar estados de autenticación
    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Authenticated -> {
                onLoginSuccess()
            }
            is AuthState.Error -> {
                val message = (authState as AuthState.Error).message
                if (message.contains("email", ignoreCase = true)) {
                    emailError = message
                } else if (message.contains("password", ignoreCase = true)) {
                    passwordError = message
                }
            }
            else -> {
                emailError = null
                passwordError = null
            }
        }
    }

    val spacingSm = 8.dp
    val spacingLg = 16.dp
    val spacingXl = 24.dp
    val spacingXxl = 32.dp

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = spacingXl)
                .padding(top = spacingXl * 2),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo y título
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = spacingXxl)
            ) {
                Text(
                    text = "Bomberos",
                    fontSize = MaterialTheme.typography.displayMedium.fontSize,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    letterSpacing = (-0.5).sp
                )

                Text(
                    text = "Granada",
                    fontSize = MaterialTheme.typography.displayMedium.fontSize,
                    fontWeight = FontWeight.Light,
                    color = MaterialTheme.colorScheme.primary,
                    letterSpacing = 2.sp
                )

                Spacer(modifier = Modifier.height(spacingSm))

                Text(
                    text = "Accede a tu cuenta",
                    fontSize = MaterialTheme.typography.bodyMedium.fontSize,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Normal
                )
            }

            // Formulario
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(spacingLg)
            ) {
                // Email
                ElegantTextField(
                    value = email,
                    onValueChange = {
                        email = it
                        emailError = null
                    },
                    label = "Email",
                    leadingIcon = Icons.Outlined.Email,
                    isError = emailError != null,
                    errorMessage = emailError,
                    enabled = authState !is AuthState.Loading
                )

                // Password
                ElegantTextField(
                    value = password,
                    onValueChange = {
                        password = it
                        passwordError = null
                    },
                    label = "Contraseña",
                    leadingIcon = Icons.Outlined.Lock,
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    trailingIcon = {
                        IconButton(
                            onClick = { passwordVisible = !passwordVisible },
                            modifier = Modifier.size(18.dp)
                        ) {
                            Icon(
                                imageVector = if (passwordVisible) {
                                    Icons.Outlined.VisibilityOff
                                } else {
                                    Icons.Outlined.Visibility
                                },
                                contentDescription = if (passwordVisible) {
                                    "Ocultar contraseña"
                                } else {
                                    "Mostrar contraseña"
                                },
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    },
                    isError = passwordError != null,
                    errorMessage = passwordError,
                    enabled = authState !is AuthState.Loading
                )

                Spacer(modifier = Modifier.height(spacingSm))

                // Botón de login
                ElegantButton(
                    text = "Iniciar sesión",
                    onClick = {
                        viewModel.login(email, password)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = email.isNotBlank() && password.isNotBlank(),
                    loading = authState is AuthState.Loading
                )

                // Forgot password
                TextButton(
                    onClick = { /* TODO: Forgot password */ },
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text(
                        text = "¿Olvidaste tu contraseña?",
                        fontSize = MaterialTheme.typography.bodySmall.fontSize,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.Normal
                    )
                }
            }
        }
    }
}