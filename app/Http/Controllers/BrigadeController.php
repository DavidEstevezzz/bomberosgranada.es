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

            // Lista de brigadas que consideras "excluidas" (tienen prioridad si chocan con otra)
            $excludedBrigadeNames = [
                'Bajas',
                'Vacaciones',
                'Asuntos Propios',
                'Modulo',
                'Licencias por Jornadas',
                'Licencias por Días',
                'Compensacion grupos especiales'
            ];

            $assignmentsByTurno = [];

            foreach ($sameDayAssignments as $assignment) {
                // Nombre de la brigada destino o null si no existe
                $currentBrigadeName = $assignment->brigadeDestination
                    ? $assignment->brigadeDestination->nombre
                    : null;

                // ¿Esta asignación es de una brigada "excluida"?
                $currentIsExcluded = in_array($currentBrigadeName, $excludedBrigadeNames);

                // Ver si ya hay algo guardado para este turno
                if (!isset($assignmentsByTurno[$assignment->turno])) {
                    // Si no hay nada, guardamos directamente
                    $assignmentsByTurno[$assignment->turno] = $assignment;
                } else {
                    // Si ya existe otra asignación para este turno, comparamos prioridades
                    $previousAssignment = $assignmentsByTurno[$assignment->turno];
                    $prevBrigadeName = $previousAssignment->brigadeDestination
                        ? $previousAssignment->brigadeDestination->nombre
                        : null;

                    // ¿La asignación previa era de una brigada excluida?
                    $previousIsExcluded = in_array($prevBrigadeName, $excludedBrigadeNames);

                    // 1) Si la nueva es excluida y la previa no, preferimos la nueva
                    if ($currentIsExcluded && !$previousIsExcluded) {
                        $assignmentsByTurno[$assignment->turno] = $assignment;
                    }
                    // 2) Si la previa es excluida y la nueva no, mantenemos la anterior
                    elseif (!$currentIsExcluded && $previousIsExcluded) {
                        // no cambiamos nada
                    } else {
                        // 3) Si ambas son del mismo tipo (o ambas excluidas, o ambas no excluidas)
                        //    => guardamos la última (la que llega ahora)
                        $assignmentsByTurno[$assignment->turno] = $assignment;
                    }
                }
            }


            Log::info("Asignaciones por turno para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", $assignmentsByTurno);

                $lastAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                    ->whereDate('fecha_ini', '<', $fecha)
                    ->orderBy('fecha_ini', 'desc')
                    ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                    ->first();

                if ($lastAssignment) {
                    Log::info("ULTIMA ASIGNACION para el empleado {$user->id_empleado}", [
                        'lastAssignment' => $lastAssignment ? $lastAssignment->toArray() : null
                    ]);
                } else {
                    Log::info("No se encontró última asignación para el empleado {$user->id_empleado} con fecha <= {$fecha}");
                }

            $firefighters = [];

            if (isset($assignmentsByTurno['Tarde'])) {
                Log::info("Evaluando IF 1 para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", [
                    'Tarde_id_brigada_destino' => $assignmentsByTurno['Tarde']->id_brigada_destino ?? null,
                    'Noche_existe' => isset($assignmentsByTurno['Noche']),
                    'Noche_id_brigada_destino' => $assignmentsByTurno['Noche']->id_brigada_destino ?? null,
                    'id_brigada_consultada' => $id_brigada,
                ]);
                if (
                    $assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada
                    && isset($assignmentsByTurno['Noche'])
                    && $assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada
                ) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 1 - Turno Mañana y noche");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Mañana y noche',
                        'dni' => $user->dni
                    ];
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && !isset($assignmentsByTurno['Noche'])) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 2 - Turno Tarde y noche");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Tarde y noche',
                        'dni' => $user->dni
                    ];
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada && isset($assignmentsByTurno['Mañana']) && $assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 3 - Turno Mañana a la brigada con id {$id_brigada} que debe de ser igual que id_brigada_destino: {$assignmentsByTurno['Mañana']->id_brigada_destino}");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Mañana',
                        'dni' => $user->dni
                    ];
                } else if (
                    $assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada
                    && !isset($assignmentsByTurno['Noche'])
                    && !isset($assignmentsByTurno['Mañana'])
                    && $lastAssignment
                    && $lastAssignment->id_brigada_destino == $id_brigada
                ) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 4 - Turno Mañana");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Mañana',
                        'dni' => $user->dni
                    ];
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && isset($assignmentsByTurno['Noche']) && $assignmentsByTurno['Noche']->id_brigada_destino != $id_brigada) {
                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 1 - Turno Tarde");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Tarde',
                        'dni' => $user->dni
                    ];
                } else if (
                    isset($assignmentsByTurno['Tarde']) &&
                    $assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada &&
                    !isset($assignmentsByTurno['Noche']) &&
                    !isset($assignmentsByTurno['Mañana']) &&
                    $lastAssignment &&
                    $lastAssignment->id_brigada_destino == $id_brigada
                ) {
                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 2 - Turno Tarde");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'puesto' => $user->puesto,
                        'telefono' => $user->telefono,
                        'turno' => 'Mañana',
                        'dni' => $user->dni
                    ];
                }
            } else if (isset($assignmentsByTurno['Noche'])) {

                Log::info("Comparando brigadas para Noche", [
                    'id_brigada_destino' => $assignmentsByTurno['Noche']->id_brigada_destino,
                    'id_brigada_consultada' => $id_brigada,
                    'son_iguales' => ($assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada),
                    'tipo_id_brigada_destino' => gettype($assignmentsByTurno['Noche']->id_brigada_destino),
                    'tipo_id_brigada_consultada' => gettype($id_brigada)
                ]);
                
                if ($assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 4 - Turno Noche");

                    $firefighters[] = [
                        'id_empleado' => $user->id_empleado,
                        'nombre'     => $user->nombre,
                        'apellido'   => $user->apellido,
                        'puesto'     => $user->puesto,
                        'telefono'   => $user->telefono,
                        'turno'      => 'Noche',
                        'dni' => $user->dni
                    ];
                } else {
                    // Verificar si hay asignación para 'Mañana'
                    $mananaEstaBrigada = false;

                    if (
                        isset($assignmentsByTurno['Mañana']) &&
                        $assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada
                    ) {
                        $mananaEstaBrigada = true;
                        Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) tiene asignación en Mañana con brigada destino {$assignmentsByTurno['Mañana']->id_brigada_destino} que coincide con la consultada {$id_brigada}");
                    } elseif (
                        !isset($assignmentsByTurno['Mañana']) &&
                        $lastAssignment &&
                        $lastAssignment->id_brigada_destino == $id_brigada
                    ) {
                        $mananaEstaBrigada = true;
                        Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) no tiene asignación en Mañana, pero la última asignación previa tiene brigada destino {$lastAssignment->id_brigada_destino} que coincide con la consultada {$id_brigada}");
                    } else {
                        Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) no cumple con las condiciones de Mañana: ni tiene asignación en Mañana ni la última asignación previa coincide con la brigada consultada.");
                    }

                    if ($mananaEstaBrigada) {
                        Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en ELSE 2 - Turno Mañana y tarde, validado correctamente");
                        $firefighters[] = [
                            'id_empleado' => $user->id_empleado,
                            'nombre'     => $user->nombre,
                            'apellido'   => $user->apellido,
                            'puesto'     => $user->puesto,
                            'telefono'   => $user->telefono,
                            'turno'      => 'Mañana y tarde',
                            'dni' => $user->dni
                        ];
                    }
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
                        'turno' => 'Día completo',
                        'dni' => $user->dni
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
                        'turno' => 'Día completo',
                        'dni' => $user->dni
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
                        'turno' => 'Día completo',
                        'dni' => $user->dni
                    ];
                }
            }
            Log::info("Bomberos procesados para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", [
                'firefighters' => $firefighters,
            ]);


            return $firefighters;
        });

        return response()->json([
            'brigade' => $brigade,
            'firefighters' => $filteredUsers->values(),
            'fecha' => $fecha,
        ]);
    }
}
