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
     * Muestra mensajes donde receiver_id = usuario logueado O massive = true
     */
    public function index()
    {
        $userId = auth()->id();

        // Muestra mensajes recibidos O masivos
        $messages = UserMessage::where(function ($query) use ($userId) {
                // Mensaje normal dirigido al usuario
                $query->where('receiver_id', $userId)
                      // O mensaje masivo
                      ->orWhere('massive', true);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Bandeja de salida:
     * Muestra mensajes enviados por el usuario (sender_id).
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
     */
    public function show(UserMessage $message)
    {
        // Asegúrate de tener políticas o validaciones de acceso.
        // $this->authorize('view', $message);

        $fileExists = $message->attachment && file_exists(public_path('storage/' . $message->attachment));

        return response()->json([
            'message' => $message,
            'file_url' => $fileExists ? url('storage/' . $message->attachment) : null,
        ]);
    }

    /**
     * Crear/enviar un mensaje.
     * - Si massive=true, el campo receiver_id se ignora y se pone a null.
     */
    public function store(Request $request)
{
    // Validar
    $isMassive = $request->boolean('massive', false);

    $rules = [
        'subject' => 'required|string|max:255',
        'body' => 'required|string',
        'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        'massive' => 'sometimes|boolean',
    ];
    if (!$isMassive) {
        $rules['receiver_id'] = 'required|exists:users,id_empleado';
    }

    $validated = $request->validate($rules);
    $validated['sender_id'] = auth()->id();
    $validated['massive'] = $isMassive;

    // Si es masivo => no necesitamos receiver_id en la tabla
    if ($isMassive) {
        $validated['receiver_id'] = null;
    }

    // Manejar archivo
    if ($request->hasFile('attachment')) {
        $path = $request->file('attachment')->store('attachments', 'shared');
        $validated['attachment'] = $path;
    }

    // 1) Crear un solo mensaje (masivo)
    $message = UserMessage::create($validated);
    $message->load('sender', 'receiver');

    // 2) Enviar correos
    try {
        if ($isMassive) {
            // Tomar a todos los usuarios (excepto al emisor si quieres)
            $allUsers = \App\Models\User::where('id_empleado', '!=', auth()->id())->get();

            foreach ($allUsers as $u) {
                Mail::to($u->email)->send(new MessageSent($message));
            }

        } else {
            // Caso normal
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

        $filePath = ('/home/david-api/htdocs/api.bomberosgranada.es/shared/storage/' . $message->attachment);
        Log::info("Ruta de archivo adjunto: " . $filePath);

        if (!file_exists($filePath)) {
            return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
        }

        return response()->download($filePath);
    }

    /**
     * Marcar un mensaje como leído.
     */
    public function markAsRead(Request $request, $id)
    {
        $message = UserMessage::findOrFail($id);

        if ($message->receiver_id !== auth()->id() && !$message->massive) {
            // Si es masivo, tal vez quieras permitir a todos marcarlo. Depende de tu lógica.
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
        // $this->authorize('delete', $message);
        $message->delete();

        return response()->json(['message' => 'Mensaje eliminado.']);
    }

    public function restore($id)
    {
        $message = UserMessage::withTrashed()->findOrFail($id);
        // $this->authorize('restore', $message);
        $message->restore();

        return response()->json(['message' => 'Mensaje restaurado.']);
    }

    /**
     * Búsqueda de mensajes en la bandeja (inbox+sent).
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
}
