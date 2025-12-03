package es.bomberosgranada.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import es.bomberosgranada.app.data.local.TokenManager
import es.bomberosgranada.app.data.api.RetrofitClient
import es.bomberosgranada.app.data.repositories.*
import es.bomberosgranada.app.navigation.AppNavigation
import es.bomberosgranada.app.ui.theme.BomberosGranadaTheme
import es.bomberosgranada.app.viewmodels.AuthViewModel
import es.bomberosgranada.app.viewmodels.AuthViewModelFactory

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)   // IMPORTANTE: llama al padre

        // Inicializar TokenManager como singleton
        val tokenManager = TokenManager.getInstance(applicationContext)

        // Inicializar Retrofit con TokenManager para añadir Authorization
        RetrofitClient.initialize(tokenManager)

        // Inicializar repositories
        val repositories = initializeRepositories()

        setContent {
            BomberosGranadaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()

                    val authViewModel: AuthViewModel = viewModel(
                        factory = AuthViewModelFactory(
                            repositories.authRepository,
                            tokenManager
                        )
                    )

                    AppNavigation(
                        navController = navController,
                        authViewModel = authViewModel,
                        guardsRepository = repositories.guardsRepository,
                        brigadesRepository = repositories.brigadesRepository,
                        messagesRepository = repositories.messagesRepository,
                        assignmentsRepository = repositories.assignmentsRepository,
                        requestsRepository = repositories.requestsRepository,
                        shiftChangeRepository = repositories.shiftChangeRepository,
                        incidentsRepository = repositories.incidentsRepository,
                        interventionsRepository = repositories.interventionsRepository,
                        vehiclesRepository = repositories.vehiclesRepository,
                        parksRepository = repositories.parksRepository,
                        usersRepository = repositories.usersRepository,
                        suggestionsRepository = repositories.suggestionsRepository,
                        transfersRepository = repositories.transfersRepository,
                        personalEquipmentRepository = repositories.personalEquipmentRepository,
                        clothingItemsRepository = repositories.clothingItemsRepository,
                        brigadeCompositionRepository = repositories.brigadeCompositionRepository,
                        brigadeUsersRepository = repositories.brigadeUsersRepository,
                        extraHoursRepository = repositories.extraHoursRepository,
                        guardAssignmentsRepository = repositories.guardAssignmentsRepository
                    )
                }
            }
        }
    }

    private fun initializeRepositories(): AppRepositories {
        return AppRepositories(
            authRepository = AuthRepository(),
            guardsRepository = GuardsRepository(),
            brigadesRepository = BrigadesRepository(),
            messagesRepository = MessagesRepository(),
            assignmentsRepository = AssignmentsRepository(),
            requestsRepository = RequestsRepository(),
            shiftChangeRepository = ShiftChangeRequestsRepository(),
            incidentsRepository = IncidentsRepository(),
            guardAssignmentsRepository = GuardAssignmentsRepository(),
            interventionsRepository = InterventionsRepository(),
            vehiclesRepository = VehiclesRepository(),
            parksRepository = ParksRepository(),
            usersRepository = UsersRepository(),
            suggestionsRepository = SuggestionsRepository(),
            transfersRepository = TransfersRepository(),
            personalEquipmentRepository = PersonalEquipmentRepository(),
            clothingItemsRepository = ClothingItemsRepository(),
            brigadeCompositionRepository = BrigadeCompositionRepository(),
            brigadeUsersRepository = BrigadeUsersRepository(),
            extraHoursRepository = ExtraHoursRepository()
        )
    }
}

data class AppRepositories(
    val authRepository: AuthRepository,
    val guardsRepository: GuardsRepository,
    val brigadesRepository: BrigadesRepository,
    val messagesRepository: MessagesRepository,
    val assignmentsRepository: AssignmentsRepository,
    val requestsRepository: RequestsRepository,
    val shiftChangeRepository: ShiftChangeRequestsRepository,
    val incidentsRepository: IncidentsRepository,
    val guardAssignmentsRepository : GuardAssignmentsRepository,
    val interventionsRepository: InterventionsRepository,
    val vehiclesRepository: VehiclesRepository,
    val parksRepository: ParksRepository,
    val usersRepository: UsersRepository,
    val suggestionsRepository: SuggestionsRepository,
    val transfersRepository: TransfersRepository,
    val personalEquipmentRepository: PersonalEquipmentRepository,
    val clothingItemsRepository: ClothingItemsRepository,
    val brigadeCompositionRepository: BrigadeCompositionRepository,
    val brigadeUsersRepository: BrigadeUsersRepository,
    val extraHoursRepository: ExtraHoursRepository
)
