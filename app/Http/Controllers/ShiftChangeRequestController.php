<?php

namespace App\Http\Controllers;

use App\Models\ShiftChangeRequest;
use App\Models\Firefighters_assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Mail\ShiftChangeStatusUpdatedMail;
use Illuminate\Support\Facades\Mail;

class ShiftChangeRequestController extends Controller
{
    public function index()
    {
        $requests = ShiftChangeRequest::with(['empleado1', 'empleado2', 'brigada1', 'brigada2'])->get();
        return response()->json($requests);
    }

    public function store(Request $request)
    {

        Log::info('Datos recibidos:', $request->all());

        $rules = [
            'id_empleado1' => 'required|exists:users,id_empleado',
            'id_empleado2' => 'required|exists:users,id_empleado',
            'fecha' => 'required|date',
            'fecha2' => 'nullable|date',
            'turno' => 'required|in:Mañana,Tarde,Noche,Dia Completo,Mañana y tarde,Tarde y noche',
            'motivo' => 'nullable|string',
            'estado' => 'required|in:rechazado,aceptado_por_empleados,en_tramite,aceptado'
        ];
    
        $validator = Validator::make($request->all(), $rules);
    
        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }
    
        // Obtener asignaciones más relevantes para la fecha
        $assignments = $this->getLatestBrigadeAssignments($request->fecha);
    
        // Determinar las brigadas para los empleados involucrados
        $brigada1 = $assignments->firstWhere('id_empleado', $request->id_empleado1)?->id_brigada_destino;
        $brigada2 = $assignments->firstWhere('id_empleado', $request->id_empleado2)?->id_brigada_destino;
    
        // Validar que se encontraron las brigadas
        if (!$brigada1 || !$brigada2) {
            return response()->json([
                'message' => 'No se encontraron asignaciones de brigada para los empleados en la fecha proporcionada.'
            ], 400);
        }
    
        // Crear solicitud de cambio de guardia
        $shiftChangeRequest = ShiftChangeRequest::create([
            'id_empleado1' => $request->id_empleado1,
            'id_empleado2' => $request->id_empleado2,
            'brigada1' => $brigada1,
            'brigada2' => $brigada2,
            'fecha' => $request->fecha,
            'fecha2' => $request->fecha2,
            'turno' => $request->turno,
            'motivo' => $request->motivo,
            'estado' => $request->estado,
        ]);
    
        return response()->json($shiftChangeRequest, 201);
    }

    public function update(Request $request, $id)
{
    Log::info('Valor de turno recibido:', ['turno' => $request->turno]);

    $rules = [
        'estado' => 'required|in:rechazado,aceptado_por_empleados,en_tramite,aceptado'
    ];

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $shiftChangeRequest = ShiftChangeRequest::find($id);

    if (!$shiftChangeRequest) {
        return response()->json(['message' => 'Shift change request not found'], 404);
    }

    $oldEstado = $shiftChangeRequest->estado;

    // Actualizar solo el estado
    $shiftChangeRequest->estado = $request->estado;
    $shiftChangeRequest->save();

    // Si el estado es "aceptado" y antes no lo estaba, crear asignaciones
    if ($shiftChangeRequest->estado === 'aceptado' && $oldEstado !== 'aceptado') {
        if (!Firefighters_assignment::where('id_change_request', $shiftChangeRequest->id)->exists()) {
            $this->createAssignments($shiftChangeRequest);
        }
    }

    // Si el estado ha cambiado de "aceptado" a "rechazado", eliminar asignaciones
    if ($oldEstado === 'aceptado' && $shiftChangeRequest->estado === 'rechazado') {
        $this->deleteAssignmentsForChangeRequest($shiftChangeRequest);
    }

    // Enviar notificación a los dos empleados
    $empleado1 = $shiftChangeRequest->empleado1;
    $empleado2 = $shiftChangeRequest->empleado2;

    if ($empleado1 && $empleado1->email) {
        Mail::to($empleado1->email)->send(new ShiftChangeStatusUpdatedMail($shiftChangeRequest, $request->estado));
    }

    if ($empleado2 && $empleado2->email) {
        Mail::to($empleado2->email)->send(new ShiftChangeStatusUpdatedMail($shiftChangeRequest, $request->estado));
    }

    return response()->json($shiftChangeRequest, 200);
}

private function createAssignments($shiftChangeRequest)
{

    // Evitar duplicados si ya existen asignaciones para esta solicitud
    if (Firefighters_assignment::where('id_change_request', $shiftChangeRequest->id)->exists()) {
        Log::info('Asignaciones ya existentes para el cambio de turno', ['id' => $shiftChangeRequest->id]);
        return;
    }
    
    Log::info('Iniciando la creación de asignaciones para cambio de turno', [
        'shiftChangeRequest' => $shiftChangeRequest
    ]);

    try {
        if ($shiftChangeRequest->fecha2) {
            // Determinar cuál es la fecha más pequeña y cuál es la más grande
            $fecha1 = new \DateTime($shiftChangeRequest->fecha);
            $fecha2 = new \DateTime($shiftChangeRequest->fecha2);

            $fechaMenor = min($fecha1, $fecha2);
            $fechaMayor = max($fecha1, $fecha2);

            // Calcular fechas de inicio y de devolución
            $fechaInicio = clone $fechaMenor;
            $fechaInicio->modify('-1 day'); // Empieza un día antes de la fecha más pequeña

            $fechaDevolucion = clone $fechaMayor;
            $fechaDevolucion->modify('+2 days'); // Termina dos días después de la fecha más grande

            Log::info('Fechas calculadas para cambio espejo', [
                'fechaInicio' => $fechaInicio->format('Y-m-d'),
                'fechaDevolucion' => $fechaDevolucion->format('Y-m-d'),
            ]);

            // Crear asignaciones para Bombero 1
            Firefighters_assignment::create([
                'fecha_ini' => $fechaInicio->format('Y-m-d'),
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => 'Mañana',
                'tipo_asignacion' => 'ida',
            ]);

            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion->format('Y-m-d'),
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => 'Mañana',
                'tipo_asignacion' => 'vuelta',
            ]);

            // Crear asignaciones para Bombero 2
            Firefighters_assignment::create([
                'fecha_ini' => $fechaInicio->format('Y-m-d'),
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => 'Mañana',
                'tipo_asignacion' => 'ida',
            ]);

            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion->format('Y-m-d'),
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => 'Mañana',
                'tipo_asignacion' => 'vuelta',
            ]);

            Log::info('Asignaciones creadas para cambio espejo');
        } else if ($shiftChangeRequest->turno === 'Dia Completo') {
            // Lógica específica para Día Completo
            $fechaOriginal = $shiftChangeRequest->fecha;

            $fechaInicioBombero1 = $fechaOriginal; // Día x
            $fechaInicioBombero2 = date('Y-m-d', strtotime($fechaOriginal . ' -1 day')); // Día x - 1
            $fechaDevolucion = date('Y-m-d', strtotime($fechaOriginal . ' +2 day')); // Día x + 2

            $turnoAsignacion = $this->determinarTurnoInicial($shiftChangeRequest->turno);
            $turnoDevolucion = $this->determinarTurnoDevolucion($shiftChangeRequest->turno);

            Log::info('Fechas y turnos determinados para cambio de guardia Día Completo', [
                'fechaInicioBombero1' => $fechaInicioBombero1,
                'fechaInicioBombero2' => $fechaInicioBombero2,
                'fechaDevolucion' => $fechaDevolucion,
                'turnoAsignacion' => $turnoAsignacion,
                'turnoDevolucion' => $turnoDevolucion
            ]);

            // Crear asignación inicial para Bombero 1
            Firefighters_assignment::create([
                'fecha_ini' => $fechaInicioBombero1,
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => $turnoAsignacion,
                'tipo_asignacion' => 'ida',
            ]);

            // Crear asignación inicial para Bombero 2
            Firefighters_assignment::create([
                'fecha_ini' => $fechaInicioBombero2,
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => $turnoAsignacion,
                'tipo_asignacion' => 'ida',
            ]);

            // Crear asignación de devolución para Bombero 1
            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion,
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => $turnoDevolucion,
                'tipo_asignacion' => 'vuelta',
            ]);

            // Crear asignación de devolución para Bombero 2
            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion,
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => $turnoDevolucion,
                'tipo_asignacion' => 'vuelta',
            ]);

            Log::info('Asignaciones creadas para cambio de guardia Día Completo');
        } else {
            // Lógica anterior para otros turnos
            $turnoAsignacion = $this->determinarTurnoInicial($shiftChangeRequest->turno);
            $turnoDevolucion = $this->determinarTurnoDevolucion($shiftChangeRequest->turno);

            $fechaDevolucion = ($shiftChangeRequest->turno === 'Noche' || $shiftChangeRequest->turno === 'Tarde y noche')
                ? date('Y-m-d', strtotime($shiftChangeRequest->fecha . ' +1 day'))
                : $shiftChangeRequest->fecha;

            Log::info('Fechas y turnos determinados para cambio de guardia (otros turnos)', [
                'fechaOriginal' => $shiftChangeRequest->fecha,
                'fechaDevolucion' => $fechaDevolucion,
                'turnoAsignacion' => $turnoAsignacion,
                'turnoDevolucion' => $turnoDevolucion
            ]);

            // Crear asignación inicial para Bombero 1
            Firefighters_assignment::create([
                'fecha_ini' => $shiftChangeRequest->fecha,
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => $turnoAsignacion,
                'tipo_asignacion' => 'ida',

            ]);

            // Crear asignación inicial para Bombero 2
            Firefighters_assignment::create([
                'fecha_ini' => $shiftChangeRequest->fecha,
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => $turnoAsignacion,
                'tipo_asignacion' => 'ida',
            ]);

            // Crear asignación de devolución para Bombero 1
            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion,
                'id_empleado' => $shiftChangeRequest->id_empleado1,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada2,
                'id_brigada_destino' => $shiftChangeRequest->brigada1,
                'turno' => $turnoDevolucion,
                'tipo_asignacion' => 'vuelta',
            ]);

            // Crear asignación de devolución para Bombero 2
            Firefighters_assignment::create([
                'fecha_ini' => $fechaDevolucion,
                'id_empleado' => $shiftChangeRequest->id_empleado2,
                'id_change_request' => $shiftChangeRequest->id,
                'id_brigada_origen' => $shiftChangeRequest->brigada1,
                'id_brigada_destino' => $shiftChangeRequest->brigada2,
                'turno' => $turnoDevolucion,
                'tipo_asignacion' => 'vuelta',
            ]);

            Log::info('Asignaciones creadas para cambio de guardia (otros turnos)');
        }
    } catch (\Exception $e) {
        Log::error('Error al crear asignaciones', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'shiftChangeRequest' => $shiftChangeRequest
        ]);
        throw $e; // Re-lanzar el error para que el flujo lo maneje
    }
}

private function deleteAssignmentsForChangeRequest($shiftChangeRequest)
{
    Log::info("Eliminando asignaciones vinculadas al cambio de guardia ID: {$shiftChangeRequest->id}");

    Firefighters_assignment::where('id_change_request', $shiftChangeRequest->id)->delete();
}



    private function deleteAssignments($shiftChangeRequest)
    {
        // Determinar la fecha de devolución según el tipo de turno
        $fechaDevolucion = ($shiftChangeRequest->turno === 'Noche' || $shiftChangeRequest->turno === 'Tarde y noche')
            ? date('Y-m-d', strtotime($shiftChangeRequest->fecha . ' +1 day'))
            : $shiftChangeRequest->fecha;
    
        // Determinar el turno inicial y el turno de devolución
        $turnoAsignacion = $this->determinarTurnoInicial($shiftChangeRequest->turno);
        $turnoDevolucion = $this->determinarTurnoDevolucion($shiftChangeRequest->turno);
    
        // Eliminar asignaciones para empleado 1 en fecha de cambio y fecha de devolución, considerando el turno
        Firefighters_assignment::where('id_empleado', $shiftChangeRequest->id_empleado1)
            ->where(function ($query) use ($shiftChangeRequest, $fechaDevolucion, $turnoAsignacion, $turnoDevolucion) {
                $query->where(function ($q) use ($shiftChangeRequest, $turnoAsignacion) {
                        $q->where('fecha_ini', $shiftChangeRequest->fecha)
                          ->where('turno', $turnoAsignacion);
                    })
                    ->orWhere(function ($q) use ($fechaDevolucion, $turnoDevolucion) {
                        $q->where('fecha_ini', $fechaDevolucion)
                          ->where('turno', $turnoDevolucion);
                    });
            })
            ->delete();
    
        // Eliminar asignaciones para empleado 2 en fecha de cambio y fecha de devolución, considerando el turno
        Firefighters_assignment::where('id_empleado', $shiftChangeRequest->id_empleado2)
            ->where(function ($query) use ($shiftChangeRequest, $fechaDevolucion, $turnoAsignacion, $turnoDevolucion) {
                $query->where(function ($q) use ($shiftChangeRequest, $turnoAsignacion) {
                        $q->where('fecha_ini', $shiftChangeRequest->fecha)
                          ->where('turno', $turnoAsignacion);
                    })
                    ->orWhere(function ($q) use ($fechaDevolucion, $turnoDevolucion) {
                        $q->where('fecha_ini', $fechaDevolucion)
                          ->where('turno', $turnoDevolucion);
                    });
            })
            ->delete();
    }
    


    public function destroy($id)
    {
        $shiftChangeRequest = ShiftChangeRequest::find($id);

        if (!$shiftChangeRequest) {
            return response()->json(['message' => 'Shift change request not found'], 404);
        }

        $this->deleteAssignments($shiftChangeRequest);

        $shiftChangeRequest->delete();
        return response()->json(null, 204);
    }

    
private function determinarTurnoDevolucion($turnoActual)
{
    switch ($turnoActual) {
        case 'Mañana':
            return 'Tarde';
        case 'Tarde':
            return 'Noche';
        case 'Noche':
            return 'Mañana';
        case 'Dia Completo':
            return 'Mañana'; // Devolución en "Mañana" del día siguiente
        case 'Mañana y tarde':
            return 'Noche'; // Devolución en "Noche" del mismo día
        case 'Tarde y noche':
            return 'Mañana'; // Devolución en "Mañana" del día siguiente
        default:
            return 'Mañana'; 
    }
}

private function determinarTurnoInicial($turnoOriginal)
{
    switch ($turnoOriginal) {
        case 'Mañana y tarde':
            return 'Mañana'; // Se registrará el turno de la mañana
        case 'Tarde y noche':
            return 'Tarde'; // Se registrará el turno de la tarde
        case 'Dia Completo':
            return 'Mañana';
        default:
            return $turnoOriginal; // Para los turnos simples (Mañana, Tarde, Noche)
    }
}

public function getLatestBrigadeAssignments($date)
{
    $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
        ->orderByRaw("CASE WHEN fecha_ini = '$date' THEN 0 ELSE 1 END")
        ->orderBy('fecha_ini', 'desc')
        ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
        ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")
        ->orderBy('created_at', 'desc')
        ->get()
        ->unique('id_empleado');
    
    return $assignments;
}

}
