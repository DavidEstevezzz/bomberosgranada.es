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
            'requerimiento' => 'boolean'
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
            'requerimiento' => 'boolean' // Nuevo: para update también
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
        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Brigada J'];

        // Obtenemos las brigadas que tienen guardia SOLO en el día consultado
        $guards = Guard::with('brigade')->where('date', $date)->get();
        $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos ambas listas
        $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
        Log::info("Brigadas excluidas (estáticas y por guardia en {$date}):", ['excludedBrigades' => $excludedBrigades]);

        // Agrupamos las asignaciones de bomberos hasta $date
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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

        $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Brigada J'];

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

        // Para la comprobación de hoy usaremos: exclusiones estáticas + brigadas de ayer y de mañana (más las del día actual que ya vienen en $excludedBrigades)
        $excludedForToday = array_merge($excludedBrigades, $guardYesterday, $guardTomorrow);
        // Para ayer, ignoramos las brigadas de mañana
        $excludedForYesterday = array_merge($excludedBrigades, $guardYesterday);
        // Para mañana, ignoramos las brigadas de ayer
        $excludedForTomorrow = array_merge($excludedBrigades, $guardTomorrow);

        Log::info("Lista de exclusión para hoy:", ['excludedForToday' => $excludedForToday]);
        Log::info("Lista de exclusión para ayer:", ['excludedForYesterday' => $excludedForYesterday]);
        Log::info("Lista de exclusión para mañana:", ['excludedForTomorrow' => $excludedForTomorrow]);

        // Cargar asignaciones vigentes
        $assignmentsToday = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');

        $assignmentsYesterday = Firefighters_assignment::where('fecha_ini', '<=', $previousDay)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');

        $assignmentsTomorrow = Firefighters_assignment::where('fecha_ini', '<=', $nextDay)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');

        $unavailableFirefighterIds = [];
        $allFirefighterIds = $assignmentsToday->keys()
            ->merge($assignmentsYesterday->keys())
            ->merge($assignmentsTomorrow->keys())
            ->unique();

        foreach ($allFirefighterIds as $firefighterId) {
            // Comprobar si está protegido por Requests
            $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $nextDay);

            // 1) Revisar asignación HOY
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastToday = $assignmentsToday->has($firefighterId) ? $assignmentsToday[$firefighterId]->first() : null;

            if ($lastToday && $lastToday->brigadeDestination) {
                $brigadeNameToday = $lastToday->brigadeDestination->nombre;
                Log::info("Brigada de hoy para bombero {$firefighterId}: {$brigadeNameToday} y su última asignación fue a {$lastToday->fecha_ini}");

                // Primero, verificar si el bombero está en brigada de guardia HOY (sin considerar protección)
                $guardsToday = Guard::with('brigade')->where('date', $date)->get();
                $guardBrigadesToday = $guardsToday->pluck('brigade.nombre')->unique()->toArray();

                // EXCLUSIÓN ABSOLUTA: Si está en brigada de exclusión absoluta, excluir siempre
                if (in_array($brigadeNameToday, $absoluteExclusions)) {
                    $unavailableFirefighterIds[] = $firefighterId;
                    Log::info("Bombero {$firefighterId} EXCLUIDO ABSOLUTAMENTE por estar en brigada '{$brigadeNameToday}' HOY.");
                    continue;
                }

                // Si está asignado a una brigada en guardia HOY, excluir sin importar protección
                if (in_array($brigadeNameToday, $guardBrigadesToday)) {
                    $unavailableFirefighterIds[] = $firefighterId;
                    Log::info("Bombero {$firefighterId} EXCLUIDO por estar en brigada '{$brigadeNameToday}' con guardia HOY (sin considerar protección).");
                    continue;
                }

                // Si está en otra brigada excluida (no de guardia hoy) y no está protegido, excluir
                if (in_array($brigadeNameToday, $excludedForToday) && !$isProtected) {
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }
            }

            // 2) Revisar asignación AYER
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastYesterday = $assignmentsYesterday->has($firefighterId) ? $assignmentsYesterday[$firefighterId]->first() : null;

            if ($lastYesterday && $lastYesterday->brigadeDestination) {
                $brigadeNameYesterday = $lastYesterday->brigadeDestination->nombre;
                Log::info("Brigada de ayer para bombero {$firefighterId}: {$brigadeNameYesterday} y su última asignación fue a {$lastYesterday->fecha_ini}");
                if (in_array($brigadeNameYesterday, $excludedForYesterday) && !$isProtected) {
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }
            }

            // 3) Revisar asignación MAÑANA
            // CORRECCIÓN: Verificar si existe la clave antes de acceder
            $lastTomorrow = $assignmentsTomorrow->has($firefighterId) ? $assignmentsTomorrow[$firefighterId]->first() : null;

            if ($lastTomorrow && $lastTomorrow->brigadeDestination) {
                $brigadeNameTomorrow = $lastTomorrow->brigadeDestination->nombre;
                if (in_array($brigadeNameTomorrow, $excludedForTomorrow) && !$isProtected) {
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }
            }
        }

        $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
        Log::info("IDs de bomberos no disponibles (con ayer/hoy/mañana):", [
            'unavailableFirefighterIds' => $unavailableFirefighterIds
        ]);

        return $unavailableFirefighterIds;
    }

    private function isFirefighterInGuardBrigade($firefighterId, $date)
    {
        $lastAssignment = Firefighters_assignment::where('id_empleado', $firefighterId)
            ->where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
            'licencias por jornadas'
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
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales', 'Brigada J'];

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
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
            'Compensacion grupos especiales'
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
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');

        // Asignaciones vigentes para MAÑANA
        $assignmentsTomorrow = Firefighters_assignment::where('fecha_ini', '<=', $tomorrow)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
            'Brigada J'
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
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');

        // Asignaciones para AYER
        $assignmentsYesterday = Firefighters_assignment::where('fecha_ini', '<=', $yesterday)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
            ->orderBy('created_at', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
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
}
