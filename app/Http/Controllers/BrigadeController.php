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
        // Buscar las asignaciones del usuario el mismo día
        $sameDayAssignments = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '=', $fecha)
            ->orderByRaw("FIELD(turno, 'Mañana', 'Tarde', 'Noche')")
            ->get();

        $assignmentsByTurno = [];
        foreach ($sameDayAssignments as $assignment) {
            $assignmentsByTurno[$assignment->turno] = $assignment;
        }

        // Buscar la última asignación previa si no tiene asignaciones para el mismo día
        $lastAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
            ->whereDate('fecha_ini', '<=', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $firefighters = [];

        Log::info("Ultima asignación del bombero con nombre: {$user->nombre} {$user->apellido}", ['last_assignment' => $lastAssignment]);


        if (isset($assignmentsByTurno['Tarde'])) {
            if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada && isset($assignmentsByTurno['Noche']) && $assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {
                // Mostrar el turno "Noche" solo si la brigada de destino coincide con la brigada actual
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana y noche'
                ];
            } else if($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && !isset($assignmentsByTurno['Noche'])){

                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Tarde y noche'
                ];
            
            }  else if($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada && isset($assignmentsByTurno['Mañana']) && $assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada){

                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana'
                ];
            
            }  else {
                // Si hay un cambio de brigada en el turno "Noche", mostrar los turnos anteriores en la brigada original
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Tarde'
                ];
            }
        }
        // Si hay asignación de turno "Noche", mantener los turnos previos en la brigada original
        else if (isset($assignmentsByTurno['Noche'])) {
            if ($assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {
                // Mostrar el turno "Noche" solo si la brigada de destino coincide con la brigada actual
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Noche'
                ];
            } else {
                // Si hay un cambio de brigada en el turno "Noche", mostrar los turnos anteriores en la brigada original
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana y tarde'
                ];
            }
        } elseif (isset($assignmentsByTurno['Tarde'])) {
            if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada) {
                // Mostrar el turno "Mañana" en la brigada original si cambia de brigada en la tarde
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Mañana y noche'
                ];
                
            }
            // Mostrar el turno "Tarde" en la brigada de destino
            if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada) {
            $firefighters[] = [
                'id_empleado' => $user->id_empleado,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido,
                'puesto' => $user->puesto,
                'telefono' => $user->telefono,
                'turno' => 'Tarde'
            ];
        }
        } elseif (isset($assignmentsByTurno['Mañana'])) {
            // Si tiene asignación en turno de "Mañana", se muestra solo esa
            if ($assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {
                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'turno' => 'Día completo'
                ];
             }
        } else {
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