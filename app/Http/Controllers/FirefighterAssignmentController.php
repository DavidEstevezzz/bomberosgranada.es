<?php

namespace App\Http\Controllers;

use App\Models\Firefighters_assignment;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Guard;
use App\Models\Request as RequestModel;


class FirefighterAssignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $firefighter_assignments = Firefighters_assignment::with([
            'firefighter:id_empleado,nombre,apellido', // Asumiendo que tienes un campo 'nombre' en el modelo User
            'brigadeOrigin:id_brigada,nombre',
            'brigadeDestination:id_brigada,nombre'
        ])->get();        

        return response()->json($firefighter_assignments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge([
            'turno' => $request->input('turno', 'Mañana')
        ]);

        $rules = [
            'id_asignacion' => 'unique:firefighters_assignments,id_asignacion',
            'fecha_ini' => 'required|date',
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'turno' => 'in:Mañana,Tarde,Noche',  // Validación del turno
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $firefighter_assignment = Firefighters_assignment::create($request->all());
        return response()->json($firefighter_assignment, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id_asignacion)
    {
        $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_assignment) {
            return response()->json(['message' => 'Metodo show. Firefighter assignment not found'], 404);
        }

        return response()->json($firefighter_assignment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id_asignacion)
    {
        $rules = [
            'id_asignacion' => 'unique:firefighters_assignments,id_asignacion,' . $id_asignacion . ',id_asignacion',
            'fecha_ini' => 'required|date',
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'turno' => 'required|in:Mañana,Tarde,Noche',  // Validación del turno
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_assignment) {
            return response()->json(['message' => 'Firefighter assignment not found'], 404);
        }

        $firefighter_assignment->update($request->all());
        return response()->json($firefighter_assignment, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id_asignacion)
    {
        $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_assignment) {
            return response()->json(['message' => 'Firefighter assignment not found'], 404);
        }

        $firefighter_assignment->delete();
        return response()->json(null, 204);
    }

    public function availableFirefighters(Request $request)
{
    $date = $request->query('date', date('Y-m-d'));
    Log::info("Fecha recibida en availableFirefighters antes de procesar:", ['date' => $date]);

    // Definimos brigadas excluidas por defecto
    $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licendias por Días'];

    // Añadimos brigadas que estuvieron en guardia ayer, hoy, o mañana
    $guards = Guard::whereIn('date', [
        $date,
        date('Y-m-d', strtotime("$date -1 day")),
        date('Y-m-d', strtotime("$date +1 day"))
    ])
    ->get();

    // Obtenemos los nombres de las brigadas activas en guardias para incluirlos en excluidas
    $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
    $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);

    Log::info("Brigadas excluidas con guardias recientes:", ['excludedBrigades' => $excludedBrigades]);

    // Filtramos los bomberos no disponibles debido a asignaciones previas en brigadas excluidas
    $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades);

    // Filtramos los bomberos disponibles
    $availableFirefighters = User::whereIn('type', ['bombero', 'mando'])
        ->whereNotIn('id_empleado', $unavailableFirefighterIds)
        ->get();

    Log::info("Bomberos disponibles obtenidos:", ['available_firefighters' => $availableFirefighters]);

    return response()->json([
        'date' => $date,
        'available_firefighters' => $availableFirefighters,
    ]);
}

public function availableFirefightersWithoutMands(Request $request)
{
    $date = $request->query('date', date('Y-m-d'));
    Log::info("Fecha recibida en availableFirefighters antes de procesar:", ['date' => $date]);

    // Definimos brigadas excluidas por defecto
    $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];

    // Añadimos brigadas que estuvieron en guardia ayer, hoy, o mañana
    $guards = Guard::whereIn('date', [
        $date,
        date('Y-m-d', strtotime("$date -1 day")),
        date('Y-m-d', strtotime("$date +1 day"))
    ])
    ->get();

    // Obtenemos los nombres de las brigadas activas en guardias para incluirlos en excluidas
    $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
    $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);

    Log::info("Brigadas excluidas con guardias recientes:", ['excludedBrigades' => $excludedBrigades]);

    // Filtramos los bomberos no disponibles debido a asignaciones previas en brigadas excluidas
    $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades);

    // Filtramos los bomberos disponibles
    $availableFirefighters = User::whereIn('type', ['bombero'])
        ->whereNotIn('id_empleado', $unavailableFirefighterIds)
        ->get();

    Log::info("Bomberos disponibles obtenidos:", ['available_firefighters' => $availableFirefighters]);

    return response()->json([
        'date' => $date,
        'available_firefighters' => $availableFirefighters,
    ]);
}



private function getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades)
{
    Log::info("Fecha y brigadas excluidas:", [
        'date' => $date,
        'excludedBrigades' => $excludedBrigades
    ]);

    // Agrupamos las asignaciones hasta la fecha consultada
    $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
        ->orderBy('fecha_ini', 'desc')
        ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
        ->get()
        ->groupBy('id_empleado');

    Log::info("Asignaciones agrupadas por bombero:", ['assignments' => $assignments]);

    $unavailableFirefighterIds = [];

    // Calculamos días anterior y siguiente (si mantienes la lógica de 'protección')
    $previousDay = date('Y-m-d', strtotime("$date -1 day"));
    $nextDay     = date('Y-m-d', strtotime("$date +1 day"));

    foreach ($assignments as $firefighterId => $firefighterAssignments) {
        // 1) Verificar si el bombero está protegido por alguna solicitud
        //    (ejemplo: día anterior con turno Tarde y noche o día siguiente con turno Mañana y tarde)
        $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $nextDay);

        if (!$isProtected) {
            // 2) Como NO está protegido, buscamos su última asignación antes o en la fecha $date
            //    es decir, la más reciente con fecha_ini <= $date
            $lastAssignment = $firefighterAssignments
                ->filter(function ($assignment) use ($date) {
                    return $assignment->fecha_ini <= $date;
                })
                ->sortByDesc('fecha_ini') // primero por fecha descendente
                ->sortByDesc(function ($a) {
                    // Si quieres respetar el orden de turno 'Noche','Tarde','Mañana'
                    // puedes hacer una pequeña lógica de prioridad:
                    return match ($a->turno) {
                        'Noche' => 3,
                        'Tarde' => 2,
                        'Mañana' => 1,
                        default => 0,
                    };
                })
                ->first();

                if (
                    $lastAssignment &&
                    $lastAssignment->brigadeDestination &&
                    in_array($lastAssignment->brigadeDestination->nombre, $excludedBrigades)
                ) {
                    // Aquí obtenemos el usuario y la brigada
                    $user = $lastAssignment->firefighter; 
                    $brigadeName = $lastAssignment->brigadeDestination->nombre;
                
                    // Registramos en logs el nombre, apellido y la brigada
                    if ($user) {
                        Log::info(
                            "Bombero excluido: {$user->nombre} {$user->apellido}. Brigada: {$brigadeName}"
                        );
                    }
                
                    // Finalmente, lo marcamos como no disponible
                    $unavailableFirefighterIds[] = $firefighterId;
                }
                else{
                    $user = $lastAssignment->firefighter; 
                    $brigadeName = $lastAssignment->brigadeDestination->nombre;

                    Log::info(
                        "Bombero incluido: {$user->nombre} {$user->apellido}. Brigada: {$brigadeName}"
                    );
                }
        }
    }

    Log::info("IDs de bomberos no disponibles:", [
        'unavailableFirefighterIds' => $unavailableFirefighterIds
    ]);

    return $unavailableFirefighterIds;
}



/**
 * Determina si el bombero está "protegido" por alguna solicitud Confirmada
 * en el día anterior, actual o siguiente, bajo los turnos y tipos que quieras.
 */
private function isProtectedByRequests($firefighterId, $previousDay, $currentDay, $nextDay)
{
    // Tipos que no tienen turno y se protegen solo con la comprobación de fechas.
    $typesWithoutTurno = [
        'vacaciones',
        'modulo',
        'licencias por dias'
    ];

    // Tipos que requieren la comprobación del turno.
    $typesWithTurno = [
        'asuntos propios',
        'compensacion grupos especiales',
        'licencias por jornadas'
    ];

    // --- Comprobación para el día anterior ---
    $queryPrev = \App\Models\Request::where('id_empleado', $firefighterId)
        ->where('estado', 'Confirmada')
        ->where(function ($query) use ($previousDay, $typesWithoutTurno, $typesWithTurno) {
            $query->where(function ($q) use ($previousDay, $typesWithoutTurno) {
                $q->whereIn('tipo', $typesWithoutTurno)
                  ->where('fecha_ini', '<=', $previousDay)
                  ->where('fecha_fin', '>=', $previousDay);
            })
            ->orWhere(function ($q) use ($previousDay, $typesWithTurno) {
                $q->whereIn('tipo', $typesWithTurno)
                  ->where('fecha_ini', '<=', $previousDay)
                  ->where('fecha_fin', '>=', $previousDay)
                  ->whereIn('turno', ['Tarde y noche', 'Día Completo']);
            });
        });
    $protectedPrevious = $queryPrev->exists();
    Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día anterior ({$previousDay}): " . ($protectedPrevious ? "Protegido" : "No protegido"));

    // --- Comprobación para el día actual ---
    $queryCurrent = \App\Models\Request::where('id_empleado', $firefighterId)
        ->where('estado', 'Confirmada')
        ->where(function ($query) use ($currentDay, $typesWithoutTurno, $typesWithTurno) {
            $query->where(function ($q) use ($currentDay, $typesWithoutTurno) {
                $q->whereIn('tipo', $typesWithoutTurno)
                  ->where('fecha_ini', '<=', $currentDay)
                  ->where('fecha_fin', '>=', $currentDay);
            })
            ->orWhere(function ($q) use ($currentDay, $typesWithTurno) {
                $q->whereIn('tipo', $typesWithTurno)
                  ->where('fecha_ini', '<=', $currentDay)
                  ->where('fecha_fin', '>=', $currentDay)
                  ->whereIn('turno', ['Tarde y noche', 'Día Completo', 'Mañana y tarde']);
            });
        });
    $protectedCurrent = $queryCurrent->exists();
    Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día actual ({$currentDay}): " . ($protectedCurrent ? "Protegido" : "No protegido"));

    // --- Comprobación para el día siguiente ---
    $queryNext = \App\Models\Request::where('id_empleado', $firefighterId)
        ->where('estado', 'Confirmada')
        ->where(function ($query) use ($nextDay, $typesWithoutTurno, $typesWithTurno) {
            $query->where(function ($q) use ($nextDay, $typesWithoutTurno) {
                $q->whereIn('tipo', $typesWithoutTurno)
                  ->where('fecha_ini', '<=', $nextDay)
                  ->where('fecha_fin', '>=', $nextDay);
            })
            ->orWhere(function ($q) use ($nextDay, $typesWithTurno) {
                $q->whereIn('tipo', $typesWithTurno)
                  ->where('fecha_ini', '<=', $nextDay)
                  ->where('fecha_fin', '>=', $nextDay)
                  ->whereIn('turno', ['Mañana y tarde', 'Día Completo']);
            });
        });
    $protectedNext = $queryNext->exists();
    Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día siguiente ({$nextDay}): " . ($protectedNext ? "Protegido" : "No protegido"));

    $result = $protectedPrevious || $protectedCurrent || $protectedNext;
    Log::info("isProtectedByRequests - Bombero {$firefighterId} - Resultado final: " . ($result ? "Protegido" : "No protegido"));

    return $result;
}


   

    public function moveToTop($id, $column = 'orden')
{
    $minOrder = User::min($column);
    $firefighter = User::find($id);

    if ($firefighter) {
        $firefighter->$column = $minOrder - 1;
        $firefighter->save();
        return response()->json(['message' => 'Moved to bottom', 'orden' => $firefighter->$column]);
    }

    return response()->json(['message' => 'Firefighter not found'], 404);
    
}

public function moveToBottom($id, $column = 'orden')
{
    $maxOrder = User::max($column);
    $firefighter = User::find($id);

    if ($firefighter) {
        $firefighter->$column = $maxOrder + 1;
        $firefighter->save();
        return response()->json(['message' => 'Moved to top', 'orden' => $firefighter->$column]);
    }

    return response()->json(['message' => 'Firefighter not found'], 404);
}

public function requireFirefighter(Request $request)
{
    Log::info("requireFirefighter - Datos recibidos:", $request->all());

    // Validar los campos recibidos
    $validator = Validator::make($request->all(), [
        'id_empleado' => 'required|exists:users,id_empleado',
        'id_brigada_destino' => 'required|exists:brigades,id_brigada',
        'fecha' => 'required|date',
        'turno' => 'required|in:Mañana,Tarde,Noche,Día Completo,Mañana y tarde,Tarde y noche',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $idEmpleado = $request->input('id_empleado');
    $idBrigadaDestino = $request->input('id_brigada_destino');
    $fecha = $request->input('fecha');
    $turnoRequest = $request->input('turno');

    // 1. Determinar la brigada original (última antes de $fecha)
    $assignmentAnterior = Firefighters_assignment::where('id_empleado', $idEmpleado)
        ->where('fecha_ini', '<=', $fecha)
        ->orderBy('fecha_ini', 'desc')
        ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
        ->first();

    $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

    // 2. Calcular el turno de ida
    $turnoIda = match ($turnoRequest) {
        'Mañana', 'Día Completo', 'Mañana y tarde' => 'Mañana',
        'Tarde', 'Tarde y noche' => 'Tarde',
        'Noche' => 'Noche',
        default => 'Mañana',  // Por si acaso
    };

    // 3. Crear la asignación de ida
    $asignacionIda = Firefighters_assignment::create([
        'id_empleado' => $idEmpleado,
        'id_brigada_origen' => $brigadaOrigen,
        'id_brigada_destino' => $idBrigadaDestino,
        'fecha_ini' => $fecha,
        'turno' => $turnoIda,
    ]);

    // 4. Calcular el turno de vuelta
    // y la fecha de vuelta
    switch ($turnoRequest) {
        case 'Mañana':
            $turnoVuelta = 'Tarde';
            $fechaVuelta = $fecha; 
            break;
        case 'Tarde':
        case 'Mañana y tarde':
            $turnoVuelta = 'Noche';
            $fechaVuelta = $fecha;
            break;
        case 'Tarde y noche':
        case 'Noche':
            $turnoVuelta = 'Mañana';
            // Fecha siguiente
            $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
            break;
        case 'Día Completo':
            // Podrías decidir si la vuelta es al día siguiente o mismo día. 
            // Como no estaba especificado, asumimos vuelve al día siguiente por la mañana:
            $turnoVuelta = 'Mañana';
            $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
            break;
        default:
            $turnoVuelta = 'Tarde';
            $fechaVuelta = $fecha; 
            break;
    }

    // 5. Crear la asignación de vuelta
    $asignacionVuelta = Firefighters_assignment::create([
        'id_empleado' => $idEmpleado,
        'id_brigada_origen' => $idBrigadaDestino,
        'id_brigada_destino' => $brigadaOrigen,
        'fecha_ini' => $fechaVuelta,
        'turno' => $turnoVuelta,
    ]);

    return response()->json([
        'asignacion_ida' => $asignacionIda,
        'asignacion_vuelta' => $asignacionVuelta,
    ], 201);
}




}
