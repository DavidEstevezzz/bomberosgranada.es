<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Head extends User
{
    use HasFactory;

    protected $fillable = [
        'id_parque', // Atributo adicional para OfficeWorker
    ];

    public function incidents()
    {
        return $this->hasMany(Incident::class, 'id_empleado');
    }
}
