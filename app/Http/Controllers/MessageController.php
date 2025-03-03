<?php

namespace App\Http\Controllers;

use App\Models\UserMessage;
use Illuminate\Http\Request;
use App\Mail\MessageSent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Bandeja de entrada:
     * Muestra mensajes donde receiver_id = usuario logueado O massive = true.
     */
    public function index()
    {
        $userId = auth()->id();

        // Mensajes recibidos o masivos.
        $messages = UserMessage::where(function ($query) use ($userId) {
                $query->where('receiver_id', $userId)
                      ->orWhere('massive', true);
            })
            ->orderBy('created_at', 'desc')
            ->get();

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
        // Validar
        $isMassive = $request->boolean('massive', false);
        $rules = [
            'subject'   => 'required|string|max:255',
            'body'      => 'required|string',
            'attachment'=> 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'massive'   => 'sometimes|boolean',
            'parent_id' => 'nullable|exists:messages,id', // Para respuesta en hilo.
        ];
        if (!$isMassive) {
            $rules['receiver_id'] = 'required|exists:users,id_empleado';
        }

        $validated = $request->validate($rules);
        $validated['sender_id'] = auth()->id();
        $validated['massive'] = $isMassive;

        // Si es masivo, ignoramos receiver_id.
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

        // Enviar correos (mantén tu lógica actual)
        try {
            if ($isMassive) {
                $allUsers = \App\Models\User::where('id_empleado', '!=', auth()->id())->get();
                foreach ($allUsers as $u) {
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
    $message = UserMessage::find($id);
    if (!$message || !$message->attachment) {
        return response()->json(['message' => 'Archivo no encontrado'], 404);
    }
    $filePath = public_path('storage/attatchments' . $message->attachment);
    Log::info("Ruta de archivo adjunto: " . $filePath);
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
    }
    $downloadName = basename($message->attachment);
    return response()->download($filePath, $downloadName);
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
