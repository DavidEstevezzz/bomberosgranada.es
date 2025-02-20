<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;
    
    // Establece 'matricula' como clave primaria
    protected $primaryKey = 'matricula';
    public $incrementing = false;
    protected $keyType = 'string';

    // Define los campos asignables masivamente
    protected $fillable = ['matricula', 'id_parque', 'año', 'tipo'];

    // Relación con los incidentes
    public function vehicles_incident()
    {
        return $this->hasMany('App\Models\Vehicles_incident');
    }

    // Relación con el parque
    public function park()
    {
        return $this->belongsTo('App\Models\Park', 'id_parque');
    }
}
