<?php

namespace App\Http\Controllers;

use App\Models\Firefighters_assignment;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Guard;


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
    $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licendias por Días', 'Compensacion grupos especiales'];

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



    /**
     * Método privado para obtener IDs de bomberos cuya última brigada asignada es una brigada excluida.
     */
    private function getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades)
    {
        Log::info("Fecha y brigadas excluidas en getFirefightersAssignedToExcludedBrigades:", ['date' => $date, 'excludedBrigades' => $excludedBrigades]);
    
        // Definimos las brigadas temporales especiales
        $temporaryBrigades = ['Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licendias por Días', 'Compensacion grupos especiales'];
    
        // Obtener todas las asignaciones válidas hasta la fecha específica
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc') // Ordenar por fecha de inicio (más recientes primero)
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')") // Priorizar turnos
            ->get()
            ->groupBy('id_empleado'); // Agrupar por bombero para analizar uno por uno
    
        Log::info("Asignaciones agrupadas por bombero:", ['assignments' => $assignments]);
    
        $unavailableFirefighterIds = [];
    
        foreach ($assignments as $firefighterId => $firefighterAssignments) {
            $isAvailable = false;
    
            // Buscar asignaciones relevantes para el día anterior, actual y siguiente
            foreach ($firefighterAssignments as $assignment) {
                if ($assignment->fecha_ini == $date || 
                    $assignment->fecha_ini == date('Y-m-d', strtotime("$date -1 day")) || 
                    $assignment->fecha_ini == date('Y-m-d', strtotime("$date +1 day"))) {
                    // Si alguna asignación coincide con una brigada temporal especial, marcar como disponible
                    if (in_array($assignment->brigadeDestination->nombre, $temporaryBrigades)) {
                        $isAvailable = true;
                        break;
                    }
                }
            }
    
            if (!$isAvailable) {
                // Si no está disponible por brigadas temporales, verificar exclusión por brigadas normales
                $relevantAssignment = $firefighterAssignments->first();
                if ($relevantAssignment && in_array($relevantAssignment->brigadeDestination->nombre, $excludedBrigades)) {
                    $unavailableFirefighterIds[] = $firefighterId;
                }
            }
        }
    
        Log::info("Bomberos no disponibles tras evaluación contextual:", ['unavailableFirefighterIds' => $unavailableFirefighterIds]);
    
        return $unavailableFirefighterIds;
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
