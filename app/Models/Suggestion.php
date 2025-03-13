<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Suggestion extends Model
{
    protected $table = 'suggestions';

    protected $fillable = [
        'usuario_id',
        'titulo',
        'descripcion',
        'estado',
        'conteo_votos',
    ];

    // Agregamos el atributo calculado para que se incluya en la respuesta JSON
    protected $appends = ['userVoted'];

    /**
     * Relación: Una sugerencia tiene muchos votos.
     */
    public function votes()
    {
        return $this->hasMany(SuggestionVote::class, 'suggestion_id');
    }

    /**
     * Accesor para determinar si el usuario autenticado ya ha votado esta sugerencia.
     * Se consulta si existe un voto en la relación "votes" filtrado por el ID del usuario.
     */
    public function getUserVotedAttribute()
    {
        $userId = auth()->user() ? auth()->user()->id_empleado : null;
        if ($userId) {
            return $this->votes()->where('usuario_id', $userId)->exists();
        }
        return false;
    }

    /**
     * Relación: La sugerencia pertenece a un usuario (el autor).
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id_empleado');
    }
}
