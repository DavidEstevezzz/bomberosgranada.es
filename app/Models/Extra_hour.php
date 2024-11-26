<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Extra_hour extends Model
{
    use HasFactory;

    // No defines $primaryKey para claves compuestas
    public $incrementing = false; // No es autoincremental
    protected $keyType = 'string'; // Cambia a 'string' si las claves no son enteros

    protected $fillable = [
        'id_empleado',
        'date',
        'id_salario',
        'horas_diurnas',
        'horas_nocturnas',
    ];

    public function salarie()
    {
        return $this->belongsTo('App\Models\Salary', 'id_salario');
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'id_empleado');
    }

    public function getTotalSalaryAttribute()
    {
        // Asegúrate de tener los datos de salario cargados
        if (!$this->relationLoaded('salarie')) {
            $this->load('salarie');
        }

        $tarifa_diurna = $this->salarie->tarifa_diurna ?? 0;
        $tarifa_nocturna = $this->salarie->tarifa_nocturna ?? 0;

        return ($this->horas_diurnas * $tarifa_diurna) + ($this->horas_nocturnas * $tarifa_nocturna);
    }
}

