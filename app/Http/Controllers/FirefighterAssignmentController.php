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
            'id_asignacion'       => 'unique:firefighters_assignments,id_asignacion',
            'fecha_ini'           => 'required|date',
            'id_empleado'         => 'required|exists:users,id_empleado',
            'id_brigada_origen'   => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino'  => 'required|exists:brigades,id_brigada',
            'turno'               => 'in:Mañana,Tarde,Noche',
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
            'id_asignacion'       => 'unique:firefighters_assignments,id_asignacion,' . $id_asignacion . ',id_asignacion',
            'fecha_ini'           => 'required|date',
            'id_empleado'         => 'required|exists:users,id_empleado',
            'id_brigada_origen'   => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino'  => 'required|exists:brigades,id_brigada',
            'turno'               => 'required|in:Mañana,Tarde,Noche',
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

    /**
     * Devuelve los bomberos disponibles (tipo bombero y mando) para la fecha consultada.
     */
    public function availableFirefighters(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefighters:", ['date' => $date]);

        // Lista estática de estados (o brigadas) que excluyen inmediatamente:
        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];

        // Se obtienen las brigadas que tienen guardia en el día consultado.
        $guards = Guard::with('brigade')->where('date', $date)->get();
        $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

        // Combinamos la lista estática y las brigadas con guardia hoy.
        $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
        Log::info("Brigadas excluidas (estáticas y por guardia hoy):", ['excludedBrigades' => $excludedBrigades]);

        // Se agrupan las asignaciones de bomberos hasta $date.
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');
        Log::info("Asignaciones agrupadas por bombero:", ['assignments' => $assignments]);

        $unavailableFirefighterIds = [];
        foreach ($assignments as $firefighterId => $firefighterAssignments) {
            if (!$this->isFirefighterRequerible($firefighterId, $date, $excludedBrigades)) {
                $unavailableFirefighterIds[] = $firefighterId;
                Log::info("Bombero {$firefighterId} marcado como NO disponible para {$date}.");
            } else {
                Log::info("Bombero {$firefighterId} marcado como DISPONIBLE para {$date}.");
            }
        }

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
     * Devuelve los bomberos disponibles (solo tipo bombero) para la fecha consultada.
     */
    public function availableFirefightersWithoutMands(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefightersWithoutMands:", ['date' => $date]);

        $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];
        $guards = Guard::with('brigade')->where('date', $date)->get();
        $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();
        $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
        Log::info("Brigadas excluidas (estáticas y por guardia hoy):", ['excludedBrigades' => $excludedBrigades]);

        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');
        Log::info("Asignaciones agrupadas por bombero:", ['assignments' => $assignments]);

        $unavailableFirefighterIds = [];
        foreach ($assignments as $firefighterId => $firefighterAssignments) {
            if (!$this->isFirefighterRequerible($firefighterId, $date, $excludedBrigades)) {
                $unavailableFirefighterIds[] = $firefighterId;
                Log::info("Bombero {$firefighterId} marcado como NO disponible para {$date}.");
            } else {
                Log::info("Bombero {$firefighterId} marcado como DISPONIBLE para {$date}.");
            }
        }

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
     * Determina si un bombero es "requerible" (disponible) para la fecha $date, siguiendo el siguiente orden:
     *
     * 1. Exclusión inmediata:
     *    a) Si para $date el bombero tiene una solicitud Confirmada de tipo
     *       ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas',
     *        'Licencias por Días', 'Compensacion grupos especiales'] se le excluye.
     *    b) Si la última asignación (hasta $date) del bombero pertenece a una brigada que tiene guardia hoy (según $excludedBrigades), se le excluye.
     *
     * 2. Protección para casos limítrofes:
     *    a) Si la última asignación pertenece a una brigada que tuvo guardia ayer y el bombero tiene una solicitud Confirmada para el día anterior (ya sea sin turno o con turno adecuado),
     *       se le protege (aparece como disponible).
     *    b) Si la última asignación pertenece a una brigada que tendrá guardia mañana y el bombero tiene una solicitud Confirmada para el día siguiente (con turno adecuado),
     *       se le protege.
     *
     * Si ninguno de estos casos aplica, se considera disponible.
     *
     * Se registran logs para depurar cada paso.
     *
     * @param int    $firefighterId
     * @param string $date             Fecha consultada (formato 'Y-m-d')
     * @param array  $excludedBrigades Lista combinada (estática + guardia hoy)
     *
     * @return bool   true si el bombero es requerible (disponible), false en caso contrario.
     */
    private function isFirefighterRequerible($firefighterId, $date, $excludedBrigades)
    {
        // --- Paso 1: Exclusión inmediata por solicitudes de tipos excluyentes ---
        $excludedTypes = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];
        $hasExcludedRequestToday = RequestModel::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->whereIn('tipo', $excludedTypes)
            ->where('fecha_ini', '<=', $date)
            ->where('fecha_fin', '>=', $date)
            ->exists();
        if ($hasExcludedRequestToday) {
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} EXCLUIDO por tener solicitud de (" . implode(', ', $excludedTypes) . ") para {$date}.");
            return false;
        }

        // --- Paso 2: Revisar la última asignación hasta $date ---
        $firefighterAssignments = Firefighters_assignment::where('id_empleado', $firefighterId)
            ->where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get();
        $lastAssignment = $firefighterAssignments->first();
        if ($lastAssignment && $lastAssignment->brigadeDestination) {
            $brigadeName = $lastAssignment->brigadeDestination->nombre;
            Log::info("isFirefighterRequerible - Bombero {$firefighterId}: Última asignación para {$date} en brigada '{$brigadeName}'.");
            if (in_array($brigadeName, $excludedBrigades)) {
                Log::info("isFirefighterRequerible - Bombero {$firefighterId} EXCLUIDO por pertenecer a brigada '{$brigadeName}' (guard hoy) en {$date}.");
                return false;
            }
        } else {
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} no tiene asignación previa para {$date}.");
            return false;
        }

        // --- Paso 3: Protección en casos limítrofes por guardia ayer o mañana ---
        $previousDay = date('Y-m-d', strtotime("$date -1 day"));
        $nextDay     = date('Y-m-d', strtotime("$date +1 day"));

        // Consultamos las brigadas que tuvieron guardia ayer y mañana.
        $guardYesterday = Guard::where('date', $previousDay)->pluck('brigade.nombre')->unique()->toArray();
        $guardTomorrow  = Guard::where('date', $nextDay)->pluck('brigade.nombre')->unique()->toArray();

        // Si la última asignación pertenece a una brigada que tuvo guardia ayer:
        if (in_array($brigadeName, $guardYesterday)) {
            $queryPrev = RequestModel::where('id_empleado', $firefighterId)
                ->where('estado', 'Confirmada')
                ->where(function ($query) use ($previousDay) {
                    // Sin turno:
                    $query->where(function ($q) use ($previousDay) {
                        $q->whereIn('tipo', ['vacaciones', 'modulo', 'licencias por dias'])
                          ->where('fecha_ini', '<=', $previousDay)
                          ->where('fecha_fin', '>=', $previousDay);
                    })
                    ->orWhere(function ($q) use ($previousDay) {
                        // Con turno (turnos para protección en el día anterior: 'Tarde y noche' o 'Día Completo')
                        $q->whereIn('tipo', ['asuntos propios', 'compensacion grupos especiales', 'licencias por jornadas'])
                          ->where('fecha_ini', '<=', $previousDay)
                          ->where('fecha_fin', '>=', $previousDay)
                          ->whereIn('turno', ['Tarde y noche', 'Día Completo']);
                    });
                });
            $protectedPrevious = $queryPrev->exists();
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} - Protección para guard ayer ({$previousDay}): " . ($protectedPrevious ? "Protegido" : "No protegido"));
            if ($protectedPrevious) {
                return true;
            } else {
                return false;
            }
        }

        // Si la última asignación pertenece a una brigada que tendrá guardia mañana:
        if (in_array($brigadeName, $guardTomorrow)) {
            $queryNext = RequestModel::where('id_empleado', $firefighterId)
                ->where('estado', 'Confirmada')
                ->where(function ($query) use ($nextDay) {
                    $query->where(function ($q) use ($nextDay) {
                        $q->whereIn('tipo', ['vacaciones', 'modulo', 'licencias por dias'])
                          ->where('fecha_ini', '<=', $nextDay)
                          ->where('fecha_fin', '>=', $nextDay);
                    })
                    ->orWhere(function ($q) use ($nextDay) {
                        $q->whereIn('tipo', ['asuntos propios', 'compensacion grupos especiales', 'licencias por jornadas'])
                          ->where('fecha_ini', '<=', $nextDay)
                          ->where('fecha_fin', '>=', $nextDay)
                          ->whereIn('turno', ['Mañana y tarde', 'Día Completo']);
                    });
                });
            $protectedNext = $queryNext->exists();
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} - Protección para guard mañana ({$nextDay}): " . ($protectedNext ? "Protegido" : "No protegido"));
            if ($protectedNext) {
                return true;
            } else {
                return false;
            }
        }

        // Si ninguna de las condiciones de protección (para guard ayer o mañana) aplica,
        // consideramos al bombero como disponible.
        Log::info("isFirefighterRequerible - Bombero {$firefighterId} se considera DISPONIBLE para {$date} (ninguna protección adicional aplicada).");
        return true;
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
        $validator = Validator::make($request->all(), [
            'id_empleado'      => 'required|exists:users,id_empleado',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'fecha'            => 'required|date',
            'turno'            => 'required|in:Mañana,Tarde,Noche,Día Completo,Mañana y tarde,Tarde y noche',
        ]);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }
        $idEmpleado = $request->input('id_empleado');
        $idBrigadaDestino = $request->input('id_brigada_destino');
        $fecha = $request->input('fecha');
        $turnoRequest = $request->input('turno');

        $assignmentAnterior = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<=', $fecha)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();
        $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

        $turnoIda = match ($turnoRequest) {
            'Mañana', 'Día Completo', 'Mañana y tarde' => 'Mañana',
            'Tarde', 'Tarde y noche' => 'Tarde',
            'Noche' => 'Noche',
            default => 'Mañana',
        };

        $asignacionIda = Firefighters_assignment::create([
            'id_empleado'        => $idEmpleado,
            'id_brigada_origen'  => $brigadaOrigen,
            'id_brigada_destino' => $idBrigadaDestino,
            'fecha_ini'          => $fecha,
            'turno'              => $turnoIda,
        ]);

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

        $asignacionVuelta = Firefighters_assignment::create([
            'id_empleado'        => $idEmpleado,
            'id_brigada_origen'  => $idBrigadaDestino,
            'id_brigada_destino' => $brigadaOrigen,
            'fecha_ini'          => $fechaVuelta,
            'turno'              => $turnoVuelta,
        ]);

        return response()->json([
            'asignacion_ida'    => $asignacionIda,
            'asignacion_vuelta' => $asignacionVuelta,
        ], 201);
    }
}
