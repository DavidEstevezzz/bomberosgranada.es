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



    /**
     * Método privado para obtener IDs de bomberos cuya última brigada asignada es una brigada excluida.
     */
    private function getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades)
    {
        Log::info("Fecha y brigadas excluidas en getFirefightersAssignedToExcludedBrigades:", ['date' => $date, 'excludedBrigades' => $excludedBrigades]);
    
        // Obtener asignaciones en la fecha actual y luego en fechas anteriores
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderByRaw("CASE WHEN fecha_ini = '$date' THEN 0 ELSE 1 END")  // Priorizar asignaciones en el día actual
            ->orderBy('fecha_ini', 'desc')  // Luego ordenar descendentemente por fecha
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")  // Priorizar turnos
            ->get()
            ->unique('id_empleado');
    
        Log::info("Asignaciones filtradas por fecha y ordenadas:", ['assignments' => $assignments]);
    
        $unavailableFirefighterIds = [];
    
        foreach ($assignments as $assignment) {
            if ($assignment->brigadeDestination) {
                Log::info("Última brigada asignada para bombero {$assignment->id_empleado} en el día {$date} : " . $assignment->brigadeDestination->nombre);
    
                if (in_array($assignment->brigadeDestination->nombre, $excludedBrigades)) {
                    $unavailableFirefighterIds[] = $assignment->id_empleado;
                }
            } else {
                Log::info("Última brigada asignada para bombero {$assignment->id_empleado} es null");
            }
        }
    
        Log::info("Bomberos no disponibles:", ['unavailableFirefighterIds' => $unavailableFirefighterIds]);
    
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
