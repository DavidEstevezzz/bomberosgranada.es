<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\apiController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ParkController;
use App\Http\Controllers\BrigadeController;
use App\Http\Controllers\FirefighterAssignmentController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\GuardController;
use App\Http\Controllers\Extra_hourController;
use App\Http\Controllers\ShiftChangeRequestController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\PasswordResetController;


// Rutas abiertas sin restricción de roles

Route::post('users/forgot-password', [PasswordResetController::class, 'sendResetPasswordLink']);
Route::post('users/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    // Usuario autenticado
    Route::get('/user', [UserController::class, 'getUserByToken']);
    Route::get('/firefighters-assignments/available-firefighters', [FirefighterAssignmentController::class, 'availableFirefighters']);

    // Métodos index y show abiertos a todos los roles
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/por-puesto', [UserController::class, 'getUsersByPuesto']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);



    Route::get('/parks', [ParkController::class, 'index']);
    Route::get('/parks/{id_parque}', [ParkController::class, 'show']);

    Route::get('/brigades', [BrigadeController::class, 'index']);
    Route::get('/brigades/{id}', [BrigadeController::class, 'show']);
    Route::get('/brigades/{id}/firefighters', [BrigadeController::class, 'getFirefightersByBrigade']);
    Route::get('/guards/by-brigades', [GuardController::class, 'getGuardsByBrigades']);
    Route::get('/guards/by-date', [GuardController::class, 'getGuardsByDate']);
    Route::get('/guards/by-brigade-and-date', [GuardController::class, 'getGuardByBrigadeAndDate']);
    Route::put('/guards/update-comments', [GuardController::class, 'updateComments']);


    Route::get('/firefighters-assignments', [FirefighterAssignmentController::class, 'index']);
    Route::get('/firefighters-assignments/{id}', [FirefighterAssignmentController::class, 'show']);
    Route::get('/firefighters-assignments/{id}/firefighters', [FirefighterAssignmentController::class, 'getFirefightersByAssignment']);


    Route::get('/guards', [GuardController::class, 'index']);
    Route::get('/guards/{id}', [GuardController::class, 'show']);

    Route::get('/extra_hours', [Extra_hourController::class, 'index']);
    Route::get('/extra_hours/{id}', [Extra_hourController::class, 'show']);

    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{id}', [SettingController::class, 'show']);

    Route::get('/salaries', [SalaryController::class, 'index']);
    Route::get('/salaries/{id}', [SalaryController::class, 'show']);

    // Requests y ShiftChangeRequests abiertos para index, show y store
    Route::get('/requests', [RequestController::class, 'index']);
    Route::get('/requests/{id}', [RequestController::class, 'show']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::get('/requests/{id}/file', [RequestController::class, 'downloadFile']);


    Route::get('/shift-change-requests', [ShiftChangeRequestController::class, 'index']);
    Route::get('/shift-change-requests/{id}', [ShiftChangeRequestController::class, 'show']);
    Route::post('/shift-change-requests', [ShiftChangeRequestController::class, 'store']);
    Route::put('/shift-change-requests/{id}', [ShiftChangeRequestController::class, 'update']);

});

// Rutas de Login y Logout (abiertas)
Route::post('/login', [apiController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [apiController::class, 'logout']);

// Rutas protegidas por rol jefe
Route::middleware(['auth:sanctum', 'role:Jefe|Mando'])->group(function () {
    // CRUD de Usuarios
    Route::post('/users/create', [UserController::class, 'store']);
    Route::put('/users/{id}/update-ap', [UserController::class, 'updateAP']);

    // CRUD de Parques
    Route::post('/parks', [ParkController::class, 'store']);
    Route::put('/parks/{id_parque}', [ParkController::class, 'update']);
    Route::delete('/parks/{id_parque}', [ParkController::class, 'destroy']);

    // CRUD de Brigadas
    Route::post('/brigades', [BrigadeController::class, 'store']);
    Route::put('/brigades/{id}', [BrigadeController::class, 'update']);
    Route::delete('/brigades/{id}', [BrigadeController::class, 'destroy']);

    // CRUD de Guardias
    Route::post('/guards', [GuardController::class, 'store']);
    Route::put('/guards/{id}', [GuardController::class, 'update']);
    Route::delete('/guards/{id}', [GuardController::class, 'destroy']);


    // CRUD de Horas Extra
    Route::post('/extra_hours', [Extra_hourController::class, 'store']);
    Route::put('/extra_hours/{id}', [Extra_hourController::class, 'update']);
    Route::delete('/extra_hours/{id}', [Extra_hourController::class, 'destroy']);

    // CRUD de Salarios
    Route::post('/salaries', [SalaryController::class, 'store']);
    Route::put('/salaries/{id}', [SalaryController::class, 'update']);
    Route::delete('/salaries/{id}', [SalaryController::class, 'destroy']);

    // CRUD de Configuración
    Route::post('/settings', [SettingController::class, 'store']);
    Route::put('/settings/{id}', [SettingController::class, 'update']);
    Route::delete('/settings/{id}', [SettingController::class, 'destroy']);

    // Restricción de Request y ShiftChangeRequest para update y delete
    Route::put('/requests/{id}', [RequestController::class, 'update']);
    Route::delete('/requests/{id}', [RequestController::class, 'destroy']);

    Route::put('/firefighters-assignments/{id}', [FirefighterAssignmentController::class, 'update']);
Route::delete('/firefighters-assignments/{id}', [FirefighterAssignmentController::class, 'destroy']);
Route::post('/firefighters-assignments', [FirefighterAssignmentController::class, 'store']);
Route::post('/firefighters/{id}/move-to-top', [FirefighterAssignmentController::class, 'moveToTop']);
Route::post('/firefighters/{id}/move-to-bottom', [FirefighterAssignmentController::class, 'moveToBottom']);




    Route::delete('/shift-change-requests/{id}', [ShiftChangeRequestController::class, 'destroy']);
});
