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

    $filteredUsers = $users->flatMap(function ($user) use ($fecha, $id_brigada) {
        // Buscar las asignaciones del usuario el mismo día
        $sameDayAssignments = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '=', $fecha)
            ->orderByRaw("FIELD(turno, 'Mañana', 'Tarde', 'Noche')")
            ->get();

        $assignmentsByTurno = [];
        foreach ($sameDayAssignments as $assignment) {
            $assignmentsByTurno[$assignment->turno] = $assignment;
        }

        Log::info("Asignaciones por turno para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", $assignmentsByTurno);

        // Buscar la última asignación previa si no tiene asignaciones para el mismo día
        $lastAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '<=', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $firefighters = [];

        if (isset($assignmentsByTurno['Tarde'])) {
            Log::info("Evaluando IF 1 para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", [
                'Tarde_id_brigada_destino' => $assignmentsByTurno['Tarde']->id_brigada_destino ?? null,
                'Noche_existe' => isset($assignmentsByTurno['Noche']),
                'Noche_id_brigada_destino' => $assignmentsByTurno['Noche']->id_brigada_destino ?? null,
                'id_brigada_consultada' => $id_brigada,
            ]);
            if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada 
                && isset($assignmentsByTurno['Noche']) 
                && $assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 1 - Turno Mañana y noche");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana y noche'
                ];
            } else if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && !isset($assignmentsByTurno['Noche'])) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 2 - Turno Tarde y noche");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Tarde y noche'
                ];
            } else if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada && isset($assignmentsByTurno['Mañana']) && $assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 3 - Turno Mañana");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana'
                ];
            } else {
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 1 - Turno Tarde");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Tarde'
                ];
            }
        } else if (isset($assignmentsByTurno['Noche'])) {
            if ($assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 4 - Turno Noche");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Noche'
                ];
            } else {
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 2 - Turno Mañana y tarde");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana y tarde'
                ];
            }
        } elseif (isset($assignmentsByTurno['Mañana'])) {
            if ($assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 5 - Turno Día completo");
        
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Día completo'
                ];
            }
        } else if (empty($assignmentsByTurno)) {
            if ($lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {
                
                Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 6 - Última asignación previa, Día completo");
        
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
         else {
            // Validar si no tiene asignaciones en otro turno en otra brigada el mismo día
            $sameDayOtherBrigade = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                ->whereDate('fecha_ini', '=', $fecha)
                ->where('id_brigada_destino', '!=', $id_brigada)
                ->exists();

            // Si no hay asignaciones el mismo día en otra brigada, mostrar "Día completo"
            if (!$sameDayOtherBrigade && $lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {
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

    return response()->json([
        'brigade' => $brigade,
        'firefighters' => $filteredUsers->values(),
        'fecha' => $fecha,
    ]);
}







}