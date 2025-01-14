<?php

namespace App\Http\Controllers;

use App\Models\UserMessage;
use Illuminate\Http\Request;
use App\Mail\MessageSent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        $messages = UserMessage::where('receiver_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    public function sent()
    {
        $userId = auth()->id();
        $messages = UserMessage::where('sender_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    public function show(UserMessage $message)
    {
        $this->authorize('view', $message);

        return response()->json($message);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id_empleado',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $validated['sender_id'] = auth()->id();

        if ($request->hasFile('attachment')) {
            $validated['attachment'] = $request->file('attachment')->store('attachments', 'public');
        }

        $message = UserMessage::create($validated);
        $message = UserMessage::with('sender', 'receiver')->find($message->id);

        Log::info('Sender:', ['sender' => $message->sender]);
        Log::info('Receiver:', ['receiver' => $message->receiver]);

        Mail::to($message->receiver->email)->send(new MessageSent($message));

        return response()->json($message, 201);
    }

    public function downloadAttachment(string $id)
{
    // Buscar el mensaje por ID
    $message = UserMessage::find($id);

    // Verificar si el mensaje existe y tiene un archivo adjunto asociado
    if (!$message || !$message->attachment) {
        return response()->json(['message' => 'Archivo no encontrado'], 404);
    }

    // Obtener la ruta completa al archivo almacenado
    $filePath = public_path('storage/' . $message->attachment);

    // Verificar si el archivo existe físicamente en el servidor
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'Archivo no encontrado en el servidor'], 404);
    }

    // Responder con el archivo para que el navegador inicie la descarga
    return response()->download($filePath);
}



    public function markAsRead(Request $request, $id)
    {
        $message = UserMessage::findOrFail($id);

        if ($message->receiver_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $message->is_read = true;
        $message->save();

        return response()->json(['message' => 'Mensaje marcado como leído'], 200);
    }

    public function destroy(UserMessage $message)
    {
        $this->authorize('delete', $message);
        $message->delete();

        return response()->json(['message' => 'Mensaje eliminado.']);
    }

    public function restore($id)
    {
        $message = UserMessage::withTrashed()->findOrFail($id);
        $this->authorize('restore', $message);
        $message->restore();

        return response()->json(['message' => 'Mensaje restaurado.']);
    }

    public function search(Request $request)
    {
        $userId = auth()->id();
        $query = $request->input('query');

        $messages = UserMessage::where(function ($q) use ($userId) {
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
