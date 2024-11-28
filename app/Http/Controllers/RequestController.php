<?php

namespace App\Http\Controllers;

use App\Models\Request as MiRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Firefighters_assignment;

class RequestController extends Controller
{
    public function index()
    {
        $request = MiRequest::all();
        return response()->json($request);
    }

    public function store(Request $request)
{
    Log::info('Datos de la solicitud recibidos:', $request->all());

    // Reglas generales
    $rules = [
        'id_empleado' => 'required|exists:users,id_empleado',
        'tipo' => 'required|in:vacaciones,asuntos propios,salidas personales,licencias por jornadas,licencias por dias',
        'fecha_ini' => 'required|date',
        'fecha_fin' => 'required|date',
        'estado' => 'required|in:Pendiente,Confirmada,Cancelada',
        'file' => 'nullable|file|mimes:pdf,jpg,png|max:2048', // Validación del archivo
    ];

    // Reglas específicas para "asuntos propios"
    if ($request->tipo === 'asuntos propios' || $request->tipo === 'licencias por jornadas') {
        $rules['turno'] = 'required|in:Mañana,Tarde,Noche,Día Completo,Mañana y tarde,Tarde y noche';
    }

    // Reglas específicas para "salidas personales"
    if ($request->tipo === 'salidas personales') {
        $rules['horas'] = 'required|numeric|min:1|max:24'; // Validar las horas
        $request->merge([
            'fecha_fin' => $request->fecha_ini, // Asegurar que fecha_ini y fecha_fin sean iguales
        ]);
    }

    if ($request->tipo === 'licencias por dias') {
        $request->merge([
            'fecha_fin' => $request->fecha_fin ?? $request->fecha_ini, // Asegura que haya fecha_fin
        ]);
    }

    // Validar los datos
    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        Log::error('Errores de validación:', $validator->errors()->toArray());
        return response()->json($validator->errors(), 400);
    }

    // Guardar el archivo si se proporciona
    $filePath = null;
    if ($request->hasFile('file')) {
        $filePath = $request->file('file')->store('files', 'public');
    }

    Log::info('Datos de la solicitud recibidos:', $request->all());

    if ($request->hasFile('file')) {
        $file = $request->file('file');
        Log::info('Archivo recibido:', ['nombre' => $file->getClientOriginalName()]);
    } else {
        Log::warning('No se recibió ningún archivo.');
    }

    // Crear la solicitud
    $miRequest = MiRequest::create(array_merge($request->all(), ['file' => $filePath]));

    Log::info('Solicitud creada con éxito:', $miRequest->toArray());
    return response()->json($miRequest, 201);
}



public function show(string $id)
{
    $miRequest = MiRequest::find($id);

    if (!$miRequest) {
        return response()->json(['message' => 'Request not found'], 404);
    }

    
    
    $fileExists = $miRequest->file && file_exists(public_path('storage/' . $miRequest->file));

    return response()->json([
        'request' => $miRequest,
        'file_url' => $fileExists ? url('storage/' . $miRequest->file) : null,
    ]);

}

public function downloadFile(string $id)
{
    // Buscar la solicitud por ID
    $miRequest = MiRequest::find($id);

    // Verificar si la solicitud existe y tiene un archivo asociado
    if (!$miRequest || !$miRequest->file) {
        return response()->json(['message' => 'Archivo no encontrado'], 404);
    }

    // Obtener la ruta completa al archivo almacenado
    $filePath = public_path('storage/' . $miRequest->file);

    // Verificar si el archivo existe físicamente en el servidor
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
    }

    // Responder con el archivo para que el navegador inicie la descarga
    return response()->download($filePath);
}



    public function update(Request $request, $id)
    {
        $miRequest = MiRequest::findOrFail($id);

        $rules = [
            'estado' => 'required|in:Pendiente,Confirmada,Cancelada',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $oldEstado = $miRequest->estado;
        $miRequest->estado = $request->estado;
        $miRequest->save();

        // Ajustar la columna `SP` si la solicitud es de tipo `salidas personales`
        if ($miRequest->tipo === 'salidas personales') {
            $this->adjustSPHours($miRequest, $oldEstado, $miRequest->estado);
        } else {
            // Crear o eliminar asignaciones solo para otros tipos de solicitudes
            if ($miRequest->estado === 'Confirmada') {
                $this->createAssignments($miRequest);
            }

            if ($oldEstado === 'Confirmada' && $miRequest->estado === 'Cancelada') {
                $this->deleteAssignments($miRequest);
            }
        }

        return response()->json($miRequest, 200);
    }


    private function createAssignments($miRequest)
    {
        $brigadeId = null;

        // Determinar la brigada en función del tipo de solicitud
        switch (strtolower($miRequest->tipo)) {
            case 'vacaciones':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Vacaciones')->value('id_brigada');
                break;
            case 'asuntos propios':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Asuntos Propios')->value('id_brigada');
                break;
            case 'salidas personales':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Salidas Personales')->value('id_brigada');
                break;
            case 'licencias por jornadas':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Licencias por Jornadas')->value('id_brigada');
                break;
            case 'licencias por dias':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Licencias por Días')->value('id_brigada');
                break;
        }

        if (!$brigadeId) {
            Log::error("No se encontró la brigada para el tipo: {$miRequest->tipo}");
            return response()->json(['error' => "Brigada para el tipo {$miRequest->tipo} no encontrada"], 400);
        }

        // Verificar el turno y asignarlo correctamente
        if ($miRequest->tipo === 'asuntos propios' || $miRequest->tipo === 'licencias por jornadas') {
            // Para "asuntos propios", usar el turno enviado en la solicitud
            $turnoAsignacion = $this->determinarTurnoInicial($miRequest->turno);
            $turnoDevolucion = $this->determinarTurnoDevolucion($miRequest->turno);
        } else {
            // Para otros tipos de solicitud, asignar "Mañana" por defecto
            $turnoAsignacion = 'Mañana';
            $turnoDevolucion = 'Mañana';
        }

        // Obtener la brigada original para devolver al empleado a su puesto
        $brigadeOriginal = $this->getOriginalBrigade($miRequest->id_empleado, $miRequest->fecha_ini);

        // Crear la asignación inicial
        Firefighters_assignment::create([
            'id_empleado' => $miRequest->id_empleado,
            'id_brigada_origen' => $brigadeOriginal,
            'id_brigada_destino' => $brigadeId,
            'fecha_ini' => $miRequest->fecha_ini,
            'turno' => $turnoAsignacion,
        ]);

        // Definir la fecha de devolución
        $fechaDevolucion = $this->determinarFechaDevolucion($miRequest->fecha_ini, $miRequest->turno);

        Log::info("Asignación de retorno - Empleado: {$miRequest->id_empleado}, Brigada Original: {$brigadeOriginal}, Fecha: {$fechaDevolucion}, Turno: {$turnoDevolucion}");

        // Crear la asignación de retorno
        Firefighters_assignment::create([
            'id_empleado' => $miRequest->id_empleado,
            'id_brigada_origen' => $brigadeId,
            'id_brigada_destino' => $brigadeOriginal,
            'fecha_ini' => $fechaDevolucion,
            'turno' => $turnoDevolucion,
        ]);
    }

    private function determinarTurnoInicial($turnoActual)
    {
        return match ($turnoActual) {
            'Mañana y tarde' => 'Mañana',
            'Tarde y noche' => 'Tarde',
            'Día Completo' => 'Mañana',
            default => $turnoActual,
        };
    }

    private function determinarTurnoDevolucion($turnoActual)
    {
        return match ($turnoActual) {
            'Mañana', 'Mañana y tarde' => 'Noche',
            'Tarde', 'Tarde y noche' => 'Mañana',
            'Noche', 'Día Completo' => 'Mañana',
        };
    }

    private function determinarFechaDevolucion($fechaInicio, $turno)
    {
        return in_array($turno, ['Noche', 'Día Completo', 'Tarde y noche'])
            ? date('Y-m-d', strtotime($fechaInicio . ' +1 day'))
            : $fechaInicio;
    }

    private function deleteAssignments($miRequest)
    {
        Log::info("Eliminando asignaciones para empleado: {$miRequest->id_empleado} entre las fechas: {$miRequest->fecha_ini} y {$miRequest->fecha_fin} con turno: {$miRequest->turno}");

        if ($miRequest->tipo === 'asuntos propios') {
            // Determinar turnos de ida y vuelta específicos para asuntos propios
            $turnoInicial = $this->determinarTurnoInicial($miRequest->turno);
            $turnoDevolucion = $this->determinarTurnoDevolucion($miRequest->turno);
            $fechaDevolucion = $this->determinarFechaDevolucion($miRequest->fecha_ini, $miRequest->turno);

            // Eliminar asignaciones de ida y de vuelta basadas en turno y fecha específicos
            Firefighters_assignment::where('id_empleado', $miRequest->id_empleado)
                ->where(function ($query) use ($miRequest, $turnoInicial, $turnoDevolucion, $fechaDevolucion) {
                    $query->where('fecha_ini', $miRequest->fecha_ini)
                        ->where('turno', $turnoInicial)
                        ->orWhere(function ($q) use ($fechaDevolucion, $turnoDevolucion) {
                            $q->where('fecha_ini', $fechaDevolucion)
                                ->where('turno', $turnoDevolucion);
                        });
                })
                ->delete();
        } else {
            // Eliminar todas las asignaciones para otros tipos (vacaciones, salidas personales) basadas en fecha solamente
            Firefighters_assignment::where('id_empleado', $miRequest->id_empleado)
                ->whereIn('fecha_ini', [$miRequest->fecha_ini, $miRequest->fecha_fin])
                ->delete();
        }
    }



    private function getOriginalBrigade($idEmpleado, $fechaInicio)
    {
        Log::info("Buscando brigada original para empleado: {$idEmpleado} antes de la fecha: {$fechaInicio}");

        // Ordenar por fecha en descendente y luego según la prioridad de turno
        $assignments = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<', $fechaInicio)
            ->orderBy('fecha_ini', 'desc')
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
            ->get();

        if ($assignments->isEmpty()) {
            Log::info("No se encontraron asignaciones anteriores para el empleado {$idEmpleado} antes de la fecha {$fechaInicio}.");
            return null;
        }

        $assignment = $assignments->first();
        Log::info("Asignación seleccionada como original:", [
            'id_empleado' => $assignment->id_empleado,
            'id_brigada_destino' => $assignment->id_brigada_destino,
            'fecha_ini' => $assignment->fecha_ini,
            'turno' => $assignment->turno
        ]);

        return $assignment->id_brigada_destino;
    }


    public function destroy(MiRequest $miRequest)
    {
        $this->deleteAssignments($miRequest);
        $miRequest->delete();
        return response()->json(null, 204);
    }

    private function adjustSPHours($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor; // Relación con el modelo User
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        $hours = $miRequest->horas; // Asegúrate de que este campo esté presente y sea válido

        // Restar horas de `SP` si la solicitud es confirmada
        if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
            $user->SP = max(0, $user->SP - $hours); // Evitar valores negativos
        }

        // Sumar horas de `SP` si la solicitud es cancelada
        if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
            $user->SP += $hours;
        }

        $user->save();
        Log::info("Columna SP ajustada para el usuario ID: {$user->id_empleado}, horas ajustadas: {$hours}");
    }
}
