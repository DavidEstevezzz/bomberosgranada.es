<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Firefighters_assignment extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_asignacion'; 

    protected $fillable = [
        'fecha_ini',
        'id_empleado',
        'id_brigada_origen',
        'id_brigada_destino',
        'turno',
        'id_request',
        'id_change_request'
    ];

    public function firefighter()
    {
        return $this->belongsTo('App\Models\User', 'id_empleado', 'id_empleado');
    }

    public function brigadeOrigin()
    {
        return $this->belongsTo('App\Models\Brigade', 'id_brigada_origen', 'id_brigada');
    }

    public function brigadeDestination()
    {
        return $this->belongsTo('App\Models\Brigade', 'id_brigada_destino', 'id_brigada');
    }
}
