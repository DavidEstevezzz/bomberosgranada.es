<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftChangeRequest extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';

    protected $fillable = [
        'id_empleado1',
        'id_empleado2',
        'id_empleado3',
        'brigada1',
        'brigada2',
        'fecha',
        'fecha2',
        'turno',
        'motivo',
        'estado',
    ];

    protected $casts = [
        'brigada1' => 'integer',
        'brigada2' => 'integer',
    ];

    // Relación con el primer empleado (quien crea la solicitud)
    public function empleado1()
    {
        return $this->belongsTo('App\Models\User', 'id_empleado1', 'id_empleado');
    }

    // Relación con el segundo empleado (quien recibe la solicitud)
    public function empleado2()
    {
        return $this->belongsTo('App\Models\User', 'id_empleado2', 'id_empleado');
    }

    // Relación con el jefe que aprueba la solicitud
    public function empleado3()
    {
        return $this->belongsTo('App\Models\User', 'id_empleado3', 'id_empleado');
    }

    // Relación con la brigada del primer empleado
    public function brigada1()
    {
        return $this->belongsTo('App\Models\Brigade', 'brigada1', 'id_brigada');
    }

    // Relación con la brigada del segundo empleado
    public function brigada2()
    {
        return $this->belongsTo('App\Models\Brigade', 'brigada2', 'id_brigada');
    }
}
