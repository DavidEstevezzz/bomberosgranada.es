<?php

namespace App\Http\Controllers;

use App\Models\Request as MiRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Firefighters_assignment;
use App\Mail\RequestStatusUpdatedMail;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Illuminate\Support\Facades\Auth;


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
            'estado' => 'required|in:Pendiente,Confirmada,Cancelada,Denegada',
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
            'estado' => 'required|in:Pendiente,Confirmada,Cancelada,Denegada',
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
            switch ($miRequest->tipo) {
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
        switch ($miRequest->tipo) {
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
        $tiposSinAsignaciones = ['vestuario', 'salidas personales']; // Tipos que no requieren asignaciones
        if (!in_array($miRequest->tipo, $tiposSinAsignaciones)) {
            if ($newEstado === 'Confirmada' && $oldEstado !== 'Confirmada') {
                $this->deleteAssignments($miRequest);  // Eliminar cualquier asignación existente
                $this->createAssignments($miRequest);   // Crear nuevas asignaciones

                Log::info("Asignaciones recreadas para solicitud ID: {$miRequest->id}");
            }
            if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada')) {
                $this->deleteAssignments($miRequest);
                Log::info("Asignaciones eliminadas para solicitud ID: {$miRequest->id}");
            }

            // Enviar correo de notificación

            $user = $miRequest->EnviadaPor;

            Log::info("=== INICIO PROCESO ENVÍO CORREO ===");
            Log::info("Solicitud ID: {$miRequest->id}");
            Log::info("Estado anterior: {$oldEstado}");
            Log::info("Estado nuevo: {$newEstado}");

            if (!$user) {
                Log::error("❌ Usuario no encontrado para la solicitud ID: {$miRequest->id}");
                return response()->json($miRequest, 200);
            }

            Log::info("✅ Usuario encontrado:", [
                'id_empleado' => $user->id_empleado,
                'nombre' => $user->nombre,
                'email' => $user->email
            ]);

            if (!$user->email) {
                Log::warning("⚠️ Usuario no tiene email configurado - ID: {$user->id_empleado}");
                return response()->json($miRequest, 200);
            }

            // Verificar configuración de correo
            $mailMailer = config('mail.default');
            Log::info("📧 Configuración de correo actual:", [
                'MAIL_MAILER' => $mailMailer,
                'MAIL_FROM_ADDRESS' => config('mail.from.address'),
                'MAIL_FROM_NAME' => config('mail.from.name'),
            ]);

            // Configuración específica según el mailer
            if ($mailMailer === 'sendgrid') {
                Log::info("🎯 Usando SendGrid API");
                Log::info("API KEY configurada: " . (config('services.sendgrid.key') ? 'SÍ' : 'NO'));
            } else {
                Log::info("📧 Configuración SMTP:", [
                    'MAIL_HOST' => config('mail.mailers.smtp.host'),
                    'MAIL_PORT' => config('mail.mailers.smtp.port'),
                    'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
                    'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
                    'PASSWORD_SET' => config('mail.mailers.smtp.password') ? 'SÍ' : 'NO'
                ]);
            }

            Log::info("📨 Preparando envío de correo:");
            Log::info("Destinatario: {$user->email}");
            Log::info("Tipo de solicitud: {$miRequest->tipo}");
            Log::info("Fecha inicio: {$miRequest->fecha_ini}");
            Log::info("Fecha fin: {$miRequest->fecha_fin}");

            try {
                Log::info("🚀 Iniciando envío de correo...");

                // Solo verificar conectividad SMTP si no es SendGrid API
                if ($mailMailer !== 'sendgrid') {
                    Log::info("🔌 Verificando conectividad SMTP...");

                    $host = config('mail.mailers.smtp.host');
                    $port = config('mail.mailers.smtp.port');

                    // Test de conectividad básica
                    $fp = @fsockopen($host, $port, $errno, $errstr, 10);
                    if (!$fp) {
                        Log::error("❌ No se puede conectar a {$host}:{$port}");
                        Log::error("Error número: {$errno}");
                        Log::error("Error mensaje: {$errstr}");
                        throw new \Exception("No se puede conectar al servidor SMTP: {$errstr}");
                    } else {
                        Log::info("✅ Conexión TCP a {$host}:{$port} exitosa");
                        fclose($fp);
                    }
                } else {
                    Log::info("⚡ Usando SendGrid API (no requiere conexión SMTP)");
                }

                // Medir tiempo de envío
                $startTime = microtime(true);

                Log::info("📧 Creando instancia del Mailable...");
                $mailable = new RequestStatusUpdatedMail($miRequest, $newEstado);
                Log::info("✅ Mailable creado exitosamente");

                Log::info("📤 Enviando correo...");

                Mail::to($user->email)->send($mailable);

                $endTime = microtime(true);
                $executionTime = round(($endTime - $startTime) * 1000, 2);

                Log::info("✅ Correo enviado exitosamente!");
                Log::info("⏱️ Tiempo de envío: {$executionTime}ms");
                Log::info("📧 Correo enviado a: {$user->email}");
            } catch (\Exception $e) {
                Log::error("❌ ERROR AL ENVIAR CORREO:");
                Log::error("Tipo de excepción: " . get_class($e));
                Log::error("Mensaje: " . $e->getMessage());
                Log::error("Código: " . $e->getCode());
                Log::error("Archivo: " . $e->getFile() . ":" . $e->getLine());

                // Información adicional de debug
                Log::error("🔍 Información adicional:");
                Log::error("PHP Version: " . PHP_VERSION);
                Log::error("Laravel Version: " . app()->version());
                Log::error("Environment: " . config('app.env'));
                Log::error("Mailer usado: " . $mailMailer);
            } finally {
                Log::info("=== FIN PROCESO ENVÍO CORREO ===");
            }

            return response()->json($miRequest, 200);
        }
    }

    /**
 * Obtener lista de empleados para jefes
 */
public function getEmployees()
{
    $user = Auth::user();
    
    // Solo los jefes pueden acceder a esta función
    if ($user->type !== 'jefe') {
        return response()->json(['message' => 'No autorizado'], 403);
    }
    
    $employees = User::select(
        'id_empleado', 
        'nombre', 
        'apellido', 
        'vacaciones', 
        'AP', 
        'SP', 
        'horas_sindicales',
        'modulo',
        'type'
    )
    ->whereIn('type', ['bombero', 'mando', 'empleado'])
    ->orderBy('nombre')
    ->orderBy('apellidos')
    ->get();
    
    return response()->json($employees);
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
            'tipo_asignacion' => 'ida',
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
            'tipo_asignacion' => 'vuelta',
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

        $assignment = Firefighters_assignment::where('id_empleado', $idEmpleado)
            ->where('fecha_ini', '<=', $fechaInicio)
            ->orderBy('fecha_ini', 'desc')                                    // 1. Fecha más reciente
            ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")        // 2. Prioridad de turno
            ->orderByRaw("FIELD(tipo_asignacion, 'ida', 'vuelta')")          // 3. Tipo de asignación
            ->orderBy('created_at', 'desc')                                   // 4. Más reciente en caso de empate
            ->first();  //  ESTO ES LO CRÍTICO: first() en la query, no en la colección

        if (!$assignment) {
            Log::info("No se encontraron asignaciones anteriores para el empleado {$idEmpleado} antes de la fecha {$fechaInicio}.");

            // Fallback: buscar la brigada base del usuario
            $user = \App\Models\User::find($idEmpleado);
            $brigadeUsuario = $user ? $user->brigades()->first() : null;

            if ($brigadeUsuario) {
                Log::info("Usando brigada base del usuario: {$brigadeUsuario->id_brigada} - {$brigadeUsuario->nombre}");
                return $brigadeUsuario->id_brigada;
            }

            Log::warning("No se encontró brigada base para el usuario {$idEmpleado}");
            return null;
        }

        // ✅ Logging detallado para debugging
        Log::info("Asignación seleccionada como brigada original:", [
            'id_empleado' => $assignment->id_empleado,
            'fecha_ini' => $assignment->fecha_ini,
            'turno' => $assignment->turno,
            'brigada_destino' => $assignment->id_brigada_destino,
            'tipo_asignacion' => $assignment->tipo_asignacion,
            'brigada_nombre' => $assignment->brigadeDestination ? $assignment->brigadeDestination->nombre : 'N/A'
        ]);

        return $assignment->id_brigada_destino;
    }


    public function destroy(MiRequest $miRequest)
    {
        $this->deleteAssignments($miRequest);
        $miRequest->delete();
        return response()->json(null, 204);
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

        // Restar días de vacaciones cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            Log::info("Días solicitados: {$diasSolicitados}");
            Log::info("Vacaciones disponibles antes de la resta: {$user->vacaciones}");
            $user->vacaciones = max(0, $user->vacaciones - $diasSolicitados);
            Log::info("Restando {$diasSolicitados} días de vacaciones al usuario ID: {$user->id_empleado}");
            Log::info("Vacaciones disponibles después de la resta: {$user->vacaciones}");
        }

        // Sumar días de vacaciones cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Pendiente')) {
            $user->vacaciones += $diasSolicitados;
            Log::info("Sumando {$diasSolicitados} días de vacaciones al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }

    private function adjustModuloDays($miRequest, $oldEstado, $newEstado)
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

        // Restar días de módulo cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            $user->modulo = max(0, $user->modulo - $diasSolicitados);
            Log::info("Restando {$diasSolicitados} días de módulo al usuario ID: {$user->id_empleado}");
        }

        // Sumar días de módulo cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada' || $newEstado === 'Pendiente')) {
            $user->modulo += $diasSolicitados;
            Log::info("Sumando {$diasSolicitados} días de módulo al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }

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

    private function adjustAPDays($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor;
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        // Calcular jornadas según el turno
        $jornadasSolicitadas = $this->calcularJornadasPorTurno($miRequest->turno);

        Log::info("Solicitud ID: {$miRequest->id}, Tipo: {$miRequest->tipo}, Turno: {$miRequest->turno}");
        Log::info("Jornadas calculadas: {$jornadasSolicitadas}");
        Log::info("Estado anterior: {$oldEstado}, Nuevo estado: {$newEstado}");
        Log::info("AP disponibles antes de operación: {$user->AP}");

        // Restar jornadas de AP cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            $user->AP = max(0, $user->AP - $jornadasSolicitadas);
            Log::info("Restando {$jornadasSolicitadas} jornadas de asuntos propios al usuario ID: {$user->id_empleado}");
        }

        // Sumar jornadas de AP cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada' || $newEstado === 'Pendiente')) {
            $user->AP += $jornadasSolicitadas;
            Log::info("Sumando {$jornadasSolicitadas} jornadas de asuntos propios al usuario ID: {$user->id_empleado}");
        }

        Log::info("AP disponibles después de operación: {$user->AP}");
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

        // Restar jornadas de compensacion_grupos cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            $user->compensacion_grupos = max(0, $user->compensacion_grupos - $jornadasSolicitadas);
            Log::info("Restando {$jornadasSolicitadas} jornadas de compensación grupos al usuario ID: {$user->id_empleado}");
        }

        // Sumar jornadas de compensacion_grupos cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada' || $newEstado === 'Pendiente')) {
            $user->compensacion_grupos += $jornadasSolicitadas;
            Log::info("Sumando {$jornadasSolicitadas} jornadas de compensación grupos al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }

    private function adjustSindicalHours($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor;
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        $hours = $miRequest->horas;

        // Restar horas sindicales cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            $user->horas_sindicales = max(0, $user->horas_sindicales - $hours);
            Log::info("Restando {$hours} horas sindicales al usuario ID: {$user->id_empleado}");
        }

        // Sumar horas sindicales cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada' || $newEstado === 'Pendiente')) {
            $user->horas_sindicales += $hours;
            Log::info("Sumando {$hours} horas sindicales al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }

    private function adjustSPHours($miRequest, $oldEstado, $newEstado)
    {
        $user = $miRequest->EnviadaPor;
        if (!$user) {
            Log::error("Usuario no encontrado para la solicitud ID: {$miRequest->id}");
            return;
        }

        $hours = $miRequest->horas;

        // Restar horas de SP cuando se confirma la solicitud
        if (($oldEstado === 'Pendiente' || $oldEstado === 'Cancelada' || $oldEstado === 'Denegada') && $newEstado === 'Confirmada') {
            $user->SP = max(0, $user->SP - $hours);
            Log::info("Restando {$hours} horas de salidas personales al usuario ID: {$user->id_empleado}");
        }

        // Sumar horas de SP cuando se cancela la solicitud
        if ($oldEstado === 'Confirmada' && ($newEstado === 'Cancelada' || $newEstado === 'Denegada' || $newEstado === 'Pendiente')) {
            $user->SP += $hours;
            Log::info("Sumando {$hours} horas de salidas personales al usuario ID: {$user->id_empleado}");
        }

        $user->save();
    }
    
}


