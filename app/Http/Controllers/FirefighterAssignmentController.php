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
    // Ejemplo: un bombero está protegido si:
    // - El día anterior tiene una solicitud Confirmada de tipo "asuntos propios" o "licencias por jornadas"
    //   con turno en ['Tarde y noche','Día Completo'], O
    // - El día siguiente tiene una solicitud Confirmada de tipo "asuntos propios" o "licencias por jornadas"
    //   con turno en ['Mañana y tarde','Día Completo'].
    // (Ajusta según tu propia condición)

    // Comprueba día anterior
    $protectedPrevious = \App\Models\Request::where('id_empleado', $firefighterId)
        ->where('estado', 'Confirmada')
        ->whereIn('tipo', ['asuntos propios','licencias por jornadas'])
        ->where(function ($query) use ($previousDay) {
            // El previousDay cae entre fecha_ini y fecha_fin
            $query->where('fecha_ini', '<=', $previousDay)
                  ->where('fecha_fin', '>=', $previousDay);
        })
        ->whereIn('turno', ['Tarde y noche','Día Completo'])
        ->exists();

    // Comprueba día siguiente
    $protectedNext = \App\Models\Request::where('id_empleado', $firefighterId)
        ->where('estado', 'Confirmada')
        ->whereIn('tipo', ['asuntos propios','licencias por jornadas'])
        ->where(function ($query) use ($nextDay) {
            // El nextDay cae entre fecha_ini y fecha_fin
            $query->where('fecha_ini', '<=', $nextDay)
                  ->where('fecha_fin', '>=', $nextDay);
        })
        ->whereIn('turno', ['Mañana y tarde','Día Completo'])
        ->exists();

    return $protectedPrevious || $protectedNext ;
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



}
