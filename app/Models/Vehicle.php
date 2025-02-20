<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'matricula';
    public $incrementing = false;
    protected $keyType = 'string';

    // Incluye 'nombre' junto con los demás campos
    protected $fillable = ['matricula', 'nombre', 'id_parque', 'año', 'tipo'];

    public function vehicles_incident()
    {
        return $this->hasMany('App\Models\Vehicles_incident');
    }

    public function park()
    {
        return $this->belongsTo('App\Models\Park', 'id_parque');
    }
}
