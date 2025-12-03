package es.bomberosgranada.app.data.api

import es.bomberosgranada.app.data.api.services.*

object ApiClient {
    val auth: AuthService by lazy {
        RetrofitClient.retrofit.create(AuthService::class.java)
    }

    val guards: GuardsService by lazy {
        RetrofitClient.retrofit.create(GuardsService::class.java)
    }

    val messages: MessagesService by lazy {
        RetrofitClient.retrofit.create(MessagesService::class.java)
    }

    val salaries: SalariesService by lazy {
        RetrofitClient.retrofit.create(SalariesService::class.java)
    }
    val firefighterAssignments: FirefighterAssignmentsService by lazy {
        RetrofitClient.retrofit.create(FirefighterAssignmentsService::class.java)
    }

    val requests: RequestsService by lazy {
        RetrofitClient.retrofit.create(RequestsService::class.java)
    }

    val shiftChangeRequests: ShiftChangeRequestsService by lazy {
        RetrofitClient.retrofit.create(ShiftChangeRequestsService::class.java)
    }

    val interventions: InterventionsService by lazy {
        RetrofitClient.retrofit.create(InterventionsService::class.java)
    }

    val incidents: IncidentsService by lazy {
        RetrofitClient.retrofit.create(IncidentsService::class.java)
    }

    val vehicles: VehiclesService by lazy {
        RetrofitClient.retrofit.create(VehiclesService::class.java)
    }

    val brigades: BrigadesService by lazy {
        RetrofitClient.retrofit.create(BrigadesService::class.java)
    }

    val parks: ParksService by lazy {
        RetrofitClient.retrofit.create(ParksService::class.java)
    }

    val users: UsersService by lazy {
        RetrofitClient.retrofit.create(UsersService::class.java)
    }

    val suggestions: SuggestionsService by lazy {
        RetrofitClient.retrofit.create(SuggestionsService::class.java)
    }

    val transfers: TransfersService by lazy {
        RetrofitClient.retrofit.create(TransfersService::class.java)
    }

    val personalEquipment: PersonalEquipmentService by lazy {
        RetrofitClient.retrofit.create(PersonalEquipmentService::class.java)
    }
    val pdfDocuments: PdfDocumentsService by lazy {
        RetrofitClient.retrofit.create(PdfDocumentsService::class.java)
    }

    val guardAssignments: GuardAssignmentsService by lazy {
        RetrofitClient.retrofit.create(GuardAssignmentsService::class.java)
    }

    val clothingItems: ClothingItemsService by lazy {
        RetrofitClient.retrofit.create(ClothingItemsService::class.java)
    }

    val brigadeComposition: BrigadeCompositionService by lazy {
        RetrofitClient.retrofit.create(BrigadeCompositionService::class.java)
    }

    val brigadeUsers: BrigadeUsersService by lazy {
        RetrofitClient.retrofit.create(BrigadeUsersService::class.java)
    }

    val extraHours: ExtraHoursService by lazy {
        RetrofitClient.retrofit.create(ExtraHoursService::class.java)
    }
}