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

    /**
     * Devuelve los bomberos disponibles (con 'mando') para la fecha consultada.
     */
    public function availableFirefighters(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefighters:", ['date' => $date]);

        // Brigadas excluidas por defecto
        $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licendias por Días'];

        // Se añaden las brigadas que tuvieron guardia ayer, hoy o mañana.
        $guards = Guard::whereIn('date', [
            $date,
            date('Y-m-d', strtotime("$date -1 day")),
            date('Y-m-d', strtotime("$date +1 day"))
        ])->get();
        $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
        $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);
        Log::info("Brigadas excluidas (incluyendo guardias):", ['excludedBrigades' => $excludedBrigades]);

        // Obtenemos todas las asignaciones hasta $date agrupadas por id_empleado
        $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get()
            ->groupBy('id_empleado');
        Log::info("Asignaciones agrupadas por bombero:", ['assignments' => $assignments]);

        $unavailableFirefighterIds = [];

        // Por cada bombero, evaluamos si es requerible (disponible)
        foreach ($assignments as $firefighterId => $firefighterAssignments) {
            if (!$this->isFirefighterRequerible($firefighterId, $date, $excludedBrigades)) {
                $unavailableFirefighterIds[] = $firefighterId;
                Log::info("Bombero {$firefighterId} marcado como NO disponible para {$date}.");
            } else {
                Log::info("Bombero {$firefighterId} marcado como DISPONIBLE para {$date}.");
            }
        }

        // Se filtran los usuarios que sean 'bombero' o 'mando' y que NO estén en la lista de no disponibles
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
     * Devuelve los bomberos disponibles (solo de tipo 'bombero') para la fecha consultada.
     */
    public function availableFirefightersWithoutMands(Request $request)
    {
        $date = $request->query('date', date('Y-m-d'));
        Log::info("Fecha recibida en availableFirefightersWithoutMands:", ['date' => $date]);

        $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];
        $guards = Guard::whereIn('date', [
            $date,
            date('Y-m-d', strtotime("$date -1 day")),
            date('Y-m-d', strtotime("$date +1 day"))
        ])->get();
        $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
        $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);
        Log::info("Brigadas excluidas (incluyendo guardias):", ['excludedBrigades' => $excludedBrigades]);

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
     * Función que determina si un bombero es "requerible" (disponible) para la fecha $date,
     * siguiendo este orden de comprobaciones:
     *
     * 1. Exclusión inmediata:
     *    a) Si la última asignación (hasta $date) del bombero indica que su brigada está en la lista de
     *       brigadas excluidas.
     *    b) Si en el día $date el bombero tiene una solicitud Confirmada (sin turno) de tipo:
     *       'vacaciones', 'modulo' o 'licencias por dias'.
     *
     * 2. Protección:
     *    a) Si en el día $date el bombero tiene una solicitud Confirmada de tipo con turno (por ejemplo:
     *       'asuntos propios', 'compensacion grupos especiales', 'licencias por jornadas') que cumpla
     *       con los turnos indicados.
     *    b) O si el día anterior o el día siguiente tiene una solicitud Confirmada (sin turno) de los mismos tipos.
     *
     * Se añaden logs para poder depurar el porqué se excluye o protege.
     *
     * @param int    $firefighterId
     * @param string $date           Fecha consultada (formato 'Y-m-d')
     * @param array  $excludedBrigades Lista de nombres de brigadas excluidas
     *
     * @return bool   true si el bombero es requerible (aparece como disponible), false si se debe excluir.
     */
    private function isFirefighterRequerible($firefighterId, $date, $excludedBrigades)
    {
        // -----------------------------------------------------------------
        // Regla 1: Exclusión inmediata
        // -----------------------------------------------------------------
        // a) Obtener la asignación más reciente hasta $date
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
                Log::info("isFirefighterRequerible - Bombero {$firefighterId} EXCLUIDO por pertenecer a brigada '{$brigadeName}' en {$date}.");
                return false;
            }
        } else {
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} no tiene asignación previa para {$date}.");
        }

        // b) Verificar si en el día $date el bombero tiene una solicitud sin turno que cubra ese día
        $nonShiftTypes = ['vacaciones', 'modulo', 'licencias por dias'];
        $hasNonShiftRequestToday = RequestModel::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->whereIn('tipo', $nonShiftTypes)
            ->where('fecha_ini', '<=', $date)
            ->where('fecha_fin', '>=', $date)
            ->exists();
        if ($hasNonShiftRequestToday) {
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} EXCLUIDO porque tiene solicitud de (" . implode(', ', $nonShiftTypes) . ") para {$date}.");
            return false;
        }

        // -----------------------------------------------------------------
        // Regla 2: Protección
        // -----------------------------------------------------------------
        // a) Solicitudes con turno
        $typesWithTurno = ['asuntos propios', 'compensacion grupos especiales', 'licencias por jornadas'];
        $protectedCurrentShift = RequestModel::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->whereIn('tipo', $typesWithTurno)
            ->where('fecha_ini', '<=', $date)
            ->where('fecha_fin', '>=', $date)
            ->whereIn('turno', ['Tarde y noche', 'Día Completo', 'Mañana y tarde'])
            ->exists();

        // b) Solicitudes sin turno (protegidas si el día anterior o siguiente tiene la solicitud)
        $previousDay = date('Y-m-d', strtotime("$date -1 day"));
        $nextDay     = date('Y-m-d', strtotime("$date +1 day"));
        $protectedNonShiftPrev = RequestModel::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->whereIn('tipo', $nonShiftTypes)
            ->where('fecha_ini', '<=', $previousDay)
            ->where('fecha_fin', '>=', $previousDay)
            ->exists();
        $protectedNonShiftNext = RequestModel::where('id_empleado', $firefighterId)
            ->where('estado', 'Confirmada')
            ->whereIn('tipo', $nonShiftTypes)
            ->where('fecha_ini', '<=', $nextDay)
            ->where('fecha_fin', '>=', $nextDay)
            ->exists();

        if ($protectedCurrentShift || $protectedNonShiftPrev || $protectedNonShiftNext) {
            Log::info("isFirefighterRequerible - Bombero {$firefighterId} PROTEGIDO para {$date}: " .
                "protectedCurrentShift=" . ($protectedCurrentShift ? 'sí' : 'no') . ", " .
                "protectedNonShiftPrev=" . ($protectedNonShiftPrev ? 'sí' : 'no') . ", " .
                "protectedNonShiftNext=" . ($protectedNonShiftNext ? 'sí' : 'no')
            );
            return true;
        }

        Log::info("isFirefighterRequerible - Bombero {$firefighterId} NO PROTEGIDO para {$date} (no cumple condiciones de protección).");
        return false;
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
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->first();

        $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

        // 2. Calcular el turno de ida
        $turnoIda = match ($turnoRequest) {
            'Mañana', 'Día Completo', 'Mañana y tarde' => 'Mañana',
            'Tarde', 'Tarde y noche' => 'Tarde',
            'Noche' => 'Noche',
            default => 'Mañana',  // Por si acaso
        };

        // 3. Crear la asignación de ida
        $asignacionIda = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $brigadaOrigen,
            'id_brigada_destino' => $idBrigadaDestino,
            'fecha_ini' => $fecha,
            'turno' => $turnoIda,
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

        // 5. Crear la asignación de vuelta
        $asignacionVuelta = Firefighters_assignment::create([
            'id_empleado' => $idEmpleado,
            'id_brigada_origen' => $idBrigadaDestino,
            'id_brigada_destino' => $brigadaOrigen,
            'fecha_ini' => $fechaVuelta,
            'turno' => $turnoVuelta,
        ]);

        return response()->json([
            'asignacion_ida' => $asignacionIda,
            'asignacion_vuelta' => $asignacionVuelta,
        ], 201);
    }
}
