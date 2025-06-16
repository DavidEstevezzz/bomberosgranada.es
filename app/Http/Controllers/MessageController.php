<?php

namespace App\Http\Controllers;

use App\Models\UserMessage;
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
        $userId = auth()->id();
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

        // Activar el registro de queries y el registro de mensajes
        DB::enableQueryLog();

        // Primera consulta: buscar mensaje 243 con withTrashed para ver si existe y su estado
        $message243 = UserMessage::withTrashed()->find(243);
        Log::debug("Mensaje 243 encontrado: " . ($message243 ? 'SÍ' : 'NO'));
        if ($message243) {
            Log::debug("Estado mensaje 243: deleted_at=" . ($message243->deleted_at ? $message243->deleted_at : 'NULL') .
                ", massive='" . $message243->massive . "', tipo=" . gettype($message243->massive));
        }

        // Segunda consulta: verificar todos los mensajes masivos, incluso los eliminados
        $massiveMessages = UserMessage::withTrashed()
            ->whereIn(DB::raw('LOWER(massive)'), array_map('strtolower', $massiveValues))
            ->get();

        Log::debug("Mensajes masivos encontrados (incluso eliminados): " . $massiveMessages->count());
        foreach ($massiveMessages as $msg) {
            Log::debug("Mensaje masivo ID: {$msg->id}, massive: '{$msg->massive}', deleted_at: " .
                ($msg->deleted_at ? $msg->deleted_at : 'NULL'));
        }

        // Consulta principal: múltiples intentos para capturar diferentes posibilidades
        $messages = UserMessage::where(function ($query) use ($userId, $massiveValues) {
            // 1. Mensajes específicos para este usuario
            $query->where('receiver_id', $userId);

            // 2. Mensajes masivos - usando varios métodos
            foreach ($massiveValues as $value) {
                $query->orWhereRaw("LOWER(massive) = ?", [strtolower($value)])
                    ->orWhereRaw("massive LIKE ?", ["%$value%"])
                    ->orWhere('massive', $value);
            }

            // 3. Verificar el ID 243 específicamente 
            $query->orWhere('id', 243);
        })
            ->orderBy('created_at', 'desc')
            ->get();

        // Loguear el query ejecutado
        $queryLog = DB::getQueryLog();
        Log::debug("Queries ejecutadas: " . json_encode($queryLog));

        // Agregar información detallada sobre los mensajes
        Log::info("Cantidad de mensajes recuperados: " . $messages->count());
        foreach ($messages as $message) {
            $massiveValue = $message->massive;
            if (is_null($massiveValue)) {
                $massiveValueStr = 'NULL';
            } else {
                // Asegurar que se muestre como string y escapar caracteres especiales
                $massiveValueStr = "'" . addslashes($massiveValue) . "'";
            }

            Log::debug("Mensaje ID: {$message->id}, massive: {$massiveValueStr}, tipo: " . gettype($message->massive));
        }

        return response()->json($messages);
    }



    /**
     * Bandeja de salida:
     * Muestra mensajes enviados por el usuario.
     */
    public function sent()
    {
        $userId = auth()->id();
        $messages = UserMessage::where('sender_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Mostrar detalle de un mensaje.
     * Se carga la relación "replies" para mostrar el hilo.
     */
    public function show(UserMessage $message)
    {
        // Puedes agregar políticas de acceso si lo deseas.
        $message->loadRecursive(); // Cargar TODAS las respuestas recursivamente
        $fileExists = $message->attachment && file_exists(public_path('storage/' . $message->attachment));

        return response()->json([
            'message' => $message,
            'file_url' => $fileExists ? url('storage/' . $message->attachment) : null,
        ]);
    }


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
            'parent_id' => 'nullable|exists:messages,id', // Para respuesta en hilo.
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

        // Manejo del archivo adjunto.
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

        // Resto del código (envío de correos, etc.)...

        return response()->json($message, 201);
    }


    /**
     * Descargar un adjunto.
     */
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

            $filePath = ('/home/david-api/htdocs/api.bomberosgranada.es/shared/storage/' . $message->attachment);
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
     * Obtiene el tipo MIME para una extensión dada
     */
    private function getMimeTypeForExtension($extension)
    {
        $mimeTypes = [
            'pdf'  => 'application/pdf',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif',
            // Añade más tipos según sea necesario
        ];

        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }
    /**
     * Marcar un mensaje como leído.
     */
    public function markAsRead(Request $request, $id)
    {
        $message = UserMessage::findOrFail($id);
        if ($message->receiver_id !== auth()->id() && !$message->massive) {
            return response()->json(['error' => 'No autorizado'], 403);
        }
        $message->is_read = true;
        $message->save();
        return response()->json(['message' => 'Mensaje marcado como leído'], 200);
    }

    /**
     * Marcar mensaje masivo como leído para todos los usuarios del tipo correspondiente
     * Solo accesible para usuarios con rol de jefe
     */
    public function markMassiveAsRead(Request $request, $id)
    {
        $user = auth()->user();

        // Verificar que el usuario sea jefe
        if ($user->type !== 'jefe') {
            return response()->json(['error' => 'No autorizado. Solo los jefes pueden marcar mensajes masivos como leídos.'], 403);
        }

        $message = UserMessage::findOrFail($id);

        // Verificar que sea un mensaje masivo
        if (!$message->massive || $message->massive === 'false') {
            return response()->json(['error' => 'Este no es un mensaje masivo'], 400);
        }

        try {
            // Determinar qué usuarios deben marcar el mensaje como leído
            $usersToUpdate = [];

            switch (strtolower($message->massive)) {
                case 'toda':
                    // Todos los usuarios
                    $usersToUpdate = DB::table('users')->pluck('id_empleado')->toArray();
                    break;
                case 'mandos':
                    // Solo usuarios con tipo 'mando'
                    $usersToUpdate = DB::table('users')->where('type', 'mando')->pluck('id_empleado')->toArray();
                    break;
                case 'bomberos':
                    // Solo usuarios con tipo 'bombero'
                    $usersToUpdate = DB::table('users')->where('type', 'bombero')->pluck('id_empleado')->toArray();
                    break;
                default:
                    return response()->json(['error' => 'Tipo de mensaje masivo no válido'], 400);
            }

            // Crear registros de lectura para cada usuario que debería ver el mensaje
            // Usaremos una tabla auxiliar o actualizaremos el mensaje para cada usuario
            // Como es masivo, vamos a usar un enfoque diferente: 
            // Marcaremos el mensaje como "globalmente leído" agregando un campo
            $message->marked_as_read_by_admin = true;
            $message->marked_as_read_at = now();
            $message->marked_as_read_by = $user->id_empleado;
            $message->save();

            Log::info("Mensaje masivo {$id} marcado como leído por el jefe {$user->id_empleado} para tipo: {$message->massive}");

            return response()->json([
                'message' => 'Mensaje masivo marcado como leído para todos los usuarios correspondientes',
                'affected_users_count' => count($usersToUpdate)
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error al marcar mensaje masivo como leído: " . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Eliminar un mensaje (actualizado con nuevas reglas de autorización).
     */
    public function destroy(UserMessage $message)
    {
        $user = auth()->user();

        // Los jefes pueden eliminar cualquier mensaje
        if ($user->role_name === 'jefe') {
            $message->delete();
            return response()->json(['message' => 'Mensaje eliminado por el administrador.']);
        }

        // Para usuarios normales: no pueden eliminar mensajes masivos
        if ($message->massive && $message->massive !== 'false') {
            return response()->json(['error' => 'No se pueden eliminar mensajes masivos. Solo un jefe puede hacerlo.'], 403);
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
        $userId = auth()->id();
        $queryText = $request->input('query');
        $messages = UserMessage::where(function ($q) use ($userId) {
            $q->where('receiver_id', $userId)
                ->orWhere('sender_id', $userId)
                ->orWhere('massive', true);
        })
            ->where(function ($q) use ($queryText) {
                $q->where('subject', 'like', "%$queryText%")
                    ->orWhere('body', 'like', "%$queryText%");
            })
            ->get();
        return response()->json($messages);
    }

    public function getMessageThread($id)
    {
        $message = UserMessage::with('replies.replies.replies') // Cargar niveles anidados
            ->findOrFail($id);

        // Convertir a array para asegurarnos de que la estructura es correcta
        return response()->json(['message' => $message->toArray()]);
    }
}
