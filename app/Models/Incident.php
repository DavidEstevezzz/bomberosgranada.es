<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Park;

class Incident extends Model
{
    use HasFactory;

    // La clave primaria es id_incidencia, que no es autoincremental
    protected $primaryKey = 'id_incidencia';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_incidencia',
        'id_empleado',   // Creador de la incidencia
        'tipo',          // vehiculo, personal o instalacion
        'estado',
        'matricula',     // Si tipo es "vehiculo"
        'id_empleado2',  // Si tipo es "personal"
        'resulta_por',   // Empleado que resuelve la incidencia
        'leido',         // Bool que indica si ha sido leído por los jefes
        'id_parque',     // Parque donde se genera la incidencia
        'fecha',
        'descripcion'
    ];

    // Relación con el usuario creador de la incidencia.
    public function creator()
    {
        return $this->belongsTo(User::class, 'id_empleado');
    }

    // Si la incidencia es de tipo "vehiculo", se relaciona con el vehículo (usando la matrícula)
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'matricula', 'matricula');
    }

    // Si la incidencia es de tipo "personal", se relaciona con el empleado referenciado.
    public function employee2()
    {
        return $this->belongsTo(User::class, 'id_empleado2');
    }

    // Empleado que resuelve la incidencia
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resulta_por');
    }

    // Relación con el parque donde se origina la incidencia.
    public function park()
    {
        return $this->belongsTo(Park::class, 'id_parque');
    }
}
