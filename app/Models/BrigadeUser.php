<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BrigadeUser extends Model
{
    use HasFactory;

    protected $table = 'brigade_user';

    protected $fillable = [
        'id_brigada',
        'id_usuario',
        'practicas'
    ];

    // Relación con la brigada
    public function brigade()
    {
        return $this->belongsTo(Brigade::class, 'id_brigada', 'id_brigada');
    }

    // Relación con el usuario
    public function user()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_empleado');
    }
}