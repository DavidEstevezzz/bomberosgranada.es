<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use App\Mail\MessageSent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Bandeja de entrada: Listar mensajes recibidos.
     */
    public function index()
    {
        $userId = auth()->id();
        $messages = Message::where('receiver_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Bandeja de salida: Listar mensajes enviados.
     */
    public function sent()
    {
        $userId = auth()->id();
        $messages = Message::where('sender_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Ver un mensaje específico.
     */
    public function show(Message $message)
    {
        $this->authorize('view', $message);

        return response()->json($message);
    }

    /**
     * Enviar un mensaje.
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'receiver_id' => 'required|exists:users,id_empleado',
        'subject' => 'required|string|max:255',
        'body' => 'required|string',
        'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048'       
    ]);

    $validated['sender_id'] = auth()->id();

    if ($request->hasFile('attachment')) {
        $validated['attachment'] = $request->file('attachment')->store('attachments', 'public');
    }

    // Crear el mensaje
    $message = Message::create($validated);

    // Enviar el correo al destinatario
    Mail::to($message->receiver->email)->send(new MessageSent($message));

    return response()->json($message, 201);
}

    public function downloadAttachment($id)
{
    $message = Message::find($id);

    if (!$message || !$message->attachment) {
        return response()->json(['message' => 'Archivo no encontrado'], 404);
    }

    $filePath = public_path('storage/' . $message->attachment);

    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
    }

    return response()->download($filePath);
}


    /**
     * Marcar un mensaje como leído.
     */
    public function markAsRead(Request $request, $id) {
        $message = Message::findOrFail($id);
    
        // Asegúrate de que el usuario actual es el destinatario del mensaje
        if ($message->receiver_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }
    
        $message->is_read = true;
        $message->save();
    
        return response()->json(['message' => 'Mensaje marcado como leído'], 200);
    }

    /**
     * Eliminar un mensaje (soft delete).
     */
    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);
        $message->delete();

        return response()->json(['message' => 'Mensaje eliminado.']);
    }

    /**
     * Restaurar un mensaje eliminado.
     */
    public function restore($id)
    {
        $message = Message::withTrashed()->findOrFail($id);
        $this->authorize('restore', $message);
        $message->restore();

        return response()->json(['message' => 'Mensaje restaurado.']);
    }

    /**
     * Buscar mensajes en bandeja de entrada o salida.
     */
    public function search(Request $request)
    {
        $userId = auth()->id();
        $query = $request->input('query');

        $messages = Message::where(function ($q) use ($userId) {
            $q->where('receiver_id', $userId)
              ->orWhere('sender_id', $userId);
        })
        ->where(function ($q) use ($query) {
            $q->where('subject', 'like', "%$query%")
              ->orWhere('body', 'like', "%$query%");
        })
        ->get();

        return response()->json($messages);
    }
}
