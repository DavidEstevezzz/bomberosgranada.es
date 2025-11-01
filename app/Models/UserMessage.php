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
        'attachment_filename',
        'is_read',
        'massive',
        'parent_id',
        'marked_as_read_by_admin',
        'marked_as_read_at', 
        'marked_as_read_by'
    ];

    protected $table = 'messages';

    protected $dates = ['deleted_at', 'marked_as_read_at'];

    /**
     * Quien envía el mensaje
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'id_empleado');
    }

    /**
     * Quien recibe el mensaje (solo aplica si no es masivo)
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id', 'id_empleado');
    }

    /**
     * Relación con el mensaje "padre" (si es una respuesta)
     */
    public function parent()
    {
        return $this->belongsTo(UserMessage::class, 'parent_id');
    }

    /**
     * Relación recursiva para cargar todas las respuestas (hijos)
     */
    public function replies()
    {
        return $this->hasMany(UserMessage::class, 'parent_id')->with('replies');
    }

    /**
     * NUEVA: Relación con las lecturas individuales
     */
    public function reads()
    {
        return $this->hasMany(MessageRead::class, 'message_id');
    }

    /**
     * Verifica si un usuario específico ha leído el mensaje
     * 
     * @param int $userId
     * @return bool
     */
     public function isReadByUser($userId)
    {
        // Para mensajes individuales, usar el campo is_read tradicional
        if (!$this->massive || $this->massive === 'false') {
            return (bool) $this->is_read;
        }

        // Para mensajes masivos: primero verificar en la tabla de lecturas (sistema nuevo)
        $hasIndividualRead = $this->reads()->where('user_id', $userId)->exists();
        
        if ($hasIndividualRead) {
            return true;
        }
        
        // COMPATIBILIDAD: Si no tiene lectura individual, verificar si fue marcado por admin (sistema antiguo)
        // Esto mantiene la compatibilidad con mensajes antiguos
        if ($this->marked_as_read_by_admin) {
            return true;
        }
        
        return false;
    }

    /**
     * Marcar mensaje como leído por un usuario específico
     * 
     * @param int $userId
     * @return void
     */
    public function markAsReadByUser($userId)
    {
        // Para mensajes individuales, actualizar el campo is_read
        if (!$this->massive || $this->massive === 'false') {
            $this->is_read = true;
            $this->save();
            return;
        }

        // Para mensajes masivos, crear registro en message_reads
        // firstOrCreate evita duplicados
        MessageRead::firstOrCreate([
            'message_id' => $this->id,
            'user_id' => $userId
        ], [
            'read_at' => now()
        ]);
    }

    /**
     * Obtener conteo de usuarios que han leído el mensaje masivo
     * 
     * @return int
     */
    public function getReadCount()
    {
        if (!$this->massive || $this->massive === 'false') {
            return $this->is_read ? 1 : 0;
        }

        return $this->reads()->count();
    }

    /**
     * Obtener total de destinatarios potenciales según el tipo de mensaje masivo
     * 
     * @return int
     */
    public function getTotalRecipients()
    {
        if (!$this->massive || $this->massive === 'false') {
            return 1;
        }

        switch (strtolower($this->massive)) {
            case 'toda':
                return User::count();
            case 'mandos':
                return User::where('type', 'mando')->count();
            case 'bomberos':
                return User::where('type', 'bombero')->count();
            default:
                return 0;
        }
    }

    /**
     * Obtener porcentaje de lectura para mensajes masivos
     * 
     * @return float
     */
    public function getReadPercentage()
    {
        $total = $this->getTotalRecipients();
        if ($total === 0) {
            return 0;
        }

        $readCount = $this->getReadCount();
        return round(($readCount / $total) * 100, 2);
    }

    /**
     * Cargar recursivamente todas las respuestas
     */
    public function loadRecursive()
    {
        return $this->load(['replies' => function ($query) {
            $query->with('replies');
        }]);
    }
}