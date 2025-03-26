<?php

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
        'revision',
        'practica',
        'basura',
        'anotaciones',
        'incidencias_de_trafico',
        'mando',
        'incidencias_personal',
        'limpieza_vehiculos',
        'limpieza_dependencias',
        'callejero',
        'ejercicios',
        'repostaje',
    ];
    

    // Clave primaria autoincrementable (por defecto es "id")
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    public function assignments()
    {
        return $this->hasManyThrough(
            'App\Models\Firefighters_assignment',
            'App\Models\Brigade',
            'id_brigada', // FK en la tabla de brigadas
            'id_brigade_destino', // FK en la tabla de asignaciones
            'id_brigada', // Clave local en guards
            'id_brigada'  // Clave local en brigades
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
