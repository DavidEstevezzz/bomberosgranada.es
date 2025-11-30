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
import es.bomberosgranada.app.ui.components.*
import es.bomberosgranada.app.ui.theme.*
import es.bomberosgranada.app.ui.viewmodels.AuthState
import es.bomberosgranada.app.ui.viewmodels.AuthViewModel

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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppSpacing.xl.dp)
                .padding(top = AppSpacing.xxl.dp * 2),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo y título
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = AppSpacing.xxl.dp)
            ) {
                Text(
                    text = "Bomberos",
                    fontSize = AppTypography.displayMedium.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.TextPrimary,
                    letterSpacing = (-0.5).sp
                )

                Text(
                    text = "Granada",
                    fontSize = AppTypography.displayMedium.sp,
                    fontWeight = FontWeight.Light,
                    color = AppColors.Primary,
                    letterSpacing = 2.sp
                )

                Spacer(modifier = Modifier.height(AppSpacing.sm.dp))

                Text(
                    text = "Accede a tu cuenta",
                    fontSize = AppTypography.bodyMedium.sp,
                    color = AppColors.TextSecondary,
                    fontWeight = FontWeight.Normal
                )
            }

            // Formulario
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg.dp)
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
                                tint = AppColors.TextTertiary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    },
                    isError = passwordError != null,
                    errorMessage = passwordError,
                    enabled = authState !is AuthState.Loading
                )

                Spacer(modifier = Modifier.height(AppSpacing.sm.dp))

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
                        fontSize = AppTypography.bodySmall.sp,
                        color = AppColors.TextSecondary,
                        fontWeight = FontWeight.Normal
                    )
                }
            }
        }
    }
}