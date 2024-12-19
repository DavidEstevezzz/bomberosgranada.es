<?php
namespace App\Http\Controllers;

use App\Models\Brigade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Firefighters_assignment;

class BrigadeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Log::info('Fetching all brigades');
        $brigade = Brigade::all();

        return response()->json($brigade);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Request received for brigade creation', ['request_data' => $request->all()]);

        $rules = [
            'id_parque' => 'required',
            'nombre' => 'required',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for brigade creation', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $brigade = Brigade::create($request->all());
            Log::info('Brigade created successfully', ['brigade_id' => $brigade->id_brigada]);
            return response()->json($brigade, 201);
        } catch (\Exception $e) {
            Log::error('Error creating brigade', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        Log::info('Fetching brigade', ['brigade_id' => $id]);

        $brigade = Brigade::find($id);

        if (!$brigade) {
            Log::warning('Brigade not found', ['brigade_id' => $id]);
            return response()->json(['message' => 'Brigade not found'], 404);
        }

        return response()->json($brigade);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Brigade $id)
    {
        Log::info('Request received for brigade update', ['brigade_id' => $id->id_brigada, 'request_data' => $request->all()]);

        $rules = [
            'id_parque' => 'required',
            'nombre' => 'required',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for brigade update', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $id->update($request->all());
            Log::info('Brigade updated successfully', ['brigade_id' => $id->id_brigada]);
            return response()->json($id, 200);
        } catch (\Exception $e) {
            Log::error('Error updating brigade', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Brigade $id)
    {
        try {
            $id->delete();
            Log::info('Brigade deleted successfully', ['brigade_id' => $id->id_brigada]);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting brigade', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function getFirefightersByBrigade($id_brigada, Request $request)
{
    $fecha = $request->input('fecha', date('Y-m-d'));

    Log::info("Obteniendo bomberos para la brigada: {$id_brigada} en la fecha: {$fecha}");

    $brigade = Brigade::with('park')->find($id_brigada);

    if (!$brigade) {
        Log::warning("Brigada no encontrada: {$id_brigada}");
        return response()->json(['message' => 'Brigade not found'], 404);
    }

    $users = \App\Models\User::whereIn('type', ['bombero', 'mando'])->get();

    Log::info("Usuarios obtenidos del sistema:", ['users' => $users->toArray()]);

    $filteredUsers = $users->flatMap(function ($user) use ($fecha, $id_brigada) {
        // Obtener asignaciones el mismo día
        $sameDayAssignments = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '=', $fecha)
            ->orderByRaw("FIELD(turno, 'Mañana', 'Tarde', 'Noche')")
            ->get();

        Log::info("Asignaciones del mismo día para el usuario con ID {$user->id_empleado} el {$fecha}:", ['asignaciones' => $sameDayAssignments->toArray()]);

        // Buscar última asignación previa a la fecha
        $lastAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '<', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $firefighters = [];

        // Determinar turnos relevantes en la brigada actual
        $brigadeTurns = $sameDayAssignments->filter(function ($assignment) use ($id_brigada) {
            return $assignment->id_brigada_destino === $id_brigada;
        })->pluck('turno');

        // Si hay asignaciones relevantes, ordenarlas en el orden correcto
        $turnosOrdenados = $brigadeTurns->sort(function ($a, $b) {
            $prioridadTurnos = ['Mañana', 'Tarde', 'Noche'];
            return array_search($a, $prioridadTurnos) - array_search($b, $prioridadTurnos);
        })->values();

        // Generar el texto del turno según los turnos disponibles
        if ($turnosOrdenados->isNotEmpty()) {
            $turnoTexto = $turnosOrdenados->join(' y '); // Combina los turnos en el formato deseado
            $firefighters[] = [
                'id_empleado' => $user->id_empleado,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido,
                'puesto' => $user->puesto,
                'telefono' => $user->telefono,
                'turno' => $turnoTexto // Aquí asignamos el texto generado
            ];
        } else {
            // Continuidad en la brigada previa
            if ($lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Día completo'
                ];
            }
        }

        return $firefighters;
    });

    // Log final: lista de usuarios obtenidos
    Log::info("Lista final de bomberos asignados a la brigada {$id_brigada}:", [
        'firefighters' => $filteredUsers->values()->toArray()
    ]);

    return response()->json($filteredUsers->values());
}








}