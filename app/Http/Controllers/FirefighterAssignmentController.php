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
            'firefighter:id_empleado,nombre,apellido',
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
            'requerimiento' => 'boolean',
            'tipo_asignacion' => 'required|in:ida,vuelta', // Aseguramos que el tipo de asignación sea válido

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
            'requerimiento' => 'boolean', // Nuevo: para update también
            'tipo_asignacion' => 'required|in:ida,vuelta', // Aseguramos que el tipo de asignación sea válido
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
        Log::info("Fecha recibida en availableFirefighters:", ['date' => $date]);

        // Lista estática de exclusión
        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Horas Sindicales'];

        // Obtenemos las brigadas que tienen guardia SOLO en el día consultado
        $guards = Guard::with('brigade')->where('date', $date)->get();
        $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos ambas listas
        $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
        Log::info("Brigadas excluidas (estáticas y por guardia en {$date}):", ['excludedBrigades' => $excludedBrigades]);

        // Agrupamos las asignaciones de bomberos hasta $date
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente primero
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno (dentro de la misma fecha)
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Ida antes que vuelta (SOLO si fecha y turno son iguales)
            ->orderBy('created_at', 'desc')                                   // 4. Creación más reciente
            ->get()
            ->groupBy('id_empleado');

        $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards);

        $availableFirefighters = User::whereIn('type', ['bombero', 'mando'])
            //->where('puesto', '!=', 'Operador')
            ->whereNotIn('id_empleado', $unavailableFirefighterIds)
            ->get();

        return response()->json([
            'date' => $date,
            'available_firefighters' => $availableFirefighters,
        ]);
    }


    public function availableFirefightersWithoutMands(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefighters antes de procesar:", ['date' => $date]);

        $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Horas Sindicales'];

        $guards = Guard::whereIn('date', [
            $date,
            date('Y-m-d', strtotime("$date -1 day")),
            date('Y-m-d', strtotime("$date +1 day"))
        ])->get();

        $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
        $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);

        Log::info("Brigadas excluidas con guardias recientes:", ['excludedBrigades' => $excludedBrigades]);

        $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards);

        $availableFirefighters = User::whereIn('type', ['bombero'])
            ->whereNotIn('id_empleado', $unavailableFirefighterIds)
            ->get();

        Log::info("Bomberos disponibles obtenidos:", ['available_firefighters' => $availableFirefighters]);

        return response()->json([
            'date' => $date,
            'available_firefighters' => $availableFirefighters,
        ]);
    }



    private function getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards)
    {
        Log::info("Fecha y brigadas excluidas iniciales:", [
            'date' => $date,
            'excludedBrigades' => $excludedBrigades
        ]);

        // Definir días anterior y siguiente
        $previousDay = date('Y-m-d', strtotime("$date -1 day"));
        $nextDay     = date('Y-m-d', strtotime("$date +1 day"));

        $absoluteExclusions = [
            'Bajas',
            'Vacaciones',
            'Asuntos Propios',
            'Modulo',
            'Licencias por Jornadas',
            'Licencias por Días',
            'Compensacion grupos especiales',
            'Horas Sindicales',
            'Brigada J'
        ];

        // Obtener las brigadas en guardia para ayer y mañana
        $guardYesterday = Guard::with('brigade')
            ->where('date', $previousDay)
            ->get()
            ->pluck('brigade.nombre')
            ->unique()
            ->toArray();
        $guardTomorrow = Guard::with('brigade')
            ->where('date', $nextDay)
            ->get()
            ->pluck('brigade.nombre')
            ->unique()
            ->toArray();

        Log::info("Brigadas en guardia ayer:", ['guardYesterday' => $guardYesterday]);
        Log::info("Brigadas en guardia mañana:", ['guardTomorrow' => $guardTomorrow]);

        // Para la comprobación de hoy usaremos: exclusiones estáticas + brigadas de ayer y de mañana
        $excludedForToday = array_merge($excludedBrigades, $guardYesterday, $guardTomorrow);
        // Para ayer, ignoramos las brigadas de mañana y las del día actual
        $excludedForYesterday = array_merge($absoluteExclusions, $guardYesterday);
        // Para mañana, ignoramos las brigadas de ayer y las del día actual
        $excludedForTomorrow = array_merge($absoluteExclusions, $guardTomorrow);

        Log::info("Lista de exclusión para hoy:", ['excludedForToday' => $excludedForToday]);
        Log::info("Lista de exclusión para ayer:", ['excludedForYesterday' => $excludedForYesterday]);
        Log::info("Lista de exclusión para mañana:", ['excludedForTomorrow' => $excludedForTomorrow]);

        // Cargar asignaciones vigentes
        $assignmentsToday = $this->getAssignmentsForSpecificDate($date);
        $assignmentsYesterday = $this->getAssignmentsForSpecificDate($previousDay);
        $assignmentsTomorrow = $this->getAssignmentsForSpecificDate($nextDay);

        $unavailableFirefighterIds = [];

        // Obtener todos los IDs de bomberos únicos
        $allFirefighterIds = collect()
            ->merge($assignmentsToday->keys())
            ->merge($assignmentsYesterday->keys())
            ->merge($assignmentsTomorrow->keys())
            ->unique();

        Log::info("Total de bomberos a evaluar:", ['count' => $allFirefighterIds->count()]);

        // Tipos sin turno que se excluyen automáticamente
        $typesWithoutTurno = ['vacaciones', 'modulo', 'licencias por dias'];

        foreach ($allFirefighterIds as $firefighterId) {
            // Verificar si está protegido por requerimientos
            $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $nextDay);
            Log::info("Bombero {$firefighterId} => isProtected: " . ($isProtected ? 'SÍ' : 'NO'));

            // Obtener las últimas asignaciones (ESTAS SON LAS QUE FALTABAN)
            $lastToday = $assignmentsToday->has($firefighterId) ? $assignmentsToday[$firefighterId]->first() : null;
            $lastYesterday = $assignmentsYesterday->has($firefighterId) ? $assignmentsYesterday[$firefighterId]->first() : null;
            $lastTomorrow = $assignmentsTomorrow->has($firefighterId) ? $assignmentsTomorrow[$firefighterId]->first() : null;

            // NUEVO: Obtener TODAS las asignaciones del día actual para este bombero
            $allAssignmentsToday = Firefighters_assignment::where('id_empleado', $firefighterId)
                ->where('fecha_ini', $date)
                ->get();

            // Variable para rastrear si debe ser excluido por trabajar en guardia
            $shouldExcludeForGuard = false;
            $guardBrigadeName = '';

            // Verificar CADA asignación del día
            // Verificar CADA asignación del día
            foreach ($allAssignmentsToday as $assignment) {
                $worksBrigadeWithGuard = false;
                $brigadeName = '';

                // Si es una IDA, verificar si TRABAJÓ antes de irse
                if ($assignment->tipo_asignacion == 'ida' && $assignment->brigadeOrigin) {
                    // IMPORTANTE: Si la IDA es por la mañana, NO trabajó (se fue antes de empezar)
                    if ($assignment->turno != 'Mañana') {
                        // Verificar si la brigada origen tiene guardia
                        if (in_array($assignment->brigadeOrigin->nombre, $excludedForToday)) {
                            $worksBrigadeWithGuard = true;
                            $brigadeName = $assignment->brigadeOrigin->nombre;
                            Log::info("Bombero {$firefighterId} trabajó en {$brigadeName} antes de irse (ida turno {$assignment->turno})");
                        }

                        // NUEVO: También excluir si va a una brigada especial pero trabajó antes
                        // Esto cubre el caso donde alguien trabaja y luego se va a Horas Sindicales
                        $specialBrigades = [
                            'Bajas',
                            'Vacaciones',
                            'Asuntos Propios',
                            'Modulo',
                            'Licencias por Jornadas',
                            'Licencias por Días',
                            'Compensacion grupos especiales',
                            'Horas Sindicales',
                            'Brigada J'
                        ];

                        if (
                            !in_array($assignment->brigadeOrigin->nombre, $specialBrigades) &&
                            in_array($assignment->brigadeDestination->nombre, $specialBrigades)
                        ) {
                            // Trabajó en brigada operativa y se fue a permiso/especial
                            $worksBrigadeWithGuard = true;
                            $brigadeName = $assignment->brigadeOrigin->nombre;
                            Log::info("Bombero {$firefighterId} trabajó en {$brigadeName} antes de irse a {$assignment->brigadeDestination->nombre}");
                        }
                    }
                }

                // Si es una VUELTA, verificar si EMPIEZA a trabajar
                if ($assignment->tipo_asignacion == 'vuelta' && $assignment->brigadeDestination) {
                    // Verificar que NO viene de una brigada especial sin turno
                    if (!in_array(strtolower($assignment->brigadeDestination->nombre), $typesWithoutTurno)) {
                        // En una vuelta a brigada operativa, si tiene guardia, SÍ trabaja
                        if (in_array($assignment->brigadeDestination->nombre, $excludedForToday)) {
                            $worksBrigadeWithGuard = true;
                            $brigadeName = $assignment->brigadeDestination->nombre;
                            Log::info("Bombero {$firefighterId} vuelve a trabajar en {$brigadeName} (vuelta turno {$assignment->turno})");
                        }
                    }
                }

                if ($worksBrigadeWithGuard) {
                    $shouldExcludeForGuard = true;
                    $guardBrigadeName = $brigadeName;
                    break;
                }
            }

            // Si trabaja en brigada con guardia, SIEMPRE excluir (sin importar protección)
            if ($shouldExcludeForGuard) {
                Log::info("EXCLUYENDO a Bombero {$firefighterId} por trabajar en brigada '{$guardBrigadeName}' con guardia HOY.");
                $unavailableFirefighterIds[] = $firefighterId;
                continue;
            }

            // 1) Revisar asignación HOY (usando la última asignación)
            if ($lastToday) {
                if ($lastToday->brigadeDestination) {
                    $brigadeNameToday = $lastToday->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId} - Asignación HOY => brigada '{$brigadeNameToday}'.");

                    // Exclusión automática por tipo sin turno
                    if (in_array(strtolower($brigadeNameToday), $typesWithoutTurno)) {
                        Log::info("Bombero {$firefighterId} EXCLUIDO automáticamente por asignación a '{$brigadeNameToday}' (tipo sin turno).");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }

                    // Si la brigada está en las excluidas y no está protegido (y no fue excluido ya)
                    if (in_array($brigadeNameToday, $excludedForToday) && !$isProtected && !$shouldExcludeForGuard) {
                        $shouldExclude = true;
                        // Excluimos por guardia mañana solo si sigue en la misma brigada mañana
                        if (in_array($brigadeNameToday, $guardTomorrow)) {
                            $sameBrigadeTomorrow = $lastTomorrow &&
                                $lastTomorrow->brigadeDestination &&
                                $lastTomorrow->brigadeDestination->nombre === $brigadeNameToday;

                            if (!$sameBrigadeTomorrow) {
                                $shouldExclude = false;
                            }
                        }

                        if ($shouldExclude) {
                            Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameToday}' HOY y NO está protegido.");
                            $unavailableFirefighterIds[] = $firefighterId;
                            continue;
                        } else {
                            Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameToday}' HOY, pero NO se excluye (cambia de brigada mañana).");
                        }
                    } else {
                        Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameToday}' HOY, pero NO se excluye (o está protegido).");
                    }
                } else {
                    // Sin asignación previa para hoy
                    Log::info("Bombero {$firefighterId} SIN asignación previa para HOY ({$date}), EXCLUYENDO.");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }
            }

            // 2) Revisar asignación AYER
            if ($lastYesterday) {
                if ($lastYesterday->brigadeDestination) {
                    $brigadeNameYesterday = $lastYesterday->brigadeDestination->nombre;
                    Log::info("Brigada de ayer para bombero {$firefighterId}: {$brigadeNameYesterday}");

                    if (in_array($brigadeNameYesterday, $excludedForYesterday) && !$isProtected) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameYesterday}' AYER y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }
                }
            }

            // 3) Revisar asignación MAÑANA
            if ($lastTomorrow) {
                if ($lastTomorrow->brigadeDestination) {
                    $brigadeNameTomorrow = $lastTomorrow->brigadeDestination->nombre;
                    Log::info("Brigada de mañana para bombero {$firefighterId}: {$brigadeNameTomorrow}");

                    if (in_array($brigadeNameTomorrow, $excludedForTomorrow) && !$isProtected) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameTomorrow}' MAÑANA y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }
                }
            }
        }

        $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
        Log::info("IDs de bomberos no disponibles (con ayer/hoy/mañana):", [
            'unavailableFirefighterIds' => $unavailableFirefighterIds
        ]);

        return $unavailableFirefighterIds;
    }


    /**
     * Obtiene las asignaciones efectivas para una fecha específica
     * Prioriza asignaciones del día exacto sobre asignaciones vigentes anteriores
     */
    private function getAssignmentsForSpecificDate($date)
    {
        // Primero, obtener asignaciones que empiezan exactamente en esta fecha
        $exactDateAssignments = Firefighters_assignment::where('fecha_ini', $date)
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        // Luego, obtener asignaciones vigentes (para bomberos sin asignación exacta)
        $allAssignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        $finalAssignments = collect();

        // Para cada bombero, priorizar asignación del día exacto
        foreach ($allAssignments as $firefighterId => $assignments) {
            if ($exactDateAssignments->has($firefighterId)) {
                // Si tiene asignación exacta para este día, usar esa
                $finalAssignments[$firefighterId] = $exactDateAssignments[$firefighterId];
                Log::info("Bombero {$firefighterId} - Usando asignación EXACTA para {$date}: brigada " .
                    ($exactDateAssignments[$firefighterId]->first()->brigadeDestination ?
                        $exactDateAssignments[$firefighterId]->first()->brigadeDestination->nombre : 'N/A'));
            } else {
                // Si no, usar la asignación vigente más reciente
                $finalAssignments[$firefighterId] = collect([$assignments->first()]);
                Log::info("Bombero {$firefighterId} - Usando asignación VIGENTE para {$date}: brigada " .
                    ($assignments->first()->brigadeDestination ?
                        $assignments->first()->brigadeDestination->nombre : 'N/A'));
            }
        }

        return $finalAssignments;
    }

    private function isFirefighterInGuardBrigade($firefighterId, $date)
    {
        $lastAssignment = Firefighters_assignment::where('id_empleado', $firefighterId)
            ->where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastAssignment || !$lastAssignment->brigadeDestination) {
            return false;
        }

        $brigadeName = $lastAssignment->brigadeDestination->nombre;
        $guardsToday = Guard::with('brigade')
            ->where('date', $date)
            ->get()
            ->pluck('brigade.nombre')
            ->unique()
            ->toArray();

        return in_array($brigadeName, $guardsToday);
    }

    private function isProtectedByRequests($firefighterId, $previousDay, $currentDay, $nextDay)
    {
        // Tipos que NO tienen turno
        $typesWithoutTurno = [
            'vacaciones',
            'modulo',
            'licencias por dias'
        ];

        // Tipos que SÍ requieren comprobación de turnos
        $typesWithTurno = [
            'asuntos propios',
            'compensacion grupos especiales',
            'licencias por jornadas',
            'horas sindicales'
        ];

        // Verificar si el bombero está en guardia HOY
        $isInGuardToday = $this->isFirefighterInGuardBrigade($firefighterId, $currentDay);

        // Si está en guardia HOY, nunca debe estar protegido para HOY
        if ($isInGuardToday) {
            Log::info("isProtectedByRequests - Bombero {$firefighterId} en guardia HOY, no puede estar protegido.");
            return false;
        }

        // Verificar día anterior
        $protectedPrevious = \App\Models\Request::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->where(function ($query) use ($previousDay, $typesWithoutTurno, $typesWithTurno) {
                $query->where(function ($q) use ($previousDay, $typesWithoutTurno) {
                    $q->whereIn('tipo', $typesWithoutTurno)
                        ->where('fecha_ini', '<=', $previousDay)
                        ->where('fecha_fin', '=', $previousDay);
                })
                    ->orWhere(function ($q) use ($previousDay, $typesWithTurno) {
                        $q->whereIn('tipo', $typesWithTurno)
                            ->where('fecha_ini', '<=', $previousDay)
                            ->where('fecha_fin', '>=', $previousDay)
                            ->whereIn('turno', ['Tarde y noche', 'Día Completo']);
                    });
            })
            ->exists();

        Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día anterior: " . ($protectedPrevious ? "Protegido" : "No protegido"));

        // Verificar día siguiente
        $protectedNext = \App\Models\Request::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->where(function ($query) use ($nextDay, $typesWithoutTurno, $typesWithTurno) {
                $query->where(function ($q) use ($nextDay, $typesWithoutTurno) {
                    $q->whereIn('tipo', $typesWithoutTurno)
                        ->where('fecha_ini', '=', $nextDay);
                })
                    ->orWhere(function ($q) use ($nextDay, $typesWithTurno) {
                        $q->whereIn('tipo', $typesWithTurno)
                            ->where('fecha_ini', '=', $nextDay)
                            ->whereIn('turno', ['Mañana y tarde', 'Día Completo']);
                    });
            })
            ->exists();

        Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día siguiente: " . ($protectedNext ? "Protegido" : "No protegido"));

        // Protegido si cualquiera de las condiciones es verdadera
        $result = $protectedPrevious || $protectedNext;
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
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->first();

        $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

        // 2. Calcular el turno de ida
        $turnoIda = match ($turnoRequest) {
            'Mañana', 'Día Completo', 'Mañana y tarde' => 'Mañana',
            'Tarde', 'Tarde y noche' => 'Tarde',
            'Noche' => 'Noche',
            default => 'Mañana',
        };

        // 3. Crear la asignación de ida (requerimiento = true)
        $asignacionIda = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $brigadaOrigen,
            'id_brigada_destino' => $idBrigadaDestino,
            'fecha_ini' => $fecha,
            'turno' => $turnoIda,
            'requerimiento' => true,
            'tipo_asignacion' => 'ida',
        ]);

        // 4. Calcular el turno de vuelta y la fecha de vuelta
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
                $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
                break;
            case 'Día Completo':
                $turnoVuelta = 'Mañana';
                $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
                break;
            default:
                $turnoVuelta = 'Tarde';
                $fechaVuelta = $fecha;
                break;
        }

        // 5. Crear la asignación de vuelta (requerimiento = false)
        $asignacionVuelta = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $idBrigadaDestino,
            'id_brigada_destino' => $brigadaOrigen,
            'fecha_ini' => $fechaVuelta,
            'turno' => $turnoVuelta,
            'requerimiento' => false,
            'tipo_asignacion' => 'vuelta',
        ]);

        return response()->json([
            'asignacion_ida' => $asignacionIda,
            'asignacion_vuelta' => $asignacionVuelta,
        ], 201);
    }


    public function availableFirefightersNoAdjacentDays(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefightersNoAdjacentDays:", ['date' => $date]);

        // Lista estática de exclusión
        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Horas Sindicales'];

        // Obtenemos las brigadas que tienen guardia SOLO en el día consultado
        $guards = Guard::with('brigade')->where('date', $date)->get();
        $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos ambas listas
        $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
        Log::info("Brigadas excluidas (estáticas y por guardia en {$date}):", ['excludedBrigades' => $excludedBrigades]);

        // Obtenemos IDs de bomberos **no disponibles** sin considerar ayer/mañana.
        $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoAdjacentDays($date, $excludedBrigades);

        $availableFirefighters = User::whereIn('type', ['bombero', 'mando'])
            ->whereNotIn('id_empleado', $unavailableFirefighterIds)
            ->get();

        Log::info("Bomberos disponibles (No Adjacent) obtenidos:", ['available_firefighters' => $availableFirefighters]);

        return response()->json([
            'date' => $date,
            'available_firefighters' => $availableFirefighters,
        ]);
    }


    private function getFirefightersAssignedToExcludedBrigadesNoAdjacentDays($date, $excludedBrigades)
    {
        Log::info("Fecha y brigadas excluidas (NO Adjacent):", [
            'date' => $date,
            'excludedBrigades' => $excludedBrigades
        ]);

        // Traemos todas las asignaciones vigentes a la fecha actual (como hacías antes)
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente primero
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno (dentro de la misma fecha)
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Ida antes que vuelta (SOLO si fecha y turno son iguales)
            ->orderBy('created_at', 'desc')                                   // 4. Creación más reciente
            ->get()
            ->groupBy('id_empleado');

        Log::info("Asignaciones agrupadas por bombero (NO Adjacent):", [
            'assignments' => $assignments
        ]);

        $unavailableFirefighterIds = [];

        foreach ($assignments as $firefighterId => $firefighterAssignments) {
            $lastAssignment = $firefighterAssignments->first();

            // Lo marcamos como no disponible si la última brigada destino está en la lista de excluidas
            if ($lastAssignment && $lastAssignment->brigadeDestination) {
                $brigadeName = $lastAssignment->brigadeDestination->nombre;
                if (in_array($brigadeName, $excludedBrigades)) {
                    Log::info("Bombero {$firefighterId} EXCLUIDO (NO Adjacent) por estar en brigada '{$brigadeName}' el día actual.");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }
            } else {
                // Si no tiene asignación previa, lo excluimos (o puedes decidir lo contrario)
                Log::info("Bombero {$firefighterId} no tiene asignación previa para {$date}, excluyendo (NO Adjacent).");
                $unavailableFirefighterIds[] = $firefighterId;
            }
        }

        Log::info("IDs de bomberos no disponibles:", [
            'unavailableFirefighterIds' => $unavailableFirefighterIds
        ]);

        return $unavailableFirefighterIds;
    }

    /**
     * Excluye a quienes tengan guardia HOY o MAÑANA. Devuelve sólo users con puesto = 'Operador'.
     */
    public function availableFirefightersNoTodayAndTomorrow(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefightersNoTodayAndTomorrow:", ['date' => $date]);

        // Calculamos la fecha de mañana
        $tomorrow = date('Y-m-d', strtotime("$date +1 day"));

        // Lista estática de exclusión
        $staticExcluded = [
            'Bajas',
            'Vacaciones',
            'Asuntos Propios',
            'Modulo',
            'Licencias por Jornadas',
            'Licencias por Días',
            'Compensacion grupos especiales',
            'Horas Sindicales'

        ];

        // Brigadas que tienen guardia HOY
        $guardsToday = Guard::with('brigade')->where('date', $date)->get();
        $excludedToday = $guardsToday->pluck('brigade.nombre')->unique()->toArray();

        // Brigadas que tienen guardia MAÑANA
        $guardsTomorrow = Guard::with('brigade')->where('date', $tomorrow)->get();
        $excludedTomorrow = $guardsTomorrow->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos ambas listas
        $excludedBrigades = array_merge($staticExcluded, $excludedToday, $excludedTomorrow);
        Log::info("Brigadas excluidas (estáticas, hoy y mañana) en {$date}:", ['excludedBrigades' => $excludedBrigades]);

        // Obtenemos IDs de bomberos no disponibles, para HOY o MAÑANA
        $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoTodayAndTomorrow($date, $tomorrow, $excludedBrigades);

        // Aquí solo traemos users con puesto = 'Operador'
        $availableFirefighters = User::where('puesto', 'Operador')
            ->whereNotIn('id_empleado', $unavailableFirefighterIds)
            ->get();

        Log::info("Bomberos disponibles (No Today & Tomorrow) obtenidos:", ['available_firefighters' => $availableFirefighters]);

        return response()->json([
            'date' => $date,
            'available_firefighters' => $availableFirefighters,
        ]);
    }

    // MÉTODO 1: getFirefightersAssignedToExcludedBrigadesNoTodayAndTomorrow
    private function getFirefightersAssignedToExcludedBrigadesNoTodayAndTomorrow($date, $tomorrow, $excludedBrigades)
    {
        Log::info("Fecha hoy: {$date}, fecha mañana: {$tomorrow}, brigadas excluidas:", ['excludedBrigades' => $excludedBrigades]);

        $unavailableFirefighterIds = [];

        // Día anterior a HOY (por si usamos isProtectedByRequests)
        $previousDay = date('Y-m-d', strtotime("$date -1 day"));

        // Asignaciones vigentes para HOY
        $assignmentsToday = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        // Asignaciones vigentes para MAÑANA
        $assignmentsTomorrow = Firefighters_assignment::where('fecha_ini', '<=', $tomorrow)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        // Bomberos que tienen asignaciones hoy o mañana
        $allFirefighterIds = $assignmentsToday->keys()
            ->merge($assignmentsTomorrow->keys())
            ->unique();

        // Definimos los tipos sin turno (en minúsculas para comparación)
        $typesWithoutTurno = ['vacaciones', 'modulo', 'licencias por dias'];

        foreach ($allFirefighterIds as $firefighterId) {
            // Verificamos si está protegido (día anterior, hoy y mañana)
            $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $tomorrow);
            Log::info("Bombero {$firefighterId} => isProtected: " . ($isProtected ? 'SÍ' : 'NO'));

            // 1) Última asignación HOY
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastAssignmentToday = $assignmentsToday->has($firefighterId) ? $assignmentsToday[$firefighterId]->first() : null;

            if ($lastAssignmentToday && $lastAssignmentToday->brigadeDestination) {
                $brigadeName = $lastAssignmentToday->brigadeDestination->nombre;
                Log::info("Bombero {$firefighterId} - Asignación HOY => brigada '{$brigadeName}'.");

                // Si la última asignación es de un tipo sin turno, se excluye automáticamente
                if (in_array(strtolower($brigadeName), $typesWithoutTurno)) {
                    Log::info("Bombero {$firefighterId} EXCLUIDO automáticamente por asignación a '{$brigadeName}' (tipo sin turno).");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue; // Pasamos al siguiente bombero sin evaluar protección
                }

                // Luego, si la brigada está en las excluidas y no está protegido, se excluye
                if (in_array($brigadeName, $excludedBrigades) && !$isProtected) {
                    Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeName}' HOY y NO está protegido.");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue; // Ya excluido por hoy, no chequeamos mañana
                } else {
                    Log::info("Bombero {$firefighterId} - brigada '{$brigadeName}' HOY, pero NO se excluye (o está protegido).");
                }
            } else {
                // Si no tiene asignación previa para HOY, lo excluimos (o ajusta si quieres otro comportamiento)
                Log::info("Bombero {$firefighterId} SIN asignación previa para HOY ({$date}), EXCLUYENDO (NoTodayAndTomorrow).");
                $unavailableFirefighterIds[] = $firefighterId;
                continue;
            }

            // 2) Última asignación MAÑANA (solo si no se excluyó por hoy)
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastAssignmentTomorrow = $assignmentsTomorrow->has($firefighterId) ? $assignmentsTomorrow[$firefighterId]->first() : null;

            if ($lastAssignmentTomorrow && $lastAssignmentTomorrow->brigadeDestination) {
                $brigadeNameTomorrow = $lastAssignmentTomorrow->brigadeDestination->nombre;
                Log::info("Bombero {$firefighterId} - Asignación MAÑANA => brigada '{$brigadeNameTomorrow}'.");

                if (in_array($brigadeNameTomorrow, $excludedBrigades) && !$isProtected) {
                    Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameTomorrow}' MAÑANA y NO está protegido.");
                    $unavailableFirefighterIds[] = $firefighterId;
                } else {
                    Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameTomorrow}' MAÑANA, pero NO se excluye (o está protegido).");
                }
            }
        }

        $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
        Log::info("IDs de bomberos no disponibles (No Today & Tomorrow + isProtected):", [
            'unavailableFirefighterIds' => $unavailableFirefighterIds
        ]);

        return $unavailableFirefighterIds;
    }



    /**
     * Excluye a quienes tengan guardia HOY o AYER. Devuelve sólo users con puesto = 'Operador'.
     */
    public function availableFirefightersNoTodayAndYesterday(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefightersNoTodayAndYesterday:", ['date' => $date]);

        // Calculamos la fecha de AYER
        $yesterday = date('Y-m-d', strtotime("$date -1 day"));

        // Lista estática de exclusión
        $staticExcluded = [
            'Bajas',
            'Vacaciones',
            'Asuntos Propios',
            'Modulo',
            'Licencias por Jornadas',
            'Licencias por Días',
            'Compensacion grupos especiales',
            'Horas Sindicales'
        ];

        // Brigadas que tienen guardia HOY
        $guardsToday = Guard::with('brigade')->where('date', $date)->get();
        $excludedToday = $guardsToday->pluck('brigade.nombre')->unique()->toArray();

        // Brigadas que tienen guardia AYER
        $guardsYesterday = Guard::with('brigade')->where('date', $yesterday)->get();
        $excludedYesterday = $guardsYesterday->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos ambas listas
        $excludedBrigades = array_merge($staticExcluded, $excludedToday, $excludedYesterday);
        Log::info("Brigadas excluidas (estáticas, hoy y ayer) en {$date}:", ['excludedBrigades' => $excludedBrigades]);

        // IDs no disponibles para HOY o AYER
        $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoTodayAndYesterday($date, $yesterday, $excludedBrigades);

        // Aquí solo traemos users con puesto = 'Operador'
        $availableFirefighters = User::where('puesto', 'Operador')
            ->whereNotIn('id_empleado', $unavailableFirefighterIds)
            ->get();

        Log::info("Bomberos disponibles (No Today & Yesterday) obtenidos:", ['available_firefighters' => $availableFirefighters]);

        return response()->json([
            'date' => $date,
            'available_firefighters' => $availableFirefighters,
        ]);
    }

    private function getFirefightersAssignedToExcludedBrigadesNoTodayAndYesterday($date, $yesterday, $excludedBrigades)
    {
        Log::info("Fecha hoy: {$date}, fecha ayer: {$yesterday}, brigadas excluidas:", ['excludedBrigades' => $excludedBrigades]);

        $unavailableFirefighterIds = [];

        // Podemos definir un día posterior a HOY para isProtectedByRequests
        $tomorrow = date('Y-m-d', strtotime("$date +1 day"));

        // Asignaciones para HOY
        $assignmentsToday = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        // Asignaciones para AYER
        $assignmentsYesterday = Firefighters_assignment::where('fecha_ini', '<=', $yesterday)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo (solo si fecha+turno iguales)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('id_empleado');

        // Bomberos que tienen asignaciones hoy o ayer
        $allFirefighterIds = $assignmentsToday->keys()
            ->merge($assignmentsYesterday->keys())
            ->unique();

        // Definimos los tipos sin turno
        $typesWithoutTurno = ['vacaciones', 'modulo', 'licencias por dias'];

        foreach ($allFirefighterIds as $firefighterId) {
            // Verificamos si está protegido (ayer, hoy y mañana)
            $isProtected = $this->isProtectedByRequests($firefighterId, $yesterday, $date, $tomorrow);
            Log::info("Bombero {$firefighterId} => isProtected: " . ($isProtected ? 'SÍ' : 'NO'));

            // 1) Última asignación HOY
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastAssignmentToday = $assignmentsToday->has($firefighterId) ? $assignmentsToday[$firefighterId]->first() : null;

            if ($lastAssignmentToday && $lastAssignmentToday->brigadeDestination) {
                $brigadeNameToday = $lastAssignmentToday->brigadeDestination->nombre;
                Log::info("Bombero {$firefighterId} - Asignación HOY => brigada '{$brigadeNameToday}'.");

                // Si la asignación es de un tipo sin turno, se excluye automáticamente
                if (in_array(strtolower($brigadeNameToday), $typesWithoutTurno)) {
                    Log::info("Bombero {$firefighterId} EXCLUIDO automáticamente por asignación a '{$brigadeNameToday}' (tipo sin turno).");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }

                if (in_array($brigadeNameToday, $excludedBrigades) && !$isProtected) {
                    Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameToday}' HOY y NO está protegido.");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue; // Excluido por hoy
                } else {
                    Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameToday}' HOY, " .
                        (in_array($brigadeNameToday, $excludedBrigades) ? "pero ESTÁ PROTEGIDO" : "pero NO está excluida") . ".");
                }
            } else {
                // Sin asignación para HOY, lo excluimos
                Log::info("Bombero {$firefighterId} SIN asignación para HOY ({$date}), EXCLUYENDO (NoTodayAndYesterday).");
                $unavailableFirefighterIds[] = $firefighterId;
                continue;
            }

            // 2) Última asignación AYER (solo si no se excluyó por hoy)
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastAssignmentYesterday = $assignmentsYesterday->has($firefighterId) ? $assignmentsYesterday[$firefighterId]->first() : null;

            if ($lastAssignmentYesterday && $lastAssignmentYesterday->brigadeDestination) {
                $brigadeNameYesterday = $lastAssignmentYesterday->brigadeDestination->nombre;
                Log::info("Bombero {$firefighterId} - Asignación AYER => brigada '{$brigadeNameYesterday}'.");

                if (in_array($brigadeNameYesterday, $excludedBrigades) && !$isProtected) {
                    Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameYesterday}' AYER y NO está protegido.");
                    $unavailableFirefighterIds[] = $firefighterId;
                } else {
                    Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameYesterday}' AYER, pero NO se excluye (o está protegido).");
                }
            }
        }

        $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
        Log::info("IDs de bomberos no disponibles (No Today & Yesterday + isProtected):", [
            'unavailableFirefighterIds' => $unavailableFirefighterIds
        ]);

        return $unavailableFirefighterIds;
    }

    public function increaseUserColumnValue($id_empleado, Request $request)
    {
        $validated = $request->validate([
            'column' => 'required|string',
            'increment' => 'required|numeric',
            // Recibimos opcionalmente el nombre de la segunda columna
            'orderColumn2' => 'nullable|string',
        ]);

        $column = $validated['column'];
        $increment = $validated['increment'];
        $orderColumn2 = $validated['orderColumn2'] ?? null;

        $user = User::find($id_empleado);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        // Incrementar la columna principal
        $user->$column += $increment;

        // Si se proporciona el nombre de la segunda columna, actualizarla con el timestamp actual
        if ($orderColumn2) {
            $user->$orderColumn2 = now();
        }

        $user->save();

        return response()->json([
            'message' => "Columna '{$column}' incrementada en {$increment}" . ($orderColumn2 ? " y '{$orderColumn2}' actualizado." : "."),
            'new_value' => $user->$column,
            'orderColumn2' => $orderColumn2 ? $user->$orderColumn2 : null,
        ]);
    }


    public function workingFirefighters(Request $request)
    {
        // Se obtiene la fecha de consulta (por defecto el día de hoy)
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en workingFirefighters:", ['date' => $date]);

        // Se obtienen las guardias asignadas para esa fecha, junto con la información de la brigada
        $guards = Guard::with('brigade')->where('date', $date)->get();
        // Se extraen los nombres de las brigadas que tienen guardia asignada ese día
        $guardBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
        Log::info("Brigadas con guardia asignada en {$date}:", ['guardBrigades' => $guardBrigades]);

        // Se obtienen las asignaciones de bomberos cuya fecha es menor o igual a la fecha consultada,
        // ordenadas de forma que la primera asignación de cada bombero es la más reciente.
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente primero
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Turno (dentro de la misma fecha)
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Ida antes que vuelta (SOLO si fecha y turno son iguales)
            ->orderBy('created_at', 'desc')                                   // 4. Creación más reciente
            ->get()
            ->groupBy('id_empleado');

        $workingFirefighterIds = [];

        // Se recorre cada grupo de asignaciones por bombero
        foreach ($assignments as $firefighterId => $assignmentGroup) {
            // Se toma la última asignación (la más reciente) para el bombero
            $lastAssignment = $assignmentGroup->first();
            if ($lastAssignment && $lastAssignment->brigadeDestination) {
                $brigadeName = $lastAssignment->brigadeDestination->nombre;
                // Si la brigada destino de la última asignación está entre las brigadas que tienen guardia asignada,
                // se considera que el bombero está trabajando
                if (in_array($brigadeName, $guardBrigades)) {
                    $workingFirefighterIds[] = $firefighterId;
                }
            }
        }

        // Se obtienen los datos de los bomberos que cumplen la condición
        $workingFirefighters = User::whereIn('id_empleado', $workingFirefighterIds)->get();

        return response()->json([
            'date' => $date,
            'available_firefighters' => $workingFirefighters
        ]);
    }

    /**
     * Crear asignaciones de prácticas para usuarios
     * Crea una asignación de ida por la mañana y otra de vuelta por la tarde el mismo día
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function createPracticesAssigments(Request $request)
    {
        Log::info("createPracticesAssigments - Datos recibidos:", $request->all());

        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idEmpleado = $request->input('id_empleado');
        $idBrigadaDestino = $request->input('id_brigada_destino');
        $fecha = $request->input('fecha');

        // 1. Determinar la brigada original (última antes de $fecha)
        $assignmentAnterior = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<=', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

        // 2. Crear la asignación de ida por la mañana (prácticas)
        $asignacionIda = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $brigadaOrigen,
            'id_brigada_destino' => $idBrigadaDestino,
            'fecha_ini' => $fecha,
            'turno' => 'Mañana',
            'requerimiento' => true,
            'tipo_asignacion' => 'ida',
        ]);

        // 3. Crear la asignación de vuelta por la tarde (mismo día)
        $asignacionVuelta = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $idBrigadaDestino,
            'id_brigada_destino' => $brigadaOrigen,
            'fecha_ini' => $fecha,
            'turno' => 'Tarde',
            'requerimiento' => false,
            'tipo_asignacion' => 'vuelta',
        ]);

        return response()->json([
            'asignacion_ida' => $asignacionIda,
            'asignacion_vuelta' => $asignacionVuelta,
            'message' => 'Asignaciones de prácticas creadas correctamente'
        ], 201);
    }

    /**
     * Crear asignaciones de retén (RT)
     * Crea una asignación de ida por la mañana y otra de vuelta por la mañana del día siguiente
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function createRTAssigments(Request $request)
    {
        Log::info("createRTAssigments - Datos recibidos:", $request->all());

        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idEmpleado = $request->input('id_empleado');
        $idBrigadaDestino = $request->input('id_brigada_destino');
        $fecha = $request->input('fecha');

        // Calcular la fecha del día siguiente para la asignación de vuelta
        $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));

        // 1. Determinar la brigada original (última antes de $fecha)
        $assignmentAnterior = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<=', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

        // 2. Crear la asignación de ida por la mañana
        $asignacionIda = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $brigadaOrigen,
            'id_brigada_destino' => $idBrigadaDestino,
            'fecha_ini' => $fecha,
            'turno' => 'Mañana',
            'requerimiento' => true,
            'tipo_asignacion' => 'ida',
        ]);

        // 3. Crear la asignación de vuelta por la mañana del día siguiente
        $asignacionVuelta = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $idBrigadaDestino,
            'id_brigada_destino' => $brigadaOrigen,
            'fecha_ini' => $fechaVuelta,
            'turno' => 'Mañana',
            'requerimiento' => false,
            'tipo_asignacion' => 'vuelta',
        ]);

        return response()->json([
            'asignacion_ida' => $asignacionIda,
            'asignacion_vuelta' => $asignacionVuelta,
            'message' => 'Asignaciones de retén (RT) creadas correctamente'
        ], 201);
    }

    /**
     * Verificar si existe una asignación especial para una brigada en una fecha específica
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getEspecialAssigment(Request $request)
    {
        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idBrigada = $request->input('id_brigada');
        $fecha = $request->input('fecha');

        // Buscar todas las asignaciones para esa brigada en esa fecha como brigada de destino
        $existenAsignaciones = Firefighters_assignment::where('id_brigada_destino', $idBrigada)
            ->where('fecha_ini', $fecha)
            ->exists();

        Log::info("getEspecialAssigment - Verificando brigada {$idBrigada} en fecha {$fecha}: " .
            ($existenAsignaciones ? 'Tiene asignaciones' : 'No tiene asignaciones'));

        return response()->json([
            'id_brigada' => $idBrigada,
            'fecha' => $fecha,
            'has_assignments' => $existenAsignaciones
        ]);
    }

    public function checkEspecialAssignment(Request $request)
    {
        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
            'id_usuario' => 'required|exists:users,id_empleado',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idBrigada = $request->input('id_brigada');
        $fecha = $request->input('fecha');
        $idUsuario = $request->input('id_usuario');

        // Buscar si existe alguna asignación específica para ese usuario en la brigada y fecha especificadas
        // Ahora verificamos explícitamente que sea para este usuario
        $existeAsignacion = Firefighters_assignment::where('id_brigada_destino', $idBrigada)
            ->where('fecha_ini', $fecha)
            ->where('id_empleado', $idUsuario)
            ->exists();

        Log::info("checkEspecialAssignment - Verificando asignación para usuario {$idUsuario} en brigada {$idBrigada} en fecha {$fecha}: " .
            ($existeAsignacion ? 'Existe' : 'No existe'));

        return response()->json([
            'id_brigada' => $idBrigada,
            'fecha' => $fecha,
            'id_usuario' => $idUsuario,
            'has_assignments' => $existeAsignacion
        ]);
    }


    /**
     * Eliminar asignaciones de prácticas para una brigada en una fecha específica
     * Elimina las asignaciones donde la brigada origen o destino coincida con la brigada especificada
     * y que sean del mismo día (ida por la mañana y vuelta por la tarde)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function deletePracticesAssignments(Request $request)
    {
        Log::info("deletePracticesAssignments - Datos recibidos:", $request->all());

        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
            'id_usuario' => 'required|exists:users,id_empleado', // Nuevo campo obligatorio
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idBrigada = $request->input('id_brigada');
        $fecha = $request->input('fecha');
        $idUsuario = $request->input('id_usuario'); // Nuevo campo

        // Buscar y eliminar solo las asignaciones del usuario específico relacionadas con esa brigada en esa fecha
        $eliminadas = Firefighters_assignment::where('fecha_ini', $fecha)
            ->where('id_empleado', $idUsuario) // Filtramos por ID de usuario
            ->where(function ($query) use ($idBrigada) {
                $query->where('id_brigada_origen', $idBrigada)
                    ->orWhere('id_brigada_destino', $idBrigada);
            })
            ->get();

        // Almacenar los IDs antes de eliminar
        $idsEliminados = $eliminadas->pluck('id_asignacion')->toArray();

        // Cantidad de registros que serán eliminados
        $count = $eliminadas->count();

        // Eliminar los registros
        Firefighters_assignment::where('fecha_ini', $fecha)
            ->where('id_empleado', $idUsuario) // Filtramos por ID de usuario
            ->where(function ($query) use ($idBrigada) {
                $query->where('id_brigada_origen', $idBrigada)
                    ->orWhere('id_brigada_destino', $idBrigada);
            })
            ->delete();

        Log::info("Asignaciones de prácticas eliminadas para usuario específico:", [
            'fecha' => $fecha,
            'id_brigada' => $idBrigada,
            'id_usuario' => $idUsuario,
            'cantidad' => $count,
            'ids_eliminados' => $idsEliminados
        ]);

        return response()->json([
            'message' => "Se han eliminado {$count} asignaciones de prácticas para el usuario {$idUsuario} en la brigada {$idBrigada} en la fecha {$fecha}",
            'deleted_count' => $count,
            'deleted_ids' => $idsEliminados
        ]);
    }

    /**
     * Eliminar asignaciones de retén (RT) para un usuario específico en una brigada y fecha
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function deleteRTAssignments(Request $request)
    {
        Log::info("deleteRTAssignments - Datos recibidos:", $request->all());

        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
            'id_usuario' => 'required|exists:users,id_empleado', // Nuevo campo obligatorio
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idBrigada = $request->input('id_brigada');
        $fecha = $request->input('fecha');
        $idUsuario = $request->input('id_usuario'); // Nuevo campo

        // Calcular la fecha del día siguiente para la asignación de vuelta
        $fechaSiguiente = date('Y-m-d', strtotime($fecha . ' +1 day'));

        // Buscar y eliminar las asignaciones del usuario específico relacionadas con esa brigada
        // en la fecha especificada y en el día siguiente
        $eliminadas = Firefighters_assignment::whereIn('fecha_ini', [$fecha, $fechaSiguiente])
            ->where('id_empleado', $idUsuario) // Filtramos por ID de usuario
            ->where(function ($query) use ($idBrigada) {
                $query->where('id_brigada_origen', $idBrigada)
                    ->orWhere('id_brigada_destino', $idBrigada);
            })
            ->get();

        // Almacenar los IDs antes de eliminar
        $idsEliminados = $eliminadas->pluck('id_asignacion')->toArray();

        // Cantidad de registros que serán eliminados
        $count = $eliminadas->count();

        // Eliminar los registros
        Firefighters_assignment::whereIn('fecha_ini', [$fecha, $fechaSiguiente])
            ->where('id_empleado', $idUsuario) // Filtramos por ID de usuario
            ->where(function ($query) use ($idBrigada) {
                $query->where('id_brigada_origen', $idBrigada)
                    ->orWhere('id_brigada_destino', $idBrigada);
            })
            ->delete();

        Log::info("Asignaciones de retén (RT) eliminadas para usuario específico:", [
            'fecha' => $fecha,
            'fecha_siguiente' => $fechaSiguiente,
            'id_brigada' => $idBrigada,
            'id_usuario' => $idUsuario,
            'cantidad' => $count,
            'ids_eliminados' => $idsEliminados
        ]);

        return response()->json([
            'message' => "Se han eliminado {$count} asignaciones de retén (RT) para el usuario {$idUsuario} en la brigada {$idBrigada} en las fechas {$fecha} y {$fechaSiguiente}",
            'deleted_count' => $count,
            'deleted_ids' => $idsEliminados
        ]);
    }

    /**
     * Ampliar/prolongar la jornada de un bombero hacia adelante o hacia atrás
     * Modifica la asignación de vuelta (prolongar hacia adelante) o la de ida (prolongar hacia atrás)
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function extendWorkingDay(Request $request)
    {
        Log::info("extendWorkingDay - Datos recibidos:", $request->all());

        // Validar los campos recibidos
        $validator = Validator::make($request->all(), [
            'id_empleado' => 'required|exists:users,id_empleado',
            'fecha_actual' => 'required|date', // Fecha donde tiene asignaciones actuales
            'nueva_fecha' => 'required|date', // Nueva fecha hasta donde se quiere prolongar
            'nuevo_turno' => 'required|in:Mañana,Tarde,Noche', // Nuevo turno
            'direccion' => 'required|in:adelante,atras', // Dirección de la prolongación
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idEmpleado = $request->input('id_empleado');
        $fechaActual = $request->input('fecha_actual');
        $nuevaFecha = $request->input('nueva_fecha');
        $nuevoTurno = $request->input('nuevo_turno');
        $direccion = $request->input('direccion');

        if ($direccion === 'adelante') {
            return $this->extendForward($idEmpleado, $fechaActual, $nuevaFecha, $nuevoTurno);
        } else {
            return $this->extendBackward($idEmpleado, $fechaActual, $nuevaFecha, $nuevoTurno);
        }
    }


    /**
     * Prolongar jornada hacia adelante (modificando asignación de vuelta)
     */
    private function extendForward($idEmpleado, $fechaActual, $nuevaFecha, $turnoAProlongar)
    {
        // Función auxiliar para calcular el nuevo turno de vuelta según el turno a prolongar
        $calcularNuevoTurnoVuelta = function ($turnoAProlongar, $fechaActual, $nuevaFecha) {
            switch ($turnoAProlongar) {
                case 'Mañana':
                    // Si prolongamos la mañana, la vuelta debe ser por la tarde del mismo día
                    return [
                        'turno' => 'Tarde',
                        'fecha' => $nuevaFecha
                    ];

                case 'Tarde':
                    // Si prolongamos la tarde, la vuelta debe ser por la noche del mismo día
                    return [
                        'turno' => 'Noche',
                        'fecha' => $nuevaFecha
                    ];

                case 'Noche':
                    // Si prolongamos la noche, la vuelta debe ser por la mañana del día siguiente
                    $diaSiguiente = date('Y-m-d', strtotime($nuevaFecha . ' +1 day'));
                    return [
                        'turno' => 'Mañana',
                        'fecha' => $diaSiguiente
                    ];

                default:
                    return [
                        'turno' => 'Tarde',
                        'fecha' => $nuevaFecha
                    ];
            }
        };

        // CASO ESPECIAL: Detectar si estamos prolongando desde noche hasta mañana siguiente
        $diaSiguiente = date('Y-m-d', strtotime($fechaActual . ' +1 day'));
        $esCasoNocheMañana = ($nuevaFecha === $diaSiguiente && $turnoAProlongar === 'Mañana');

        if ($esCasoNocheMañana) {
            Log::info("Detectado caso especial: prolongación de noche a mañana siguiente");
            return $this->handleNightToMorningExtension($idEmpleado, $fechaActual, $nuevaFecha, $turnoAProlongar);
        }

        // CASO NORMAL: Buscar asignación de vuelta en la fecha actual
        $asignacionVuelta = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', $fechaActual)
            ->where('tipo_asignacion', 'vuelta')
            ->first();

        if (!$asignacionVuelta) {
            Log::warning("No se encontró asignación de vuelta para el bombero {$idEmpleado} en la fecha {$fechaActual}");
            return response()->json([
                'message' => 'No se encontró una asignación de vuelta para este bombero en la fecha especificada'
            ], 404);
        }

        // Calcular el nuevo turno y fecha de vuelta
        $nuevoTurnoVuelta = $calcularNuevoTurnoVuelta($turnoAProlongar, $fechaActual, $nuevaFecha);

        // Validar que la nueva fecha no sea anterior a la fecha actual
        if ($nuevoTurnoVuelta['fecha'] < $fechaActual) {
            return response()->json([
                'message' => 'Para prolongar hacia adelante, la nueva fecha no puede ser anterior a la fecha actual'
            ], 400);
        }

        // Guardar los valores originales para el log
        $fechaOriginal = $asignacionVuelta->fecha_ini;
        $turnoOriginal = $asignacionVuelta->turno;

        // Actualizar la asignación de vuelta con la nueva fecha y turno calculado
        $asignacionVuelta->fecha_ini = $nuevoTurnoVuelta['fecha'];
        $asignacionVuelta->turno = $nuevoTurnoVuelta['turno'];
        $asignacionVuelta->save();

        Log::info("Jornada prolongada hacia adelante:", [
            'id_empleado' => $idEmpleado,
            'id_asignacion' => $asignacionVuelta->id_asignacion,
            'tipo_asignacion' => 'vuelta',
            'turno_a_prolongar' => $turnoAProlongar,
            'fecha_original' => $fechaOriginal,
            'turno_original' => $turnoOriginal,
            'nueva_fecha' => $nuevoTurnoVuelta['fecha'],
            'nuevo_turno' => $nuevoTurnoVuelta['turno']
        ]);

        // Cargar las relaciones para la respuesta
        $asignacionVuelta->load(['firefighter:id_empleado,nombre,apellido', 'brigadeOrigin:id_brigada,nombre', 'brigadeDestination:id_brigada,nombre']);

        return response()->json([
            'message' => "Jornada prolongada exitosamente. Ahora trabajará también el turno de {$turnoAProlongar}",
            'tipo_modificacion' => 'vuelta',
            'caso_especial' => 'normal',
            'turno_prolongado' => $turnoAProlongar,
            'asignacion_modificada' => $asignacionVuelta,
            'cambios' => [
                'fecha_anterior' => $fechaOriginal,
                'turno_anterior' => $turnoOriginal,
                'nueva_fecha' => $nuevoTurnoVuelta['fecha'],
                'nuevo_turno' => $nuevoTurnoVuelta['turno']
            ]
        ], 200);
    }

    /**
     * Prolongar jornada hacia atrás (modificando asignación de ida)
     */
    private function extendBackward($idEmpleado, $fechaActual, $nuevaFecha, $turnoAProlongar)
    {
        // Función auxiliar para calcular el nuevo turno de ida según el turno a prolongar
        $calcularNuevoTurnoIda = function ($turnoAProlongar, $fechaActual, $nuevaFecha) {
            switch ($turnoAProlongar) {
                case 'Mañana':
                    // Si prolongamos para incluir la mañana, la ida debe ser por la mañana
                    return [
                        'turno' => 'Mañana',
                        'fecha' => $nuevaFecha
                    ];

                case 'Tarde':
                    // Si prolongamos para incluir la tarde, la ida debe ser por la tarde
                    return [
                        'turno' => 'Tarde',
                        'fecha' => $nuevaFecha
                    ];

                case 'Noche':
                    // Si prolongamos para incluir la noche, la ida debe ser por la noche
                    return [
                        'turno' => 'Noche',
                        'fecha' => $nuevaFecha
                    ];

                default:
                    return [
                        'turno' => 'Mañana',
                        'fecha' => $nuevaFecha
                    ];
            }
        };

        // Buscar la asignación de ida del bombero en la fecha actual
        $asignacionIda = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', $fechaActual)
            ->where('tipo_asignacion', 'ida')
            ->first();

        if (!$asignacionIda) {
            Log::warning("No se encontró asignación de ida para el bombero {$idEmpleado} en la fecha {$fechaActual}");
            return response()->json([
                'message' => 'No se encontró una asignación de ida para este bombero en la fecha especificada'
            ], 404);
        }

        // Calcular el nuevo turno y fecha de ida
        $nuevoTurnoIda = $calcularNuevoTurnoIda($turnoAProlongar, $fechaActual, $nuevaFecha);

        // Validar que la nueva fecha no sea posterior a la fecha actual
        if ($nuevoTurnoIda['fecha'] > $fechaActual) {
            return response()->json([
                'message' => 'Para prolongar hacia atrás, la nueva fecha no puede ser posterior a la fecha actual'
            ], 400);
        }

        // Guardar los valores originales para el log
        $fechaOriginal = $asignacionIda->fecha_ini;
        $turnoOriginal = $asignacionIda->turno;

        // Actualizar la asignación de ida con la nueva fecha y turno calculado
        $asignacionIda->fecha_ini = $nuevoTurnoIda['fecha'];
        $asignacionIda->turno = $nuevoTurnoIda['turno'];
        $asignacionIda->save();

        Log::info("Jornada prolongada hacia atrás:", [
            'id_empleado' => $idEmpleado,
            'id_asignacion' => $asignacionIda->id_asignacion,
            'tipo_asignacion' => 'ida',
            'turno_a_prolongar' => $turnoAProlongar,
            'fecha_original' => $fechaOriginal,
            'turno_original' => $turnoOriginal,
            'nueva_fecha' => $nuevoTurnoIda['fecha'],
            'nuevo_turno' => $nuevoTurnoIda['turno']
        ]);

        // Cargar las relaciones para la respuesta
        $asignacionIda->load(['firefighter:id_empleado,nombre,apellido', 'brigadeOrigin:id_brigada,nombre', 'brigadeDestination:id_brigada,nombre']);

        return response()->json([
            'message' => "Jornada prolongada exitosamente. Ahora trabajará también el turno de {$turnoAProlongar}",
            'tipo_modificacion' => 'ida',
            'turno_prolongado' => $turnoAProlongar,
            'asignacion_modificada' => $asignacionIda,
            'cambios' => [
                'fecha_anterior' => $fechaOriginal,
                'turno_anterior' => $turnoOriginal,
                'nueva_fecha' => $nuevoTurnoIda['fecha'],
                'nuevo_turno' => $nuevoTurnoIda['turno']
            ]
        ], 200);
    }

    /**
     * Manejar el caso especial de prolongar desde turno noche hasta mañana siguiente
     */
    private function handleNightToMorningExtension($idEmpleado, $fechaActual, $nuevaFecha, $turnoAProlongar)
    {
        // Verificar que efectivamente tiene turno de noche en la fecha actual
        $asignacionNoche = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', $fechaActual)
            ->where('tipo_asignacion', 'ida')
            ->where('turno', 'Noche')
            ->first();

        if (!$asignacionNoche) {
            Log::warning("No se encontró asignación de ida con turno Noche para el bombero {$idEmpleado} en la fecha {$fechaActual}");
            return response()->json([
                'message' => 'No se encontró una asignación de turno noche para este bombero en la fecha especificada. El caso especial noche-mañana requiere un turno noche previo.'
            ], 404);
        }

        // Buscar la asignación de vuelta específicamente programada para la mañana del día siguiente
        $asignacionVueltaMañana = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', $nuevaFecha)
            ->where('tipo_asignacion', 'vuelta')
            ->where('turno', 'Mañana')
            ->where('id_brigada_origen', $asignacionNoche->id_brigada_destino)
            ->first();

        if (!$asignacionVueltaMañana) {
            Log::warning("No se encontró la asignación de vuelta por la mañana del día siguiente para el caso noche-mañana");
            return response()->json([
                'message' => 'No se encontró la asignación de vuelta programada para la mañana del día siguiente. Verifique que el turno de noche tenga su correspondiente vuelta programada.'
            ], 404);
        }

        // Guardar los valores originales para el log
        $fechaOriginal = $asignacionVueltaMañana->fecha_ini;
        $turnoOriginal = $asignacionVueltaMañana->turno;

        // Para prolongar la mañana del día siguiente, la vuelta debe ser por la tarde de ese día
        $asignacionVueltaMañana->turno = 'Tarde';
        $asignacionVueltaMañana->save();

        Log::info("Jornada prolongada hacia adelante (caso especial noche-mañana):", [
            'id_empleado' => $idEmpleado,
            'id_asignacion_noche' => $asignacionNoche->id_asignacion,
            'id_asignacion_vuelta' => $asignacionVueltaMañana->id_asignacion,
            'turno_a_prolongar' => $turnoAProlongar,
            'fecha_original' => $fechaOriginal,
            'turno_original' => $turnoOriginal,
            'nueva_fecha' => $nuevaFecha,
            'nuevo_turno' => 'Tarde'
        ]);

        // Cargar las relaciones para la respuesta
        $asignacionVueltaMañana->load(['firefighter:id_empleado,nombre,apellido', 'brigadeOrigin:id_brigada,nombre', 'brigadeDestination:id_brigada,nombre']);

        return response()->json([
            'message' => "Jornada prolongada exitosamente. Ahora trabajará también el turno de {$turnoAProlongar} del día siguiente",
            'tipo_modificacion' => 'vuelta',
            'caso_especial' => 'noche_mañana',
            'turno_prolongado' => $turnoAProlongar,
            'asignacion_modificada' => $asignacionVueltaMañana,
            'asignacion_noche_original' => [
                'id_asignacion' => $asignacionNoche->id_asignacion,
                'fecha' => $asignacionNoche->fecha_ini,
                'turno' => $asignacionNoche->turno
            ],
            'cambios' => [
                'fecha_anterior' => $fechaOriginal,
                'turno_anterior' => $turnoOriginal,
                'nueva_fecha' => $nuevaFecha,
                'nuevo_turno' => 'Tarde'
            ]
        ], 200);
    }
    /**
     * Obtener las asignaciones de vuelta de un bombero para una fecha específica
     * Método auxiliar para verificar qué asignaciones de vuelta tiene un bombero
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getReturnAssignments(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empleado' => 'required|exists:users,id_empleado',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idEmpleado = $request->input('id_empleado');
        $fecha = $request->input('fecha');

        // Buscar todas las asignaciones de vuelta del bombero en la fecha especificada
        $asignacionesVuelta = Firefighters_assignment::with([
            'firefighter:id_empleado,nombre,apellido',
            'brigadeOrigin:id_brigada,nombre',
            'brigadeDestination:id_brigada,nombre'
        ])
            ->where('id_empleado', $idEmpleado)
            ->where('fecha_ini', $fecha)
            ->where('tipo_asignacion', 'vuelta')
            ->get();

        return response()->json([
            'id_empleado' => $idEmpleado,
            'fecha' => $fecha,
            'asignaciones_vuelta' => $asignacionesVuelta
        ]);
    }
}
