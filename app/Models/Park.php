<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Park extends Model
{
    use HasFactory;

    // Definir la clave primaria personalizada
    protected $primaryKey = 'id_parque';

    // Definir si la clave primaria no es un entero autoincremental
    public $incrementing = false;

    // Definir el tipo de la clave primaria si no es un entero
    protected $keyType = 'string';

    // Definir los atributos que se pueden asignar masivamente
    protected $fillable = ['id_parque', 'nombre', 'ubicacion', 'telefono'];

    public function brigades()
    {
        return $this->hasMany('App\Models\Brigade');
    }

    public function vehicles()
    {
        return $this->hasMany('App\Models\Vehicles');
    }

    public function office_workers()
    {
        return $this->hasMany('App\Models\Office_Worker');
    }
}
