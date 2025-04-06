<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuardAssignment extends Model
{
    protected $fillable = [
        'id_guard', 'id_empleado', 'turno', 'asignacion'
    ];

    public function guardRecord()
    {
        return $this->belongsTo(Guard::class, 'id_guard');
    }

    public function empleado()
    {
        return $this->belongsTo(User::class, 'id_empleado');
    }

    
public static function getAssignmentsByDateAndParque($date, $id_parque)
{
    // Buscar la guardia en la tabla 'guards' que coincida con la fecha e id_parque
    $guard = \App\Models\Guard::where('date', $date)
                              ->where('id_parque', $id_parque)
                              ->first();

    if (!$guard) {
        return null;
    }

    // Obtener las asignaciones de la guardia encontrada y extraer el campo 'asignacion'
    return self::where('id_guard', $guard->id)
                ->pluck('asignacion')
                ->unique()
                ->values();
}
}
