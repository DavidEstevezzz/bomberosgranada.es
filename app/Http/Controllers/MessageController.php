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

    /**
     * Crear/enviar un mensaje.
     * Si massive=true, el receiver_id se ignora.
     * Se admite el campo opcional parent_id para respuestas.
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
    // - Si es masivo, guardar el valor exacto ('toda', 'mandos', 'bomberos')
    // - Si no es masivo, guardar NULL en lugar de 'false'
    $validated['massive'] = $isMassive ? $massiveScope : null;

    // Si es masivo, ignoramos receiver_id
    if ($isMassive) {
        $validated['receiver_id'] = null;
    }

        // Manejo del archivo adjunto.
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('attachments', 'shared');
            $validated['attachment'] = $path;
        }

        $message = UserMessage::create($validated);
        $message->load('sender', 'receiver', 'parent', 'replies');

        // Enviar correos
        try {
            if ($isMassive) {
                if ($massiveScope === 'toda') {
                    // Toda la plantilla: todos excepto el remitente
                    $users = \App\Models\User::where('id_empleado', '!=', auth()->id())->get();
                } elseif ($massiveScope === 'mandos') {
                    // Solo mandos
                    $users = \App\Models\User::where('type', 'mando')->get();
                } elseif ($massiveScope === 'bomberos') {
                    // Solo bomberos
                    $users = \App\Models\User::where('type', 'bomberos')->get();
                } else {
                    $users = collect();
                }
                foreach ($users as $u) {
                    Mail::to($u->email)->send(new MessageSent($message));
                }
            } else {
                if ($message->receiver) {
                    Mail::to($message->receiver->email)->send(new MessageSent($message));
                }
            }
        } catch (\Exception $e) {
            Log::error("Error enviando correo masivo: " . $e->getMessage());
        }

        return response()->json($message, 201);
    }


    /**
     * Descargar un adjunto.
     */
    public function downloadAttachment($id)
    {
        try {
            $message = UserMessage::find($id);
            if (!$message || !$message->attachment) {
                Log::error("No se encontró el mensaje o no tiene adjunto. ID: " . $id);
                return response()->json(['message' => 'Archivo no encontrado'], 404);
            }
            // Asegúrate de que la ruta sea la correcta. 
            // Por ejemplo, si guardaste el archivo en 'attachments', debería ser 'storage/attachments/'.
            $filePath = ('/home/david-api/htdocs/api.bomberosgranada.es/shared/storage/' . $message->attachment);
            Log::info("Ruta de archivo adjunto: " . $filePath);
            if (!file_exists($filePath)) {
                Log::error("Archivo no encontrado en el servidor. Ruta: " . $filePath);
                return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
            }
            $downloadName = basename($message->attachment);
            return response()->download($filePath, $downloadName);
        } catch (\Exception $e) {
            Log::error("Error al descargar el adjunto: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
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
     * Eliminar un mensaje.
     */
    public function destroy(UserMessage $message)
    {
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
