package es.bomberosgranada.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
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

        val shifts = listOf(
            "Mañana" to "Mañana",
            "Tarde" to "Tarde",
            "Noche" to "Noche"
        )

        val positionOrder = listOf("Subinspector", "Oficial", "Operador", "Conductor", "Bombero")

        shifts.forEach { (shiftKey, shiftLabel) ->
            val shiftAttendees = attendees.filter { it.matchesShift(shiftKey) }
                .sortedWith(
                    compareBy<Attendee> {
                        val index = positionOrder.indexOf(it.position)
                        if (index == -1) Int.MAX_VALUE else index
                    }.thenBy { it.name }
                )

            item {
                ShiftHeader(label = shiftLabel)
                Spacer(modifier = Modifier.height(12.dp))
            }

            if (shiftAttendees.isEmpty()) {
                item {
                    Text(
                        text = "Sin asignaciones",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            } else {
                val groupedByPosition = shiftAttendees.groupBy { attendee ->
                    positionOrder.find { it.equals(attendee.position, ignoreCase = true) }
                        ?: attendee.position
                }

                positionOrder.forEach { position ->
                    val attendeesByPosition = groupedByPosition[position].orEmpty()

                    if (attendeesByPosition.isNotEmpty()) {
                        item {
                            PositionHeader(position = position)
                        }

                        items(attendeesByPosition) { attendee ->
                            AttendeeCard(attendee = attendee)
                        }
                    }
                }

                val remainingPositions = groupedByPosition.keys.filterNot { positionOrder.contains(it) }
                remainingPositions.forEach { position ->
                    val attendeesByPosition = groupedByPosition[position].orEmpty()

                    item {
                        PositionHeader(position = position)
                    }

                    items(attendeesByPosition) { attendee ->
                        AttendeeCard(attendee = attendee)
                    }
                }
            }
        }
    }
}

@Composable
private fun ShiftHeader(label: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                        MaterialTheme.colorScheme.secondary.copy(alpha = 0.16f)
                    )
                )
            )
            .padding(vertical = 12.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun PositionHeader(position: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 4.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp, 4.dp)
                .clip(RoundedCornerShape(percent = 50))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
        )
        Text(
            text = position,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun AttendeeCard(attendee: Attendee) {
    ElegantCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1.6f)) {
                                    Text(
                                        text = attendee.name,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.SemiBold
                                    )
                    Text(
                        text = attendee.position,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (!attendee.available && !attendee.reason.isNullOrBlank()) {
                        Text(
                            text = attendee.reason,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                            fontStyle = FontStyle.Italic,
                            modifier = Modifier
                                .padding(top = 6.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.error.copy(alpha = 0.1f))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                        )
                                    }
                                }
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                                    Text(
                                        text = "Turno asignado",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = attendee.shift.ifBlank { "Sin turno" },
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}



private fun Attendee.matchesShift(targetShift: String): Boolean {
    return shift == targetShift ||
            shift == "Día completo" ||
            (targetShift == "Mañana" && (shift == "Mañana y tarde" || shift == "Mañana y noche")) ||
            (targetShift == "Tarde" && (shift == "Mañana y tarde" || shift == "Tarde y noche")) ||
            (targetShift == "Noche" && (shift == "Tarde y noche" || shift == "Mañana y noche"))
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