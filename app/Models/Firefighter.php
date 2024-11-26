<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Firefighter extends User
{
    use HasFactory;

    protected $fillable = [
        'puesto', // Atributo adicional para Firefighter
    ];

    public function firefightersAssignments()
    {
        return $this->hasMany(Firefighters_assignment::class, 'id_empleado');
    }

}
