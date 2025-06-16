<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'subject',
        'body',
        'attachment',
        'is_read',
        'massive',
        'parent_id',
        'marked_as_read_by_admin',
        'marked_as_read_at', 
        'marked_as_read_by'
    ];

    protected $table = 'messages';

    protected $dates = ['deleted_at'];

    // Quien envía el mensaje
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Quien recibe el mensaje (solo aplica si no es masivo)
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // Relación con el mensaje “padre” (si es una respuesta)
    public function parent()
    {
        return $this->belongsTo(UserMessage::class, 'parent_id');
    }

    /**
     * Relación recursiva para cargar todas las respuestas (hijos),
     * y las respuestas de esas respuestas, etc.
     */
    public function replies()
{
    return $this->hasMany(UserMessage::class, 'parent_id')->with('replies'); // Recursivo
}

public function loadRecursive()
{
    return $this->load(['replies' => function ($query) {
        $query->with('replies'); // Carga recursivamente todas las respuestas
    }]);
}

}
