<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brigade extends Model
{
    use HasFactory;

    protected $table = 'brigades';
    protected $primaryKey = 'id_brigada';
    public $incrementing = true; // Asegurarse de que el campo es auto-incremental

    protected $fillable = [
        'id_parque',
        'nombre'
    ];

    public function park()
    {
        return $this->belongsTo('App\Models\Park', 'id_parque', 'id_parque');
    }

    public function firefightersAssignments()
    {
        return $this->hasMany('App\Models\FirefightersAssignment', 'brigade_id');
    }

    public function commandsAssignments()
    {
        return $this->hasMany('App\Models\CommandsAssignment', 'brigade_id');
    }
}

