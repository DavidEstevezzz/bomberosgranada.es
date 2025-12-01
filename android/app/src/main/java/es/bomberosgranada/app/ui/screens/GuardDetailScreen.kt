package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import es.bomberosgranada.app.ui.components.ElegantCard
import es.bomberosgranada.app.ui.components.LoadingScreen
import es.bomberosgranada.app.viewmodels.Attendee
import es.bomberosgranada.app.viewmodels.GuardDetailUiState
import es.bomberosgranada.app.viewmodels.GuardDetailViewModel
import java.time.format.DateTimeFormatter

@Composable
fun GuardDetailScreen(
    guardId: Int,
    brigadeId: Int,
    parkId: Int,
    date: String,
    viewModel: GuardDetailViewModel,
    onBack: () -> Unit
) {
    LaunchedEffect(key1 = guardId, key2 = date) {
        viewModel.loadGuardDetails(
            guardId = guardId,
            brigadeId = brigadeId,
            parkId = parkId,
            date = date
        )
    }

    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            GuardDetailTopBar(onBack = onBack)
        }
    ) { paddingValues ->
        when (uiState) {
            GuardDetailUiState.Loading -> LoadingScreen(message = "Cargando guardia...")
            is GuardDetailUiState.Error -> {
                val message = (uiState as GuardDetailUiState.Error).message
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            is GuardDetailUiState.Success -> {
                val detail = uiState as GuardDetailUiState.Success
                GuardDetailContent(
                    paddingValues = paddingValues,
                    dateLabel = detail.date.format(DateTimeFormatter.ofPattern("d 'de' MMMM yyyy")),
                    brigadeName = detail.brigadeName,
                    guardType = detail.guard.tipo,
                    attendees = detail.attendees
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GuardDetailTopBar(onBack: () -> Unit) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Guardia",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Detalle y asistentes",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Volver"
                )
            }
        }
    )
}

@Composable
private fun GuardDetailContent(
    paddingValues: PaddingValues,
    dateLabel: String,
    brigadeName: String,
    guardType: String,
    attendees: List<Attendee>
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            ElegantCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = brigadeName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    InfoRow(
                        icon = Icons.Default.CalendarMonth,
                        label = "Fecha",
                        value = dateLabel
                    )
                    InfoRow(
                        icon = Icons.Default.Group,
                        label = "Tipo",
                        value = guardType
                    )
                }
            }
        }

        item {
            Text(
                text = "Asistentes",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        items(attendees) { attendee ->
            ElegantCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = attendee.name,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (attendee.position.isNotBlank()) {
                        Text(
                            text = attendee.position,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = if (attendee.available) "Asiste" else attendee.reason ?: "No disponible",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (attendee.available) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary
        )
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
        }
    }
}