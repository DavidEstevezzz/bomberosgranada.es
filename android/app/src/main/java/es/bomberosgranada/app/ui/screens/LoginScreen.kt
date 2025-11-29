package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bomberosgranada.data.local.TokenManager
import com.example.bomberosgranada.data.repository.AuthRepository
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var cargando by remember { mutableStateOf(false) }
    var mensaje by remember { mutableStateOf("") }
    var mensajeError by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val authRepository = remember { AuthRepository() }
    val tokenManager = remember { TokenManager(context) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF1E293B)
                    )
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1E293B).copy(alpha = 0.8f)
            ),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "🚒",
                    fontSize = 64.sp
                )

                Text(
                    text = "Bomberos Granada",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text(
                    text = "Iniciar Sesión",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                if (mensaje.isNotEmpty()) {
                    Text(
                        text = mensaje,
                        color = if (mensajeError) Color(0xFFEF4444) else Color(0xFF10B981),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = "Email")
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFEF4444),
                        focusedLabelColor = Color(0xFFEF4444),
                        focusedLeadingIconColor = Color(0xFFEF4444),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                        unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
                        unfocusedLeadingIconColor = Color.White.copy(alpha = 0.7f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Color(0xFFEF4444)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    enabled = !cargando
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = "Contraseña")
                    },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFEF4444),
                        focusedLabelColor = Color(0xFFEF4444),
                        focusedLeadingIconColor = Color(0xFFEF4444),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                        unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
                        unfocusedLeadingIconColor = Color.White.copy(alpha = 0.7f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Color(0xFFEF4444)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    enabled = !cargando
                )

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        println("🔵 Botón presionado!")
                        cargando = true
                        mensaje = ""

                        scope.launch {
                            println("🔵 Lanzando coroutine...")
                            try {
                                val result = authRepository.login(email, password)
                                println("🔵 Resultado obtenido")

                                result.onSuccess { response ->
                                    println("✅ Login exitoso: ${response.user.name}")

                                    tokenManager.saveAuthData(
                                        token = response.token,
                                        name = response.user.name,
                                        email = response.user.email,
                                        role = response.role
                                    )

                                    mensajeError = false
                                    mensaje = "¡Bienvenido ${response.user.name}!"

                                    // Navegar a Dashboard
                                    onLoginSuccess()
                                }

                                result.onFailure { error ->
                                    println("❌ Login fallido: ${error.message}")
                                    mensajeError = true
                                    mensaje = error.message ?: "Error desconocido"
                                }
                            } catch (e: Exception) {
                                println("❌ Exception: ${e.message}")
                                e.printStackTrace()
                                mensajeError = true
                                mensaje = "Error: ${e.message}"
                            } finally {
                                cargando = false
                                println("🔵 Fin - cargando = false")
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFEF4444),
                        disabledContainerColor = Color(0xFFEF4444).copy(alpha = 0.5f)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !cargando && email.isNotEmpty() && password.isNotEmpty()
                ) {
                    if (cargando) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "Iniciar Sesión",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}