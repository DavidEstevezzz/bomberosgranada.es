<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transfer;
use App\Models\Firefighters_assignment;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    /**
     * Mapeo de turno seleccionado a turno de ida y vuelta
     */
    private function getAssignmentDetails($turnoSeleccionado)
    {
        $mapping = [
            'Mañana' => ['ida' => 'Mañana', 'vuelta' => 'Tarde', 'nextDay' => false],
            'Tarde' => ['ida' => 'Tarde', 'vuelta' => 'Noche', 'nextDay' => false],
            'Noche' => ['ida' => 'Noche', 'vuelta' => 'Mañana', 'nextDay' => true],
            'Día Completo' => ['ida' => 'Mañana', 'vuelta' => 'Mañana', 'nextDay' => true],
            'Mañana y tarde' => ['ida' => 'Mañana', 'vuelta' => 'Noche', 'nextDay' => false],
            'Tarde y noche' => ['ida' => 'Tarde', 'vuelta' => 'Mañana', 'nextDay' => true],
        ];

        return $mapping[$turnoSeleccionado] ?? null;
    }

    /**
     * Obtener todos los traslados de una brigada en una fecha
     */
    public function getTransfersByBrigadeAndDate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $idBrigada = $request->input('id_brigada');
        $fecha = $request->input('fecha');

        try {
            $transfers = Transfer::with([
                'firefighter:id_empleado,nombre,apellido,puesto',
                'brigadeOrigin:id_brigada,nombre,id_parque',
                'brigadeDestination:id_brigada,nombre,id_parque',
                'assignments'
            ])
                ->where('fecha_traslado', $fecha)
                ->where(function ($query) use ($idBrigada) {
                    $query->where('id_brigada_origen', $idBrigada)
                        ->orWhere('id_brigada_destino', $idBrigada);
                })
                ->orderBy('turno_seleccionado')
                ->get();

            return response()->json([
                'transfers' => $transfers,
                'count' => $transfers->count()
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching transfers', [
                'id_brigada' => $idBrigada,
                'fecha' => $fecha,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al obtener los traslados'], 500);
        }
    }

    /**
     * Crear un nuevo traslado con sus asignaciones
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_origen' => 'required|exists:brigades,id_brigada',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
            'fecha_traslado' => 'required|date',
            'turno_seleccionado' => 'required|string',
            'horas_traslado' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $assignmentDetails = $this->getAssignmentDetails($request->input('turno_seleccionado'));
        if (!$assignmentDetails) {
            return response()->json(['error' => 'Turno seleccionado no válido'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Crear el registro de traslado
            $transfer = Transfer::create([
                'id_empleado' => $request->input('id_empleado'),
                'id_brigada_origen' => $request->input('id_brigada_origen'),
                'id_brigada_destino' => $request->input('id_brigada_destino'),
                'fecha_traslado' => $request->input('fecha_traslado'),
                'turno_seleccionado' => $request->input('turno_seleccionado'),
                'horas_traslado' => $request->input('horas_traslado'),
            ]);

            // 2. Calcular fechas de ida y vuelta
            $fechaIda = $request->input('fecha_traslado');
            $fechaVuelta = $assignmentDetails['nextDay']
                ? date('Y-m-d', strtotime($fechaIda . ' +1 day'))
                : $fechaIda;

            // 3. Crear asignación de ida
            $asignacionIda = Firefighters_assignment::create([
                'id_empleado' => $request->input('id_empleado'),
                'id_brigada_origen' => $request->input('id_brigada_origen'),
                'id_brigada_destino' => $request->input('id_brigada_destino'),
                'fecha_ini' => $fechaIda,
                'turno' => $assignmentDetails['ida'],
                'tipo_asignacion' => 'ida',
                'id_transfer' => $transfer->id_transfer,
            ]);

            // 4. Crear asignación de vuelta
            $asignacionVuelta = Firefighters_assignment::create([
                'id_empleado' => $request->input('id_empleado'),
                'id_brigada_origen' => $request->input('id_brigada_destino'),
                'id_brigada_destino' => $request->input('id_brigada_origen'),
                'fecha_ini' => $fechaVuelta,
                'turno' => $assignmentDetails['vuelta'],
                'tipo_asignacion' => 'vuelta',
                'id_transfer' => $transfer->id_transfer,
            ]);

            // 5. Incrementar horas de traslado del usuario
            $user = User::find($request->input('id_empleado'));
            if ($user) {
                $user->traslados += floatval($request->input('horas_traslado'));
                $user->fecha_traslado = now();
                $user->save();

                Log::info("Transfer created and hours incremented", [
                    'id_transfer' => $transfer->id_transfer,
                    'id_empleado' => $user->id_empleado,
                    'horas_incrementadas' => $request->input('horas_traslado'),
                    'nuevo_total' => $user->traslados
                ]);
            }

            DB::commit();

            // Cargar relaciones para la respuesta
            $transfer->load([
                'firefighter:id_empleado,nombre,apellido,puesto',
                'brigadeOrigin:id_brigada,nombre,id_parque',
                'brigadeDestination:id_brigada,nombre,id_parque',
                'assignments'
            ]);

            return response()->json([
                'message' => 'Traslado creado exitosamente',
                'transfer' => $transfer,
                'asignacion_ida' => $asignacionIda,
                'asignacion_vuelta' => $asignacionVuelta
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating transfer', [
                'data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error al crear el traslado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar un traslado existente
     */
    public function update(Request $request, $id_transfer)
    {
        $validator = Validator::make($request->all(), [
            'turno_seleccionado' => 'sometimes|string',
            'horas_traslado' => 'sometimes|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $transfer = Transfer::with('assignments')->find($id_transfer);
        if (!$transfer) {
            return response()->json(['error' => 'Traslado no encontrado'], 404);
        }

        DB::beginTransaction();
        try {
            $oldHoras = $transfer->horas_traslado;
            $newHoras = $request->input('horas_traslado', $oldHoras);
            $newTurno = $request->input('turno_seleccionado', $transfer->turno_seleccionado);

            // Si cambia el turno, recalcular asignaciones
            if ($newTurno !== $transfer->turno_seleccionado) {
                $assignmentDetails = $this->getAssignmentDetails($newTurno);
                if (!$assignmentDetails) {
                    return response()->json(['error' => 'Turno seleccionado no válido'], 400);
                }

                $fechaIda = $transfer->fecha_traslado->format('Y-m-d');
                $fechaVuelta = $assignmentDetails['nextDay']
                    ? date('Y-m-d', strtotime($fechaIda . ' +1 day'))
                    : $fechaIda;

                // Actualizar asignación de ida
                $asignacionIda = $transfer->assignments->where('tipo_asignacion', 'ida')->first();
                if ($asignacionIda) {
                    $asignacionIda->update([
                        'turno' => $assignmentDetails['ida'],
                        'fecha_ini' => $fechaIda,
                    ]);
                }

                // Actualizar asignación de vuelta
                $asignacionVuelta = $transfer->assignments->where('tipo_asignacion', 'vuelta')->first();
                if ($asignacionVuelta) {
                    $asignacionVuelta->update([
                        'turno' => $assignmentDetails['vuelta'],
                        'fecha_ini' => $fechaVuelta,
                    ]);
                }

                $transfer->turno_seleccionado = $newTurno;
            }

            // Si cambian las horas, ajustar en el usuario
            if ($newHoras != $oldHoras) {
                $user = User::find($transfer->id_empleado);
                if ($user) {
                    $diferencia = $newHoras - $oldHoras;
                    $user->traslados = max(0, $user->traslados + $diferencia);
                    $user->fecha_traslado = now();
                    $user->save();

                    Log::info("Transfer hours updated", [
                        'id_transfer' => $id_transfer,
                        'id_empleado' => $user->id_empleado,
                        'horas_anteriores' => $oldHoras,
                        'horas_nuevas' => $newHoras,
                        'diferencia' => $diferencia,
                        'nuevo_total' => $user->traslados
                    ]);
                }

                $transfer->horas_traslado = $newHoras;
            }

            $transfer->save();
            DB::commit();

            $transfer->load([
                'firefighter:id_empleado,nombre,apellido,puesto',
                'brigadeOrigin:id_brigada,nombre,id_parque',
                'brigadeDestination:id_brigada,nombre,id_parque',
                'assignments'
            ]);

            return response()->json([
                'message' => 'Traslado actualizado exitosamente',
                'transfer' => $transfer
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating transfer', [
                'id_transfer' => $id_transfer,
                'data' => $request->all(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al actualizar el traslado'], 500);
        }
    }

    /**
     * Eliminar un traslado y revertir horas
     */
    public function destroy($id_transfer)
    {
        $transfer = Transfer::with('assignments')->find($id_transfer);
        if (!$transfer) {
            return response()->json(['error' => 'Traslado no encontrado'], 404);
        }

        DB::beginTransaction();
        try {
            $horasRevertidas = $transfer->horas_traslado;
            $idEmpleado = $transfer->id_empleado;

            // 1. Revertir horas del usuario
            $user = User::find($idEmpleado);
            if ($user && $horasRevertidas > 0) {
                $user->traslados = max(0, $user->traslados - $horasRevertidas);
                $user->save();

                Log::info("Transfer hours reverted", [
                    'id_transfer' => $id_transfer,
                    'id_empleado' => $idEmpleado,
                    'horas_revertidas' => $horasRevertidas,
                    'nuevo_total' => $user->traslados
                ]);
            }

            // 2. Eliminar asignaciones vinculadas
            $assignmentsDeleted = $transfer->assignments()->delete();

            // 3. Eliminar el traslado
            $transfer->delete();

            DB::commit();

            return response()->json([
                'message' => 'Traslado eliminado exitosamente',
                'horas_revertidas' => $horasRevertidas,
                'asignaciones_eliminadas' => $assignmentsDeleted
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting transfer', [
                'id_transfer' => $id_transfer,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al eliminar el traslado'], 500);
        }
    }

    /**
     * Obtener un traslado específico
     */
    public function show($id_transfer)
    {
        $transfer = Transfer::with([
            'firefighter:id_empleado,nombre,apellido,puesto',
            'brigadeOrigin:id_brigada,nombre,id_parque',
            'brigadeDestination:id_brigada,nombre,id_parque',
            'assignments'
        ])->find($id_transfer);

        if (!$transfer) {
            return response()->json(['error' => 'Traslado no encontrado'], 404);
        }

        return response()->json($transfer, 200);
    }
}
