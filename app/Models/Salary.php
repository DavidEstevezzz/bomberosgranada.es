<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    use HasFactory;

    protected $table = 'salaries';
    protected $primaryKey = 'id_salario'; // Definir la clave primaria
    
    protected $fillable = [
        'id_salario',
        'tipo',
        'fecha_ini',
        'precio_diurno',
        'precio_nocturno',  // Corregido de 'precio_noctirno' a 'precio_nocturno'
        'horas_diurnas',
        'horas_nocturnas'
    ];

    public function Guards()
    {
        return $this->hasMany('App\Models\Guard');
    }

    public function Extra_hours()
    {
        return $this->hasMany('App\Models\Extra_hour');
    }
}
