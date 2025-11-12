<?php

namespace App\Http\Controllers;

use App\Models\BrigadeComposition;
use App\Models\Brigade;
use App\Models\User;
use App\Models\Guard;
use App\Models\Request as RequestModel;
use App\Models\ShiftChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class BrigadeCompositionController extends Controller
{
    /**
     * Obtener la composición de una brigada para un mes/año específico
     */
    public function show($brigadeId, $idParque, $year, $month)
    {
        try {
            Log::info("Obteniendo composición de brigada", [
                'brigade_id' => $brigadeId,
                'id_parque' => $idParque,
                'year' => $year,
                'month' => $month
            ]);

            // Obtener la brigada
            $brigade = Brigade::with('park')->find($brigadeId);
            if (!$brigade) {
                return response()->json(['error' => 'Brigada no encontrada'], 404);
            }

            // Obtener las composiciones del mes
            $compositions = BrigadeComposition::with(['user', 'brigade', 'parque'])
                ->byMonthYear($year, $month)
                ->byBrigadeParque($brigadeId, $idParque)
                ->get();

            if ($compositions->isEmpty()) {
                return response()->json([
                    'brigade' => $brigade,
                    'firefighters' => [],
                    'guard_days' => [],
                    'message' => 'No hay composiciones para este mes'
                ]);
            }

            // Obtener los días de guardia de esta brigada en este mes
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            $guardDays = Guard::where('id_brigada', $brigadeId)
                ->where('id_parque', $idParque)
                ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                ->orderBy('date')
                ->pluck('date')
                ->toArray();

            Log::info("Días de guardia encontrados", ['count' => count($guardDays), 'days' => $guardDays]);

            // Para cada bombero, obtener el estado de cada día de guardia
            $firefighters = [];
            foreach ($compositions as $composition) {
                $user = $composition->user;
                if (!$user) {
                    continue;
                }

                $guardStatus = [];
                foreach ($guardDays as $guardDay) {
                    $status = $this->getDayStatus($user->id_empleado, $guardDay);
                    $guardStatus[] = [
                        'date' => $guardDay,
                        'status' => $status['status'],
                        'detail' => $status['detail']
                    ];
                }

                $firefighters[] = [
                    'id_empleado' => $user->id_empleado,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'puesto' => $user->puesto,
                    'telefono' => $user->telefono,
                    'dni' => $user->dni,
                    'guard_days' => $guardStatus
                ];
            }

            return response()->json([
                'brigade' => $brigade,
                'firefighters' => $firefighters,
                'guard_days' => $guardDays
            ]);

        } catch (\Exception $e) {
            Log::error("Error obteniendo composición de brigada", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Determinar el estado de un bombero en un día específico
     */
    private function getDayStatus($userId, $date)
    {
        // 1. Buscar en requests (permisos/licencias)
        $request = RequestModel::where('id_empleado', $userId)
            ->where('estado', 'Confirmada')
            ->where('fecha_ini', '<=', $date)
            ->where('fecha_fin', '>=', $date)
            ->first();

        if ($request) {
            return $this->getRequestStatus($request);
        }

        // 2. Buscar en shift_change_requests (cambios de guardia)
        $shiftChange = ShiftChangeRequest::where(function($query) use ($userId) {
                $query->where('id_empleado1', $userId)
                      ->orWhere('id_empleado2', $userId);
            })
            ->where('estado', 'aceptado')
            ->where(function($query) use ($date) {
                $query->where('fecha', $date)
                      ->orWhere('fecha2', $date);
            })
            ->first();

        if ($shiftChange) {
            $otherUser = $shiftChange->id_empleado1 == $userId 
                ? $shiftChange->empleado2 
                : $shiftChange->empleado1;
            
            return [
                'status' => 'cambio',
                'detail' => $otherUser ? "{$otherUser->nombre} {$otherUser->apellido}" : 'Cambio de guardia'
            ];
        }

        // 3. Si no hay nada, acude normalmente
        return [
            'status' => 'acude',
            'detail' => null
        ];
    }

    /**
     * Obtener el estado según el tipo de solicitud
     */
    private function getRequestStatus($request)
    {
        switch (strtolower($request->tipo)) {
            case 'vacaciones':
                return [
                    'status' => 'vacaciones',
                    'detail' => 'Vacaciones'
                ];
            
            case 'modulo':
            case 'licencias por jornadas':
            case 'licencias por dias':
            case 'asuntos propios':
            case 'compensacion grupos especiales':
                return [
                    'status' => 'permiso',
                    'detail' => ucfirst($request->tipo)
                ];
            
            default:
                return [
                    'status' => 'baja',
                    'detail' => ucfirst($request->tipo)
                ];
        }
    }

    /**
     * Copiar todas las brigadas del mes actual al mes siguiente
     */
    public function copyToNextMonth(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'required|integer',
                'month' => 'required|integer|min:1|max:12'
            ]);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            $currentYear = $request->year;
            $currentMonth = $request->month;

            // Calcular el mes siguiente
            $nextDate = Carbon::createFromDate($currentYear, $currentMonth, 1)->addMonth();
            $nextYear = $nextDate->year;
            $nextMonth = $nextDate->month;

            Log::info("Copiando brigadas", [
                'from' => "$currentYear-$currentMonth",
                'to' => "$nextYear-$nextMonth"
            ]);

            // Verificar si ya existen composiciones para el mes siguiente
            $existingCount = BrigadeComposition::byMonthYear($nextYear, $nextMonth)->count();
            if ($existingCount > 0) {
                return response()->json([
                    'error' => 'Ya existen composiciones para el mes siguiente',
                    'count' => $existingCount
                ], 409);
            }

            // Obtener todas las composiciones del mes actual
            $currentCompositions = BrigadeComposition::byMonthYear($currentYear, $currentMonth)->get();

            if ($currentCompositions->isEmpty()) {
                return response()->json([
                    'error' => 'No hay composiciones en el mes actual para copiar'
                ], 404);
            }

            // Copiar cada composición al mes siguiente
            $copied = 0;
            DB::beginTransaction();
            try {
                foreach ($currentCompositions as $composition) {
                    BrigadeComposition::create([
                        'user_id' => $composition->user_id,
                        'brigade_id' => $composition->brigade_id,
                        'id_parque' => $composition->id_parque,
                        'year' => $nextYear,
                        'month' => $nextMonth,
                    ]);
                    $copied++;
                }

                DB::commit();
                Log::info("Brigadas copiadas exitosamente", ['count' => $copied]);

                return response()->json([
                    'message' => 'Brigadas copiadas exitosamente',
                    'copied' => $copied,
                    'to' => "$nextYear-$nextMonth"
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error("Error copiando brigadas", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Trasladar un bombero de una brigada a otra
     */
    public function transferFirefighter(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id_empleado',
                'from_brigade_id' => 'required|exists:brigades,id_brigada',
                'from_id_parque' => 'required',
                'to_brigade_id' => 'required|exists:brigades,id_brigada',
                'to_id_parque' => 'required',
                'year' => 'required|integer',
                'month' => 'required|integer|min:1|max:12'
            ]);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            $userId = $request->user_id;
            $fromBrigadeId = $request->from_brigade_id;
            $fromIdParque = $request->from_id_parque;
            $toBrigadeId = $request->to_brigade_id;
            $toIdParque = $request->to_id_parque;
            $year = $request->year;
            $month = $request->month;

            Log::info("Trasladando bombero", [
                'user_id' => $userId,
                'from' => "$fromBrigadeId-$fromIdParque",
                'to' => "$toBrigadeId-$toIdParque",
                'month' => "$year-$month"
            ]);

            // Buscar la composición actual
            $composition = BrigadeComposition::where('user_id', $userId)
                ->where('year', $year)
                ->where('month', $month)
                ->where('brigade_id', $fromBrigadeId)
                ->where('id_parque', $fromIdParque)
                ->first();

            if (!$composition) {
                return response()->json([
                    'error' => 'No se encontró la composición del bombero'
                ], 404);
            }

            // Verificar que no exista ya en la brigada destino
            $existing = BrigadeComposition::where('user_id', $userId)
                ->where('year', $year)
                ->where('month', $month)
                ->where('brigade_id', $toBrigadeId)
                ->where('id_parque', $toIdParque)
                ->first();

            if ($existing) {
                return response()->json([
                    'error' => 'El bombero ya está en la brigada destino'
                ], 409);
            }

            // Actualizar la composición
            $composition->update([
                'brigade_id' => $toBrigadeId,
                'id_parque' => $toIdParque
            ]);

            Log::info("Bombero trasladado exitosamente");

            return response()->json([
                'message' => 'Bombero trasladado exitosamente',
                'composition' => $composition->load(['user', 'brigade', 'parque'])
            ]);

        } catch (\Exception $e) {
            Log::error("Error trasladando bombero", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Obtener todas las brigadas disponibles
     */
    public function getBrigades()
    {
        $brigades = Brigade::with('park')->orderBy('nombre')->get();
        return response()->json($brigades);
    }
}