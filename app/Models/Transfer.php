<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasFactory;

    protected $table = 'transfers';
    protected $primaryKey = 'id_transfer';

    protected $fillable = [
        'id_empleado',
        'id_brigada_origen',
        'id_brigada_destino',
        'fecha_traslado',
        'turno_seleccionado',
        'horas_traslado',
    ];

    protected $casts = [
        'fecha_traslado' => 'date',
        'horas_traslado' => 'float',
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

    public function assignments()
    {
        return $this->hasMany('App\Models\Firefighters_assignment', 'id_transfer', 'id_transfer');
    }
}
