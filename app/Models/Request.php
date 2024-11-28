<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Request extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_empleado',
        'tipo',
        'motivo',
        'fecha_ini',
        'fecha_fin',
        'estado',
        'turno',
        'horas',
        'file',
    ];

    public function EnviadaPor()
    {
        return $this->belongsTo(User::class, 'id_empleado');
    }

    public function ImplicaA()
    {
        return $this->belongsTo(User::class, 'id_empleado2');
    }
}
