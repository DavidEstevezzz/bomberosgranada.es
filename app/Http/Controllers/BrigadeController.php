<?php

namespace App\Http\Controllers;

use App\Models\Brigade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Firefighters_assignment;
use App\Models\ShiftChangeRequest;

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
                ->orderByRaw("FIELD(turno, 'Mañana', 'Tarde', 'Noche')") // 1º: Turno
                ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')") // 2º: Tipo
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
                        //    verificamos prioridad entre 'ida' y 'vuelta'
                        if (
                            $previousAssignment->tipo_asignacion === 'vuelta' &&
                            $assignment->tipo_asignacion === 'ida'
                        ) {
                            // La nueva asignación es 'ida' y tiene prioridad sobre la 'vuelta' previa
                            $assignmentsByTurno[$assignment->turno] = $assignment;
                        } elseif (
                            $previousAssignment->tipo_asignacion === 'ida' &&
                            $assignment->tipo_asignacion === 'vuelta'
                        ) {
                            // La asignación previa es 'ida' y mantiene la prioridad
                            // no cambiamos nada
                        } else {
                            // Si ambas tienen el mismo tipo, conservamos la última
                            $assignmentsByTurno[$assignment->turno] = $assignment;
                        }
                    }
                }
            }


            Log::info("Asignaciones por turno para el usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado})", $assignmentsByTurno);

            $lastAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                ->whereDate('fecha_ini', '<', $fecha)
                ->orderBy('fecha_ini', 'desc') // 1º: Fecha más reciente
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')") // 2º: Turno (orden inverso para última)
                ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')") // 3º: Tipo
                ->first();

            if ($lastAssignment) {
                Log::info("ULTIMA ASIGNACION para el empleado {$user->id_empleado}", [
                    'lastAssignment' => $lastAssignment ? $lastAssignment->toArray() : null
                ]);
            } else {
                Log::info("No se encontró última asignación para el empleado {$user->id_empleado} con fecha <= {$fecha}");
            }

            $assignmentSameDay = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                ->whereDate('fecha_ini', $fecha)
                ->where('id_brigada_destino', $id_brigada)
                ->orderByRaw("FIELD(turno, 'Mañana','Tarde','Noche')") // 1º: Turno
                ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')") // 2º: Tipo
                ->first();

            $requerimiento = $assignmentSameDay?->requerimiento ?? false;
            $idChangeRequest = $assignmentSameDay?->id_change_request;
            if (!$idChangeRequest) {
                $prevDate = date('Y-m-d', strtotime($fecha . ' -1 day'));
                $prevAssignment = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                    ->whereDate('fecha_ini', $prevDate)
                    ->where('id_brigada_destino', $id_brigada)
                    ->whereNotNull('id_change_request')
                    ->orderByRaw("FIELD(turno, 'Mañana','Tarde','Noche')") // 1º: Turno
                    ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')") // 2º: Tipo
                    ->first();
                $idChangeRequest = $prevAssignment?->id_change_request;
            }
            $changeRequestName = null;
            if ($idChangeRequest) {
                $cr = ShiftChangeRequest::with(['empleado1', 'empleado2'])->find($idChangeRequest);
                if ($cr) {
                    // Verificar cuál de los dos empleados es el que aparece disponible
                    if ($cr->id_empleado2 == $user->id_empleado) {
                        // Este usuario acude al turno (id_empleado2), mostrar quien lo cedió (id_empleado1)
                        if ($cr->empleado1) {
                            $changeRequestName = $cr->empleado1->nombre . ' ' . $cr->empleado1->apellido;
                        }
                    } elseif ($cr->id_empleado1 == $user->id_empleado) {
                        // Este usuario cedió el turno (id_empleado1), mostrar quien lo recibe (id_empleado2)
                        if ($cr->empleado2) {
                            $changeRequestName = $cr->empleado2->nombre . ' ' . $cr->empleado2->apellido;
                        }
                    }
                }
            }

            $tipoAsignacionActiva = null;

            // Determinar qué asignación está definiendo realmente dónde está el bombero
            if ($assignmentSameDay && $assignmentSameDay->id_brigada_destino == $id_brigada) {
                // Si hay asignación del mismo día hacia esta brigada, usar su tipo
                $tipoAsignacionActiva = $assignmentSameDay->tipo_asignacion;
            } elseif ($lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada && empty($assignmentsByTurno)) {
                // Si no hay asignaciones del mismo día, pero la última asignación lo coloca aquí
                $tipoAsignacionActiva = $lastAssignment->tipo_asignacion;
            } else {
                // Para casos más complejos, buscar en los turnos específicos

                // Verificar si alguna asignación del día lo coloca en esta brigada
                foreach ($assignmentsByTurno as $turno => $assignment) {
                    if ($assignment->id_brigada_destino == $id_brigada) {
                        $tipoAsignacionActiva = $assignment->tipo_asignacion;
                        break; // Tomar el primer turno que lo coloque en esta brigada
                    }
                }

                // Si no se encontró en asignaciones del día, usar la última asignación
                if ($tipoAsignacionActiva === null && $lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {
                    $tipoAsignacionActiva = $lastAssignment->tipo_asignacion;
                }
            }

            $baseInfo = [
                'id_empleado' => $user->id_empleado,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido,
                'puesto' => $user->puesto,
                'telefono' => $user->telefono,
                'dni' => $user->dni,
                'requerimiento' => $requerimiento,
                'id_change_request' => $idChangeRequest,
                'cambio_con' => $changeRequestName,
                'tipo_asignacion' => $tipoAsignacionActiva // AÑADIR ESTA LÍNEA
            ];


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

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Mañana y noche'
                    ]);
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && !isset($assignmentsByTurno['Noche'])) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 2 - Turno Tarde y noche");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Tarde y noche'
                    ]);
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada && isset($assignmentsByTurno['Mañana']) && $assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 3 - Turno Mañana a la brigada con id {$id_brigada} que debe de ser igual que id_brigada_destino: {$assignmentsByTurno['Mañana']->id_brigada_destino}");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Mañana'
                    ]);
                } else if (
                    $assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada
                    && !isset($assignmentsByTurno['Noche'])
                    && !isset($assignmentsByTurno['Mañana'])
                    && $lastAssignment
                    && $lastAssignment->id_brigada_destino == $id_brigada
                ) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 4 - Turno Mañana");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Mañana'
                    ]);
                } else if ($assignmentsByTurno['Tarde']->id_brigada_destino == $id_brigada && isset($assignmentsByTurno['Noche']) && $assignmentsByTurno['Noche']->id_brigada_destino != $id_brigada) {
                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 1 - Turno Tarde");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Tarde'
                    ]);
                } else if (
                    isset($assignmentsByTurno['Tarde']) &&
                    $assignmentsByTurno['Tarde']->id_brigada_destino != $id_brigada &&
                    !isset($assignmentsByTurno['Noche']) &&
                    !isset($assignmentsByTurno['Mañana']) &&
                    $lastAssignment &&
                    $lastAssignment->id_brigada_destino == $id_brigada
                ) {
                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el ELSE 2 - Turno Tarde");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Mañana'
                    ]);
                }
            } else if (isset($assignmentsByTurno['Noche'])) {
                if ($assignmentsByTurno['Noche']->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 4 - Turno Noche");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Noche'
                    ]);
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
                        $firefighters[] = array_merge($baseInfo, [
                            'turno' => 'Mañana y tarde'
                        ]);
                    }
                }
            } elseif (isset($assignmentsByTurno['Mañana'])) {
                if ($assignmentsByTurno['Mañana']->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 5 - Turno Día completo");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Día completo'
                    ]);
                }
            } else if (empty($assignmentsByTurno)) {
                if ($lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {

                    Log::info("El usuario {$user->nombre} {$user->apellido} (ID: {$user->id_empleado}) ha entrado en el IF 6 - Última asignación previa, Día completo");

                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Día completo'
                    ]);
                }
            } else {
                // Validar si no tiene asignaciones en otro turno en otra brigada el mismo día
                $sameDayOtherBrigade = Firefighters_assignment::where('id_empleado', $user->id_empleado)
                    ->whereDate('fecha_ini', '=', $fecha)
                    ->where('id_brigada_destino', '!=', $id_brigada)
                    ->exists();

                // Si no hay asignaciones el mismo día en otra brigada, mostrar "Día completo"
                if (!$sameDayOtherBrigade && $lastAssignment && $lastAssignment->id_brigada_destino == $id_brigada) {
                    $firefighters[] = array_merge($baseInfo, [
                        'turno' => 'Día completo'
                    ]);
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
    /**
     * Verifica si la brigada es especial.
     * 
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkBrigadaEspecial(string $id)
    {
        $brigade = Brigade::find($id);

        if (!$brigade) {
            return response()->json(['message' => 'Brigada no encontrada'], 404);
        }

        return response()->json([
            'especial' => (bool) $brigade->especial
        ]);
    }

    /**
     * Obtiene todas las brigadas que son especiales.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEspecialBrigades()
    {
        $especialBrigades = Brigade::where('especial', true)
            ->where('id_parque', 1)
            ->get();
        return response()->json($especialBrigades);
    }
}
