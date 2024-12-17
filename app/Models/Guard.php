<?php
// App\Models\Guard.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guard extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',        
        'id_brigada',
        'id_salario',
        'tipo',
        'comentarios',
    ];

    // Clave primaria autoincrementable
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    public function assignments()
    {
        return $this->hasManyThrough(
            'App\Models\Firefighters_assignment',
            'App\Models\Brigade',
            'id_brigada', // Foreign key on Brigades table...
            'id_brigada_destino', // Foreign key on Firefighters_assignments table...
            'id_brigada', // Local key on Guards table...
            'id_brigada' // Local key on Brigades table...
        );
    }

    public function salary()
    {
        return $this->belongsTo('App\Models\Salary', 'id_salario', 'id_salario');
    }

    public function brigade()
    {
        return $this->belongsTo('App\Models\Brigade', 'id_brigada', 'id_brigada');
    }
}


