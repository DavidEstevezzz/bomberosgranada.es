<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuardAssignment extends Model
{
    protected $fillable = [
        'id_guard', 'id_empleado', 'turno', 'asignacion'
    ];

    public function guardRecord()
    {
        return $this->belongsTo(Guard::class, 'id_guard');
    }

    public function empleado()
    {
        return $this->belongsTo(User::class, 'id_empleado');
    }
}
