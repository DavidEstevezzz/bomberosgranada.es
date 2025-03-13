<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuggestionVote extends Model
{
    protected $table = 'suggestions_votos';

    protected $fillable = [
        'suggestion_id',
        'usuario_id',
    ];

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = null;

    public function suggestion()
    {
        return $this->belongsTo(Suggestion::class, 'suggestion_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id_empleado');
    }
}
