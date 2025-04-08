<?php

namespace App\Http\Controllers;

use App\Models\Request as MiRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Firefighters_assignment;
use App\Mail\RequestStatusUpdatedMail;
use Illuminate\Support\Facades\Mail;


class RequestController extends Controller
{
    public function index()
    {
        // 1) Obtenemos las solicitudes ordenadas por 'fecha_ini' en orden ascendente
        $requests = MiRequest::orderBy('fecha_ini', 'asc')->get();

        // 2) Transformamos cada solicitud para agregar 'creacion' con solo la fecha
        //    y conservamos el resto de campos habituales
        $data = $requests->map(function ($req) {
            return [
                'id'            => $req->id,
                'id_empleado'   => $req->id_empleado,
                'tipo'          => $req->tipo,
                'motivo'        => $req->motivo,
                'fecha_ini'     => $req->fecha_ini,
                'fecha_fin'     => $req->fecha_fin,
                'estado'        => $req->estado,
                'turno'         => $req->turno,
                'file'          => $req->file,
                // Este es el campo nuevo que mostrará solo la fecha de created_at
                'creacion'      => $req->created_at ? $req->created_at->format('Y-m-d') : null,
            ];
        });

        return response()->json($data);
    }


    public function store(Request $request)
    {
        Log::info('Datos de la solicitud recibidos:', $request->all());

        // Reglas generales
        $rules = [
            'id_empleado' => 'required|exists:users,id_empleado',
            'tipo' => 'required|in:vacaciones,asuntos propios,horas sindicales,salidas personales,vestuario,licencias por jornadas,licencias por dias,modulo,compensacion grupos especiales',
            'fecha_ini' => 'required|date',
            'fecha_fin' => 'required|date',
            'estado' => 'required|in:Pendiente,Confirmada,Cancelada',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048', // Validación del archivo
        ];

        // Reglas específicas para "asuntos propios"
        if ($request->tipo === 'asuntos propios' || $request->tipo === 'licencias por jornadas') {
            $rules['turno'] = 'required|in:Mañana,Tarde,Noche,Día Completo,Mañana y tarde,Tarde y noche';
        }

        if ($request->tipo === 'salidas personales' || $request->tipo === 'horas sindicales') {

            $rules['horas'] = 'required|numeric|min:1|max:24'; // Validar las horas
            $request->merge([
                'fecha_fin' => $request->fecha_ini, // Asegurar que fecha_ini y fecha_fin sean iguales
            ]);
        }

        if ($request->tipo === 'licencias por dias' || request()->tipo === 'compensacion grupos especiales') {
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
            $filePath = $request->file('file')->store('files', 'shared');
            Log::info("Ruta de archivo adjunto: " . $filePath);
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
        $filePath = ('/home/david-api/htdocs/api.bomberosgranada.es/shared/storage/' . $miRequest->file);

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
        $newEstado = $request->estado;
    
        // Validación de disponibilidad según el tipo de solicitud
        if ($newEstado === 'Confirmada') {
            $user = $miRequest->EnviadaPor;
            if (!$user) {
                return response()->json(['error' => 'Usuario no encontrado para esta solicitud'], 404);
            }
    
            // Verificaciones específicas por tipo
            switch($miRequest->tipo) {
                case 'vacaciones':
                    $fechaInicio = new \DateTime($miRequest->fecha_ini);
                    $fechaFin = new \DateTime($miRequest->fecha_fin);
                    $diasSolicitados = $fechaInicio->diff($fechaFin)->days + 1;
                    
                    if ($user->vacaciones < $diasSolicitados) {
                        return response()->json(['error' => 'El usuario no tiene suficientes días de vacaciones disponibles'], 400);
                    }
                    break;
                case 'modulo':
                    $fechaInicio = new \DateTime($miRequest->fecha_ini);
                    $fechaFin = new \DateTime($miRequest->fecha_fin);
                    $diasSolicitados = $fechaInicio->diff($fechaFin)->days + 1;
                    
                    if ($user->modulo < $diasSolicitados) {
                        return response()->json(['error' => 'El usuario no tiene suficientes días en su módulo disponibles'], 400);
                    }
                    break;
                case 'horas sindicales':
                    if ($user->horas_sindicales < $miRequest->horas) {
                        return response()->json(['error' => 'El usuario no tiene suficientes horas sindicales disponibles'], 400);
                    }
                    break;
                case 'salidas personales':
                    if ($user->SP < $miRequest->horas) {
                        return response()->json(['error' => 'El usuario no tiene suficientes horas de salidas personales disponibles'], 400);
                    }
                    break;
                case 'asuntos propios':
                    $jornadasSolicitadas = $this->calcularJornadasPorTurno($miRequest->turno);
                    
                    if ($user->AP < $jornadasSolicitadas) {
                        return response()->json(['error' => 'El usuario no tiene suficientes jornadas de asuntos propios disponibles'], 400);
                    }
                    break;
                case 'compensacion grupos especiales':
                    $jornadasSolicitadas = $this->calcularJornadasPorTurno($miRequest->turno);
                    
                    if ($user->compensacion_grupos < $jornadasSolicitadas) {
                        return response()->json(['error' => 'El usuario no tiene suficientes jornadas de compensación de grupos especiales disponibles'], 400);
                    }
                    break;
            }
        }
    
        // Actualizar el estado de la solicitud
        $miRequest->estado = $newEstado;
        $miRequest->save();
    
        // Ajustar las columnas específicas según el tipo (saldos de días/horas)
        switch($miRequest->tipo) {
            case 'vacaciones':
                $this->adjustVacationDays($miRequest, $oldEstado, $newEstado);
                break;
            case 'modulo':
                $this->adjustModuloDays($miRequest, $oldEstado, $newEstado);
                break;
            case 'salidas personales':
                $this->adjustSPHours($miRequest, $oldEstado, $newEstado);
                break;
            case 'horas sindicales':
                $this->adjustSindicalHours($miRequest, $oldEstado, $newEstado);
                break;
            case 'asuntos propios':
                $this->adjustAPDays($miRequest, $oldEstado, $newEstado);
                break;
            case 'compensacion grupos especiales':
                $this->adjustCompensacionGrupos($miRequest, $oldEstado, $newEstado);
                break;
        }
    
        // Manejar las asignaciones para todos los tipos que lo requieran
        $tiposSinAsignaciones = ['vestuario']; // Tipos que no requieren asignaciones
        if (!in_array($miRequest->tipo, $tiposSinAsignaciones)) {
            if ($newEstado === 'Confirmada') {
                $this->createAssignments($miRequest);
            }
            if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
                $this->deleteAssignments($miRequest);
            }
        }
    
        // Enviar correo de notificación
        $user = $miRequest->EnviadaPor;
        if ($user && $user->email) {
            try {
                Mail::to($user->email)->send(new RequestStatusUpdatedMail($miRequest, $newEstado));
            } catch (\Exception $e) {
                Log::error("Error enviando correo: " . $e->getMessage());
            }
        }
    
        return response()->json($miRequest, 200);
    }




    private function createAssignments($miRequest)
    {
        $brigadeId = null;

        Log::info("Creando asignaciones para la solicitud de tipo: {$miRequest->tipo}");

        // Determinar la brigada en función del tipo de solicitud
        switch (strtolower($miRequest->tipo)) {
            case 'vacaciones':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Vacaciones')->value('id_brigada');
                break;
            case 'asuntos propios':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Asuntos Propios')->value('id_brigada');
                break;
            case 'horas sindicales':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Horas Sindicales')->value('id_brigada');
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
            case 'modulo':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Modulo')->value('id_brigada');
                break;
            case 'compensacion grupos especiales':
                $brigadeId = \App\Models\Brigade::where('nombre', 'Compensacion grupos especiales')->value('id_brigada');
                break;
        }

        if (!$brigadeId) {
            Log::error("No se encontró la brigada para el tipo: {$miRequest->tipo}");
            return response()->json(['error' => "Brigada para el tipo {$miRequest->tipo} no encontrada"], 400);
        }

        // Verificar el turno y asignarlo correctamente
        if (in_array($miRequest->tipo, ['asuntos propios', 'licencias por jornadas', 'compensacion grupos especiales', 'horas sindicales'])) {
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
            'id_request' => $miRequest->id,
            'id_brigada_origen' => $brigadeOriginal,
            'id_brigada_destino' => $brigadeId,
            'fecha_ini' => $miRequest->fecha_ini,
            'turno' => $turnoAsignacion,
        ]);

        Log::info("Asignación inicial - Empleado: {$miRequest->id_empleado}, Brigada Destino: {$brigadeId}, Fecha: {$miRequest->fecha_ini}, Turno: {$turnoAsignacion}");

        // Definir la fecha de devolución
        $fechaDevolucion = $this->determinarFechaDevolucion(
            $miRequest->fecha_ini,
            $miRequest->fecha_fin,
            $miRequest->turno,
            $miRequest->tipo
        );

        Log::info("Asignación de retorno - Empleado: {$miRequest->id_empleado}, Brigada Original: {$brigadeOriginal}, Fecha: {$fechaDevolucion}, Turno: {$turnoDevolucion}");

        // Crear la asignación de retorno
        Firefighters_assignment::create([
            'id_empleado' => $miRequest->id_empleado,
            'id_request' => $miRequest->id,
            'id_brigada_origen' => $brigadeId,
            'id_brigada_destino' => $brigadeOriginal,
            'fecha_ini' => $fechaDevolucion,
            'turno' => $turnoDevolucion,
        ]);
    }

    private function determinarTurnoInicial($turnoActual)
    {
        return match ($turnoActual) {
            'Mañana', 'Mañana y tarde' => 'Mañana',
            'Tarde', 'Tarde y noche' => 'Tarde',
            'Noche' => 'Noche',
            'Día Completo' => 'Mañana',
            default => $turnoActual,
        };
    }

    private function determinarTurnoDevolucion($turnoActual)
    {
        return match ($turnoActual) {
            'Tarde', 'Mañana y tarde' => 'Noche',
            'Tarde y noche', 'Noche', 'Día Completo' => 'Mañana',
            'Mañana' => 'Tarde',
        };
    }

    private function determinarFechaDevolucion($fechaInicio, $fechaFin, $turno, $tipoSolicitud)
    {
        // Si el tipo de solicitud incluye una fecha de fin y es de los tipos específicos
        if (in_array($tipoSolicitud, ['vacaciones', 'licencias por dias', 'modulo']) && $fechaFin) {
            $fechaFin = new \DateTime($fechaFin);
            $fechaFin->modify('+1 day'); // Incrementar un día para la devolución
            return $fechaFin->format('Y-m-d');
        }

        // Para los demás tipos de solicitud, usar la lógica previa
        $fechaInicio = new \DateTime($fechaInicio);
        if (in_array($turno, ['Noche', 'Día Completo', 'Tarde y noche', null])) {
            $fechaInicio->modify('+1 day'); // Incrementar un día si es nocturno o día completo
        }
        return $fechaInicio->format('Y-m-d');
    }


    private function deleteAssignments($miRequest)
    {
        Log::info("Eliminando asignaciones vinculadas a la solicitud ID: {$miRequest->id}");

        Firefighters_assignment::where('id_request', $miRequest->id)->delete();
    }



    private function getOriginalBrigade($idEmpleado, $fechaInicio)
    {
        Log::info("Buscando brigada original para empleado: {$idEmpleado} antes de la fecha: {$fechaInicio}");

        // Ordenar por fecha en descendente y luego según la prioridad de turno
        $assignments = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<=', $fechaInicio)
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

    private function adjustAPDays($miRequest, $oldEstado, $newEstado)
{
    $user = $miRequest->EnviadaPor;
    if (!$user) {
        Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
        return;
    }

    // Calcular jornadas según el turno
    $jornadasSolicitadas = $this->calcularJornadasPorTurno($miRequest->turno);

    // Restar jornadas de AP si la solicitud es confirmada
    if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
        $user->AP = max(0, $user->AP - $jornadasSolicitadas);
        Log::info("Restando {$jornadasSolicitadas} jornadas de asuntos propios al usuario ID: {$user->id_empleado}");
    }

    // Sumar jornadas de AP si la solicitud es cancelada
    if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
        $user->AP += $jornadasSolicitadas;
        Log::info("Sumando {$jornadasSolicitadas} jornadas de asuntos propios al usuario ID: {$user->id_empleado}");
    }

    $user->save();
}

/**
 * Calcula las jornadas según el turno especificado
 */
private function calcularJornadasPorTurno($turno)
{
    if ($turno === 'Día Completo') {
        return 3;
    } else if ($turno === 'Mañana y tarde' || $turno === 'Tarde y noche') {
        return 2;
    } else {
        return 1;
    }
}

    private function adjustVacationDays($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor;
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        // Calcular los días solicitados
        $fechaInicio = new \DateTime($miRequest->fecha_ini);
        $fechaFin = new \DateTime($miRequest->fecha_fin);
        $diasSolicitados = $fechaInicio->diff($fechaFin)->days + 1;

        // Restar días de vacaciones si la solicitud es confirmada
        if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
            $user->vacaciones = max(0, $user->vacaciones - $diasSolicitados);
            Log::info("Restando {$diasSolicitados} días de vacaciones al usuario ID: {$user->id_empleado}");
        }

        // Sumar días de vacaciones si la solicitud es cancelada
        if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
            $user->vacaciones += $diasSolicitados;
            Log::info("Sumando {$diasSolicitados} días de vacaciones al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }

    private function adjustCompensacionGrupos($miRequest, $oldEstado, $newEstado)
{
    $user = $miRequest->EnviadaPor;
    if (!$user) {
        Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
        return;
    }

    // Calcular jornadas según el turno
    $jornadasSolicitadas = $this->calcularJornadasPorTurno($miRequest->turno);

    // Restar jornadas de compensacion_grupos si la solicitud es confirmada
    if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
        $user->compensacion_grupos = max(0, $user->compensacion_grupos - $jornadasSolicitadas);
        Log::info("Restando {$jornadasSolicitadas} jornadas de compensación grupos al usuario ID: {$user->id_empleado}");
    }

    // Sumar jornadas de compensacion_grupos si la solicitud es cancelada
    if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
        $user->compensacion_grupos += $jornadasSolicitadas;
        Log::info("Sumando {$jornadasSolicitadas} jornadas de compensación grupos al usuario ID: {$user->id_empleado}");
    }

    $user->save();
}

    private function adjustModuloDays($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor; // Relación con el modelo User
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        // Calcular los días solicitados
        $fechaInicio = new \DateTime($miRequest->fecha_ini);
        $fechaFin = new \DateTime($miRequest->fecha_fin);
        $diasSolicitados = $fechaInicio->diff($fechaFin)->days + 1;

        // Restar días de `modulo` si la solicitud es confirmada
        if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
            $user->modulo = max(0, $user->modulo - $diasSolicitados); // Evitar valores negativos
        }

        // Sumar días de `modulo` si la solicitud es cancelada
        if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
            $user->modulo += $diasSolicitados;
        }

        $user->save();
        Log::info("Columna modulo ajustada para el usuario ID: {$user->id_empleado}, días ajustados: {$diasSolicitados}");
    }

    private function adjustSindicalHours($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor; // Relación con el modelo User
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        $hours = $miRequest->horas; // Asegúrate de que este campo esté presente y sea válido

        // Restar horas de `horas_sindicales` si la solicitud pasa de Pendiente a Confirmada
        if ($oldEstado === 'Pendiente' && $newEstado === 'Confirmada') {
            $user->horas_sindicales = max(0, $user->horas_sindicales - $hours);
        }

        // Sumar horas de `horas_sindicales` si la solicitud pasa de Confirmada a Cancelada
        if ($oldEstado === 'Confirmada' && $newEstado === 'Cancelada') {
            $user->horas_sindicales += $hours;
        }

        $user->save();
        Log::info("Columna horas_sindicales ajustada para el usuario ID: {$user->id_empleado}, horas ajustadas: {$hours}");
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
