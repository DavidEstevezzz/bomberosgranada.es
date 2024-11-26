<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Firefighters_defined_assignment extends Firefighters_assignment
{
    use HasFactory;

    protected $fillable = [
        'fecha_ini',
        'fecha_vuelta', // Añadimos el campo de fecha de vuelta
        'id_empleado',
        'id_brigada_origen',
        'id_brigada_destino',
    ];

    public function Firefighters_Assignment()
    {
        return $this->belongsTo('App\Models\Firefighters_assignment');
    }

    // Método para verificar y revertir la asignación si es necesario
    public function checkAndRevertAssignment()
    {
        $currentDate = Carbon::now();

        if ($this->fecha_vuelta && $currentDate->greaterThanOrEqualTo($this->fecha_vuelta)) {
            // Revertir la asignación
            $temp = $this->id_brigada_origen;
            $this->id_brigada_origen = $this->id_brigada_destino;
            $this->id_brigada_destino = $temp;
            $this->save();
        }
    }
}
