<?php

namespace App\Http\Controllers;

use App\Models\UserMessage;
use App\Models\MessageRead;
use App\Models\User;
use Illuminate\Http\Request;
use App\Mail\MessageSent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Bandeja de entrada:
     * Muestra mensajes donde receiver_id = usuario logueado O massive = true.
     */
    public function index()
    {
        $user = auth()->user();
        $userId = $user->id_empleado;
        $userType = $user->type;

        Log::info("Recuperando mensajes para usuario: ID {$userId}, tipo {$userType}");

        // Definir los valores permitidos para massive
        $massiveValues = ['toda'];
        if ($userType === 'mando') {
            $massiveValues[] = 'mandos';
        } elseif ($userType === 'bombero') {
            $massiveValues[] = 'bomberos';
        }
        Log::debug("Valores de massive permitidos: " . implode(', ', $massiveValues));

        // Consulta principal con eager loading de lecturas del usuario actual
        $messages = UserMessage::with(['reads' => function($query) use ($userId) {
            $query->where('user_id', $userId);
        }])
        ->where(function ($query) use ($userId, $massiveValues) {
            // Mensajes específicos para este usuario
            $query->where('receiver_id', $userId);
            
            // Mensajes masivos
            foreach ($massiveValues as $value) {
                $query->orWhereRaw("LOWER(massive) = ?", [strtolower($value)]);
            }
        })
        ->orderBy('created_at', 'desc')
        ->get();

        // Procesar mensajes para incluir estado de lectura correcto
        $messages->transform(function ($message) use ($userId) {
            // Para mensajes individuales, usar is_read normal
            if (!$message->massive || $message->massive === 'false') {
                return $message;
            }
            
            // Para mensajes masivos: usar setAttribute para añadir atributos temporales
            $message->setAttribute('is_read', $message->isReadByUser($userId));
            $message->setAttribute('read_count', $message->getReadCount());
            $message->setAttribute('total_recipients', $message->getTotalRecipients());
            
            Log::debug("Mensaje masivo {$message->id}: leído por usuario {$userId}: " . 
                      ($message->is_read ? 'SÍ' : 'NO'));
            
            return $message;
        });

        Log::info("Cantidad de mensajes recuperados: " . $messages->count());

        return response()->json($messages);
    }

    /**
     * Bandeja de salida:
     * Muestra mensajes enviados por el usuario.
     */
    public function sent()
    {
        $userId = auth()->id();
        
        $messages = UserMessage::with('reads')
            ->where('sender_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Para mensajes masivos, añadir estadísticas de lectura
        $messages->transform(function ($message) {
            // Para mensajes individuales, mantener como está
            if (!$message->massive || $message->massive === 'false') {
                return $message;
            }
            
            // Para mensajes masivos: usar setAttribute
            $message->setAttribute('read_count', $message->getReadCount());
            $message->setAttribute('total_recipients', $message->getTotalRecipients());
            $message->setAttribute('read_percentage', $message->getReadPercentage());
            
            return $message;
        });

        return response()->json($messages);
    }

    /**
     * Mostrar detalle de un mensaje.
     * Se carga la relación "replies" para mostrar el hilo.
     */
    public function show(UserMessage $message)
    {
        $message->loadRecursive();
        $fileExists = $message->attachment && file_exists(public_path('storage/' . $message->attachment));

        // Si es un mensaje masivo, incluir estadísticas
        if ($message->massive && $message->massive !== 'false') {
            $message->setAttribute('read_count', $message->getReadCount());
            $message->setAttribute('total_recipients', $message->getTotalRecipients());
            $message->setAttribute('read_percentage', $message->getReadPercentage());
        }

        return response()->json([
            'message' => $message,
            'file_url' => $fileExists ? url('storage/' . $message->attachment) : null,
        ]);
    }

    /**
     * Crear y enviar un nuevo mensaje
     */
    public function store(Request $request)
    {
        // Se espera que el campo 'massive' venga como false o como uno de: 'toda', 'mandos', 'bomberos'
        $massiveScope = $request->input('massive', false);
        // Se considera masivo si massiveScope no es false (ni la cadena 'false')
        $isMassive = $massiveScope !== false && $massiveScope !== 'false';

        // Definir reglas de validación:
        $rules = [
            'subject'   => 'required|string|max:255',
            'body'      => 'required|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'parent_id' => 'nullable|exists:messages,id', // Para respuesta en hilo
        ];

        // Si no es masivo, se requiere receptor
        if (!$isMassive) {
            $rules['receiver_id'] = 'required|exists:users,id_empleado';
        } else {
            // Si es masivo, el campo massive debe ser uno de los valores permitidos
            $rules['massive'] = 'sometimes|string|in:toda,mandos,bomberos';
        }

        $validated = $request->validate($rules);
        $validated['sender_id'] = auth()->id();

        // Guardamos el valor masivo de forma consistente:
        $validated['massive'] = $isMassive ? $massiveScope : 'false';
        // Si es masivo, ignoramos receiver_id
        if ($isMassive) {
            $validated['receiver_id'] = null;
        }

        // Manejo del archivo adjunto
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $originalName = $file->getClientOriginalName();

            // Guardar el nombre original del archivo
            $validated['attachment_filename'] = $originalName;

            // Guarda el archivo con un nombre único pero preservando la extensión
            $path = $file->storeAs(
                'attachments',
                pathinfo($originalName, PATHINFO_FILENAME) . '_' . time() . '.' . $file->getClientOriginalExtension(),
                'shared'
            );
            $validated['attachment'] = $path;
        }

        $message = UserMessage::create($validated);
        $message->load('sender', 'receiver', 'parent', 'replies');

        return response()->json($message, 201);
    }

    /**
     * Marcar un mensaje como leído (funciona para individuales y masivos)
     */
    public function markAsRead(Request $request, $id)
    {
        $message = UserMessage::findOrFail($id);
        $userId = auth()->id();

        // Verificar autorización para mensajes individuales
        if (!$message->massive || $message->massive === 'false') {
            if ($message->receiver_id !== $userId) {
                return response()->json(['error' => 'No autorizado'], 403);
            }
        }

        // Marcar como leído usando el método del modelo
        $message->markAsReadByUser($userId);

        Log::info("Mensaje {$id} marcado como leído por usuario {$userId}");

        return response()->json([
            'message' => 'Mensaje marcado como leído',
            'is_read' => true
        ], 200);
    }

    /**
     * Marcar mensaje masivo como leído para TODOS los usuarios del tipo correspondiente
     * Solo accesible para usuarios con rol de jefe
     */
    public function markMassiveAsRead(Request $request, $id)
    {
        $user = auth()->user();

        // Verificar que el usuario sea jefe
        if ($user->type !== 'jefe') {
            return response()->json([
                'error' => 'No autorizado. Solo los jefes pueden marcar mensajes masivos como leídos para todos.'
            ], 403);
        }

        $message = UserMessage::findOrFail($id);

        // Verificar que sea un mensaje masivo
        if (!$message->massive || $message->massive === 'false') {
            return response()->json(['error' => 'Este no es un mensaje masivo'], 400);
        }

        try {
            // Obtener todos los usuarios que deberían recibir este mensaje
            $userIds = [];

            switch (strtolower($message->massive)) {
                case 'toda':
                    $userIds = User::pluck('id_empleado')->toArray();
                    break;
                case 'mandos':
                    $userIds = User::where('type', 'mando')->pluck('id_empleado')->toArray();
                    break;
                case 'bomberos':
                    $userIds = User::where('type', 'bombero')->pluck('id_empleado')->toArray();
                    break;
                default:
                    return response()->json(['error' => 'Tipo de mensaje masivo no válido'], 400);
            }

            // Crear registros de lectura para todos los usuarios
            $reads = [];
            $now = now();
            
            foreach ($userIds as $userId) {
                // Solo insertar si no existe ya
                $exists = MessageRead::where('message_id', $message->id)
                    ->where('user_id', $userId)
                    ->exists();
                
                if (!$exists) {
                    $reads[] = [
                        'message_id' => $message->id,
                        'user_id' => $userId,
                        'read_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];
                }
            }

            // Inserción masiva solo si hay registros nuevos
            if (!empty($reads)) {
                MessageRead::insert($reads);
            }

            Log::info("Mensaje masivo {$id} marcado como leído para todos por el jefe {$user->id_empleado}");

            return response()->json([
                'message' => 'Mensaje masivo marcado como leído para todos los usuarios correspondientes',
                'affected_users_count' => count($reads),
                'total_users' => count($userIds)
            ], 200);

        } catch (\Exception $e) {
            Log::error("Error al marcar mensaje masivo como leído: " . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Descargar un adjunto.
     */
    public function downloadAttachment($id)
    {
        try {
            Log::emergency("INICIO DESCARGA ADJUNTO: " . $id);

            $message = UserMessage::find($id);
            if (!$message || !$message->attachment) {
                Log::emergency("No se encontró el mensaje o no tiene adjunto. ID: " . $id);
                return response()->json(['message' => 'Archivo no encontrado'], 404);
            }

            $filePath = ('/var/www/bomberosgranada.es/shared/storage/' . $message->attachment);
            Log::emergency("Ruta de archivo adjunto: " . $filePath);

            if (!file_exists($filePath)) {
                Log::emergency("Archivo no encontrado en el servidor. Ruta: " . $filePath);
                return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
            }

            // Obtener nombre original y extensión real del archivo almacenado
            $originalName = basename($message->attachment);

            // Detectar el tipo MIME real del archivo
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $detectedMimeType = finfo_file($finfo, $filePath);
            finfo_close($finfo);

            Log::emergency(
                "Información de descarga: " .
                    json_encode([
                        'originalName' => $originalName,
                        'detectedMimeType' => $detectedMimeType
                    ])
            );

            // Usar el tipo MIME detectado
            return response()->file($filePath, [
                'Content-Type' => $detectedMimeType,
                'Content-Disposition' => 'attachment; filename="' . $originalName . '"'
            ]);
        } catch (\Exception $e) {
            Log::emergency("ERROR EN DESCARGA: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar un mensaje (actualizado con nuevas reglas de autorización).
     */
    public function destroy(UserMessage $message)
    {
        $user = auth()->user();

        // Los jefes pueden eliminar cualquier mensaje
        if ($user->type === 'jefe') {
            $message->delete();
            return response()->json(['message' => 'Mensaje eliminado por el administrador.']);
        }

        // Para usuarios normales: no pueden eliminar mensajes masivos
        if ($message->massive && $message->massive !== 'false') {
            return response()->json([
                'error' => 'No se pueden eliminar mensajes masivos. Solo un jefe puede hacerlo.'
            ], 403);
        }

        // Verificar que el usuario sea el propietario del mensaje (enviado o recibido)
        if ($message->sender_id !== $user->id_empleado && $message->receiver_id !== $user->id_empleado) {
            return response()->json(['error' => 'No autorizado para eliminar este mensaje.'], 403);
        }

        $message->delete();
        return response()->json(['message' => 'Mensaje eliminado.']);
    }

    /**
     * Restaurar un mensaje eliminado.
     */
    public function restore($id)
    {
        $message = UserMessage::withTrashed()->findOrFail($id);
        $message->restore();
        return response()->json(['message' => 'Mensaje restaurado.']);
    }

    /**
     * Búsqueda de mensajes (en bandeja de entrada y enviados).
     */
    public function search(Request $request)
    {
        $user = auth()->user();
        $userId = $user->id_empleado;
        $userType = $user->type;
        $queryText = $request->input('query');

        // Definir los valores permitidos para massive según el tipo de usuario
        $massiveValues = ['toda'];
        if ($userType === 'mando') {
            $massiveValues[] = 'mandos';
        } elseif ($userType === 'bombero') {
            $massiveValues[] = 'bomberos';
        }

        // Consulta con eager loading de lecturas
        $messages = UserMessage::with(['reads' => function($query) use ($userId) {
            $query->where('user_id', $userId);
        }])
        ->where(function ($q) use ($userId, $massiveValues) {
            $q->where('receiver_id', $userId)
                ->orWhere('sender_id', $userId);
            
            // Añadir mensajes masivos
            foreach ($massiveValues as $value) {
                $q->orWhereRaw("LOWER(massive) = ?", [strtolower($value)]);
            }
        })
        ->where(function ($q) use ($queryText) {
            $q->where('subject', 'like', "%$queryText%")
                ->orWhere('body', 'like', "%$queryText%");
        })
        ->get();

        // Procesar mensajes masivos para estado de lectura correcto
        $messages->transform(function ($message) use ($userId) {
            if ($message->massive && $message->massive !== 'false') {
                $message->setAttribute('is_read', $message->isReadByUser($userId));
                $message->setAttribute('read_count', $message->getReadCount());
                $message->setAttribute('total_recipients', $message->getTotalRecipients());
            }
            return $message;
        });

        return response()->json($messages);
    }

    /**
     * Obtener el hilo completo de un mensaje
     */
    public function getMessageThread($id)
    {
        $message = UserMessage::with('replies.replies.replies')
            ->findOrFail($id);

        // Si es masivo, añadir estadísticas
        if ($message->massive && $message->massive !== 'false') {
            $message->setAttribute('read_count', $message->getReadCount());
            $message->setAttribute('total_recipients', $message->getTotalRecipients());
            $message->setAttribute('read_percentage', $message->getReadPercentage());
        }

        return response()->json(['message' => $message->toArray()]);
    }
}